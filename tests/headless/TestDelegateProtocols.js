#!/usr/bin/env node

"use strict";

/**
 * Headless test: each delegate protocol says what its sender actually sends.
 *
 * A sender names its delegate protocol with delegateProtocol(). For each one,
 * the messages it and its subclasses send (sendDelegateMessage("…") in
 * their files and category files) must all be declared by the protocol, and every message the
 * protocol declares must be sent — a declared message nobody sends is an
 * invented interface, which is how six protocols once listed callbacks the
 * code never made. Every SvDelegateProtocol must also be named by a sender.
 * A static scan of the source: no boot needed.
 *
 * Usage (from the strvct root):
 *   node tests/headless/TestDelegateProtocols.js
 */

const fs = require("fs");
const path = require("path");

const sourceRoot = path.join(__dirname, "..", "..", "source");

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

function jsFiles (dir) {
    return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            return entry.name === "_unused" || entry.name === "external-libs" ? [] : jsFiles(full);
        }
        return entry.name.endsWith(".js") ? [full] : [];
    });
}

const files = jsFiles(sourceRoot);
const text = new Map(files.map(f => [f, fs.readFileSync(f, "utf8")]));

// class name -> its file, and superclass name -> subclass names (a subclass sends its delegate messages too)
const classFile = new Map();
const subclassesOf = new Map();
files.forEach(f => {
    for (const m of text.get(f).matchAll(/\(class ([A-Za-z]+) extends ([A-Za-z]+) \{/g)) {
        if (m[1].includes("_")) {
            continue; // a category: found with its class below
        }
        classFile.set(m[1], f);
        subclassesOf.set(m[2], (subclassesOf.get(m[2]) || []).concat([m[1]]));
    }
});

function classAndDescendants (className) {
    return [className].concat((subclassesOf.get(className) || []).flatMap(classAndDescendants));
}

function filesOfClass (className) {
    const file = classFile.get(className);
    if (!file) {
        return [];
    }
    const dir = path.dirname(file);
    return files.filter(f => path.dirname(f) === dir && (path.basename(f, ".js") === className || path.basename(f).startsWith(className + "_")));
}

function sentMessages (senderFile) {
    const family = classAndDescendants(path.basename(senderFile, ".js")).flatMap(filesOfClass);
    const names = new Set();
    family.forEach(f => {
        for (const m of text.get(f).matchAll(/sendDelegateMessage\("([A-Za-z]+)"/g)) {
            names.add(m[1]);
        }
    });
    return names;
}

function declaredMessages (protocolName) {
    const file = files.find(f => path.basename(f, ".js") === protocolName);
    if (!file) {
        return null;
    }
    const names = new Set();
    for (const m of text.get(file).matchAll(/^ {4}([a-z][A-Za-z]*) \([^)]*\) \{$/gm)) {
        names.add(m[1]);
    }
    return names;
}

const senders = files.map(f => {
    const m = text.get(f).match(/delegateProtocol \(\) \{\s*return ([A-Za-z]+);/);
    return m ? { file: f, protocol: m[1] } : null;
}).filter(s => s);

console.log("Delegate protocols match their senders");
check(senders.length >= 7, "senders that name a delegate protocol: " + senders.length);

senders.forEach(({ file, protocol }) => {
    const sender = path.basename(file, ".js");
    const declared = declaredMessages(protocol);
    if (!declared) {
        check(false, sender + ": no file for " + protocol);
        return;
    }
    const sent = sentMessages(file);
    const undeclared = [...sent].filter(n => !declared.has(n));
    const unsent = [...declared].filter(n => !sent.has(n));
    check(undeclared.length === 0, sender + " sends only what " + protocol + " declares" + (undeclared.length ? " — undeclared: " + undeclared.join(", ") : ""));
    check(unsent.length === 0, protocol + " declares only what " + sender + " sends" + (unsent.length ? " — never sent: " + unsent.join(", ") : ""));
});

console.log("\nEvery delegate protocol has a sender");
const named = new Set(senders.map(s => s.protocol));
files.filter(f => /extends SvDelegateProtocol \{/.test(text.get(f))).forEach(f => {
    const name = path.basename(f, ".js");
    check(named.has(name), name + " is named by a sender's delegateProtocol()");
});

console.log("\n" + passed + " passed, " + failed + " failed");
process.exit(failed > 0 ? 1 : 0);
