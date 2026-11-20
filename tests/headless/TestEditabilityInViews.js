#!/usr/bin/env node

"use strict";

/**
 * Headless test: view code asks the editability cascade before offering an
 * edit.
 *
 * A node's raw capabilities (nodeCanEditTitle(), canDelete(),
 * nodeCanAddSubnode(), valueIsEditable(), acceptsAddingSubnode(),
 * nodeAcceptsDrop(), nodeCanReorderSubnodes()) say what the node allows in
 * general. Whether the edit is offered HERE also depends on the cascade: a
 * catalog a non-editor can't save to, a session's copy of a character. A
 * view that reads the raw capability offers an edit that is then dropped,
 * which is how a non-admin's drop onto an admin-only catalog was lost
 * (docs/Plans/Capabilities & Permissions). So a view asks
 * node.offersUserEdit(node.canDelete()), or a field tile's
 * nodeValueIsEditable().
 *
 * This scans the view layer for a raw capability read on a node (not on
 * `this`, a view's own canDelete() that already asks) with no
 * offersUserEdit( on the same line, and fails on any not in ALLOWED.
 * A static scan of the source: no boot needed.
 *
 * Usage (from the strvct root):
 *   node tests/headless/TestEditabilityInViews.js
 */

const fs = require("fs");
const path = require("path");

const strvctRoot = path.join(__dirname, "..", "..");
const ROOTS = ["source/library/node/node_views", "source/library/view", "source/library/node/app/ui"];
const SKIPPED_DIRS = new Set(["_unused", "external-libs", "node_modules"]);

const CAPABILITIES = [
    "nodeCanEditTitle", "nodeCanEditSubtitle", "canDelete", "nodeCanAddSubnode", "valueIsEditable",
    "acceptsAddingSubnode", "nodeAcceptsDrop", "nodeCanReorderSubnodes"
];

// "<file> <capability>" → why the raw read is right there.
const ALLOWED = {
    "source/library/node/node_views/browser/stack/SvTile/field_tiles/SvFieldTile.js valueIsEditable": "nodeValueIsEditable() itself: reads the raw value, then asks the cascade on the next line"
};

const RAW_READ = new RegExp("(?<!\\bthis)\\.(" + CAPABILITIES.join("|") + ")\\s*\\(", "g");

function sourceFiles (dir) {
    return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            return SKIPPED_DIRS.has(entry.name) ? [] : sourceFiles(full);
        }
        return entry.name.endsWith(".js") ? [full] : [];
    });
}

// Code lines with their numbers, without comments: blocks that open at the
// start of a line, `//` lines, and trailing `// …`.
function codeLines (file) {
    let inBlock = false;
    const kept = [];
    fs.readFileSync(file, "utf8").split("\n").forEach((line, i) => {
        if (!inBlock && /^\s*\/\*/.test(line)) {
            inBlock = !line.includes("*/");
        } else if (inBlock) {
            inBlock = !line.includes("*/");
        } else if (!/^\s*\/\//.test(line)) {
            kept.push({ n: i + 1, text: line.replace(/(^|[^:])\/\/.*$/, "$1") });
        }
    });
    return kept;
}

function definesCapability (text, name) {
    return new RegExp("^\\s*(async\\s+)?" + name + "\\s*\\(").test(text);
}

function rawReads () {
    const found = [];
    for (const root of ROOTS) {
        for (const file of sourceFiles(path.join(strvctRoot, root))) {
            const rel = path.relative(strvctRoot, file).split(path.sep).join("/");
            for (const { n, text } of codeLines(file)) {
                if (text.includes("offersUserEdit(")) {
                    continue;
                }
                for (const match of text.matchAll(RAW_READ)) {
                    const name = match[1];
                    if (!ALLOWED[`${rel} ${name}`] && !definesCapability(text, name)) {
                        found.push({ rel, n, name, text: text.trim() });
                    }
                }
            }
        }
    }
    return found;
}

// --- list mutations ---
//
// The scan above catches a view that reads a raw capability. A view that
// changes a node's list WITHOUT reading any capability passes it, which is
// how Cmd+D duplicated a tile into a read-only catalog (found in a browser,
// 2026-11-19). So: a view method that adds to, removes from or reorders a
// node's subnodes must ask the cascade in the same method, or be listed
// here with where its gate is.

const LIST_MUTATIONS = ["addSubnode", "addSubnodeAt", "addAt", "removeSubnode", "removeSubnodes", "setSubnodes", "removeFromParentNode"];
const MUTATION = new RegExp("\\.(" + LIST_MUTATIONS.join("|") + ")\\s*\\(");
const ASKS_CASCADE = /offersUserEdit\(|effectiveUserEditability\(|\.canDelete\(\)/;

// "<file> <method>" → where the edit was already refused.
const GATED_ELSEWHERE = {
    "source/library/node/node_views/browser/stack/SvTile/SvTile_dragging.js onDragRequestRemove": "only a move drag asks this, and dragOperationForLongPress() makes a drag out of a read-only list a copy",
    "source/library/node/node_views/browser/stack/SvTilesView/SvTilesView_gestures.js onPinchCancelled": "removes the tile onPinchBegin added, which asked the cascade",
    "source/library/node/node_views/browser/stack/SvTilesView/SvTilesView_dragViewProtocol.js onDragSourceDropped": "a reorder: canReorderTiles() asked the cascade before the drag was accepted (SvTilesView_gestures)",
    "source/library/node/node_views/browser/stack/SvTilesView/SvTilesView_dragViewProtocol.js onDragDestinationDropped": "a drop: acceptsDropHoverComplete() asked the cascade before the drop was accepted"
};

function methodsOf (file) {
    const methods = [];
    let current = null;
    for (const line of codeLines(file)) {
        const start = /^ {4}(?:async\s+)?([A-Za-z0-9_]+)\s*\([^)]*\)\s*\{/.exec(line.text);
        if (start) {
            current = { name: start[1], n: line.n, text: "" };
            methods.push(current);
        }
        if (current) {
            current.text += line.text + "\n";
        }
    }
    return methods;
}

function ungatedMutations () {
    const out = [];
    for (const root of ROOTS) {
        for (const file of sourceFiles(path.join(strvctRoot, root))) {
            const rel = path.relative(strvctRoot, file).split(path.sep).join("/");
            for (const method of methodsOf(file)) {
                const mutation = MUTATION.exec(method.text);
                if (mutation && !ASKS_CASCADE.test(method.text) && !GATED_ELSEWHERE[`${rel} ${method.name}`]) {
                    out.push({ rel, n: method.n, name: method.name, call: mutation[1] });
                }
            }
        }
    }
    return out;
}

const ungated = ungatedMutations();
for (const m of ungated) {
    console.log(`  \x1b[31m✗\x1b[0m ${m.rel}:${m.n} ${m.name}() calls ${m.call}() without asking the cascade`);
    console.log("      ask node.offersUserEdit(...) in the method; if the edit was refused earlier, add it to GATED_ELSEWHERE with where");
}
if (ungated.length === 0) {
    console.log("  \x1b[32m✓\x1b[0m every view method that changes a node's list asks the editability cascade (or says where it was asked)");
}

const found = rawReads();
for (const r of found) {
    console.log(`  \x1b[31m✗\x1b[0m ${r.rel}:${r.n} reads ${r.name}() without the cascade: ${r.text}`);
    console.log("      ask node.offersUserEdit(node." + r.name + "(...)) (or a field tile's nodeValueIsEditable()); if the raw read is right, add it to ALLOWED with the reason");
}
if (found.length === 0) {
    console.log("  \x1b[32m✓\x1b[0m every raw edit-capability read in the view layer goes through the editability cascade");
}
console.log(`\n${found.length} raw read${found.length === 1 ? "" : "s"}.`);
console.log(`${ungated.length} ungated list mutation${ungated.length === 1 ? "" : "s"}.`);
process.exit(found.length + ungated.length > 0 ? 1 : 0);
