#!/usr/bin/env node

"use strict";

/**
 * Headless test: framework code names no class the framework does not define.
 *
 * STRVCT must not know the app built on it (docs/Plans/Naked Objects Issues,
 * "App names in framework code"). The 2026-11-18 cleanup found a framework
 * method that looked up the app's session class (a ReferenceError under any
 * other app) and a framework class that named the app's tile. This test keeps
 * that from coming back without knowing any app's prefix: a class name used
 * in framework code must be defined by a framework file, be a platform API,
 * or be listed in ALLOWED with its reason.
 *
 * It looks where a name is used as a class: `extends X`, `new X(`,
 * `instanceof X`, `X.clone(` / `X.shared(` / `X.prototype` / `X.type(`, and
 * the string forms `SvGlobals.get("X")`, `getClass("X")`,
 * `setSlotType("X")`, `setFinalInitProto(X)`. Comments are skipped, and so is
 * prose inside strings (a prompt's worked example is not seen).
 *
 * Its first run (2026-11-23) found two names no file defined: an audio file
 * read through SvResourceFile made an `SvSoundResource` (it is `SvWaSound`),
 * and a slot's type was spelled "NumbeStringr".
 *
 * A static scan of the source: no boot needed.
 *
 * Usage (from the strvct root):
 *   node tests/headless/TestUndefinedClassNames.js
 */

const fs = require("fs");
const path = require("path");

const strvctRoot = path.join(__dirname, "..", "..");

// Not loaded, or not framework code.
const SKIPPED_DIRS = new Set(["_unused", "-unused", "external-libs", "node_modules", "tests"]);

// Platform classes Node does not have, so they are not on its globalThis.
const BROWSER_APIS = [
    "AudioBuffer", "AudioBufferSourceNode", "AudioContext", "CanvasRenderingContext2D", "CSSStyleSheet",
    "DOMParser", "GainNode", "HTMLElement", "IntersectionObserver", "MouseEvent", "MutationObserver",
    "Notification", "OffscreenCanvas", "ResizeObserver", "SpeechRecognition", "StyleSheet", "TouchEvent"
];

// Names that are not classes, or come from a vendored library: name → why.
const ALLOWED = {
    "Action": "a slot type that marks an action method, not a class (Slot.js)",
    "DataConnection": "PeerJS's connection class (vendored under services/Peer/external-libs)"
};

const USES = [
    /\bextends\s+([A-Z][\w$]*)/g,
    /\bnew\s+([A-Z][\w$]*)\s*\(/g,
    /\binstanceof\s+([A-Z][\w$]*)/g,
    /(?<![\w$.])([A-Z][\w$]*)\.(?:clone|shared|prototype|type|initThisClass)\b/g,
    /(?:SvGlobals\.get|getClass|setSlotType)\(\s*["']([A-Z][\w$]*)["']/g,
    /setFinalInitProto\(\s*([A-Z][\w$]*)\s*\)/g
];

const DEFINITIONS = [
    /\bclass\s+([A-Za-z_$][\w$]*)/g,
    /\bfunction\s+([A-Za-z_$][\w$]*)/g,
    /\b(?:const|let|var)\s+([A-Z][\w$]*)\s*=/g,
    /SvGlobals\.set\(\s*["']([\w$]+)/g,
    /(?:globalThis|window|self|global|getGlobalThis\(\))\.([A-Z][\w$]*)\s*=/g,
    /\b([A-Z][\w$]*)\s*:\s*([A-Z][\w$]*)\s*[,}]/g // a renamed destructured import: `{ Image: NodeImage } = require(…)`
];

function sourceFiles (dir, skipped) {
    if (!fs.existsSync(dir)) {
        return [];
    }
    return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            return skipped.has(entry.name) ? [] : sourceFiles(full, skipped);
        }
        return entry.name.endsWith(".js") ? [full] : [];
    });
}

function withoutComments (source) {
    return source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:\\])\/\/.*$/gm, "$1");
}

function namesMatching (patterns, text) {
    return patterns.flatMap(pattern => Array.from(text.matchAll(pattern), m => m[m.length - 1]));
}

/** Every name a framework file defines, vendored libraries included. */
function definedNames () {
    const files = [
        ...sourceFiles(path.join(strvctRoot, "source"), new Set(["node_modules"])),
        ...sourceFiles(path.join(strvctRoot, "external-libs"), new Set(["node_modules"]))
    ];
    return new Set(files.flatMap(file => namesMatching(DEFINITIONS, fs.readFileSync(file, "utf8"))));
}

/** name → files that use it as a class without any definition. */
function undefinedUses () {
    const known = new Set([...definedNames(), ...Object.getOwnPropertyNames(globalThis), ...BROWSER_APIS, ...Object.keys(ALLOWED)]);
    const uses = new Map();
    for (const file of sourceFiles(path.join(strvctRoot, "source"), SKIPPED_DIRS)) {
        const rel = path.relative(strvctRoot, file).split(path.sep).join("/");
        for (const name of namesMatching(USES, withoutComments(fs.readFileSync(file, "utf8")))) {
            if (!known.has(name)) {
                uses.set(name, (uses.get(name) || new Set()).add(rel));
            }
        }
    }
    return uses;
}

const uses = undefinedUses();
for (const [name, files] of uses) {
    console.log(`  \x1b[31m✗\x1b[0m ${name}, used in ${Array.from(files).join(", ")}: no framework file defines it. If it is the app's, have the app supply it (a hint, a protocol, a delegate); if it is a platform API, add it to BROWSER_APIS.`);
}
console.log(`\n${uses.size} undefined class name${uses.size === 1 ? "" : "s"}.`);
process.exit(uses.size > 0 ? 1 : 0);
