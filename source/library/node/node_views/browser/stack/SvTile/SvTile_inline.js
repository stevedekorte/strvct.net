/**
 * @module browser.stack.SvTile
 */

/**
 * @class SvTile_inline
 * @extends SvTile
 * @classdesc A tile in an inline document, as something that opens and
 * closes: a row with a description opens to show it (SvTilesView_inline).
 * Which rows are open is view state, kept on the row's element, never on
 * its node. A section that folds answers the same way (SvInlineSectionTile),
 * so a section can open or close everything inside it at once.
 */

"use strict";

(class SvTile_inline extends SvTile {

    /**
     * @description Whether the tile opens and closes: a row with a
     * description (SvTitledTile marks the long ones).
     * @returns {Boolean}
     * @category Inline
     */
    isInlineOpenable () {
        return this.element().classList.contains("SvTileLongSubtitle"); // a class, not a measurement
    }

    isInlineOpen () {
        return this.element().classList.contains("SvInlineOpen");
    }

    /**
     * @description Opens or closes the row.
     * @param {Boolean} aBool
     * @returns {SvTile_inline}
     * @category Inline
     */
    setIsInlineOpen (aBool) {
        this.element().classList.toggle("SvInlineOpen", aBool);
        this.setAttribute("aria-expanded", aBool ? "true" : "false");
        return this;
    }

    /**
     * @description What opens or closes at this tile when the section it
     * sits in opens or closes everything inside: the row itself, if it opens.
     * @returns {Array<SvTile>}
     * @category Inline
     */
    inlineFoldTargets () {
        return this.isInlineOpenable() ? [this] : [];
    }

}.initThisCategory());
