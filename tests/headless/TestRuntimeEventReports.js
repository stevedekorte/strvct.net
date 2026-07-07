#!/usr/bin/env node

"use strict";

/**
 * Headless test: runtime event report queue on SvAssistantToolKit.
 *
 * Invariants under test (Plans/Runtime Event Reports v1):
 * - newRuntimeEventReport stamps context (conversation, timestamp) and does
 *   NOT enqueue; addRuntimeEventReport coalesces + enqueues and never sends.
 * - Equal-coalesceKey reports coalesce into one pending report, bumping
 *   occurrenceCount.
 * - Drain (sendCompletedToolCallResponses): a wakeAI report initiates ONE
 *   invisible user message containing the <runtime-event> block; nextTurn
 *   reports never initiate but ride along when a message goes out anyway.
 * - Loop guard: after 3 consecutive drains containing the same coalesceKey,
 *   further adds of that key are suppressed; a drain without the key resets
 *   its streak.
 * - Mirror gate: a conversation with shouldProcessToolCalls() === false never
 *   queues reports.
 * - Capture sites: promiseSendDelegateTag catches tag-handler exceptions into
 *   the queue; reportErrorToAi routes onto the queue.
 *
 * Usage (from the strvct root):
 *   node tests/headless/TestRuntimeEventReports.js
 */

const path = require("path");
const { pathToFileURL } = require("url");

const strvctRoot = path.join(__dirname, "..", "..");
process.chdir(strvctRoot);

let passed = 0;
let failed = 0;

function check (condition, message) {
    if (condition) {
        passed++;
        console.log("  \x1b[32m✓\x1b[0m " + message);
    } else {
        failed++;
        console.log("  \x1b[31m✗\x1b[0m " + message);
    }
}

async function boot () {
    const bootFile = (p) => import(pathToFileURL(path.join(strvctRoot, p)).href);
    await bootFile("source/boot/SvGlobals.js");
    await bootFile("source/boot/SvPlatform.js");
    await bootFile("source/boot/StrvctFile.js");
    await bootFile("source/boot/SvBootLoader.js");

    const SvBootLoader = SvGlobals.get("SvBootLoader");
    SvBootLoader._bootPath = "source/boot";
    await SvBootLoader.asyncRun();
}

// --- fixtures ----------------------------------------------------------------

function newConversation () {
    const SvAiConversation = SvGlobals.get("SvAiConversation");
    const conv = SvAiConversation.clone();
    conv.setService({ serviceRoleNameForRole: (r) => r });
    // Track turn initiations instead of letting completed user messages hit
    // the network: stub requestResponse per created message.
    conv.requestedResponses = [];
    const origNewUserMessage = conv.newUserMessage;
    conv.newUserMessage = function () {
        const m = origNewUserMessage.call(conv);
        m.requestResponse = function () {
            conv.requestedResponses.push(m);
            return null;
        };
        return m;
    };
    return conv;
}

function invisibleMessages (conv) {
    return conv.messages().filter(m => m.isVisibleToUser() === false);
}

// --- tests -------------------------------------------------------------------

async function testFactoryAndQueue () {
    console.log("\nfactory + enqueue + coalescing");
    const conv = newConversation();
    const kit = conv.assistantToolKit();
    check(!!kit.runtimeEventReports(), "tool kit has a runtimeEventReports queue (finalInitProto)");

    const report = kit.newRuntimeEventReport();
    check(report.conversation() === conv, "factory stamps the owning conversation");
    check(typeof report.timestamp() === "number", "factory stamps a timestamp");
    check(kit.runtimeEventReports().pendingReports().length === 0, "factory does not enqueue");

    report.setType("testEvent").setInfo({ detail: "a" });
    const pending = kit.addRuntimeEventReport(report);
    check(pending === report, "add enqueues and returns the pending report");
    check(kit.runtimeEventReports().pendingReports().length === 1, "one pending report");
    check(conv.messages().length === 0, "enqueue never sends a message");

    // equal key coalesces
    const dup = kit.newRuntimeEventReport().setType("testEvent").setInfo({ detail: "a" });
    const coalesced = kit.addRuntimeEventReport(dup);
    check(coalesced === report, "equal-coalesceKey report coalesces into the pending one");
    check(report.occurrenceCount() === 2, "coalescing bumps occurrenceCount");
    check(kit.runtimeEventReports().pendingReports().length === 1, "still one pending report");

    // different key queues separately
    const other = kit.newRuntimeEventReport().setType("testEvent").setInfo({ detail: "b" });
    kit.addRuntimeEventReport(other);
    check(kit.runtimeEventReports().pendingReports().length === 2, "different info queues separately");
}

async function testDrain () {
    console.log("\ndrain: wakeAI initiates, nextTurn rides or waits");
    const conv = newConversation();
    const kit = conv.assistantToolKit();

    // nextTurn alone: no send
    const idle = kit.newRuntimeEventReport().setType("housekeeping").setInfo({ note: "later" });
    kit.addRuntimeEventReport(idle); // default immediacy nextTurn
    await kit.sendCompletedToolCallResponses();
    check(conv.messages().length === 0, "nextTurn-only queue does not initiate a message");
    check(kit.runtimeEventReports().pendingReports().length === 1, "nextTurn report stays queued");

    // wakeAI: initiates one message, and the queued nextTurn report rides along
    kit.addRuntimeError(new Error("boom"), { tag: "dice" });
    await kit.sendCompletedToolCallResponses();
    const sent = invisibleMessages(conv);
    check(sent.length === 1, "wakeAI drain sends exactly one invisible message");
    if (sent.length === 1) {
        const content = sent[0].content();
        check(content.includes("<runtime-event>"), "message contains a <runtime-event> block");
        check(content.includes("responseProcessingError"), "wakeAI error report is in the message");
        check(content.includes("boom"), "error message is in the report info");
        check(content.includes("housekeeping"), "pending nextTurn report rode along in the same message");
        check(sent[0].speakerName() === "Runtime Events", "standalone report message speaker is 'Runtime Events'");
    }
    check(kit.runtimeEventReports().pendingReports().length === 0, "queue is empty after the drain");

    // drain with nothing pending: no-op
    const messageCount = conv.messages().length;
    await kit.sendCompletedToolCallResponses();
    check(conv.messages().length === messageCount, "empty drain sends nothing");
}

async function testLoopGuard () {
    console.log("\nloop guard");
    const conv = newConversation();
    const kit = conv.assistantToolKit();

    const addAndDrain = async () => {
        const r = kit.addRuntimeError(new Error("same failure"), { tag: "json" });
        await kit.sendCompletedToolCallResponses();
        return r;
    };

    check((await addAndDrain()) !== null, "send 1 accepted");
    check((await addAndDrain()) !== null, "send 2 accepted");
    check((await addAndDrain()) !== null, "send 3 accepted");
    const suppressed = kit.addRuntimeError(new Error("same failure"), { tag: "json" });
    check(suppressed === null, "add after 3 consecutive sends is suppressed");
    check(kit.runtimeEventReports().pendingReports().length === 0, "suppressed report is not queued");

    // a drain without the key breaks the streak
    kit.addRuntimeError(new Error("different failure"), { tag: "image" });
    await kit.sendCompletedToolCallResponses();
    const readmitted = kit.addRuntimeError(new Error("same failure"), { tag: "json" });
    check(readmitted !== null, "a drain without the key resets its streak (report re-admitted)");
}

async function testMirrorGate () {
    console.log("\nmirror gate");
    const conv = newConversation();
    conv.shouldProcessToolCalls = () => false;
    const kit = conv.assistantToolKit();
    const gated = kit.addRuntimeError(new Error("client-side"), {});
    check(gated === null, "mirror conversation (shouldProcessToolCalls false) never queues");
    check(kit.runtimeEventReports().pendingReports().length === 0, "queue stays empty on a mirror");
}

async function testCaptureSites () {
    console.log("\ncapture sites on the parsed response message");
    const conv = newConversation();
    const kit = conv.assistantToolKit();
    const SvAiParsedResponseMessage = SvGlobals.get("SvAiParsedResponseMessage");

    const m = SvAiParsedResponseMessage.clone();
    m.setConversation(conv);

    // tag handler that throws -> queued report with tag/phase/excerpt
    conv.setTagDelegate({
        respondsTo: (name) => name === "onStream_dice_TagText",
        onStream_dice_TagText: () => { throw new Error("handler exploded"); }
    });
    await m.promiseSendDelegateTag("Stream", "dice", "<dice>2d6</dice>");
    let reports = kit.runtimeEventReports().pendingReports();
    check(reports.length === 1, "throwing tag handler queues one report");
    if (reports.length === 1) {
        const info = reports[0].info();
        check(info.message === "handler exploded", "report carries the error message");
        check(info.tag === "dice" && info.phase === "stream", "report carries tag and phase");
        check(typeof info.excerpt === "string" && info.excerpt.includes("2d6"), "report carries an excerpt of the offending output");
        check(reports[0].isWakeAI(), "handler exception is a wakeAI report");
    }
    kit.runtimeEventReports().removeReports(reports);

    // legacy reportErrorToAi routes onto the queue
    m.reportErrorToAi("you used an unknown tag");
    reports = kit.runtimeEventReports().pendingReports();
    check(reports.length === 1, "reportErrorToAi queues a report");
    if (reports.length === 1) {
        check(reports[0].info().message === "you used an unknown tag", "report carries the legacy error text");
        check(reports[0].info().source === "responseTagHandling", "report is attributed to responseTagHandling");
    }
}

// --- main ---------------------------------------------------------------------

(async function main () {
    console.log("TestRuntimeEventReports: booting strvct headless...");
    await boot();

    await testFactoryAndQueue();
    await testDrain();
    await testLoopGuard();
    await testMirrorGate();
    await testCaptureSites();

    console.log("\n" + passed + " passed, " + failed + " failed");
    process.exit(failed === 0 ? 0 : 1);
})().catch((e) => {
    console.error("TEST RUN FAILED:", e);
    process.exit(1);
});
