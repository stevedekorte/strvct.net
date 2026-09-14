#!/usr/bin/env node
"use strict";
/**
 * Headless test: a request body is prepared once, and a provider prepare is
 * safe to call twice. Gemini's prepare replaces the body (messages → contents)
 * and rewrites the system message in place, so a retry that prepared again
 * crashed on `.length` of undefined (dev, 2026-09-14, caught by the smoke gate).
 * Usage (from the strvct root): node tests/headless/TestPrepareOnce.js
 */
const path = require("path"); const { pathToFileURL } = require("url");
const strvctRoot = path.join(__dirname, "..", ".."); process.chdir(strvctRoot);
let pass = 0, fail = 0; const check = (c, m) => { if (c) { pass++; console.log("  \x1b[32m✓\x1b[0m " + m); } else { fail++; console.log("  \x1b[31m✗\x1b[0m " + m); } };
async function boot () { const b = (p) => import(pathToFileURL(path.join(strvctRoot, p)).href); for (const r of ["SvGlobals.js", "SvPlatform.js", "StrvctFile.js", "SvBootLoader.js"]) { await b(path.join("source/boot", r)); } SvGlobals.get("SvBootLoader")._bootPath = "source/boot"; await SvGlobals.get("SvBootLoader").asyncRun(); }
(async () => {
    await boot();
    const service = SvGlobals.get("SvGeminiService").clone();
    const request = SvGlobals.get("SvGeminiRequest").clone();
    request.setService && request.setService(service);
    request.setBodyJson({ temperature: 0.7, top_p: 0.9, messages: [{ role: "system", content: "You are the GM." }, { role: "user", content: "Hello." }] });
    check(request.hasPreparedBody() === false, "a fresh body is unprepared");
    service.prepareToSendRequest(request);
    const once = JSON.stringify(request.bodyJson());
    check(Array.isArray(request.bodyJson().contents) && request.bodyJson().system_instruction, "first prepare produced Gemini shape (contents + system_instruction)");
    // `parts` is a repeated field. Gemini accepted a bare {text} object for it
    // until 2026-09-14, then every request 400'd ("invalid argument") on dev
    // and prod at once; the shape must be an array in every message.
    check(request.bodyJson().contents.every(m => Array.isArray(m.parts) && m.parts.every(p => typeof p.text === "string")), "every contents[].parts is an array of {text} parts");
    check(Array.isArray(request.bodyJson().system_instruction.parts), "system_instruction.parts is an array");
    let threw = null; try { service.prepareToSendRequest(request); } catch (e) { threw = e.message; }
    check(threw === null, "a second prepare does not throw (" + (threw || "ok") + ")");
    check(JSON.stringify(request.bodyJson()) === once, "…and leaves the body byte-identical");
    request.setBodyJson({ temperature: 0.7, top_p: 0.9, messages: [{ role: "user", content: "again" }] });
    check(request.hasPreparedBody() === false, "installing a new body clears the prepared flag");
    // Oversized system prompt: Gemini caps system_instruction (400 INVALID_ARGUMENT
    // above ~350k chars since 2026-09-14) but takes the same text as the first user turn.
    const big = "x".repeat(service.systemInstructionMaxChars() + 1);
    request.setBodyJson({ temperature: 0.7, top_p: 0.9, messages: [{ role: "system", content: big }, { role: "user", content: "Hello." }] });
    service.prepareToSendRequest(request);
    const body = request.bodyJson();
    check(body.system_instruction === undefined, "an oversized system prompt is not sent as system_instruction");
    check(body.contents[0].role === "user" && body.contents[0].parts[0].text.startsWith(big) && /Please begin the conversation now\.$/.test(body.contents[0].parts[0].text), "…it opens the first user turn, ending with the kickoff line");
    check(body.contents[1].parts[0].text === "Hello.", "the real first user message follows it");
    console.log("\n" + pass + " passed, " + fail + " failed"); process.exit(fail === 0 ? 0 : 1);
})().catch(e => { console.error("Test run failed:", e); process.exit(1); });
