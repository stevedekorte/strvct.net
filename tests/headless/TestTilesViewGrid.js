#!/usr/bin/env node

"use strict";

/**
 * Headless test: the wrapping grid (SvTilesView_grid, Plans/Tile Container
 * Views). A node opts in with nodeChildrenLayout() "grid".
 *
 * - only the top of a vertical column is a grid (not a horizontal row, not a
 *   section of an inline document);
 * - the cell width is the node's nodeChildrenTileWidth, or the default;
 * - arrow keys: up and down by a row, left and right along it, leaving the
 *   grid at a row's edges as a list leaves at its ends;
 * - dragging: the placeholder lands after every cell before the pointer in
 *   reading order;
 * - a grid column fills whenever it is shown, as an inline document does;
 * - the hooks that make the list's absolute stacking skip a grid are there.
 *
 * Usage (from the strvct root):
 *   node tests/headless/TestTilesViewGrid.js
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

const proto = () => SvGlobals.get("SvTilesView").prototype;

function nodeStub (layout, cellWidth) {
    return {
        nodeChildrenLayout: () => layout,
        nodeChildrenTileWidth: () => cellWidth || 0
    };
}

/** A grid of `count` tiles, `columns` to a row, with `selected` selected. */
function gridStub (count, columns, selected) {
    const p = proto();
    const g = {
        selected: selected,
        moved: [],
        tiles: () => Array.from({ length: count }, (_, i) => i),
        selectedTileIndex: () => g.selected,
        setSelectedTileIndex: (i) => {
            g.selected = i;
        },
        showSelected: () => g,
        selectNextTile: () => {
            g.selected = 0;
        },
        gridColumnCount: () => columns,
        moveLeft: () => g.moved.push("left"),
        moveRight: () => g.moved.push("right")
    };
    ["selectGridTileByOffset", "moveGridRows", "moveGridLeft", "moveGridRight"].forEach(name => {
        g[name] = p[name].bind(g);
    });
    return g;
}

function rect (x, y, w, h) {
    return SvGlobals.get("SvRectangle").clone().setOrigin(SvGlobals.get("SvPoint").clone().setX(x).setY(y)).setSize(SvGlobals.get("SvPoint").clone().setX(w).setY(h));
}

function point (x, y) {
    return SvGlobals.get("SvPoint").clone().setX(x).setY(y);
}

async function main () {
    await boot();
    const p = proto();

    console.log("Which views are grids");
    const isGrid = (node, nested, vertical) => p.isGridLayout.call({ node: () => node, isInlineNested: () => nested, isVertical: () => vertical });
    check(isGrid(nodeStub("grid"), false, true) === true, "a vertical column whose node asks for a grid");
    check(isGrid(nodeStub("column"), false, true) === false, "a column node is a list");
    check(isGrid(nodeStub("grid"), false, false) === false, "a horizontal row is drawn as a row");
    check(isGrid(nodeStub("grid"), false, null) === false, "a view not yet in a stack is not one yet");
    check(isGrid(nodeStub("grid"), true, true) === false, "a section of an inline document is not one");
    check(isGrid(null, false, true) === false, "no node, no grid");

    console.log("\nThe cell width");
    const cellWidth = (node) => p.gridCellWidth.call({ node: () => node, defaultGridCellWidth: p.defaultGridCellWidth });
    check(cellWidth(nodeStub("grid", 220)) === 220, "the node's nodeChildrenTileWidth");
    check(cellWidth(nodeStub("grid", 0)) === p.defaultGridCellWidth(), "or the default when it hints none");

    console.log("\nArrow keys (10 cells, 4 to a row)");
    let g = gridStub(10, 4, 1);
    g.moveGridRows(1);
    check(g.selected === 5, "down moves a row");
    g.moveGridRows(1);
    check(g.selected === 9, "down again, to the last row");
    g.moveGridRows(1);
    check(g.selected === 9, "down from the last row stays");
    g.moveGridRows(-1);
    check(g.selected === 5, "up moves a row");
    g = gridStub(10, 4, 5);
    g.moveGridLeft();
    check(g.selected === 4 && g.moved.length === 0, "left along a row");
    g.moveGridLeft();
    check(g.selected === 4 && g.moved[0] === "left", "left from a row's first cell goes back a column");
    g = gridStub(10, 4, 5);
    g.moveGridRight();
    check(g.selected === 6 && g.moved.length === 0, "right along a row");
    g = gridStub(10, 4, 7);
    g.moveGridRight();
    check(g.selected === 7 && g.moved[0] === "right", "right from a row's last cell goes into the opened column");
    g = gridStub(10, 4, 9);
    g.moveGridRight();
    check(g.selected === 9 && g.moved[0] === "right", "right from the last cell too");
    g = gridStub(10, 4, -1);
    g.moveGridRows(1);
    check(g.selected === 0, "with nothing selected, a key selects the first cell");

    console.log("\nWhere a drag lands");
    const cell = rect(100, 100, 50, 50); // x 100–150, y 100–150
    check(p.gridCellIsBefore(cell, point(10, 200)) === true, "a cell on a row above the pointer comes before it");
    check(p.gridCellIsBefore(cell, point(140, 120)) === true, "a cell on the pointer's row, left of it, comes before it");
    check(p.gridCellIsBefore(cell, point(110, 120)) === false, "a cell whose middle is right of the pointer does not");
    check(p.gridCellIsBefore(cell, point(500, 50)) === false, "a cell on a row below does not");

    console.log("\nThe column fills whenever a grid is shown");
    const fills = (layout) => SvGlobals.get("SvNavView").prototype.fillsWhenShown.call({ node: () => nodeStub(layout), presentedNodeFor: (n) => n });
    check(fills("grid") === true, "a grid fills");
    check(fills("inline") === true, "an inline document still fills");
    check(fills("column") === false, "a list does not");

    console.log("\nThe hooks are in place");
    const read = (rel) => fs.readFileSync(path.join(strvctRoot, "source/library/node/node_views/browser/stack/SvTilesView", rel), "utf8");
    const body = (src, sig) => {
        const s = src.slice(src.indexOf(sig));
        return s.slice(0, s.indexOf("\n    }\n"));
    };
    check(/syncGridLayout\(\)/.test(body(read("SvTilesView.js"), "    syncFromNode () {")), "syncFromNode applies the grid");
    const orientation = read("SvTilesView_orientation.js");
    check(/isGridLayout\(\)/.test(body(orientation, "    stackTiles () {")) && /isGridLayout\(\)/.test(body(orientation, "    unstackTiles () {")), "a grid's cells are never stacked absolutely");
    const drag = read("SvTilesView_dragViewProtocol.js");
    check(/moveGridPlaceHolderFor/.test(body(drag, "    onDragDestinationHover (dragView) {")), "a drag over a grid moves its placeholder cell");
    check(/indexOfGridPlaceHolder/.test(body(drag, "    indexOfTilePlaceHolder () {")), "and drops at its index");
    const keys = read("SvTilesView_keyboard.js");
    ["onUpArrowKeyDown", "onDownArrowKeyDown", "onLeftArrowKeyUp", "onRightArrowKeyUp"].forEach(name => {
        check(/isGridLayout\(\)/.test(body(keys, "    " + name + " (")), name + " moves in two dimensions in a grid");
    });

    console.log("\n" + pass + " passed, " + fail + " failed");
    process.exit(fail === 0 ? 0 : 1);
}

main().catch((e) => {
    console.error("Test run failed:", e);
    process.exit(1);
});
