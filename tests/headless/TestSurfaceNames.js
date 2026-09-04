#!/usr/bin/env node

"use strict";

/**
 * Headless test: named surfaces (nodeTileSurfaceName / nodeContainerSurfaceName).
 *
 * The point of these hints is that varying a look by NODE must not require a
 * view subclass. A custom view class breaks the naked-objects derivation — it
 * stops following the theme and has to be maintained per context — so it is
 * the last resort, and a node hint is the first. The case that motivated them:
 * the app's breadcrumb bar and a companion's are the SAME view class and must
 * read as different surfaces.
 *
 * Invariants pinned here:
 *   - a node names a SURFACE, never a color, so the theme owns the palette and
 *     light/dark needs no model change;
 *   - an unnamed surface is transparent, so an element shows its container
 *     (this is what makes one container name color a whole region);
 *   - an unknown name falls back to transparent rather than to a wrong color;
 *   - the two hints are independent — a tile's own surface and the surface of
 *     the container showing its children are different questions.
 *
 * Usage (from the strvct root):
 *   node tests/headless/TestSurfaceNames.js
 */

const path = require("path");
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

async function main () {
    await boot();

    const SvNode = SvGlobals.get("SvNode");
    const SvViewableNode = SvGlobals.get("SvViewableNode");

    console.log("The hints live on SvViewableNode and default to null (transparent)");
    const node = SvViewableNode.clone();
    check(typeof node.nodeTileSurfaceName === "function", "nodeTileSurfaceName exists");
    check(typeof node.nodeContainerSurfaceName === "function", "nodeContainerSurfaceName exists");
    check(node.nodeTileSurfaceName() === null, "tile surface defaults to null");
    check(node.nodeContainerSurfaceName() === null, "container surface defaults to null");

    console.log("\nThey are independent questions, not one slot doing two jobs");
    node.setNodeTileSurfaceName("raised");
    check(node.nodeContainerSurfaceName() === null, "naming a tile surface leaves the container alone");
    node.setNodeContainerSurfaceName("panel");
    check(node.nodeTileSurfaceName() === "raised", "...and vice versa");

    console.log("\nThe hints are declared as view hints, not app state");
    const slot = SvViewableNode.prototype.slotNamed("nodeTileSurfaceName");
    check(slot.slotType() === "String", "typed as String (a name, not a color)");
    check(slot.allowsNullValue() === true, "null allowed — that IS the default surface");
    check(slot.syncsToView() === true, "syncsToView, so renaming a surface repaints");
    console.log("\n...and are never persisted (decided 2026-09-04): a class sets them in init; a stored hint gets stamped onto every record");
    ["nodeTileSurfaceName", "nodeContainerSurfaceName"].forEach((name) => {
        const s = SvViewableNode.prototype.slotNamed(name);
        check(s.shouldStoreSlot() === false, name + " has shouldStoreSlot false");
    });

    console.log("\nName resolution: a name becomes a THEME lookup, never a literal");
    // Resolution lives on SvCssDomView so both readers share one rule.
    const SvCssDomView = SvGlobals.get("SvCssDomView");
    const resolve = SvCssDomView.prototype.backgroundValueForSurfaceName;
    check(typeof resolve === "function", "backgroundValueForSurfaceName exists on the view base");
    const resolved = resolve.call({}, "panel");
    check(resolved === "var(--sv-surface-panel, transparent)",
        "'panel' -> " + resolved);
    check(!/#|rgb/.test(resolved), "...with no literal color anywhere in it");

    console.log("\nUnnamed and unknown both end up transparent, never a wrong color");
    check(resolve.call({}, null) === "transparent", "null -> transparent");
    check(resolve.call({}, undefined) === "transparent", "undefined -> transparent");
    check(resolve.call({}, "") === "transparent", "empty string -> transparent");
    const unknown = resolve.call({}, "no-such-surface");
    check(/, transparent\)$/.test(unknown),
        "an unthemed name falls back to transparent: " + unknown);

    console.log("\nEvery container level reads the container hint, so any node's detail region can name its surface");
    // SvBrowserView paints a root; SvStackView paints a node's detail region
    // (its own column plus everything deeper) — the cascade the plan describes.
    ["SvBrowserView", "SvStackView"].forEach((className) => {
        const cls = SvGlobals.get(className);
        check(cls && typeof cls.prototype.syncSurfaceFromNode === "function", className + ".syncSurfaceFromNode exists");
    });
    const SvTile = SvGlobals.get("SvTile");
    check(typeof SvTile.prototype.syncSurfaceFromNode === "function", "SvTile.syncSurfaceFromNode exists");
    check(typeof SvTile.prototype.repaintSurfaceOverThemeState === "function",
        "SvTile.repaintSurfaceOverThemeState exists — the theme state's unselected background must not erase a named surface");

    console.log("\nA collapsible region names its expanded surface, never a color");
    const SvNavView = SvGlobals.get("SvNavView");
    const navSrc = SvNavView.prototype.applyHeaderRegionExpanded.toString();
    check(navSrc.includes("expandedRegionSurfaceName") && !navSrc.includes("expandedRegionBackgroundCss"),
        "SvNavView asks the region for expandedRegionSurfaceName (the CSS-value hook is gone)");

    console.log("\nThe framework ships defaults for the named surfaces it documents");
    const fs = require("fs");
    const css = fs.readFileSync(path.join(strvctRoot, "_css.css"), "utf8");
    ["panel", "chrome", "raised", "notice", "danger", "theatre"].forEach((name) => {
        check(css.includes("--sv-surface-" + name + ":"),
            "--sv-surface-" + name + " has a default in strvct/_css.css");
    });

    console.log("\nA plain SvNode without the hints does not break a reader");
    const bare = SvNode.clone();
    check(bare.nodeTileSurfaceName === undefined || bare.nodeTileSurfaceName() === null,
        "readers must guard the accessor — SvNode is not an SvViewableNode");

    console.log("\n" + pass + " passed, " + fail + " failed");
    process.exit(fail === 0 ? 0 : 1);
}

main().catch((e) => {
    console.error("Test run failed:", e);
    process.exit(1);
});
