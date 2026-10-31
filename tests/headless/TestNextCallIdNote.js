#!/usr/bin/env node

"use strict";

/**
 * Headless test: each request tells the AI its next free callId
 * (SvAiConversation.appendNextCallIdNote). Filing a reply into history hides
 * the ids of its calls that sent no result, and the AI then reused one (a
 * collision that fails the call); the note counts every message, filed or
 * not, and rides the never-stored trailer.
 *
 * Usage (from the strvct root):
 *   node tests/headless/TestNextCallIdNote.js
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
    for (const rel of ["SvGlobals.js", "SvPlatform.js", "StrvctFile.js", "SvBootLoader.js"]) {
        await bootFile(path.join("source/boot", rel));
    }
    SvGlobals.get("SvBootLoader")._bootPath = "source/boot";
    await SvGlobals.get("SvBootLoader").asyncRun();
}

/** A conversation whose messages are these contents (a filed reply is just a message here). */
function conversationWith (contents) {
    const conversation = SvGlobals.get("SvAiConversation").clone();
    conversation.messages = () => contents.map((c) => (typeof c === "string" ? { role: () => "user", content: () => c } : { role: () => c.role, content: () => c.content }));
    conversation.service = () => null; // the generic ephemeral shape
    return conversation;
}

(async () => {
    await boot();

    const fresh = conversationWith(["Hello."]);
    check(fresh.nextCallIdNumber() === 0, "no calls yet: call_0 is next");
    const untouched = fresh.appendNextCallIdNote([{ role: "user", content: "Hello." }]);
    check(untouched.length === 1, "and no note is added before the first call");

    const filedReply = "<tool-call>\n{\"callId\":\"call_24\",\"toolName\":\"a\"}\n</tool-call> <tool-call>\n{\"callId\": \"call_28\", \"toolName\":\"generateImage\"}\n</tool-call>"; // call_28 sent no result
    const laterResults = "<tool-call-results><tool-call-result>{\n  \"callId\": \"call_26\"\n}</tool-call-result><tool-call-result>{\n  \"callId\": \"call_27\"\n}</tool-call-result></tool-call-results>";
    const prompt = { role: "system", content: "Example: {\"callId\":\"call_80\",\"toolName\":\"x\"}" }; // the system prompt's examples
    const conversation = conversationWith([prompt, filedReply, laterResults]);
    check(conversation.nextCallIdNumber() === 29, "the highest id in any message, a filed reply's silent call included, plus one — the system prompt's example ids left out: " + conversation.nextCallIdNumber());

    const request = [{ role: "user", content: laterResults }];
    conversation.appendNextCallIdNote(request);
    const note = request[request.length - 1];
    check(note.isEphemeral === true && note.role === "user", "the note rides the never-stored trailer");
    check(/Next free callId: call_29/.test(note.content), "it names the next free id: " + note.content);
    check(request[0].content === laterResults, "stored content is untouched");

    console.log("\n" + passed + " passed, " + failed + " failed");
    process.exit(failed ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
