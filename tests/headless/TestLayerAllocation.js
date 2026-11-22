#!/usr/bin/env node

"use strict";

/**
 * Headless test: SvLayerAllocation — which columns of a browser's chain are
 * shown and which width rule each takes, with no DOM (Plans/Compaction
 * Coordinator, part C, "The function's contract"). Whole chains are run
 * through the function. These are the rules the views carried before part C,
 * written down; a line here changing is a rule changing.
 *
 * Usage (from the strvct root):
 *   node tests/headless/TestLayerAllocation.js
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
    for (const rel of ["SvGlobals.js", "SvPlatform.js", "StrvctFile.js", "SvBootLoader.js"]) {
        await bootFile(path.join("source/boot", rel));
    }
    const SvBootLoader = SvGlobals.get("SvBootLoader");
    SvBootLoader._bootPath = "source/boot";
    await SvBootLoader.asyncRun();
}

// --- claims ---

const column = (extra = {}) => Object.assign({ axis: "horizontal", targetWidth: 270, fills: false, companionReservation: 0, anchoredReservation: 0, anchoredWantsRootWidth: false }, extra);
const row = (extra = {}) => column(Object.assign({ axis: "vertical" }, extra));

function allocate (width, claims, rootWidth = width) {
    const a = SvGlobals.get("SvLayerAllocation").clone();
    a.setRootWidth(rootWidth).setFitWidth(width).setClaims(claims);
    return a.answers();
}

const hidden = (answers) => answers.map((a) => (a.isHidden ? "h" : "s")).join("");
const rules = (answers) => answers.map((a) => a.widthRule).join(",");

function testDepth () {
    console.log("\nColumns give way from the root end");
    check(hidden(allocate(1700, [column(), column(), column()])) === "sss", "three 270px columns in 1,700px: all shown");
    check(hidden(allocate(811, [column(), column(), column()])) === "sss", "810px of columns in 811px: all shown (the sum is less)");
    check(hidden(allocate(810, [column(), column(), column()])) === "hss", "810px of columns in 810px: the first is hidden (equal is not less)");
    check(hidden(allocate(541, [column(), column(), column()])) === "hss", "541px: the last two fit");
    check(hidden(allocate(540, [column(), column(), column()])) === "hhs", "540px: only the last");
    check(hidden(allocate(390, [column(), column(), column(), column()])) === "hhhs", "four columns on a phone: only the last");
    check(hidden(allocate(1700, [column({ targetWidth: 400 }), column(), column()])) === "sss", "a 400px column with room");
    check(hidden(allocate(940, [column({ targetWidth: 400 }), column(), column()])) === "hss", "400 + 270 + 270 in 940px: the first is hidden");
    check(hidden(allocate(941, [column({ targetWidth: 400 }), column(), column()])) === "sss", "the same in 941px: all shown");
}

function testCap () {
    console.log("\nThe cap and the one-pixel margin");
    const lone = allocate(200, [column()]);
    check(lone[0].targetWidth === 199, "a 270px target in 200px is capped at 199px");
    check(hidden(lone) === "s", "so a lone column is never hidden by the equality");
    check(lone[0].widthRule === "full", "and it takes all the room it has");
    check(allocate(2, [column()])[0].targetWidth === 1, "at 2px the target is 1px");
    const edge = allocate(1, [column()]);
    check(edge[0].targetWidth === 270, "at 1px the cap is zero, zero is no answer, and the target is the default 270px");
    check(hidden(edge) === "h", "and at 1px that default does not fit, so the lone column is hidden (the cap's edge, kept as it was)");
    check(allocate(1700, [column({ targetWidth: NaN })])[0].targetWidth === 270, "a column that asks for no width gets the default");
    check(allocate(1700, [column({ targetWidth: 5000 })])[0].targetWidth === 1699, "a target over the fitting width is capped to it less one");
}

function testWidthRules () {
    console.log("\nThe width rules");
    check(rules(allocate(1700, [column(), column(), column()])) === "target,target,target", "with room to spare, every column is its target");
    check(rules(allocate(539, [column(), column()])) === "target,full", "the last column with less than twice its target takes the slack");
    check(rules(allocate(540, [column(), column()])) === "target,target", "at exactly twice its target it does not");
    check(rules(allocate(539, [column(), column({ fills: true })])) === "target,fill", "a fill column fills");
    check(rules(allocate(1700, [column({ fills: true })])) === "fill", "a fill column fills when it is alone too");
    check(rules(allocate(1700, [row(), column()])) === "none,target", "a vertical level's width is not this function's");
    const narrowHidden = allocate(390, [column(), column()]);
    check(narrowHidden[0].isHidden && narrowHidden[0].widthRule === "target", "a hidden column still has its rule (it is applied when it is shown again)");
}

function testFill () {
    console.log("\nA fill column");
    check(hidden(allocate(100, [column(), column({ fills: true })])) === "hs", "is always shown, however little room there is");
    check(hidden(allocate(540, [column(), column({ fills: true })])) === "hs", "and its target still counts against the columns before it (270 + 270 is not less than 540)");
    check(hidden(allocate(541, [column(), column({ fills: true })])) === "ss", "one pixel more and the column before it is shown");
    check(hidden(allocate(300, [column({ fills: true }), column()])) === "ss", "a fill column that is not last is shown too; the last is capped and fits");
}

function testVertical () {
    console.log("\nVertical levels");
    check(hidden(allocate(100, [row(), row()])) === "ss", "are never hidden");
    check(hidden(allocate(541, [column(), row(), column()])) === "sss", "add no width of their own: two columns round a row fit in 541px");
    check(hidden(allocate(540, [column(), row(), column()])) === "hss", "and do not in 540px");
    check(hidden(allocate(271, [row(), column()])) === "ss", "a row at the root, a column after it");
    check(hidden(allocate(541, [column(), column(), row()])) === "sss", "a row at the end");
    check(hidden(allocate(1000, [column(), row({ anchoredReservation: 800 })])) === "hs", "a row's anchored reservation counts in the sums before it (270 + 800 in 1,000px)");
    check(hidden(allocate(1071, [column(), row({ anchoredReservation: 800 })])) === "ss", "and there is room at 1,071px");
    check(hidden(allocate(2000, [column(), row({ companionReservation: 1800 })])) === "hs", "so does a reservation of any other kind on a row");
}

function testCompanions () {
    console.log("\nCompanion reservations");
    check(hidden(allocate(1000, [column({ companionReservation: 380 }), column()])) === "ss", "270 + 380 + 270 in 1,000px: both shown");
    check(hidden(allocate(920, [column({ companionReservation: 380 }), column()])) === "hs", "the same in 920px: the first column is hidden, its companion's reservation stands");
    check(hidden(allocate(700, [column(), column({ companionReservation: 380 })])) === "hs", "a reservation on a later level counts against the levels before it");
    check(hidden(allocate(650, [column(), column({ companionReservation: 380 })])) === "hh", "and against its own column (270 + 380 is not less than 650)");
    check(hidden(allocate(651, [column(), column({ companionReservation: 380 })])) === "hs", "which is shown one pixel wider");
    const over = allocate(1000, [column({ companionReservation: 700 }), column({ companionReservation: 700 }), column()]);
    check(hidden(over) === "hhs", "two 700px reservations in a 1,000px root (more than there is): the first two columns are hidden, the third shown");
    check(hidden(allocate(1100, [column({ companionReservation: 380 }), column({ companionReservation: 380 }), column()])) === "hss", "two 380px panels and three columns in 1,100px: the first column gives way");
}

function testAnchored () {
    console.log("\nAnchored reservations");
    check(hidden(allocate(1400, [column(), column(), row({ anchoredReservation: 1038 })])) === "hss", "two columns before a 1,038px anchored level in 1,400px: the nearer one fits (270 + 1,038), the first does not");
    check(hidden(allocate(1300, [column(), column(), row({ anchoredReservation: 1038 })])) === "hhs", "in 1,300px neither fits");
    check(hidden(allocate(1309, [column(), row({ anchoredReservation: 1038 })])) === "ss", "one column and 1,038px in 1,309px: shown");
    check(hidden(allocate(1308, [column(), row({ anchoredReservation: 1038 })])) === "hs", "and hidden at 1,308px");
    check(hidden(allocate(3000, [column(), row({ anchoredWantsRootWidth: true })])) === "hs", "a level that wants the full width is given the root's width, and every column before it is hidden");
    check(hidden(allocate(3000, [column(), row({ anchoredWantsRootWidth: true, anchoredReservation: 10 })])) === "hs", "the flag wins over a number");
}

function testFillsWhenShown () {
    console.log("\nA column that fills when shown (an inline document)");
    const doc = (extra = {}) => column(Object.assign({ targetWidth: 300, fillsWhenShown: true }, extra));
    const wide = allocate(1400, [doc(), column()]);
    check(hidden(wide) === "ss" && rules(wide) === "fill,target", "a 300px document and a column in 1,400px: the document fills, the column is its target");
    check(wide[0].trailingWidth === 270 && wide[1].trailingWidth === null, "and the document is told what follows it takes: 270px");
    check(hidden(allocate(570, [doc(), column()])) === "hs", "300 + 270 in 570px: the document is hidden like any column (equal is not less)");
    const justFits = allocate(571, [doc(), column()]);
    check(hidden(justFits) === "ss" && rules(justFits) === "fill,target", "at 571px it is shown and fills, and the last column does not take the slack");
    const phone = allocate(390, [doc(), column()]);
    check(hidden(phone) === "hs" && rules(phone) === "target,full", "on a phone it is hidden and the last column takes the row, as before");
    const lastWider = allocate(700, [doc({ targetWidth: 270 }), column({ targetWidth: 400 })]);
    check(rules(lastWider) === "fill,target", "a 400px last column in 700px would take the slack beside a plain column; beside a document it is its target");
    const three = allocate(1400, [column(), doc(), column(), column()]);
    check(hidden(three) === "ssss" && rules(three) === "target,fill,target,target", "a document in the middle of a chain fills between plain columns");
    check(three[1].trailingWidth === 540, "and what follows it takes 540px");
    check(allocate(1400, [doc({ companionReservation: 380 }), column()])[0].trailingWidth === 650, "its own companion's reservation is part of what follows it");
    check(wide[0].trailingFlexes === false, "plain columns after it are exactly their targets: nothing after it flexes");
    const twoDocs = allocate(1400, [doc(), doc({ fills: true })]);
    check(rules(twoDocs) === "fill,fill", "a document opened from a document: both fill");
    check(twoDocs[0].trailingWidth === 300 && twoDocs[0].trailingFlexes === true, "the first starts from its target, what follows from its own 300px, and they share what is left");
    const beforeChat = allocate(1400, [doc(), column({ fills: true })]);
    check(rules(beforeChat) === "fill,fill" && beforeChat[0].trailingFlexes === true, "with a fill column after it, the two share what is left");
    const beforeRow = allocate(1400, [doc(), row(), column()]);
    check(rules(beforeRow) === "fill,none,target" && beforeRow[0].trailingFlexes === true, "with a level laid out downward after it, it shares what is left with that level");
    check(hidden(allocate(600, [doc(), doc({ fills: true })])) === "hs", "two 300px documents in 600px: the first is hidden like any column");
    const alone = allocate(1400, [doc({ fills: true })]);
    check(rules(alone) === "fill" && alone[0].trailingWidth === null, "a document that is last fills as it always has");
    check(hidden(allocate(3000, [doc(), row({ anchoredWantsRootWidth: true })])) === "hs", "a level that wants the whole root width still hides a document before it");
}

function testNoRootWidthYet () {
    console.log("\nA root with no width yet");
    check(hidden(allocate(1200, [column(), column()], 0)) === "ss", "columns are fitted in the window's width");
    check(hidden(allocate(1200, [column(), row({ anchoredWantsRootWidth: true })], 0)) === "ss", "and a level that wants the root's width is given what the root reports, which is nothing yet");
    check(hidden(allocate(1200, [column(), row({ anchoredWantsRootWidth: true })], 1200)) === "hs", "once the root reports its width, the column gives way");
}

function testPurity () {
    console.log("\nThe function keeps nothing");
    const claims = [column({ companionReservation: 380 }), column(), column()];
    const before = JSON.stringify(claims);
    const first = JSON.stringify(allocate(900, claims));
    const second = JSON.stringify(allocate(900, claims));
    check(first === second, "the same claims and widths give the same answers");
    check(JSON.stringify(claims) === before, "and the claims are not changed");
    check(allocate(900, []).length === 0, "an empty chain has no answers");
}

(async () => {
    await boot();
    console.log("SvLayerAllocation");
    testDepth();
    testCap();
    testWidthRules();
    testFill();
    testVertical();
    testCompanions();
    testAnchored();
    testFillsWhenShown();
    testNoRootWidthYet();
    testPurity();
    console.log("\n=============================");
    console.log("Passed: " + passed + "  Failed: " + failed);
    console.log("=============================");
    process.exit(failed ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
