"use strict";

/** * @module library.node.node_views.browser.stack
 */

/** * @class SvDetailView
 * @extends SvFlexDomView
 * @classdesc The always-present second child of an SvStackView, owning
 * everything past the nav column:
 *
 *     SvStackView
 *     ├── navView
 *     └── detailView (SvDetailView)
 *         ├── childStackView                  ← the old otherView: hosts the child
 *         │                                     stack / inspector for the selection
 *         └── companionView (SvCompanionView) ← optional; created when the stack's
 *                                               node answers nodeCompanionNode()
 *
 * Lays its children out along the stack's axis (companion beside the columns
 * in a horizontal stack, beneath the content in a vertical one) and owns the
 * space arbitration between them: the child stack is the flexible region, the
 * companion reserves its docked or tab length, and compaction sees that
 * reservation through companionReservedLength().
 */

(class SvDetailView extends SvFlexDomView {

    initPrototypeSlots () {
        /**
         * @member {SvStackView} stackView - the owning stack view
         * @category Data
         */
        {
            const slot = this.newSlot("stackView", null);
            slot.setSlotType("SvStackView");
        }

        /**
         * @member {SvFlexDomView} childStackView - container hosting the child
         * stack / inspector for the current selection (the old otherView)
         * @category UI
         */
        {
            const slot = this.newSlot("childStackView", null);
            slot.setSlotType("SvFlexDomView");
        }

        /**
         * @member {SvCompanionView} companionView - the companion panel, present
         * only while the stack's node answers nodeCompanionNode()
         * @category UI
         */
        {
            const slot = this.newSlot("companionView", null);
            slot.setSlotType("SvCompanionView");
            slot.setAllowsNullValue(true);
        }

        /**
         * @member {Boolean} hasStackContent - whether the child stack container
         * currently has content (set by the stack's setOtherViewContent /
         * clearOtherView); drives this view's own flex sizing
         * @category State
         */
        {
            const slot = this.newSlot("hasStackContent", false);
            slot.setSlotType("Boolean");
        }
    }

    init () {
        super.init();
        this.setElementClassName("SvDetailView");
        this.setDisplay("flex");
        this.setFlexDirection("row");
        // Overlay is retired, so the detail view no longer needs to let content
        // extend past it — clip instead, so nothing spills past the window.
        this.setOverflow("hidden");
        // As a flex item in the stack row, allow shrinking below the content's
        // intrinsic width (default min-width:auto would refuse, so a wide child
        // — the narration content — pushes the detail view, and thus the docked
        // companion, past the window edge).
        this.setMinWidth("0px");
        this.setHeight("100%");

        const container = SvFlexDomView.clone();
        container.setFlexGrow(1);
        container.setFlexShrink(1);
        container.setFlexDirection("column");
        container.setHeight("100%");
        container.setOverflow("hidden");
        container.setMinWidth("0px"); // shrink to leave room for a docked companion (no overlap/overflow)
        this.setChildStackView(container);
        this.addSubview(container);

        this.updateOuterFlex();
        return this;
    }

    // --- orientation (follows the stack's axis) ---

    /**
     * @description Lays out children along the stack's direction and points the
     * companion at the matching edge.
     * @param {string} direction The stack's direction: "right" | "down".
     * @returns {SvDetailView} The current instance.
     * @category Layout
     */
    syncOrientation (direction) {
        if (direction === "down") {
            this.setFlexDirection("column");
        } else {
            this.setFlexDirection("row");
        }
        const companion = this.companionView();
        if (companion) {
            companion.setEdge(direction === "down" ? "bottom" : "right");
            companion.applyMode();
        }
        return this;
    }

    // --- companion lifecycle (driven by the stack's node binding) ---

    /**
     * @description Creates/destroys the companion based on the stack node's
     * nodeCompanionNode() answer. Called from SvStackView.syncFromNode — same
     * lifecycle as the nav view's headerNode()/footerNode() binding.
     * @param {SvNode} stackNode The stack's node.
     * @returns {SvDetailView} The current instance.
     * @category Companion
     */
    syncCompanionFromNode (stackNode) {
        const companionNode = (stackNode && stackNode.nodeCompanionNode) ? stackNode.nodeCompanionNode() : null;

        if (companionNode) {
            let companion = this.companionView();
            if (!companion) {
                companion = SvCompanionView.clone();
                companion.setEdge(this.flexDirection() === "column" ? "bottom" : "right");
                this.setCompanionView(companion);
                this.addSubview(companion); // after childStackView: right/bottom edge
            }
            if (companion.node() !== companionNode) {
                companion.setNode(companionNode);
            }
        } else if (this.companionView()) {
            this.companionView().removeFromParentView();
            this.setCompanionView(null);
        }

        this.updateOuterFlex();
        this.updateCompanionLayout();
        return this;
    }

    // --- space arbitration ---

    /**
     * @description The space the companion currently reserves along the stack's
     * horizontal axis — included in sumOfNavWidths() so column compaction makes
     * room for it.
     * @returns {Number} The reserved width in px (0 without a companion or on a
     * vertical axis).
     * @category Layout
     */
    companionReservedWidth () {
        const companion = this.companionView();
        if (companion && companion.isVerticalEdge()) {
            return companion.currentReservedLength();
        }
        return 0;
    }

    /**
     * @description Re-evaluates the companion's docked-vs-tab mode from the
     * space the rest of the chain leaves over. Called on compaction passes
     * (window resizes, selection changes).
     * @returns {SvDetailView} The current instance.
     * @category Layout
     */
    updateCompanionLayout () {
        const companion = this.companionView();
        const stack = this.stackView();
        if (!companion || !stack) {
            return false;
        }

        let changed = false;
        if (companion.isVerticalEdge()) {
            const total = stack.topViewWidth();
            const othersWidth = stack.rootStackView().sumOfNavWidths() - companion.currentReservedLength();
            changed = companion.setAvailableLength(total - othersWidth);
        } else {
            // bottom edge: size against the detail view's own height
            const h = this.element().clientHeight;
            if (h > 0) {
                changed = companion.setAvailableLength(h - 200); // leave room for the content above
            }
        }

        this.updateOuterFlex();
        return changed; // drives the stack's recompactBrowserChain fixed point
    }

    didUpdateSlotHasStackContent (/*oldValue, newValue*/) {
        this.updateOuterFlex();
        return this;
    }

    /**
     * @description This view's own flex sizing within the stack row: flexible
     * while the child stack has content; sized by the companion alone when it
     * doesn't; collapsed when empty.
     * @returns {SvDetailView} The current instance.
     * @category Layout
     */
    updateOuterFlex () {
        if (this.hasStackContent()) {
            this.setFlexBasis(null);
            this.setFlexGrow(1);
            this.setFlexShrink(1);
        } else if (this.companionView()) {
            this.setFlexBasis("auto");
            this.setFlexGrow(0);
            this.setFlexShrink(0);
        } else {
            this.setFlexBasis("0px");
            this.setFlexGrow(0);
            this.setFlexShrink(0);
        }
        return this;
    }

}.initThisClass());
