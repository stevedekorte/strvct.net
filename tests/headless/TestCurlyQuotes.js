#!/usr/bin/env node

"use strict";

/**
 * Headless test: straight quotes are educated to curly quotes in prose.
 *
 * The AI writes ASCII " and ', but the book faces (IM Fell English) draw ASCII
 * " as a CLOSING curly quote, so every opening quote reads backwards. The fix
 * is String.withCurlyQuotes plus an opt-in flag on SvHtmlStreamReader.
 *
 * The decision uses LEFT context only, because the reader sees streamed chunks
 * and can never look at the character to the right of a quote.
 *
 * Covers:
 * - the String helper: openers vs closers, apostrophes, idempotence, and the
 *   precedingChar argument (a quote as the very last character of a chunk)
 * - the stream reader: quotes educated across awkward chunk boundaries, and
 *   across a closed inline element (prev comes from the sibling's text)
 * - machine tags (<tool-call>) stay byte-exact so their JSON still parses
 * - with educatesQuotes off (the default) nothing is rewritten
 * - an SvAiParsedResponseMessage's reader has it on
 *
 * Usage (from this directory):  node TestCurlyQuotes.js
 */

const path = require("path");
const { pathToFileURL } = require("url");

const strvctRoot = path.join(__dirname, "..", "..");
process.chdir(strvctRoot);

let passed = 0;
let failed = 0;
function check (condition, message) {
    if (condition) { passed++; console.log("  \x1b[32m✓\x1b[0m " + message); }
    else { failed++; console.log("  \x1b[31m✗\x1b[0m " + message); }
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

/**
 * The Node shim only implements document.createElement("canvas"), but the
 * stream reader mirrors its virtual DOM into a real one. A minimal stub is
 * enough — this test reads the VIRTUAL tree (innerHtml/textContent).
 */
function installDomStub () {
    const priorCreateElement = globalThis.document && globalThis.document.createElement;
    const makeNode = () => ({
        childNodes: [],
        textContent: "",
        setAttribute () {},
        appendChild (child) { this.childNodes.push(child); return child; }
    });
    if (!globalThis.document) { globalThis.document = {}; }
    globalThis.document.createElement = function (tagName) {
        if (tagName === "canvas" && priorCreateElement) { return priorCreateElement.call(this, tagName); }
        return makeNode();
    };
    globalThis.document.createTextNode = function (text) { const n = makeNode(); n.textContent = text; return n; };
}

/** Feeds the chunks through a reader and returns the root node's innerHtml. */
function streamed (chunks, educatesQuotes = true) {
    const reader = SvGlobals.get("SvHtmlStreamReader").clone().setEducatesQuotes(educatesQuotes);
    reader.beginHtmlStream();
    chunks.forEach(chunk => reader.onStreamHtml(chunk));
    reader.endHtmlStream();
    return reader;
}

function testStringHelper () {
    console.log("\nString.withCurlyQuotes()");
    check('"Hello," she said.'.withCurlyQuotes() === "“Hello,” she said.", 'sentence quotes: "Hello," → “Hello,”');
    check("'It's fine.'".withCurlyQuotes() === "‘It’s fine.’", "apostrophe in a contraction closes, the outer pair opens/closes");
    check('("quoted")'.withCurlyQuotes() === "(“quoted”)", "an open paren is an opener");
    check("—\"dash\"".withCurlyQuotes() === "—“dash”", "an em dash is an opener");
    check("\"'Run!' she shouted.\"".withCurlyQuotes() === "“‘Run!’ she shouted.”", "a single quote nested directly inside an opening double quote opens");
    check("\"'".withCurlyQuotes() === "\"'".slice(0, 1).withCurlyQuotes() + "'".withCurlyQuotes("“"), "chunk-split nested quotes agree with the whole-string result");

    const curly = "“Already,” he said — it’s fine.";
    check(curly.withCurlyQuotes() === curly, "already-curly text is untouched");
    const once = '"Hello," she said. It\'s fine.'.withCurlyQuotes();
    check(once.withCurlyQuotes() === once, "idempotent: running it twice changes nothing");

    check('"'.withCurlyQuotes("") === "“", 'a lone " with precedingChar "" opens');
    check('"'.withCurlyQuotes("o") === "”", 'a lone " with precedingChar "o" closes');
    check("he said \"".withCurlyQuotes() === "he said “", "a quote as the last char of the chunk needs no right context");
    check("'".withCurlyQuotes("") === "‘" && "'".withCurlyQuotes("o") === "’", "the same rule for single quotes");
    check("a`b'c".withCurlyQuotes() === "a`b’c", "backticks are left alone");
}

function testStreamReader () {
    console.log("\nSvHtmlStreamReader with educatesQuotes on");
    const a = streamed([
        '<narration><sentence>"Hi,',
        '" he said. \'It\'',
        "s fine.'</sentence></narration>"
    ]);
    check(a.rootNode().innerHtml() === "<narration><sentence>“Hi,” he said. ‘It’s fine.’</sentence></narration>",
        "quotes are educated across awkward chunk boundaries");

    const b = streamed(['<sentence>"<i>Hello</i>" she said</sentence>']);
    check(b.rootNode().innerHtml() === "<sentence>“<i>Hello</i>” she said</sentence>",
        "the quote after a closed <i> closes (prev comes from the sibling's textContent)");

    const toolJson = '{"toolName":"x","args":{"s":"it\'s"}}';
    const c = streamed(["<tool-call>" + toolJson + "</tool-call>"]);
    check(c.rootNode().innerHtml() === "<tool-call>" + toolJson + "</tool-call>", "<tool-call> text is byte-identical");
    const toolNode = c.rootNode().children().first();
    let parsed = null;
    try { parsed = JSON.parse(toolNode.textContent()); } catch { parsed = null; }
    check(parsed !== null && parsed.args.s === "it's", "…and its textContent still JSON.parses");

    const nested = streamed(['<tool-call><arg>{"s":"it\'s"}</arg></tool-call>']);
    check(nested.rootNode().innerHtml() === "<tool-call><arg>{\"s\":\"it's\"}</arg></tool-call>",
        "a descendant of a skip tag is skipped too");

    console.log("\nSvHtmlStreamReader with educatesQuotes off (the default)");
    const off = streamed(['<sentence>"Hi," he said. It\'s fine.</sentence>'], false);
    check(off.rootNode().innerHtml() === "<sentence>\"Hi,\" he said. It's fine.</sentence>", "nothing is rewritten");
    check(SvGlobals.get("SvHtmlStreamReader").clone().educatesQuotes() === false, "a fresh reader has it off");
}

function testParsedResponseMessage () {
    console.log("\nSvAiParsedResponseMessage");
    const message = SvGlobals.get("SvAiParsedResponseMessage").clone();
    message.setupHtmlStreamReader();
    check(message.htmlStreamReader().educatesQuotes() === true, "its stream reader educates quotes");
    check(message.htmlStreamReader().quoteEducationSkipTagNames().has("tool-call"), "…with tool-call in the skip set");
}

async function main () {
    await boot();
    installDomStub();
    testStringHelper();
    testStreamReader();
    testParsedResponseMessage();
}

main().then(() => {
    console.log("\n" + passed + " passed, " + failed + " failed");
    process.exit(failed === 0 ? 0 : 1);
}).catch((e) => { console.error("Test run failed:", e); process.exit(1); });
