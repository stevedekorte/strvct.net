#!/usr/bin/env node

"use strict";

/**
 * Headless test: ephemeral request content (Plans/Cache-Safe Standing View).
 *
 * Never-stored per-request dicts (standing-view trailer, filing reminders)
 * are marked isEphemeral: true. Invariants under test, across ALL adapters —
 * these live here rather than in TestAnthropicCacheControl because the strip
 * is adapter-agnostic and the one adapter that inherits the base no-op prep
 * (OpenAI) is exactly the case an Anthropic-focused file would forget:
 *
 * - SvAiService.appendEphemeralUserContent shapes:
 *     alternating providers (Anthropic/Gemini/DeepSeek): user → spacer + user-trailer
 *     non-alternating providers (OpenAI/xAI/Groq):       user → user-trailer
 *     repeat appends concatenate into ONE trailing ephemeral user dict
 * - The Anthropic merge loop never folds an ephemeral dict into a stored
 *   neighbor (that fold changed stored bytes between requests — a cache
 *   prefix bust); ephemeral may merge with ephemeral.
 * - applyPromptCaching puts markers on STORED messages only: the last stored
 *   message (the prefix the next request re-sends) and stored-6-back — never
 *   the trailer, whose bytes differ every request (a write that can never be
 *   read back).
 * - SvAiRequest.stripEphemeralFlags removes every isEphemeral key before the
 *   bytes go out (providers reject unknown fields on message objects).
 *
 * Usage (from the strvct root):
 *   node source/boot/index-builder/ImportsIndexer.js
 *   node tests/headless/TestEphemeralRequestContent.js
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

function testAppendShapes () {
    console.log("\nappendEphemeralUserContent shapes per provider");
    const anthropic = SvGlobals.get("SvAnthropicService").shared();
    const xai = SvGlobals.get("SvXaiService").shared();
    const openai = SvGlobals.get("SvOpenAiService").shared();

    check(anthropic.requiresAlternatingRoles() === true, "Anthropic requires alternating roles");
    check(SvGlobals.get("SvGeminiService").shared().requiresAlternatingRoles() === true, "Gemini requires alternating roles");
    // DeepSeek's merge loop is commented out in its adapter — it inherits the
    // base no-op prep and tolerates consecutive same-role messages.
    check(SvGlobals.get("SvDeepSeekService").shared().requiresAlternatingRoles() === false, "DeepSeek (merge commented out) inherits the non-alternating default");
    check(xai.requiresAlternatingRoles() === false, "xAI inherits the non-alternating default");
    check(openai.requiresAlternatingRoles() === false, "OpenAI (base no-op prep) inherits the non-alternating default");

    // Alternating provider, last stored role is user → spacer + user trailer.
    const m1 = [
        { role: "user", content: "stored player text" }
    ];
    anthropic.appendEphemeralUserContent(m1, "<standing-view>live A</standing-view>");
    check(m1.length === 3, "Anthropic-shaped: user, spacer, user-trailer");
    check(m1[1].role === anthropic.assistantRoleName() && m1[1].isEphemeral === true && m1[1].content.length > 0,
        "spacer is a non-empty ephemeral assistant note");
    check(m1[2].role === anthropic.userRoleName() && m1[2].isEphemeral === true, "trailer is an ephemeral user");
    check(m1[0].content === "stored player text", "stored user bytes untouched");

    // Second append concatenates — exactly one trailing user dict.
    anthropic.appendEphemeralUserContent(m1, "<system-reminder>file episodes</system-reminder>");
    check(m1.length === 3, "reminder + trailer share ONE trailing ephemeral user (no user,user tail)");
    check(m1[2].content.includes("live A") && m1[2].content.includes("file episodes"), "trailing user carries both");

    // Alternating provider, last stored role is assistant → no spacer needed.
    const m2 = [
        { role: "user", content: "q" },
        { role: "assistant", content: "a" }
    ];
    anthropic.appendEphemeralUserContent(m2, "<standing-view>live B</standing-view>");
    check(m2.length === 3 && m2[2].isEphemeral === true && m2[2].role === anthropic.userRoleName(),
        "after a stored assistant, the trailer appends directly (no spacer)");

    // Non-alternating provider → plain user trailer, no spacer.
    const m3 = [
        { role: "user", content: "stored player text" }
    ];
    xai.appendEphemeralUserContent(m3, "<standing-view>live C</standing-view>");
    check(m3.length === 2 && m3[1].isEphemeral === true, "xAI-shaped: user, user-trailer (no spacer)");
}

function testAnthropicMergeIsolation () {
    console.log("\nAnthropic merge: ephemeral never folds into stored");
    const service = SvGlobals.get("SvAnthropicService").shared();
    const makeRequest = (messages) => {
        const req = {
            _body: { messages },
            bodyJson () { return this._body; },
            setBodyJson (b) { this._body = b; return this; }
        };
        return req;
    };

    // A raw ephemeral user directly after a stored user (helper bypassed —
    // the guard must still hold): no fold into the stored message.
    const req1 = makeRequest([
        { role: "system", content: "sys" },
        { role: "user", content: "stored player text" },
        { role: "user", content: "<standing-view>live</standing-view>", isEphemeral: true }
    ]);
    service.prepareToSendRequest(req1);
    const out1 = req1.bodyJson().messages;
    const storedUser1 = out1.find(m => typeof m.content === "string"
        ? m.content.includes("stored player text")
        : m.content.some(b => b.text && b.text.includes("stored player text")));
    const storedText1 = typeof storedUser1.content === "string" ? storedUser1.content : storedUser1.content.map(b => b.text).join("");
    check(!storedText1.includes("<standing-view>"), "stored user did NOT absorb the ephemeral trailer");

    // Ephemeral + ephemeral same-role: allowed to merge (one trailing user).
    const req2 = makeRequest([
        { role: "system", content: "sys" },
        { role: "user", content: "stored player text" },
        { role: "assistant", content: "(context notes follow)", isEphemeral: true },
        { role: "user", content: "<standing-view>live</standing-view>", isEphemeral: true },
        { role: "user", content: "<system-reminder>file</system-reminder>", isEphemeral: true }
    ]);
    service.prepareToSendRequest(req2);
    const out2 = req2.bodyJson().messages;
    const trailingEphemeralUsers = out2.filter(m => m.isEphemeral === true && m.role === service.userRoleName());
    check(trailingEphemeralUsers.length === 1, "ephemeral-with-ephemeral merged into one trailing user");
    const trailText = typeof trailingEphemeralUsers[0].content === "string"
        ? trailingEphemeralUsers[0].content
        : trailingEphemeralUsers[0].content.map(b => b.text).join("");
    check(trailText.includes("<standing-view>") && trailText.includes("<system-reminder>"),
        "merged trailer carries both ephemeral contents");
}

function testMarkerPlacement () {
    console.log("\napplyPromptCaching: markers on stored messages only");
    const service = SvGlobals.get("SvAnthropicService").shared();

    const stored = [];
    for (let i = 0; i < 10; i++) {
        stored.push({ role: (i % 2 === 0) ? "user" : "assistant", content: "message " + i });
    }
    const body = {
        system: "sys",
        messages: stored.concat([
            { role: "assistant", content: "(context notes follow)", isEphemeral: true },
            { role: "user", content: "<standing-view>live render, differs every request</standing-view>", isEphemeral: true }
        ])
    };
    service.applyPromptCaching(body);

    const messages = body.messages;
    const trailer = messages[messages.length - 1];
    const spacer = messages[messages.length - 2];
    check(typeof trailer.content === "string", "trailer carries no cache marker (bytes differ every request)");
    check(typeof spacer.content === "string", "spacer carries no cache marker");

    const lastStored = messages[stored.length - 1];
    check(Array.isArray(lastStored.content) && lastStored.content[lastStored.content.length - 1].cache_control,
        "final marker sits on the LAST STORED message (the prefix the next request re-sends)");
    const anchor = messages[stored.length - 6];
    check(Array.isArray(anchor.content) && anchor.content[anchor.content.length - 1].cache_control,
        "lookback anchor computed over stored messages (stored-6-back), not messages.length-6");
}

function testStripEphemeralFlags () {
    console.log("\nSvAiRequest.stripEphemeralFlags: nothing custom goes out on the wire");
    const SvAiRequest = SvGlobals.get("SvAiRequest");
    const req = SvAiRequest.clone();
    req.setBodyJson({
        messages: [
            { role: "user", content: "stored" },
            { role: "assistant", content: "(context notes follow)", isEphemeral: true },
            { role: "user", content: "<standing-view>live</standing-view>", isEphemeral: true }
        ]
    });
    req.stripEphemeralFlags();
    const hasFlag = JSON.stringify(req.bodyJson()).includes("isEphemeral");
    check(!hasFlag, "outbound body JSON contains no isEphemeral key anywhere");
    check(req.bodyJson().messages.length === 3, "messages themselves are untouched (flag removal only)");
}

(async () => {
    await boot();
    testAppendShapes();
    testAnthropicMergeIsolation();
    testMarkerPlacement();
    testStripEphemeralFlags();
    console.log("\n" + passed + " passed, " + failed + " failed");
    process.exit(failed === 0 ? 0 : 1);
})().catch((e) => {
    console.error("Test run failed to boot:", e);
    process.exit(1);
});
