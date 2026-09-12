#!/usr/bin/env node

"use strict";

/**
 * Headless test: an included prompt part nests UNDER the section that includes it.
 *
 * The defect this guards (live until 2026-09-12): a part written with ordinary
 * markdown headings rendered one level SHALLOWER than its own section, because
 * SvMarkdownRelative treats an absolute heading as a level RESET. In the real
 * prompt, `=#= Combat Encounters` followed by a part whose headings began at
 * `##` put 593 lines of content above their own section, and the table of
 * contents derived from those headings misdescribed the document.
 *
 * Plain markdown is what an author naturally writes — four parts already did —
 * so the format had to stop punishing it. SvAiPromptComposer now converts an
 * included part's headings to relative at splice time
 * (`nestedContentsOfFileNamed`), letting the existing resolver nest them.
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
eval(fs.readFileSync(path.join(strvctRoot, "source/library/ideal/markdown/SvMarkdownRelative.js"), "utf8"));

const resolve = (s) => new SvMarkdownRelative().setInputString(s).convertRelativeToAbsolute().outputString();
// Mirrors SvAiPromptComposer.nestedContentsOfFileNamed: normalize the part's
// shallowest heading to `#`, then make it relative.
function normalize (text) {
    const re = /^(#{1,6})(\s)/;
    let min = null;
    text.split("\n").forEach(l => { const m = l.match(re); if (m && (min === null || m[1].length < min)) { min = m[1].length; } });
    if (min === null || min === 1) { return text; }
    const shift = min - 1;
    return text.split("\n").map(l => { const m = l.match(re); return m ? l.replace(re, "#".repeat(m[1].length - shift) + m[2]) : l; }).join("\n");
}
const nest = (s) => new SvMarkdownRelative().setInputString(normalize(s)).convertAbsoluteToRelative().outputString();
const levelOf = (line) => (line.match(/^(#+)\s/) || [null, ""])[1].length;

/** Heading level for a given title in resolved output. */
function levelFor (resolved, title) {
    const line = resolved.split("\n").find(l => l.includes(title));
    return line ? levelOf(line) : null;
}

function testPartNestsUnderItsSection () {
    console.log("\nA part written in plain markdown nests under its section");

    const part = ["# Combat Basics", "## When Combat Begins", "### Prerequisite", "## When Round Ends"].join("\n");
    const host = ["## SPECIFIC TASK DETAILS", ">#> Session Response Workflow", "=#= Combat Encounters", nest(part)].join("\n");
    const out = resolve(host);

    const section = levelFor(out, "Combat Encounters");
    const first = levelFor(out, "Combat Basics");
    const nested = levelFor(out, "When Combat Begins");
    const deepest = levelFor(out, "Prerequisite");
    const backOut = levelFor(out, "When Round Ends");

    check(section === 3, "the including section resolves to ### (" + section + ")");
    check(first === section + 1, "the part's top heading is a CHILD of it (" + first + " vs " + section + ")");
    check(nested === first + 1, "the part's internal hierarchy is preserved one deeper");
    check(deepest === nested + 1, "…and deeper again");
    check(backOut === nested, "…and coming back out returns to the right level");
}

function testTheOriginalDefectIsGone () {
    console.log("\nThe original inversion no longer happens");

    // Splicing raw (the old behaviour) vs nested (the new one).
    const part = ["## Always End a Combat Response", "### Prerequisite"].join("\n");
    const prefix = ["## SPECIFIC TASK DETAILS", ">#> Session Response Workflow", "=#= Combat Encounters"];

    const oldWay = resolve(prefix.concat([part]).join("\n"));
    const newWay = resolve(prefix.concat([nest(part)]).join("\n"));

    const oldContent = levelFor(oldWay, "Always End a Combat Response");
    const oldSection = levelFor(oldWay, "Combat Encounters");
    check(oldContent < oldSection, "precondition: splicing raw DID invert (" + oldContent + " above " + oldSection + ")");

    const newContent = levelFor(newWay, "Always End a Combat Response");
    const newSection = levelFor(newWay, "Combat Encounters");
    check(newContent === newSection + 1,
        "nested splicing puts content exactly ONE level below its section (" + newContent + " under " + newSection + ")");
}

function testRelativePartsAreUntouched () {
    console.log("\nParts already using relative markers are unaffected");

    const existing = [">#> Result Handling", "=#= Tool Errors", "<#< Back out"].join("\n");
    check(nest(existing).trim() === existing.trim(),
        "relative markers pass through unchanged, so no migration is forced");
}

function testPartStartingDeeperStillNestsByOne () {
    console.log("\nA part whose headings start at ## still nests by exactly one");

    // CombatEncountersPrompt begins at ##, not #. Without normalization it
    // would land two levels below its section, skipping a level.
    const part = ["## Always End a Combat Response", "### Prerequisite"].join("\n");
    const out = resolve(["## ROOT", ">#> Section", nest(part)].join("\n"));
    const section = levelFor(out, "Section");
    check(levelFor(out, "Always End a Combat Response") === section + 1,
        "its top heading is one below the section regardless of where it started");
    check(levelFor(out, "Prerequisite") === section + 2, "…and its child follows");
}

function testNoHeadingLevelJumps () {
    console.log("\nResolved output never skips a heading level");

    const part = ["# A", "## B", "### C"].join("\n");
    const out = resolve(["## ROOT", ">#> Section", nest(part)].join("\n"));
    const levels = out.split("\n").map(levelOf).filter(n => n > 0);
    const jumps = levels.filter((n, i) => i > 0 && n - levels[i - 1] > 1);
    check(jumps.length === 0, "no jump deeper than one level (" + levels.join(",") + ")");
}

/**
 * The guard that actually holds the composer to this. The checks above exercise
 * SvMarkdownRelative directly, so they would keep passing if the composer
 * stopped calling it — which is exactly the regression worth catching.
 *
 * Note what is NOT used here: asserting on the flattened composed output. Two
 * attempts failed to detect the original defect (a level SKIP is the wrong
 * fingerprint, since a reset goes shallower; an EMPTY SECTION is wrong too,
 * since the section has a short body before the included headings). Flattening
 * destroys the include boundaries the assertion would need, so the guard has to
 * run through the composer with a known include.
 */
function testTheComposerActuallyNestsIncludes () {
    console.log("\nThe composer nests an included part (wiring guard)");

    const composerPath = path.join(strvctRoot, "source/library/services/AiServiceKit/Composer/SvAiPromptComposer.js");
    const src = fs.readFileSync(composerPath, "utf8");
    check(/nestedContentsOfFileNamed\s*\(fileName\)/.test(src),
        "replaceNextFile splices through nestedContentsOfFileNamed, not raw contents");
    check(/convertAbsoluteToRelative/.test(src),
        "…which converts the part's headings to relative");
    check(/normalizedHeadingDepth/.test(src),
        "…after normalizing its shallowest heading to '#'");
}

function main () {
    console.log("TestPromptHeadingNesting:");
    testPartNestsUnderItsSection();
    testTheOriginalDefectIsGone();
    testPartStartingDeeperStillNestsByOne();
    testRelativePartsAreUntouched();
    testNoHeadingLevelJumps();
    testTheComposerActuallyNestsIncludes();
    console.log("\n" + pass + " passed, " + fail + " failed");
    process.exit(fail === 0 ? 0 : 1);
}

main();
