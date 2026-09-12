#!/usr/bin/env node

"use strict";

/**
 * Headless test: SvMarkdownIncludes nests an included prompt part's headings
 * at the level of the insertion point in the INCLUDING file.
 *
 * Why this exists (2026-09-12): the retired relative-marker notation resolved
 * headings against a running level carried across the flattened document, so
 * every sibling include started where the previous one's content ended. Depth
 * compounded silently — the production session prompt reached ten heading
 * levels, fifty-one headings past markdown's `######`. Anchoring to the
 * including file's own heading is the rule that stops that, and this test
 * pins each clause of it.
 *
 * Usage (from the strvct root):
 *   node tests/headless/TestPromptHeadingNesting.js
 */

const path = require("path");
const fs = require("fs");

const strvctRoot = path.join(__dirname, "..", "..");

let pass = 0, fail = 0;
const check = (c, m) => {
    if (c) { pass++; console.log("  \x1b[32m✓\x1b[0m " + m); }
    else { fail++; console.log("  \x1b[31m✗\x1b[0m " + m); }
};

global.SvGlobals = { globals: () => global };
eval(fs.readFileSync(path.join(strvctRoot, "source/library/ideal/markdown/SvMarkdownIncludes.js"), "utf8"));

/** Compose `root` against an in-memory file map. */
function compose (root, files) {
    const includes = new SvMarkdownIncludes().setContentsOfFileNamed((name) => {
        if (!Object.hasOwn(files, name)) { throw new Error("no such file " + name); }
        return files[name];
    });
    return includes.resolve(root, 1);
}

const levelOf = (line) => (line.match(/^(#+)\s/) || [null, ""])[1].length;

/** Heading level for a given title in composed output, or null. */
function levelFor (out, title) {
    const line = out.split("\n").find(l => /^#+ /.test(l) && l.includes(title));
    return line ? levelOf(line) : null;
}

function testPartAnchorsToTheInsertionPoint () {
    console.log("\nA part's # renders at the level of the nearest preceding heading in the including file");

    const part = ["# Combat Basics", "## When Combat Begins", "### Prerequisite", "## When Round Ends"].join("\n");
    const out = compose(["## SPECIFIC TASK", "### Combat Encounters", "{{file$part.txt}}"].join("\n"), { "part.txt": part });

    check(levelFor(out, "Combat Basics") === 3, "# in the part = the anchor level (3)");
    check(levelFor(out, "When Combat Begins") === 4, "## = one deeper");
    check(levelFor(out, "Prerequisite") === 5, "### = two deeper");
    check(levelFor(out, "When Round Ends") === 4, "coming back out returns to the right level");
}

function testContainedPartOpensAtTwo () {
    console.log("\nA part that opens at ## is CONTAINED by the heading above the include");

    const out = compose(["## NOTES ON THE TOOLS", "{{file$tool.txt}}"].join("\n"), { "tool.txt": "## Dice Roll Tool\n### Core Mechanics" });
    check(levelFor(out, "Dice Roll Tool") === 3, "its top heading is a child of the section");
    check(levelFor(out, "Core Mechanics") === 4, "…and its child follows");
}

function testSiblingIncludesDoNotCompound () {
    console.log("\nSibling includes all anchor to the SAME heading — depth never compounds");

    const deep = "# A\n## B\n### C\n#### D";
    const root = ["## SECTION", "{{file$deep.txt}}", "{{file$deep.txt}}", "{{file$deep.txt}}"].join("\n");
    const out = compose(root, { "deep.txt": deep });
    const aLevels = out.split("\n").filter(l => /^#+ A$/.test(l)).map(levelOf);
    check(aLevels.length === 3 && aLevels.every(n => n === 2), "each sibling's # lands at 2 (" + aLevels.join(",") + ")");
    check(Math.max(...out.split("\n").map(levelOf)) === 5, "the deepest heading is 5, not 5+3+3");
}

function testAnchorSetsLevelAndEmitsNothing () {
    console.log("\nA heading titled only '---' is a level anchor: it sets the level and emits nothing");

    const root = ["## SHARED", "### HOW TO", "{{file$how.txt}}", "", "### ---", "{{file$peer.txt}}", "## ---", "{{file$peer.txt}}"].join("\n");
    const out = compose(root, { "how.txt": "## Procedure", "peer.txt": "# Peer\n## Sub" });
    const peerLevels = out.split("\n").filter(l => /^#+ Peer$/.test(l)).map(levelOf);
    check(peerLevels.join(",") === "3,2", "the same part lands at 3 under '### ---' and at 2 under '## ---' (" + peerLevels.join(",") + ")");
    check(!/^#+ ---$/m.test(out), "no '---' heading reaches the output");
    check(levelFor(out, "Procedure") === 4, "a titled heading still anchors the include after it");
}

function testAnchorsShiftWithTheirOwnParent () {
    console.log("\nAn anchor inside an included part is shifted like any heading of that part");

    // ObjectMessageToolPrompt's shape: a part with its own anchor, itself included.
    const files = {
        "outer.txt": "## Object Message Tool\n## ---\n{{file$inner.txt}}",
        "inner.txt": "# Protocols\n## Detail"
    };
    const out = compose(["## NOTES", "{{file$outer.txt}}"].join("\n"), files);
    check(levelFor(out, "Object Message Tool") === 3, "the outer part's ## is contained by NOTES (3)");
    check(levelFor(out, "Protocols") === 3, "its '## ---' anchor is shifted to 3, so the inner part's # lands at 3");
    check(levelFor(out, "Detail") === 4, "…and the inner part's ## at 4");
}

function testNonHeadingLinesAndInlineIncludesPassThrough () {
    console.log("\nBody text passes through; an include with no headings splices inline");

    const out = compose(["# Root", "<json>", "{{file$names.json}}", "</json>", "Text with {{file$frag.txt}} inline."].join("\n"),
        { "names.json": "[\"Goblin\"]", "frag.txt": "a fragment" });
    check(out.includes("<json>\n[\"Goblin\"]\n</json>"), "a headingless include is spliced verbatim");
    check(out.includes("Text with a fragment inline."), "an inline include is replaced in place");
}

function testCycleIsReported () {
    console.log("\nAn include cycle is reported, not looped forever");

    let message = null;
    try { compose("{{file$a.txt}}", { "a.txt": "{{file$b.txt}}", "b.txt": "{{file$a.txt}}" }); }
    catch (e) { message = e.message; }
    check(message !== null && /^include cycle: a\.txt -> b\.txt -> a\.txt$/.test(message), "the error names the chain (" + message + ")");
}

function testTheComposerUsesIt () {
    console.log("\nSvAiPromptComposer resolves includes through SvMarkdownIncludes (wiring guard)");

    const src = fs.readFileSync(path.join(strvctRoot, "source/library/services/AiServiceKit/Composer/SvAiPromptComposer.js"), "utf8");
    check(/new SvMarkdownIncludes\(\)/.test(src), "replaceFiles constructs SvMarkdownIncludes");
    check(!/SvMarkdownRelative|convertToAbsoluteMarkdown/.test(src), "no relative-marker machinery remains");
}

function main () {
    console.log("TestPromptHeadingNesting:");
    testPartAnchorsToTheInsertionPoint();
    testContainedPartOpensAtTwo();
    testSiblingIncludesDoNotCompound();
    testAnchorSetsLevelAndEmitsNothing();
    testAnchorsShiftWithTheirOwnParent();
    testNonHeadingLinesAndInlineIncludesPassThrough();
    testCycleIsReported();
    testTheComposerUsesIt();
    console.log("\n" + pass + " passed, " + fail + " failed");
    process.exit(fail === 0 ? 0 : 1);
}

main();
