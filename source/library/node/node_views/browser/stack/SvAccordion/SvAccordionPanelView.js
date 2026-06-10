"use strict";

/** * @module library.node.node_views.browser.stack.SvAccordion
 */

/** * @class SvAccordionPanelView
 * @extends SvNodeView
 * @classdesc An embeddable accordion panel: a breadcrumb bar over a push/pop
 * layer stack navigating the node tree rooted at this view's node.
 *
 *     SvAccordionPanelView
 *     ├── breadCrumbsView (SvAccordionBreadCrumbsView)
 *     └── layerContainerView
 *         └── SvAccordionStackView (root layer; children push in from the right)
 *
 * Usage:
 *
 *     const panel = SvAccordionPanelView.clone();
 *     panel.setNode(rootNode);
 *     someView.addSubview(panel);
 *
 * Public navigation API: popToRoot(), selectSubpath(nodesArray) — the latter
 * takes the node path *below* the root node (e.g. [characterNode, hitPointsNode]).
 */

(class SvAccordionPanelView extends SvNodeView {

    initPrototypeSlots () {
        /**
         * @member {SvAccordionBreadCrumbsView} breadCrumbsView
         * @category UI
         */
        {
            const slot = this.newSlot("breadCrumbsView", null);
            slot.setSlotType("SvAccordionBreadCrumbsView");
        }
        /**
         * @member {SvDomView} layerContainerView - positioning context for the layer stack
         * @category UI
         */
        {
            const slot = this.newSlot("layerContainerView", null);
            slot.setSlotType("SvDomView");
        }
        /**
         * @member {SvAccordionStackView} accordionStackView - the root layer stack
         * @category UI
         */
        {
            const slot = this.newSlot("accordionStackView", null);
            slot.setSlotType("SvAccordionStackView");
        }
    }

    init () {
        super.init();
        this.setDisplay("flex");
        this.setFlexDirection("column");
        this.setWidth("100%");
        this.setHeight("100%");
        this.setOverflow("hidden");

        const bc = SvAccordionBreadCrumbsView.clone();
        this.setBreadCrumbsView(bc);
        this.addSubview(bc);

        const lc = SvDomView.clone();
        lc.setPosition("relative");
        lc.setFlexGrow(1);
        lc.setFlexShrink(1);
        lc.setWidth("100%");
        lc.setOverflow("hidden");
        this.setLayerContainerView(lc);
        this.addSubview(lc);

        return this;
    }

    /**
     * @description Rebuilds the root accordion stack when the node changes.
     * @returns {SvAccordionPanelView} The current instance.
     * @category Node Management
     */
    didChangeNode () {
        super.didChangeNode();

        const lc = this.layerContainerView();
        lc.removeAllSubviews();
        this.setAccordionStackView(null);

        const node = this.node();
        if (node) {
            const stack = SvAccordionStackView.clone();
            stack.setNode(node);
            lc.addSubview(stack);
            this.setAccordionStackView(stack);
            stack.syncFromNode();
            this.breadCrumbsView().setAccordionStackView(stack);
        } else {
            this.breadCrumbsView().setAccordionStackView(null);
        }

        return this;
    }

    /**
     * @description This view manages its own fixed subviews; it never
     * auto-generates subviews from subnodes like the SvNodeView default.
     * @returns {boolean} false — subviews never change here.
     * @category Synchronization
     */
    syncFromNode () {
        this.syncCssFromNode();
        return false;
    }

    // --- public navigation API ---

    /**
     * @description Pops all pushed layers, returning to the root panel.
     * @returns {SvAccordionPanelView} The current instance.
     * @category Navigation
     */
    popToRoot () {
        return this.selectSubpath([]);
    }

    /**
     * @description Navigates the accordion to a node path below the root node.
     * @param {Array} nodesArray The nodes to select, in order, starting with a
     * subnode of the root node. An empty array pops to root.
     * @returns {SvAccordionPanelView} The current instance.
     * @category Navigation
     */
    selectSubpath (nodesArray) {
        const stack = this.accordionStackView();
        if (stack) {
            stack.selectNodePathArray(nodesArray.shallowCopy());
        }
        return this;
    }

}.initThisClass());
