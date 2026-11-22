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
        const optionsNode = this.node().optionsNode();
        const canToggle = optionsNode.offersUserEdit(optionsNode.valueIsEditable());
        if (canToggle) {
            this.node().toggle();
            this.maybeAutoPopAfterPick();
        }
        return this;
    }

    /**
     * @description After a single-pick option is picked while the column to
     * return to is hidden (a phone, or any browser too narrow for both),
     * navigates back to it, so the user sees their pick where the field
     * is. With that column in view nothing moves.
     *
     * Uses the live navigation path (the user may have arrived here via a
     * shortcut link, so the canonical model parent chain is the wrong path
     * to walk — postOnRequestNavigateToNode would try to walk hidden
     * subnodes and fail). The user did not ask to be moved, so the
     * request's cause is "program".
     *
     * View-side decision: the layout and the view chain live here, not on
     * the node.
     * @returns {SvOptionNodeTile}
     * @category Navigation
     */
    maybeAutoPopAfterPick () {
        const browser = this.firstParentViewWithAncestorClass(SvBrowserView);
        if (!browser || !this.didPickTheOneChoice() || !this.returnColumnIsHidden()) {
            return this;
        }
        const pathAtPick = browser.selectedNodePathArray();
        if (pathAtPick.indexOf(this.node().optionsNode()) < 1) {
            return this; // not on a path that includes the options node
        }
        // Brief delay so the user sees the check-mark land on the picked
        // option before the column collapses. Eventual: replace with a
        // proper selection animation + slide-back column transition.
        this.addWeakTimeout(() => this.stepBackIfStillAt(browser, pathAtPick), this.stepBackDelayMs());
        return this;
    }

    stepBackDelayMs () {
        return 300;
    }

    /**
     * @description Whether the tap picked an option of a single-pick node:
     * not a toggle off, and not one of several picks (the user may pick
     * more, so the column stays open).
     * @returns {Boolean}
     * @category Navigation
     */
    didPickTheOneChoice () {
        const node = this.node();
        if (!node || !node.isPicked || !node.isPicked()) {
            return false;
        }
        const optionsNode = node.optionsNode();
        return !!optionsNode && !optionsNode.allowsMultiplePicks();
    }

    /**
     * @description Whether the column the options were opened from is
     * hidden: the level before this tile's own, as its browser's last pass
     * left it. A column hidden to make room for a companion counts. (This
     * was a test of the window's width against 540px, which is another
     * question: Plans/Compaction Coordinator, decision 22.)
     * @returns {Boolean}
     * @category Navigation
     */
    returnColumnIsHidden () {
        const stack = this.stackView();
        const previous = stack ? stack.previousStackView() : null;
        return !!(previous && previous.navView().isCollapsed());
    }

    /**
     * @description Goes back to the column the options were opened from,
     * unless the path has changed since the pick: a user who has already
     * gone elsewhere stays there. Truncating AT the options node deselects
     * it, which clears its column (the option list) and shows the one
     * before.
     * @param {SvBrowserView} browser
     * @param {Array<SvNode>} pathAtPick
     * @returns {SvOptionNodeTile}
     * @category Navigation
     */
    stepBackIfStillAt (browser, pathAtPick) {
        const now = browser.selectedNodePathArray();
        const isSamePath = now.length === pathAtPick.length && now.every((node, i) => node === pathAtPick[i]);
        if (isSamePath) {
            const idx = pathAtPick.indexOf(this.node().optionsNode());
            browser.navigate(SvNavigationRequest.toPath(pathAtPick.slice(1, idx)).setCause("program"));
        }
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
