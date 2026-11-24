"use strict";

/**
 * @module library.node.node_views.browser.stack.SvTilesView
 */

/**
 * @class SvTilesView_grid
 * @extends SvTilesView
 * @classdesc The wrapping grid (Plans/Tile Container Views): a tiles view
 * whose node answers nodeChildrenLayout() "grid" lays its tiles out as cells
 * that wrap at the column's edge, as a gallery does.
 *
 * - Cells are CSS grid columns at least as wide as the node's
 *   nodeChildrenTileWidth (or defaultGridCellWidth), as many as fit. Nothing
 *   is measured to lay them out.
 * - A cell is the tile the child would have in a list, so selection,
 *   drill-in and theming carry over. A tile with a thumbnail shows it above
 *   its title, as wide as the cell.
 * - Arrow keys move in two dimensions: left and right along a row (left from
 *   a row's first cell goes back a column, as in a list), up and down by a
 *   row. The row length is read from the grid's computed columns when a key
 *   is pressed, before anything is written.
 * - Dragging a tile keeps the cells in the grid and moves a placeholder
 *   cell to where the tile would land (a list instead stacks its rows
 *   absolutely, which only works in one line).
 * - Its role stays "list": a set of things to open, not a spreadsheet.
 *
 * A grid in a column laid out downward (a horizontal row) is drawn as that
 * row; only a vertical column wraps.
 */
(class SvTilesView_grid extends SvTilesView {

    /**
     * @description Whether this view lays its tiles out as a wrapping grid:
     * its node asks for one and it is a vertical column (not a section of an
     * inline document, not a horizontal row).
     * @returns {Boolean}
     * @category Grid
     */
    isGridLayout () {
        const node = this.node();
        return !this.isInlineNested() && !!node && node.nodeChildrenLayout() === "grid" && this.isVertical() === true;
    }

    /**
     * @description The narrowest cell, in px, when the node hints none.
     * @returns {Number}
     * @category Grid
     */
    defaultGridCellWidth () {
        return 160;
    }

    /**
     * @description The narrowest cell, in px: the node's
     * nodeChildrenTileWidth, or the default.
     * @returns {Number}
     * @category Grid
     */
    gridCellWidth () {
        const hinted = this.node() ? this.node().nodeChildrenTileWidth() : 0;
        return hinted > 0 ? hinted : this.defaultGridCellWidth();
    }

    /**
     * @description Applies or removes the grid look. Runs on every sync; the
     * writes are same-value skipped.
     * @returns {SvTilesView_grid}
     * @category Grid
     */
    syncGridLayout () {
        const isGrid = this.isGridLayout();
        SvTilesView.ensureGridCss();
        this.element().classList.toggle("SvGridTiles", isGrid);
        this.setCssProperty("--grid-cell-width", isGrid ? this.gridCellWidth() + "px" : null);
        return this;
    }

    /**
     * @static
     * @description Adds the grid's style sheet to the page, once. Its rules
     * are !important where they replace a tile's list styles, which tiles
     * write inline.
     * @category Grid
     */
    static ensureGridCss () {
        if (SvTilesView.hasAddedGridCss()) {
            return;
        }
        SvTilesView.setHasAddedGridCss(true);
        SvWebDocument.shared().addStyleSheetString(`
            .SvGridTiles {
                display: grid !important;
                grid-template-columns: repeat(auto-fill, minmax(min(100%, var(--grid-cell-width)), 1fr));
                grid-auto-rows: min-content;
                align-content: start;
                gap: var(--sv-grid-gap, 1px);
            }
            .SvGridTiles > * {
                width: auto !important;
                min-width: 0 !important;
                max-width: none !important;
            }
            /* a cell's picture sits above its title, as wide as the cell */
            .SvGridTiles > * > .TileContentView {
                flex-direction: column !important;
                align-items: stretch !important;
            }
            .SvGridTiles > * > .TileContentView > :first-child {
                justify-content: stretch !important;
            }
            /* the title wraps rather than being cut short */
            .SvGridTiles > * > .TileContentView > :nth-child(2) > * {
                white-space: normal !important;
                text-overflow: clip !important;
                overflow-wrap: anywhere;
                width: auto !important;
            }
            /* the whole cell is what opens: no chevron under the title */
            .SvGridTiles > [data-nav-arrow] > .TileContentView > :nth-child(3) {
                display: none !important;
            }
            .SvGridTiles .TileThumbnailView {
                width: 100% !important;
                min-width: 0 !important;
                max-width: none !important;
                height: auto !important;
                min-height: 0 !important;
                max-height: none !important;
                aspect-ratio: 1;
                margin: 0 0 0.75em 0 !important;
            }
        `);
    }

    // --- keys ---

    /**
     * @description How many cells a row of the grid holds now. Read from
     * the grid's computed columns, so call it only in a key handler, before
     * writing anything.
     * @returns {Number}
     * @category Grid
     */
    gridColumnCount () {
        const columns = this.getComputedCssProperty("grid-template-columns") || "";
        return Math.max(1, columns.split(" ").filter(s => s.length > 0).length);
    }

    /**
     * @description Selects the tile a number of cells away, if there is
     * one, and shows it.
     * @param {Number} offset - cells forward (positive) or back (negative)
     * @returns {Boolean} whether a tile was selected
     * @category Grid
     */
    selectGridTileByOffset (offset) {
        const index = this.selectedTileIndex() + offset;
        if (this.selectedTileIndex() === -1 || index < 0 || index >= this.tiles().length) {
            return false;
        }
        this.setSelectedTileIndex(index);
        this.showSelected();
        return true;
    }

    /**
     * @description Up or down a row.
     * @param {Number} rows - 1 for down, -1 for up
     * @returns {SvTilesView_grid}
     * @category Grid
     */
    moveGridRows (rows) {
        if (this.selectedTileIndex() === -1) {
            this.selectNextTile(); // nothing selected: the first cell
            return this;
        }
        this.selectGridTileByOffset(rows * this.gridColumnCount());
        return this;
    }

    /**
     * @description Left along a row; from a row's first cell, back a column.
     * @returns {SvTilesView_grid}
     * @category Grid
     */
    moveGridLeft () {
        const index = this.selectedTileIndex();
        if (index <= 0 || index % this.gridColumnCount() === 0) {
            this.moveLeft();
            return this;
        }
        this.selectGridTileByOffset(-1);
        return this;
    }

    /**
     * @description Right along a row; from a row's last cell, into the
     * column the selected cell opened.
     * @returns {SvTilesView_grid}
     * @category Grid
     */
    moveGridRight () {
        const index = this.selectedTileIndex();
        const isRowEnd = (index + 1) % this.gridColumnCount() === 0 || index === this.tiles().length - 1;
        if (index === -1 || isRowEnd || !this.selectGridTileByOffset(1)) {
            this.moveRight();
        }
        return this;
    }

    // --- dragging ---

    /**
     * @description Moves the drag placeholder to the cell a drop at the
     * pointer would take: after every cell that comes before the pointer in
     * reading order (a row above it, or to its left on its row). Reads every
     * cell's frame, then makes one write.
     * @param {SvDragView} dragView
     * @returns {SvTilesView_grid}
     * @category Grid
     */
    moveGridPlaceHolderFor (dragView) {
        const ph = this.tilePlaceHolder();
        const p = dragView.dropPoint();
        const cells = this.tiles().filter(tile => tile !== ph && !tile.isDisplayHidden());
        const before = cells.filter(tile => this.gridCellIsBefore(tile.frameInDocument(), p)).length;
        const index = before < cells.length ? this.indexOfSubview(cells[before]) : this.subviews().length;
        const current = this.indexOfSubview(ph);
        this.moveSubviewToIndex(ph, current < index ? index - 1 : index);
        return this;
    }

    /**
     * @description Whether a cell comes before a point in reading order.
     * @param {SvRectangle} frame - the cell's frame in the document
     * @param {SvPoint} p - a point in the document
     * @returns {Boolean}
     * @category Grid
     */
    gridCellIsBefore (frame, p) {
        if (frame.maxY() <= p.y()) {
            return true; // a row above
        }
        return frame.minY() <= p.y() && frame.minX() + frame.width() / 2 < p.x(); // on its row, left of it
    }

    /**
     * @description The index a drop lands at: the placeholder's place among
     * the tiles, which stay in the grid's order while dragging.
     * @returns {Number}
     * @category Grid
     */
    indexOfGridPlaceHolder () {
        return this.tiles().indexOf(this.tilePlaceHolder());
    }

}.initThisCategory());
