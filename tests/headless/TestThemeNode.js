#!/usr/bin/env node

"use strict";

/**
 * Headless test: the theme node owns its token values (Plans/Theme Environment,
 * Stage 3) and the `uiTheme` inherited resource (Stage 4).
 *
 * Invariants pinned here:
 *   - an SvTheme has three token folders (shared, light, dark) of ordinary
 *     string fields, browsable and editable with generated tiles;
 *   - the folders round-trip to plain data (themeJson / setThemeJson);
 *   - publishing an appearance layers that appearance's values over the
 *     shared ones, and a theme that authored only one appearance shows it
 *     for either request;
 *   - the token folders are subnodes but are NOT theme classes;
 *   - the CSS the UI publishes is one :root block with a color-scheme;
 *   - a node with a `uiTheme` resource slot resolves it up the resource
 *     chain, and customizing copies rather than links.
 *
 * Usage (from the strvct root):
 *   node tests/headless/TestThemeNode.js
 * (rebuild the index first if sources changed: node source/boot/index-builder/ImportsIndexer.js)
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

    const SvTheme = SvGlobals.get("SvTheme");
    const SvThemeClass = SvGlobals.get("SvThemeClass");
    const SvThemeTokens = SvGlobals.get("SvThemeTokens");
    const SvWebUserInterface = SvGlobals.get("SvWebUserInterface");

    console.log("A theme owns three token folders of ordinary fields");
    const theme = SvTheme.clone();
    check(theme.tokens() && theme.tokens().isKindOf(SvThemeTokens), "tokens folder exists");
    check(theme.lightTokens().title() === "light" && theme.darkTokens().title() === "dark", "appearance folders are titled light and dark");
    theme.tokens().setValueNamed("--sv-face-body", "IMFellEnglish");
    check(theme.tokens().valueNamed("--sv-face-body") === "IMFellEnglish", "a token is set and read by its CSS name");
    check(theme.tokens().subnodes().first().svType() === "SvStringField", "…and is an ordinary string field (browsable, editable, no custom view)");
    theme.tokens().setValueNamed("--sv-face-body", "Hoefler");
    check(theme.tokens().subnodes().length === 1 && theme.tokens().valueNamed("--sv-face-body") === "Hoefler", "setting an existing token replaces its value, not the field");

    console.log("\nToken folders are subnodes but never theme classes");
    check(theme.subnodes().length === 3, "three subnodes before any theme class");
    check(theme.themeClasses().length === 0, "…none of which is a theme class");
    theme.addSubnode(SvThemeClass.clone().setTitle("SvTile"));
    check(theme.themeClasses().length === 1 && theme.themeClassNamed("SvTile") !== null, "a theme class is found by name");
    check(theme.themeClassNamed("light") === null, "a token folder is never returned as a theme class");
    check(theme.allThemeClasses().length === 1, "allThemeClasses walks only theme classes");

    console.log("\nAppearances layer over shared tokens");
    theme.setThemeJson({
        tokens: { "--sv-face-body": "IMFellEnglish", "--uo-measure": "68ch" },
        light: { "--sv-surface": "#eeeade", "--sv-text": "#1c1c1c" },
        dark: { "--sv-surface": "#1c1c1c", "--sv-text": "#ece7da" }
    });
    const light = theme.tokenDictForAppearance("light");
    const dark = theme.tokenDictForAppearance("dark");
    check(light["--sv-surface"] === "#eeeade" && light["--sv-face-body"] === "IMFellEnglish" && light["--uo-measure"] === "68ch", "light = shared + light values");
    check(dark["--sv-surface"] === "#1c1c1c" && dark["--sv-face-body"] === "IMFellEnglish", "dark = shared + dark values");
    check(theme.resolvedAppearance("dark") === "dark", "a theme with both appearances honors the request");

    const darkOnly = SvTheme.clone();
    darkOnly.setThemeJson({ tokens: {}, light: {}, dark: { "--sv-surface": "#191919" } });
    check(darkOnly.resolvedAppearance("light") === "dark", "a theme that authored only dark shows dark when light is asked for");
    check(darkOnly.tokenDictForAppearance("light")["--sv-surface"] === "#191919", "…and publishes the dark values");
    const neutral = SvTheme.clone();
    check(neutral.resolvedAppearance("light") === "light", "a theme with neither appearance leaves the request alone");

    console.log("\nRound trip and copy");
    const json = theme.themeJson();
    check(JSON.stringify(Object.keys(json).sort()) === JSON.stringify(["dark", "light", "tokens"]), "themeJson has tokens/light/dark");
    const copy = SvTheme.clone().copyThemeFrom(theme);
    check(JSON.stringify(copy.themeJson()) === JSON.stringify(json), "copyThemeFrom reproduces the token folders");
    copy.lightTokens().setValueNamed("--sv-surface", "#ffffff");
    check(theme.lightTokens().valueNamed("--sv-surface") === "#eeeade", "…as a COPY: editing the copy leaves the source alone");
    check(theme.specVersion() === 0, "a hand-made theme has specVersion 0");

    console.log("\nThe UI publishes one :root block with a color-scheme");
    const css = SvWebUserInterface.cssTextForThemeTokens({ "--sv-surface": "#eeeade", "--sv-face-body": "IMFellEnglish" }, "light");
    check(css.startsWith(":root {") && css.trim().endsWith("}"), "CSS is a single :root block");
    check(css.includes("color-scheme: light;"), "…declaring the color scheme");
    check(css.includes("--sv-surface: #eeeade;") && css.includes("--sv-face-body: IMFellEnglish;"), "…with every token as a custom property");
    check(SvWebUserInterface.cssTextForThemeTokens({}, "dark").includes("color-scheme: dark;"), "dark requests declare dark");

    console.log("\nuiTheme is an inherited resource, resolved up the resource chain");
    (0, eval)(`
    (class TTRealm extends SvSummaryNode {
        initPrototypeSlots () {
            {
                const slot = this.newSlot("uiTheme", null);
                slot.setSlotType("SvTheme");
                slot.setAllowsNullValue(true);
                slot.setIsInheritedResource(true);
            }
        }
    }.initThisClass());
    (class TTChild extends SvSummaryNode {
    }.initThisClass());
    `);
    const realm = SvGlobals.get("TTRealm").clone();
    const folder = SvGlobals.get("TTChild").clone();
    const leaf = SvGlobals.get("TTChild").clone();
    realm.addSubnode(folder);
    folder.addSubnode(leaf);
    check(leaf.nodeInheritedResource("uiTheme") === null, "nothing declared up the chain resolves null (the UI then wears its default)");
    realm.setUiTheme(theme);
    check(leaf.nodeInheritedResource("uiTheme") === theme, "a theme set on the realm is inherited by a node two levels down");
    check(folder.declaresUiTheme() === false && realm.declaresUiTheme() === true, "declaresUiTheme reports the slot, not a value");

    console.log("\nCustomizing copies, inheriting clears");
    const genre = SvGlobals.get("TTRealm").clone();
    const child = SvGlobals.get("TTRealm").clone();
    genre.addSubnode(child);
    genre.setUiTheme(theme);
    const owned = child.customizeUiTheme();
    check(owned !== null && owned !== theme, "customizeUiTheme gives the child its own theme object");
    check(JSON.stringify(owned.themeJson()) === JSON.stringify(theme.themeJson()), "…seeded from the inherited one");
    check(child.nodeInheritedResource("uiTheme") === owned, "…which now answers the walk");
    check(child.customizeUiTheme() === owned, "customizing again is a no-op");
    child.inheritUiTheme();
    check(child.uiTheme() === null && child.nodeInheritedResource("uiTheme") === theme, "inheritUiTheme clears the slot and the walk reaches the genre again");
    check(folder.customizeUiTheme() === null, "a node without the slot cannot customize");

    console.log("\nCustomizing with nothing inherited starts from the theme on screen");
    const SvThemeResources = SvGlobals.get("SvThemeResources");
    const lone = SvGlobals.get("TTRealm").clone();
    SvThemeResources.shared().setDisplayedTheme(theme);
    const fromScreen = lone.customizeUiTheme();
    check(fromScreen !== theme && JSON.stringify(fromScreen.themeJson()) === JSON.stringify(theme.themeJson()), "…a copy of the displayed theme, not three empty folders");
    SvThemeResources.shared().setDisplayedTheme(null);
    const bare = SvGlobals.get("TTRealm").clone().customizeUiTheme();
    check(bare !== null && Object.keys(bare.tokens().tokenDict()).length === 0, "…and empty only when nothing is displayed either");

    console.log("\nAn inspector row for an unset theme says what it is");
    const SvPointerField = SvGlobals.get("SvPointerField");
    const row = SvPointerField.clone();
    row.setKey("Theme");
    row.setOwnerNode(realm);
    row.setTarget(realm);
    row.setValueMethod("uiTheme");
    realm.setUiTheme(null);
    check(row.title() === "Theme" && row.subtitle() === "(inherited)", "null on an inherited-resource slot reads 'Theme / (inherited)' (was a blank tile)");
    realm.setUiTheme(theme);
    check(row.title() === theme.title() && row.subtitle() === "theme", "…and the theme's own title once set");
    const plain = SvPointerField.clone();
    plain.setKey("Owner");
    check(plain.title() === "Owner" && plain.subtitle() === "(none)", "a free-standing pointer to nothing reads '(none)'");

    console.log("\n" + pass + " passed, " + fail + " failed");
    process.exit(fail === 0 ? 0 : 1);
}

main().catch((e) => {
    console.error("Test run failed:", e);
    process.exit(1);
});
