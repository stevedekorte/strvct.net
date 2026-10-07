#!/usr/bin/env node

"use strict";

/**
 * Headless test: SvAnchoredTabsLayout — the anchored-tabs rules with no DOM
 * (Plans/Anchor Tabs § Layout rules, milestone 1): capacity from minimum
 * widths, proportional pane widths, the tap and pin gestures, eviction and
 * restoration order, the current pane going last, availability changes, and
 * pin preferences with player overrides.
 *
 * Usage (from the strvct root):
 *   node tests/headless/TestAnchoredTabsLayout.js
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

// The session's tabs: Narration prefers to stay pinned; Me and Party are
// narrow sheets; Scene a map; Handbook and Session reference panes.
function sessionTabs (overrides = {}) {
    const base = [
        { id: "narration", minWidth: 400, comfortableWidth: 640, pinPreference: "pinned" },
        { id: "me", minWidth: 320, comfortableWidth: 420 },
        { id: "party", minWidth: 320, comfortableWidth: 380 },
        { id: "scene", minWidth: 400, comfortableWidth: 560 },
        { id: "handbook", minWidth: 300, comfortableWidth: 400 },
        { id: "session", minWidth: 300, comfortableWidth: 360 }
    ];
    return base.map(t => Object.assign({}, t, overrides[t.id] || {}));
}

function newLayout (width, tabs = sessionTabs()) {
    const layout = SvGlobals.get("SvAnchoredTabsLayout").clone();
    layout.updateContainerWidth(width);
    layout.updateTabs(tabs);
    return layout;
}

const open = (layout) => layout.openIdsInOrder().join(",");

function testOpeningAndGestures () {
    console.log("\nopening, the tap gesture, and the pin gesture");
    const layout = newLayout(1500);
    check(open(layout) === "narration" && layout.isPinned("narration"), "Narration opens pinned by its preference: " + open(layout));
    layout.tapTab("me");
    check(open(layout) === "narration,me", "tapping a closed tab opens it beside the pinned pane: " + open(layout));
    layout.tapTab("scene");
    check(open(layout) === "narration,scene", "tapping another replaces the UNPINNED pane, the pinned one stays: " + open(layout));
    layout.pinTab("me");
    check(open(layout) === "narration,me,scene" && layout.isPinned("me"), "pinning a closed tab opens it without closing anything: " + open(layout));
    layout.tapTab("me");
    check(open(layout) === "narration,me,scene", "tapping an open PINNED tab does nothing");
    layout.tapTab("scene");
    check(open(layout) === "narration,me", "tapping an open unpinned tab closes it: " + open(layout));
    layout.pinTab("me");
    check(open(layout) === "narration" && !layout.isPinned("me"), "pinning an open pinned tab unpins and closes it: " + open(layout));
    layout.tapTab("narration");
    layout.pinTab("narration");
    check(open(layout) === "narration", "the last pane never closes (tap or unpin)");
    check(layout.tabSpecs().map(t => t.id).join(",") === "narration,me,party,scene,handbook,session", "tab order is subnode order");
}

function testWidths () {
    console.log("\npane widths");
    const layout = newLayout(1500);
    layout.pinTab("me");
    layout.pinTab("scene");
    const widths = layout.paneWidths();
    const total = [...widths.values()].reduce((a, b) => a + b, 0) + layout.dividerWidth() * (widths.size - 1);
    check(total === 1500, "pane widths plus dividers fill the container exactly (" + total + ")");
    check([...widths.entries()].every(([id, w]) => w >= layout.tabWithId(id).minWidth), "no pane is below its minimum: " + JSON.stringify([...widths]));
    check(widths.get("narration") > widths.get("me"), "widths follow comfortable widths (Narration wider than Me)");
    const tight = newLayout(1000);
    tight.pinTab("me");
    tight.pinTab("party");
    const tw = tight.paneWidths();
    const phone = newLayout(390);
    check(phone.paneWidths().get("narration") === 390, "a lone pane takes the whole container even below its minimum (390 on a phone, minimum 400): " + phone.paneWidths().get("narration"));
    check(tight.openIdsInOrder().length === 2 || [...tw.entries()].every(([id, w]) => w >= tight.tabWithId(id).minWidth), "a tight container still never gives a pane less than its minimum: " + JSON.stringify([...tw]));
}

function testNarrowingAndRestoring () {
    console.log("\nnarrowing evicts, widening restores");
    const layout = newLayout(1600);
    layout.pinTab("me");
    layout.tapTab("scene");
    layout.setCurrentTabId("narration");
    check(open(layout) === "narration,me,scene", "start: Narration, Me (pinned), Scene (unpinned)");
    layout.updateContainerWidth(900);
    check(open(layout) === "narration,me", "narrowing closes the rightmost UNPINNED pane first: " + open(layout));
    layout.updateContainerWidth(500);
    check(open(layout) === "narration" && layout.isEvicted("me"), "then the rightmost pinned one, remembered as evicted: " + open(layout));
    layout.updateContainerWidth(1600);
    check(open(layout) === "narration,me" && !layout.isEvicted("me"), "widening brings the evicted pin back: " + open(layout));
    check(!layout.isOpen("scene"), "an unpinned pane closed for room is not restored");
}

function testRestoreOrder () {
    console.log("\nevicted pins return most recently evicted first");
    const layout = newLayout(1800);
    layout.pinTab("me");
    layout.pinTab("party");
    layout.pinTab("scene");
    layout.setCurrentTabId("narration");
    layout.updateContainerWidth(1100);
    check(layout.isEvicted("scene") && open(layout) === "narration,me,party", "Scene evicted first (rightmost pinned): " + open(layout));
    layout.updateContainerWidth(750);
    check(layout.isEvicted("party") && open(layout) === "narration,me", "then Party: " + open(layout));
    layout.updateContainerWidth(1100);
    check(open(layout) === "narration,me,party" && layout.isEvicted("scene"), "room for one returns Party (evicted last), not Scene: " + open(layout));
}

function testCurrentPaneGoesLast () {
    console.log("\nthe current pane is never evicted while another could go");
    const layout = newLayout(1500);
    layout.tapTab("me"); // tapping makes Me current
    check(layout.currentTabId() === "me", "a tapped tab becomes current");
    layout.updateContainerWidth(500);
    check(open(layout) === "me" && layout.isEvicted("narration"), "narrowing evicts pinned Narration rather than the unpinned pane being typed in: " + open(layout));
    layout.updateContainerWidth(100);
    check(open(layout) === "me", "when only the current pane is left, it stays (at least one pane)");
}

function testOpeningOrder () {
    console.log("\nopening a tab that doesn't fit: unpinned panes give way leftmost first");
    // 1200px: Me, Party and Handbook fit (942); adding Scene (1343) does not
    const layout = newLayout(1200, sessionTabs({ narration: { pinPreference: null } }));
    layout.tapTab("me");
    layout.pinTab("party");
    layout.pinTab("handbook");
    layout.setCurrentTabId("party");
    // open: me (unpinned), party (pinned, current), handbook (pinned)
    check(open(layout) === "me,party,handbook", "start: " + open(layout));
    layout.pinTab("scene");
    check(!layout.isOpen("me") && layout.isOpen("scene") && layout.isOpen("party"), "pinning Scene in closes the unpinned pane first: " + open(layout));
    // two unpinned panes (both opened by an "open" preference): the LEFTMOST goes
    const two = newLayout(1100, sessionTabs({ narration: { pinPreference: null }, me: { pinPreference: "open" }, party: { pinPreference: "open" } }));
    two.setCurrentTabId(null);
    check(open(two) === "me,party", "two unpinned panes open: " + open(two));
    const narrowTwo = newLayout(800, sessionTabs({ narration: { pinPreference: null }, me: { pinPreference: "open" }, party: { pinPreference: "open" } }));
    narrowTwo.setCurrentTabId(null);
    narrowTwo.pinTab("handbook"); // 320 + 320 + 300 + 2 = 942 > 800: one unpinned must go
    check(!narrowTwo.isOpen("me") && narrowTwo.isOpen("party") && narrowTwo.isOpen("handbook"), "opening closes the LEFTMOST unpinned pane (Me, not Party): " + open(narrowTwo));
}

function testAvailability () {
    console.log("\navailability changes");
    const layout = newLayout(1500);
    layout.pinTab("me");
    layout.setCurrentTabId("narration");
    layout.updateTabs(sessionTabs({ me: { isAvailable: false } }));
    check(!layout.isOpen("me") && layout.isEvicted("me"), "a pinned tab that stops being available closes and is remembered");
    layout.updateTabs(sessionTabs());
    check(layout.isOpen("me"), "…and returns when it is available again");
    layout.tapTab("scene");
    layout.updateTabs(sessionTabs({ scene: { isAvailable: false } }));
    check(!layout.isOpen("scene") && !layout.isEvicted("scene"), "an unpinned tab that disappears just closes");
    const empty = newLayout(1500, sessionTabs({ narration: { isAvailable: false, pinPreference: null } }));
    check(open(empty) === "me", "with nothing pinned, the first available tab opens (at least one pane): " + open(empty));
}

function testPreferences () {
    console.log("\npin preferences: a suggestion the player can override");
    const layout = newLayout(1600);
    layout.updateTabs(sessionTabs({ scene: { pinPreference: "pinned" } })); // e.g. combat starts
    check(layout.isOpen("scene") && layout.isPinned("scene"), "a preference turning to pinned opens and pins the tab when there is room");
    layout.updateTabs(sessionTabs());
    check(layout.isOpen("scene") && !layout.isPinned("scene"), "the preference dropping back unpins it (it stays open)");
    const narrow = newLayout(500);
    narrow.updateTabs(sessionTabs({ scene: { pinPreference: "pinned" } }));
    check(!narrow.isOpen("scene") && narrow.isEvicted("scene"), "no room: recorded as evicted, to return when room appears");
    narrow.updateContainerWidth(1200);
    check(narrow.isOpen("scene"), "…and it does");
    const player = newLayout(1600);
    player.pinTab("me");
    player.pinTab("me"); // the player unpins Me
    player.updateTabs(sessionTabs({ me: { pinPreference: "pinned" } }));
    check(!player.isPinned("me") && !player.isOpen("me"), "a node cannot re-pin a tab the player unpinned");
    const kept = newLayout(1600);
    kept.pinTab("party"); // the player pins Party
    kept.updateTabs(sessionTabs({ party: { pinPreference: "pinned" } }));
    kept.updateTabs(sessionTabs());
    check(kept.isPinned("party") && kept.isOpen("party"), "a tab the player pinned stays pinned when the preference drops");
    const opener = newLayout(1600);
    opener.updateTabs(sessionTabs({ handbook: { pinPreference: "open" } }));
    check(opener.isOpen("handbook") && !opener.isPinned("handbook"), "an \"open\" preference opens the tab unpinned when there is room");
}

function testDividersAndPinControl () {
    console.log("\ndragging a divider, and the pane's pin control");
    const layout = newLayout(1500);
    layout.tapTab("me");
    const before = layout.paneWidths();
    layout.dragDivider("narration", "me", before.get("narration") - 200);
    const after = layout.paneWidths();
    check(after.get("narration") === before.get("narration") - 200 && after.get("me") === before.get("me") + 200, "the dragged split tracks the pointer and keeps the pair's total (" + before.get("narration") + "→" + after.get("narration") + ")");
    layout.dragDivider("narration", "me", 50);
    check(layout.paneWidths().get("narration") === layout.tabWithId("narration").minWidth, "neither side goes below its minimum (dragged to 50 → " + layout.paneWidths().get("narration") + ")");
    layout.dragDivider("narration", "me", 2000);
    check(layout.paneWidths().get("me") === layout.tabWithId("me").minWidth, "…on either side");
    layout.updateContainerWidth(1600);
    const total = [...layout.paneWidths().values()].reduce((a, b) => a + b, 0) + layout.dividerWidth();
    check(total === 1600, "a resize keeps the split and still fills the container (" + total + ")");
    layout.tapTab("scene");
    check(layout.paneWidths().get("narration") !== layout.tabWithId("narration").minWidth || layout.openIdsInOrder().length !== 2, "a split is forgotten when the set of open panes changes");
    const pins = newLayout(1500);
    pins.tapTab("me");
    pins.setTabPinned("me", true);
    check(pins.isPinned("me") && pins.isOpen("me"), "the pin control pins an open pane without closing anything");
    pins.setTabPinned("me", false);
    check(!pins.isPinned("me") && pins.isOpen("me"), "…and unpins it without closing it (unlike the pin gesture)");
    check(pins.leftNeighborOf("me") === "narration" && pins.leftNeighborOf("narration") === null, "leftNeighborOf answers the open pane to the left");
}

function testTabSegments () {
    console.log("\nTab segments");
    // narrow panes, wide tabs: Party's segment (Party, Scene, Handbook) is 450px
    const tabs = (w) => sessionTabs({
        narration: { tabWidth: 150 }, me: { tabWidth: 100 }, party: { tabWidth: 130 },
        scene: { tabWidth: 140 }, handbook: { tabWidth: 180 }, session: { tabWidth: 140 }
    }).map(t => Object.assign(t, { minWidth: w, comfortableWidth: w }));
    const segs = newLayout(1600, tabs(300));
    segs.tapTab("party");
    segs.pinTab("session");
    check(open(segs) === "narration,party,session", "start: " + open(segs));
    check(segs.segmentTabWidths(segs.openIdsInOrder()).get("party") === 450, "a segment is its open tab and the closed tabs after it (" + segs.segmentTabWidths(segs.openIdsInOrder()).get("party") + ")");
    check(segs.segmentTabWidths(segs.openIdsInOrder()).get("narration") === 250, "…the first one from the row's start");
    check(segs.paneWidths().get("party") >= 450, "with room, a pane is at least as wide as its tabs (" + segs.paneWidths().get("party") + ")");
    segs.dragDivider("party", "session", 200);
    check(segs.paneWidths().get("party") === 450, "a divider can't drag a pane narrower than its tabs while there is room");
    const tight = newLayout(1600, tabs(300));
    tight.tapTab("party");
    tight.pinTab("session");
    tight.updateContainerWidth(950);
    check(open(tight) === "narration,party,session", "tab widths never close a pane: " + open(tight));
    check(tight.paneWidths().get("party") < 450 && tight.paneWidths().get("party") >= 300, "without room, panes fall back to their content minimums (" + tight.paneWidths().get("party") + ")");
    const last = newLayout(1600, tabs(300));
    last.tapTab("party");
    check(last.paneMinimums(last.openIdsInOrder(), 1599).get("party") === 300, "the last pane is not raised for the tabs after it");
}

function testInvariants () {
    console.log("\ninvariants across a random walk of gestures and widths");
    const layout = newLayout(1400);
    const ids = sessionTabs().map(t => t.id);
    let seed = 7;
    const rand = (n) => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed % n; };
    let broken = null;
    for (let i = 0; i < 400 && !broken; i++) {
        const r = rand(5);
        const id = ids[rand(ids.length)];
        if (r === 0) { layout.tapTab(id); }
        if (r === 1) { layout.pinTab(id); }
        if (r === 2) { layout.updateContainerWidth(300 + rand(1700)); }
        if (r === 3) { layout.setCurrentTabId(layout.openIdsInOrder()[rand(Math.max(1, layout.openIds().size))] || null); }
        if (r === 4) { layout.updateTabs(sessionTabs({ [id]: { isAvailable: rand(3) !== 0 } })); }
        const openIds = layout.openIdsInOrder();
        const anyAvailable = layout.tabSpecs().some(t => t.isAvailable);
        if (anyAvailable && openIds.length === 0) { broken = "no pane open at step " + i; }
        if (openIds.length > 1 && !layout.fits(openIds)) { broken = "open panes exceed the container at step " + i + ": " + openIds.join(",") + " in " + layout.containerWidth(); }
        if (openIds.some(o => !layout.isAvailable(o))) { broken = "an unavailable tab is open at step " + i; }
    }
    check(broken === null, "at least one pane, panes fit (beyond the last one), only available tabs open — 400 random steps" + (broken ? ": " + broken : ""));
}

(async () => {
    await boot();
    testOpeningAndGestures();
    testWidths();
    testNarrowingAndRestoring();
    testRestoreOrder();
    testCurrentPaneGoesLast();
    testOpeningOrder();
    testAvailability();
    testPreferences();
    testDividersAndPinControl();
    testTabSegments();
    testInvariants();
    console.log("\n=============================");
    console.log("Passed: " + passed + "  Failed: " + failed);
    console.log("=============================");
    process.exit(failed ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
