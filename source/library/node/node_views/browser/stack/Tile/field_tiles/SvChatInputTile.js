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

        v.setAllowsHtml(false);
        v.setWhiteSpace("normal");

        v.setIsMultiline(true);
        v.setDoesInput(true);

        v.setDoesHoldFocusOnReturn(true);
        //v.setDoesInput(true);
        return v;
    }


}.initThisClass());
