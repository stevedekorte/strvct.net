#!/usr/bin/env node

"use strict";

/**
 * Headless test: optional hooks answer from a base-class default, and the JSON
 * form is a declared protocol (docs/Plans/Complete Protocols).
 *
 * Call sites used to ask "does this object have the method?" before calling
 * an optional hook. Each hook now has a default on the base class every
 * receiver inherits, so the call sites call it unconditionally; this checks
 * the defaults, and that the classes that override them still do.
 * SvJsonSerializableProtocol is adopted by the base classes that write JSON,
 * and their subclasses conform through them.
 *
 * Usage (from the strvct root):
 *   node source/boot/index-builder/ImportsIndexer.js   # build build/_index.json if missing/stale
 *   node tests/headless/TestHookDefaults.js
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

const cls = (name) => SvGlobals.get(name);

function testNodeHookDefaults () {
    console.log("\nNode hooks: defaults on SvNode (a view may show any node), overrides kept");
    const proto = cls("SvNode").prototype;
    check(proto.cssVariableDict() === null, "cssVariableDict() is null by default");
    check(proto.nodeAcceptsDrop(null) === false, "nodeAcceptsDrop() is false by default");
    check(typeof proto.nodeDropped === "function", "nodeDropped() exists by default");
    check(cls("SvLinkNode").prototype.nodeAcceptsDrop !== proto.nodeAcceptsDrop, "SvLinkNode still overrides nodeAcceptsDrop");
    check(cls("SvLinkNode").prototype.nodeDropped !== proto.nodeDropped, "SvLinkNode still overrides nodeDropped");
    check(typeof cls("SvNode").prototype.nodeBecameVisible === "function", "every node has nodeBecameVisible (the check in SvNodeView is gone)");
    check(typeof proto.onBrowserDropChunk === "function", "every node has onBrowserDropChunk (the check in SvTilesView is gone)");
    check(cls("SvViewableNode").prototype.onBrowserDropChunk !== proto.onBrowserDropChunk, "SvViewableNode still accepts browser drops");
    check(cls("SvTitledNode").prototype.cssVariableDict() === null, "a node above SvViewableNode (e.g. the top bar's feedback link) answers too");
}

function testFieldCompleteness () {
    console.log("\nField completeness: complete by default, overrides kept");
    const field = cls("SvField").prototype;
    check(field.keyIsComplete() === true, "SvField.keyIsComplete() is true by default");
    check(field.valueIsComplete() === true, "SvField.valueIsComplete() is true by default");
    check(cls("SvAiResponseMessage").prototype.valueIsComplete !== field.valueIsComplete, "SvAiResponseMessage still overrides valueIsComplete");
    check(typeof cls("SvStyledDomView").prototype.activate === "function", "every value view has activate() (the check in SvFieldTile is gone)");
}

function testBlobHashDefault () {
    console.log("\nBlob hashes: every stored object answers");
    const empty = ({}).referencedBlobHashesSet();
    check(empty instanceof Set && empty.size === 0, "a plain object refers to no blobs");
    check([].referencedBlobHashesSet().size === 0, "an array refers to no blobs");
    check(cls("SvBlobNode").prototype.referencedBlobHashesSet !== Object.prototype.referencedBlobHashesSet, "SvBlobNode still overrides referencedBlobHashesSet");
}

function testJsonSerializableProtocol () {
    console.log("\nSvJsonSerializableProtocol");
    const protocol = cls("SvJsonSerializableProtocol");
    check(!!protocol, "the protocol is loaded");
    check(JSON.stringify(protocol.requiredMethodNames()) === JSON.stringify(["serializeToJson"]), "serializeToJson is required");
    check(JSON.stringify(protocol.optionalMethodNames()) === JSON.stringify(["deserializeFromJson"]), "deserializeFromJson is optional");
    const adopters = ["SvJsonGroup", "SvJsonArrayNode", "SvJsonDictionaryNode", "SvImageNode", "SvDateNode", "SvTimeNode", "SvToolResult"];
    const inheritors = ["SvField", "SvBooleanField", "SvPointerField", "SvJsonNullField", "SvConversation"];
    [...adopters, ...inheritors].forEach(name => {
        check(cls(name).prototype.conformsToProtocol(protocol), name + " conforms");
    });
    check(!cls("SvJsonIdNode").prototype.conformsToProtocol(protocol), "SvJsonIdNode (reads JSON, can't write it) doesn't claim to");
    const NoJson = class NoJson extends cls("SvNode") {};
    let threw = false;
    try {
        NoJson.prototype.addProtocol(protocol);
    } catch (e) {
        threw = /missing: serializeToJson/.test(e.message);
    }
    check(threw, "adopting it without serializeToJson fails, naming the method");
}

(async () => {
    await boot();
    testNodeHookDefaults();
    testFieldCompleteness();
    testBlobHashDefault();
    testJsonSerializableProtocol();
    console.log("\n" + passed + " passed, " + failed + " failed");
    process.exit(failed > 0 ? 1 : 0);
})().catch(e => {
    console.error(e);
    process.exit(1);
});
