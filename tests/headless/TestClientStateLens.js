#!/usr/bin/env node

"use strict";

/**
 * Headless test: SvClientStateLens — LOD-projected client-state serialization.
 *
 * Builds a session-shaped tree (root group with array children, nested
 * "locations with sublocations" mirroring the campaign shape) and checks:
 *   - no-lens serializeToJson is untouched (full dump identical)
 *   - handle / summary / full / omit emission shapes
 *   - expand-by-id (under: jsonId, depth) with depth bounding
 *   - MAX-LOD: a full target inside a summary/handle region stays full
 *   - ancestor auto-inclusion (self-locating results, "+N more" counts)
 *   - lens ref errors are self-describing
 *
 * Usage (from the strvct root):
 *   node source/boot/index-builder/ImportsIndexer.js
 *   node tests/headless/TestClientStateLens.js
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

// --- tree builder -----------------------------------------------------------

function buildTree () {
    const SvJsonGroup = SvGlobals.get("SvJsonGroup");
    const SvJsonArrayNode = SvGlobals.get("SvJsonArrayNode");

    // shouldStoreSubnodes groups use child titles as keys — lets us build a
    // session-shaped tree headlessly without defining slot classes.
    const group = (title, jsonId) => {
        const g = SvJsonGroup.clone();
        g.setShouldStoreSubnodes(true);
        g.setTitle(title);
        if (jsonId) { g.setJsonId(jsonId); }
        return g;
    };
    const arr = (title, jsonId) => {
        const a = SvJsonArrayNode.clone();
        a.setTitle(title);
        if (jsonId) { a.setJsonId(jsonId); }
        return a;
    };

    // root (session)
    //   party         [ aria, bron ]
    //   campaign      { locations: [ crypt { sublocations: [ hall, tomb ] } ] }
    //   npcs          [ goblin1, goblin2, goblin3 ]
    const root = group("session", "sess-1");

    const party = arr("party", "party-1");
    const aria = group("aria", "pc-aria");
    const bron = group("bron", "pc-bron");
    party.addSubnode(aria);
    party.addSubnode(bron);

    const campaign = group("campaign", "camp-1");
    const locations = arr("locations", "locs-1");
    const crypt = group("crypt", "loc-crypt");
    const sublocations = arr("sublocations", "sublocs-1");
    const hall = group("hall", "loc-hall");
    const tomb = group("tomb", "loc-tomb");
    sublocations.addSubnode(hall);
    sublocations.addSubnode(tomb);
    crypt.addSubnode(sublocations);
    locations.addSubnode(crypt);
    campaign.addSubnode(locations);

    const npcs = arr("npcs", "npcs-1");
    ["npc-g1", "npc-g2", "npc-g3"].forEach((id, i) => {
        npcs.addSubnode(group("goblin" + (i + 1), id));
    });

    root.addSubnode(party);
    root.addSubnode(campaign);
    root.addSubnode(npcs);

    return { root, crypt, tomb, npcs, aria };
}

// --- tests -------------------------------------------------------------------

function testLens () {
    const SvClientStateLens = SvGlobals.get("SvClientStateLens");
    check(!!SvClientStateLens, "SvClientStateLens class loaded");

    const { root, tomb } = buildTree();

    console.log("\nNo-lens dump is unchanged");
    const fullDump = root.serializeToJson(null, []);
    check(fullDump.party.length === 2 && fullDump.npcs.length === 3, "plain serializeToJson emits everything");
    check(fullDump.campaign.locations[0].sublocations.length === 2, "nested locations fully present");
    check(fullDump._lod === undefined, "no _lod markers without a lens");

    console.log("\nFloor lens: party full, campaign summary, rest handles");
    const floor = SvClientStateLens.fromJson({
        select: [
            { nodes: ["/"], lod: "summary" },
            { nodes: ["/party"], lod: "full" },
            { nodes: ["/campaign"], lod: "summary" }
        ],
        default: "handle"
    }, root);
    const view = root.serializeWithLens(floor, "omit", 0);
    check(Array.isArray(view.party) && view.party.length === 2 && typeof view.party[0] === "object" && view.party[0]._lod === undefined,
        "party @ full: real array, members not abridged");
    check(view.campaign._lod === "summary", "campaign @ summary carries _lod marker");
    check(view.campaign.locations && view.campaign.locations._lod === "handle" && view.campaign.locations.count === 1,
        "campaign's locations child is a handle with count");
    check(view.npcs && view.npcs._lod === "handle" && view.npcs.count === 3,
        "npcs @ default handle with count 3");

    console.log("\nExpand-by-id with depth bound");
    const expand = SvClientStateLens.fromJson({
        select: [{ under: "loc-crypt", lod: "full", depth: 1 }],
        default: "omit"
    }, root);
    const view2 = root.serializeWithLens(expand, "omit", 0);
    check(view2.jsonId === "sess-1" && view2._lod === "handle", "root emits as ancestor carrier (self-locating)");
    check(view2.campaign && view2.campaign.locations, "ancestor path campaign→locations present");
    const cryptOut = Array.isArray(view2.campaign.locations) ? view2.campaign.locations[0] : null;
    check(cryptOut && cryptOut.sublocations && cryptOut.sublocations._lod === undefined,
        "crypt expanded: sublocations present as content");
    const subs = cryptOut ? cryptOut.sublocations : [];
    check(Array.isArray(subs) && subs.length === 2 && subs[0]._lod === "handle",
        "depth 1: sublocation children emitted as handles");
    check(view2.party === undefined && view2.npcs === undefined,
        "default omit: unrelated branches absent");

    console.log("\nMAX-LOD: full target inside handle region; array carrier counts");
    const mixed = SvClientStateLens.fromJson({
        select: [{ nodes: ["loc-tomb"], lod: "full" }],
        default: "omit"
    }, root);
    const view3 = root.serializeWithLens(mixed, "omit", 0);
    const locsOut = view3.campaign.locations;
    check(Array.isArray(locsOut), "ancestor array emits as array of on-path children");
    const cryptCarrier = locsOut[0];
    check(cryptCarrier && cryptCarrier._lod === "handle" && Array.isArray(cryptCarrier.sublocations),
        "crypt is a carrier handle holding the on-path sublocations");
    const subsOut = cryptCarrier.sublocations;
    const tombOut = subsOut.find(x => typeof x === "object");
    check(subsOut.some(x => typeof x === "string" && x.startsWith("+1 more")),
        "pruned sibling (hall) shows as '+1 more' count, not silence");
    check(tombOut !== undefined && tombOut._lod === undefined, "tomb itself is full (MAX-LOD beats the omit region)");
    check(tomb.jsonId() === "loc-tomb", "sanity: tomb id");

    console.log("\nSummary depth propagation (session-start lens shape)");
    const breadth = SvClientStateLens.fromJson({
        select: [{ under: "/campaign/locations", lod: "summary", depth: 2 }],
        default: "omit"
    }, root);
    const view4 = root.serializeWithLens(breadth, "omit", 0);
    const locs4 = view4.campaign.locations;
    check(Array.isArray(locs4), "locations scope root emits as array");
    const crypt4 = locs4[0];
    check(crypt4 && crypt4._lod === "summary", "level-1 location is a summary, not a handle (depth propagates)");
    check(Array.isArray(crypt4.sublocations) && crypt4.sublocations.length === 2 && crypt4.sublocations[0]._lod === "handle",
        "level-2 sublocations listed as handles with titles (scene-pickable)");

    console.log("\nLens errors are self-describing");
    let err = null;
    try {
        SvClientStateLens.fromJson({ select: [{ nodes: ["no-such-id"], lod: "full" }], default: "omit" }, root);
    } catch (e) { err = e; }
    check(err !== null && err.message.includes("no-such-id"), "unknown jsonId names the bad ref");
    err = null;
    try {
        SvClientStateLens.fromJson({ select: [{ nodes: ["/party"], lod: "gigantic" }] }, root);
    } catch (e) { err = e; }
    check(err !== null && err.message.includes("gigantic"), "invalid lod names the bad value");
}

(async () => {
    await boot();
    testLens();
    console.log("\n" + passed + " passed, " + failed + " failed");
    process.exit(failed === 0 ? 0 : 1);
})().catch((e) => {
    console.error("Test run failed to boot:", e);
    process.exit(1);
});
