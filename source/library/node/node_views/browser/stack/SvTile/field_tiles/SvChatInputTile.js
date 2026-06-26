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

        // Debug: when the chat input is gated, log what the model says we're
        // waiting on — so an input that "locks up" reports its reason instead of
        // silently disabling. The model owns the reason
        // (node.valueInputBlockingReason -> conversation.chatInputBlockingReason);
        // the view only reads + logs it. De-duped against the last logged reason
        // so we capture the full trace (including the reason CHANGING while still
        // disabled, e.g. AI-streaming -> pending roll) without per-sync spam.
        // Lives here (not the generic SvFieldTile) because this tile's focused
        // guard below can return before super runs.
        if (node && typeof node.valueInputBlockingReason === "function") {
            const reason = node.acceptsValueInput && node.acceptsValueInput() ? null : node.valueInputBlockingReason();
            if (reason && reason !== this._lastLoggedInputBlockReason) {
                console.log(this.logPrefix(), "chat input disabled — waiting on:", reason);
            }
            this._lastLoggedInputBlockReason = reason;
        }
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

        // Clear the editor synchronously on Enter (afterEnter, right after
        // the message is committed via didInput → onValueInput → send).
        // Previously the only clear was send()'s setValue("") + a SCHEDULED
        // model→view sync; the focused guard (syncValueFromNode above)
        // skips value writes while the input is focused, so that scheduled
        // clear was unreliable — the input often kept the just-sent text.
        // doesClearOnReturn is the framework's purpose-built, synchronous,
        // focus-independent clear for exactly this case.
        v.setDoesClearOnReturn(true);

        v.setDoesHoldFocusOnReturn(true);
        v.setMinHeight("fit-content");
        //v.setDoesInput(true);
        return v;
    }

}.initThisClass());
