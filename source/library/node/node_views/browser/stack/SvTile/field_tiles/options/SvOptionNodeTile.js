/** * @module library.node.node_views.browser.stack.SvTile.field_tiles.options
 */

/** * @class SvOptionNodeTile
 * @extends SvTitledTile
 * @classdesc SvOptionNodeTile represents an option node tile in the browser stack.
 
 
 */

"use strict";

(class SvOptionNodeTile extends SvTitledTile {

    /**
     * @description Toggles the option state if editable
     * @returns {SvOptionNodeTile} Returns this instance
     * @category User Interaction
     */
    toggle () {
        const canToggle = this.node().optionsNode().valueIsEditable();
        if (canToggle) {
            this.node().toggle();
            this.maybeAutoPopAfterPick();
        }
        return this;
    }

    /**
     * @description On narrow viewports (single-column compaction), after a
     * single-pick option is picked, navigate back to the parent options
     * node so the user sees their selection in the parent context.
     *
     * Uses the live navigation path (the user may have arrived here via a
     * shortcut link, so the canonical model parent chain is the wrong path
     * to walk — postOnRequestNavigateToNode would try to walk hidden
     * subnodes and fail). Truncates the currently-selected path at the
     * options node and re-selects it.
     *
     * View-side decision: viewport state and view chain live here, not on
     * the node.
     * @returns {SvOptionNodeTile}
     * @category Navigation
     */
    maybeAutoPopAfterPick () {
        const node = this.node();
        if (!node || !node.isPicked || !node.isPicked()) {
            return this; // Toggled off, or no node — don't auto-pop.
        }
        const optionsNode = node.optionsNode();
        if (!optionsNode || optionsNode.allowsMultiplePicks()) {
            return this; // Multi-pick mode: user may pick more, keep column open.
        }
        const viewportWidth = SvWebBrowserWindow.shared().width();
        const narrowThreshold = 540; // 2 * default SvNavView targetWidth (270px)
        if (viewportWidth >= narrowThreshold) {
            return this; // Wide enough that the parent column is still visible.
        }

        // Walk up the view chain to any SvStackView, then to its root.
        let v = this.parentView();
        let steps = 0;
        while (v && !v.previousStackView) {
            v = v.parentView();
            if (++steps > 30) return this;
        }
        if (!v || !v.rootStackView) return this;
        const root = v.rootStackView();
        if (!root.selectedNodePathArray || !root.selectNodePathArray) return this;

        // Find the options node in the current navigation path. Truncate AT
        // the options node (slice up to idx, exclusive) — this deselects it,
        // which clears its otherView (the option list) via syncFromNavSelection,
        // making the parent column visible on narrow viewports. The live path
        // is the user's actual route (may differ from the canonical model
        // parent chain when shortcut links are involved).
        const currentPath = root.selectedNodePathArray();
        const idx = currentPath ? currentPath.indexOf(optionsNode) : -1;
        if (idx < 1) {
            return this; // Not on a path that includes the options node.
        }
        const trimmedPath = currentPath.slice(1, idx);

        // Brief delay so the user sees the check-mark land on the picked
        // option before the column collapses. Eventual: replace with a
        // proper selection animation + slide-back column transition.
        const delayMs = 300;
        this.addWeakTimeout(() => {
            root.selectNodePathArray(trimmedPath);
        }, delayMs);
        return this;
    }

    /**
     * @description Handles the enter key up event
     * @param {Event} event - The key up event
     * @returns {SvOptionNodeTile} Returns this instance
     * @category Event Handling
     */
    onEnterKeyUp (event) {
        super.onEnterKeyUp(event);
        this.toggle();
        event.stopPropagation();
        return this;
    }

    /**
     * @description Handles the tap complete gesture
     * @param {Object} aGesture - The tap gesture object
     * @returns {SvOptionNodeTile} Returns this instance
     * @category Event Handling
     */
    onTapComplete (aGesture) {
        super.onTapComplete(aGesture);
        this.toggle();
        return this;
    }

    /**
     * @description Synchronizes the tile with its node
     * @returns {SvOptionNodeTile} Returns this instance
     * @category Data Synchronization
     */
    syncFromNode () {
        super.syncFromNode();

        // Accessibility: individual option with picked/selected state
        this.setAriaSelected(this.ariaIsSelected());

        return this;
    }

    syncToNode () {
        super.syncToNode();
        return this;
    }

    // --- ARIA accessibility getters ---

    /**
     * @description Returns the ARIA role for this option tile.
     * @returns {string} The ARIA role.
     * @category Accessibility
     */
    ariaRole () {
        return "option";
    }

    /**
     * @description Returns the ARIA selected state from the node's picked state.
     * @returns {boolean} The selected state.
     * @category Accessibility
     */
    ariaIsSelected () {
        const node = this.node();
        return (node && node.isPicked) ? node.isPicked() : false;
    }

}.initThisClass());
