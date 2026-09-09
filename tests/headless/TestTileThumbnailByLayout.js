#!/usr/bin/env node

"use strict";

/**
 * Headless test: a thumbnail belongs in a vertical row, not a horizontal tab.
 *
 * The node says whether it HAS a portrait (nodeExpectsThumbnail); the tile
 * says whether one FITS. In a horizontal row it does not: a list row is wide
 * and short with room beside the title, while a tile in a horizontal row is a
 * tab — narrow, where a portrait either dominates it or forces it wide. The
 * companion's "Me" tab measured 218px against its 98px sibling.
 *
 * Deliberately not a node hint (Steve, 2026-09-09). A hint would have to read
 * "hide the thumbnail when I am laid out horizontally", which asks the model a
 * question only the view can answer, and would be repeated at every call site
 * to say the same thing.
 *
 * Usage (from the strvct root):
 *   node tests/headless/TestTileThumbnailByLayout.js
 */

const path = require("path");
const fs = require("fs");
const { pathToFileURL } = require("url");

const strvctRoot = path.join(__dirname, "..", "..");
process.chdir(strvctRoot);

let pass = 0, fail = 0;
const check = (c, m) => {
    if (c) {
        pass++;
        console.log("  \x1b[32m✓\x1b[0m " + m);
    } else {
        fail++;
        console.log("  \x1b[31m✗\x1b[0m " + m);
    }
};

async function boot () {
    const bootFile = (p) => import(pathToFileURL(path.join(strvctRoot, p)).href);
    await bootFile("source/boot/SvGlobals.js");
    await bootFile("source/boot/SvPlatform.js");
    await bootFile("source/boot/StrvctFile.js");
    await bootFile("source/boot/SvBootLoader.js");
    SvGlobals.get("SvBootLoader")._bootPath = "source/boot";
    await SvGlobals.get("SvBootLoader").asyncRun();
}

// showsThumbnail() reads only node() and direction(), so it can be exercised
// without building a DOM tile hierarchy.
function tileWith (expectsThumbnail, direction) {
    const proto = SvGlobals.get("SvTitledTile").prototype;
    return {
        node: () => (expectsThumbnail === null
            ? null
            : { nodeExpectsThumbnail: () => expectsThumbnail, asyncNodeThumbnailUrl: async () => "x.png" }),
        direction: () => direction,
        showsThumbnail: proto.showsThumbnail
    };
}

async function main () {
    await boot();

    console.log("A vertical list row shows the thumbnail");
    check(tileWith(true, "right").showsThumbnail() === true,
        "expects one, laid out vertically => shown");

    console.log("\nA horizontal row is a tab, and shows none");
    check(tileWith(true, "down").showsThumbnail() === false,
        "expects one, laid out horizontally => hidden");

    console.log("\nThe node's own answer is still respected");
    check(tileWith(false, "right").showsThumbnail() === false,
        "a node with no portrait shows none in a list either");
    check(tileWith(false, "down").showsThumbnail() === false, "…nor in a tab");

    console.log("\nTotal on the awkward cases — this runs during view sync");
    check(tileWith(null, "right").showsThumbnail() === false, "no node => false, not a throw");
    {
        // nodeExpectsThumbnail is duck-typed: plenty of nodes lack it entirely.
        const proto = SvGlobals.get("SvTitledTile").prototype;
        const bare = { node: () => ({}), direction: () => "right", showsThumbnail: proto.showsThumbnail };
        check(bare.showsThumbnail() === false, "a node without the method => false");
    }

    console.log("\nBOTH paths are gated, not just the synchronous one");
    // The async fill calls tv.unhideDisplay() once an image resolves, so
    // gating only the sync pass would let the image put the frame back.
    const src = fs.readFileSync(path.join(strvctRoot,
        "source/library/node/node_views/browser/stack/SvTile/SvTitledTile.js"), "utf8");
    const asyncBody = src.slice(src.indexOf("async asyncUpdateThumbnailView"));
    const guardAt = asyncBody.indexOf("!this.showsThumbnail()");
    const fetchAt = asyncBody.indexOf("await node.asyncNodeThumbnailUrl()");
    check(guardAt !== -1, "the async fill checks showsThumbnail");
    check(guardAt !== -1 && fetchAt !== -1 && guardAt < fetchAt,
        "…and returns BEFORE the fetch, so a tab costs no blob load");
    check((src.match(/this\.showsThumbnail\(\)/g) || []).length >= 2,
        "both call sites go through the one predicate");
    check(!/nodeExpectsThumbnail\s*&&\s*node\.nodeExpectsThumbnail\(\)/.test(src),
        "no call site still reads the raw node method directly");

    console.log("\n" + pass + " passed, " + fail + " failed");
    process.exit(fail === 0 ? 0 : 1);
}

main().catch((e) => {
    console.error("Test run failed:", e);
    process.exit(1);
});
