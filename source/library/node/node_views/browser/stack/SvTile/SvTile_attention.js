"use strict";

/** * @module library.node.node_views.browser.stack.SvTile
 */

/** * @class SvTile_attention
 * @extends SvTile
 * @classdesc Category adding an "attention" capability to every tile:
 *
 *   - a small badge chip (SvTileBadgeView) overlaid on the tile when the node
 *     reports unseen changes worth inspecting
 *   - a brief background flash when the node signals a fresh highlight
 *
 * The node-side protocol is optional; tiles whose nodes don't implement it
 * are unaffected. Protocol methods (all read via getFromNodeDelegate):
 *
 *   - nodeViewShouldBadge() → Boolean — true while unseen changes exist
 *     (stub already defined on SvTitledNode)
 *   - nodeViewBadgeTitle() → String|null — chip text (e.g. a count); null
 *     renders a plain dot (stub already defined on SvTitledNode)
 *   - nodeLastHighlightTime() → Number — monotonic ms timestamp the node bumps
 *     when something attention-worthy happens; triggers a one-shot flash
 *   - markAttentionSeen() → action the view sends when the user inspects the
 *     tile (selection), letting the model clear its badge state
 *
 * State is held in lazy ivars (not slots) because category slot definitions
 * (initPrototypeSlots_<category>) are not reliably installed by
 * initThisCategory — see Object_categorySupport.
 *
 * Flash color can be themed via the --SvTile-attention-flash-color CSS variable.
 */

(class SvTile_attention extends SvTile {

    /**
     * @description Lazily registers the attention CSS once per document.
     * @returns {SvTile} The current instance.
     * @category Attention
     */
    registerAttentionCssIfNeeded () {
        if (!SvTile._attentionCssRegistered) {
            SvTile._attentionCssRegistered = true;
            SvWebDocument.shared().addStyleSheetString(`
                .SvTile-attentionFlash {
                    animation: SvTileAttentionFlash 1.2s ease-in-out 1;
                }

                @keyframes SvTileAttentionFlash {
                    0% { background-color: transparent; }
                    20% { background-color: var(--SvTile-attention-flash-color, rgba(240, 192, 0, 0.12)); }
                    100% { background-color: transparent; }
                }
            `);
        }
        return this;
    }

    attentionBadgeView () {
        return this._attentionBadgeView || null;
    }

    lastSeenHighlightTime () {
        return this._lastSeenHighlightTime || 0;
    }

    /**
     * @description Syncs the badge and flash state from the node's attention protocol.
     * Called from SvTile.syncFromNode().
     * @returns {SvTile} The current instance.
     * @category Attention
     */
    syncAttentionFromNode () {
        const node = this.node();
        if (!node) {
            return this;
        }

        const shouldBadge = this.getFromNodeDelegate("nodeViewShouldBadge") === true;
        if (shouldBadge) {
            const badgeTitle = this.getFromNodeDelegate("nodeViewBadgeTitle");
            this.attentionBadgeViewCreateIfAbsent().setBadgeString(badgeTitle);
        } else {
            this.removeAttentionBadge();
        }

        const highlightTime = this.getFromNodeDelegate("nodeLastHighlightTime");
        if (typeof (highlightTime) === "number" && highlightTime > this.lastSeenHighlightTime()) {
            this._lastSeenHighlightTime = highlightTime;
            this.flashAttention();
        }

        return this;
    }

    /**
     * @description Lazily creates the badge view and adds it to the content view.
     * @returns {SvTileBadgeView} The badge view.
     * @category Attention
     */
    attentionBadgeViewCreateIfAbsent () {
        if (!this.attentionBadgeView()) {
            const badge = SvTileBadgeView.clone();
            this._attentionBadgeView = badge;
            this.contentView().addSubview(badge);
        }
        return this.attentionBadgeView();
    }

    /**
     * @description Removes the badge view if present.
     * @returns {SvTile} The current instance.
     * @category Attention
     */
    removeAttentionBadge () {
        const badge = this.attentionBadgeView();
        if (badge) {
            badge.removeFromParentView();
            this._attentionBadgeView = null;
        }
        return this;
    }

    /**
     * @description Plays a one-shot background flash on the content view.
     * Restarts the animation if one is already in flight.
     * @returns {SvTile} The current instance.
     * @category Attention
     */
    flashAttention () {
        this.registerAttentionCssIfNeeded();
        const cv = this.contentView();
        if (cv.elementClassNames().includes("SvTile-attentionFlash")) {
            cv.removeElementClassName("SvTile-attentionFlash");
            cv.element().getBoundingClientRect(); // force reflow so the animation restarts
        }
        cv.appendElementClassName("SvTile-attentionFlash");
        this.addWeakTimeout(() => {
            cv.removeElementClassName("SvTile-attentionFlash");
        }, 1300);
        return this;
    }

    /**
     * @description Tells the node its attention has been seen (e.g. on selection)
     * so it can clear its badge state. Safe no-op for nodes without the protocol.
     * @returns {SvTile} The current instance.
     * @category Attention
     */
    markAttentionSeenIfNeeded () {
        const node = this.node();
        if (node && node.markAttentionSeen && this.getFromNodeDelegate("nodeViewShouldBadge") === true) {
            this.sendNodeDelegate("markAttentionSeen", []);
        }
        return this;
    }

}.initThisCategory());
