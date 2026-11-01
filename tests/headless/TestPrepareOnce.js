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
    // Prompt placement (2026-11-01): Gemini's implicit cache keeps a
    // system_instruction cached through history edits, but the same prompt as
    // the opening user turn was a full miss on any edit. So the stable part
    // (before <stable-prefix-end/>) is the system_instruction, at any length,
    // and the per-world tail opens the contents with the kickoff line.
    const shared = SvGlobals.get("SvGeminiService").shared();
    const stable = "S".repeat(400000);
    const prepare = (messages) => { request.setBodyJson({ messages: messages }); shared.prepareToSendRequest(request); return request.bodyJson(); };
    let body = prepare([{ role: "system", content: stable + "\n\nWorld: grim.", stablePrefixLength: stable.length }, { role: "user", content: "Hello." }]);
    check(body.system_instruction && body.system_instruction.parts[0].text === stable, "the stable part (400k chars) is the system_instruction");
    check(body.contents[0].role === "user" && body.contents[0].parts[0].text === "World: grim.\n\nPlease begin the conversation now.", "the tail opens the contents, then the kickoff line");
    check(body.contents[1].parts[0].text === "Hello.", "the real first user message follows it");
    body = prepare([{ role: "system", content: "You are the GM." }, { role: "user", content: "Hello." }]);
    check(body.system_instruction.parts[0].text === "You are the GM." && body.contents[0].parts[0].text === "Please begin the conversation now.", "with no stable boundary the whole prompt is the system_instruction");
    // If Gemini refuses a large system_instruction again (400, as on
    // 2026-09-14), the request is resent with the text opening the contents,
    // and later requests are laid out that way.
    body = prepare([{ role: "system", content: stable + "\n\nWorld: grim.", stablePrefixLength: stable.length }, { role: "user", content: "Hello." }]);
    let resent = false; request.retryWithDelay = () => { resent = true; };
    request.currentXhrRequest = () => ({ statusCode: () => 400 });
    check(request.isRefusedSystemInstruction(), "a 400 to a 400k system_instruction reads as a refusal");
    const err = new Error("400"); request.classifyRecovery(err);
    body = request.bodyJson();
    check(resent && err.svIsRetrying, "…the request is sent again");
    check(body.system_instruction === undefined && body.contents[0].parts[0].text === stable + "\n\nWorld: grim.\n\nPlease begin the conversation now.", "…with the system text opening the first turn");
    body = prepare([{ role: "system", content: stable + "\n\nWorld: grim.", stablePrefixLength: stable.length }, { role: "user", content: "Hello." }]);
    check(body.system_instruction === undefined && body.contents[0].parts[0].text.startsWith(stable), "…and later requests open the contents with it");
    shared.setSystemInstructionIsRefused(false);
    request.setBodyJson({ messages: [{ role: "system", content: "Short." }, { role: "user", content: "Hi." }] }); shared.prepareToSendRequest(request);
    check(!request.isRefusedSystemInstruction(), "a 400 to a short system_instruction is not read as a refusal");
    console.log("\n" + pass + " passed, " + fail + " failed"); process.exit(fail === 0 ? 0 : 1);
})().catch(e => { console.error("Test run failed:", e); process.exit(1); });
