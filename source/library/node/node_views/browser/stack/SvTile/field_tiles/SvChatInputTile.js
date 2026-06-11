/** * @module library.node.node_views.browser.stack.SvTile.field_tiles
 */

/** * @class SvChatInputTile
 * @extends SvChatMessageTile
 * @classdesc SvChatInputTile is a specialized tile for chat input functionality.
 
 
 */


"use strict";

(class SvChatInputTile extends SvChatMessageTile {

    /**
     * @description Value sync with a focused guard. While the user is
     * typing, the node's value legitimately lags the view (the view->node
     * sync is scheduled, not immediate) — so any didUpdateNode ripple
     * (AI streaming chunks, multiplayer message updates, presence ticks)
     * that re-synced this tile would overwrite the contenteditable with
     * STALE text, destroying the selection (cursor jumps to position 0)
     * and dropping just-typed characters. While focused, the view is the
     * source of truth — skip the value write, but still sync the
     * non-value aspects (editability follows acceptsChatInput).
     * Programmatic clears (send) set the node's one-shot
     * _forceValueViewSync flag to override.
     * @returns {SvChatInputTile} The current instance.
     * @category Sync
     */
    syncValueFromNode () {
        const node = this.node();
        const valueView = this.valueView();
        const isFocused = valueView && typeof valueView.isFocused === "function" && valueView.isFocused();
        if (isFocused && node && !node._forceValueViewSync) {
            const nodeValue = this.visibleValue();
            const viewValue = (typeof valueView.value === "function") ? valueView.value() : null;
            if (nodeValue !== viewValue) {
                // Without the guard this write would have replaced the
                // editor's innerHTML mid-typing — text near-identical but
                // caret collapsed to position 0.
                console.log(this.logPrefix(), "skipped focused value sync (node lags view by", Math.abs(String(viewValue || "").length - String(nodeValue || "").length), "chars)");
            }
            if (valueView.setIsEditable && node.valueIsEditable) {
                valueView.setIsEditable(node.valueIsEditable());
            }
            return this;
        }
        if (node) {
            node._forceValueViewSync = false; // consume the one-shot flag
        }
        return super.syncValueFromNode();
    }


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
