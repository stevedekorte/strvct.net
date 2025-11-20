/**
 * @module library.node.node_views.browser.stack.Tile.field_tiles
 * @class SvChatInputTile
 * @extends SvChatMessageTile
 * @classdesc SvChatInputTile is a specialized tile for chat input functionality.
 */

"use strict";

(class SvChatInputTile extends SvChatMessageTile {


    /**
     * @description Creates and configures the value view.
     * @returns {SvTextView} The configured value view.
     * @category UI
     */
    createValueView () {
        const v = super.createValueView();
        v.setElementClassName("SvChatInputTileValueView");

        v.setAllowsHtml(false);
        v.setWhiteSpace("pre-wrap");

        v.setIsMultiline(true);
        v.setDoesInput(true);

        v.setDoesHoldFocusOnReturn(true);
        v.setMinHeight("fit-content");
        //v.setDoesInput(true);
        return v;
    }

}.initThisClass());
