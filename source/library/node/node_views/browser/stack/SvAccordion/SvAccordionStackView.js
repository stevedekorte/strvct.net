"use strict";

/** * @module library.node.node_views.browser.stack.SvAccordion
 */

/** * @class SvAccordionStackView
 * @extends SvStackView
 * @classdesc A single-column push/pop variant of SvStackView.
 *
 * Where a normal SvStackView lays its navView and otherView side by side
 * (Miller columns), an accordion stack stacks them as absolutely-positioned
 * layers in the same space:
 *
 *   - selecting a tile pushes the child panel in from the right; the current
 *     panel slides 30% left and fades behind it
 *   - popping plays the reverse animation
 *
 * Selection, node→tile mapping, header/footer nodes, and path selection are
 * all inherited from SvStackView. Child stacks self-propagate via
 * childStackViewClass(). Miller-column compaction is disabled.
 *
 * Path-change notifications post as "onAccordionStackViewPathChange" (not
 * "onStackViewPathChange") so the app-level URL-hash sync and global
 * breadcrumb tiles ignore accordion navigation.
 *
 * Typically used via SvAccordionPanelView, which adds a breadcrumb bar.
 *
 * The layer background can be themed via --SvAccordionLayer-bg.
 */

(class SvAccordionStackView extends SvStackView {

    initPrototypeSlots () {
        /**
         * @member {Number} pendingLayerRemovalTid - timeout id for a pop animation's
         * deferred subview removal, null when no pop is in flight
         * @category State
         */
        {
            const slot = this.newSlot("pendingLayerRemovalTid", null);
            slot.setSlotType("Number");
            slot.setAllowsNullValue(true);
        }
    }

    initPrototype () {
        this.setupCss();
    }

    setupCss () {
        SvWebDocument.shared().addStyleSheetString(`
            .SvAccordionLayer {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                box-sizing: border-box;
                background-color: var(--SvAccordionLayer-bg, #191919);
                transition: transform 0.3s ease-in-out, opacity 0.3s ease-in-out;
            }

            .SvAccordionLayer-active {
                transform: translateX(0);
                opacity: 1;
            }

            .SvAccordionLayer-behind {
                transform: translateX(-30%);
                opacity: 0.3;
                pointer-events: none;
            }

            .SvAccordionLayer-offscreen-right {
                transform: translateX(100%);
                opacity: 0;
                pointer-events: none;
            }
        `);
    }

    init () {
        super.init();
        this.setDirection("right"); // keeps SvNavView/SvTilesView in vertical-tiles mode
        this.syncOrientation();
        return this;
    }

    navViewClass () {
        return SvAccordionNavView;
    }

    childStackViewClass () {
        return SvAccordionStackView;
    }

    /**
     * @description Accordion path changes post their own notification name so
     * global onStackViewPathChange listeners (URL hash, breadcrumb tiles) ignore them.
     * @returns {SvStackView} The stack view.
     */
    didChangePath () {
        this.postNoteNamed("onAccordionStackViewPathChange");
        return this;
    }

    /**
     * @description Unlike SvStackView, the accordion never adopts the node's
     * nodeOrientation — layers always stack in place.
     * @returns {SvAccordionStackView} The stack view.
     */
    syncFromNode () {
        this.syncOrientation();
        this.syncFromNavSelection();
        return this;
    }

    /**
     * @description Lays out navView and otherView as stacked layers rather than
     * flex row/column siblings.
     * @returns {SvAccordionStackView} The stack view.
     */
    syncOrientation () {
        this.setPosition("relative");
        this.setWidth("100%");
        this.setHeight("100%");
        this.setOverflow("hidden");

        const nav = this.navView();
        if (nav) {
            nav.appendElementClassName("SvAccordionLayer");
            if (!nav.elementClassNames().includes("SvAccordionLayer-behind")) {
                nav.appendElementClassName("SvAccordionLayer-active");
            }
            nav.setZIndex(1);
            nav.syncOrientation();
        }

        const ov = this.otherView();
        if (ov) {
            ov.appendElementClassName("SvAccordionLayer");
            if (ov.subviews().length === 0 && !ov.elementClassNames().includes("SvAccordionLayer-active")) {
                // an empty layer must never intercept clicks meant for the nav below it
                ov.appendElementClassName("SvAccordionLayer-offscreen-right");
            }
            ov.setZIndex(2);
        }

        return this;
    }

    // --- layer push / pop animations ---

    /**
     * @description Pushes the child panel in from the right and slides the
     * current panel behind.
     * @param {SvDomView} v The child stack view to push.
     * @returns {SvAccordionStackView} The stack view.
     */
    setOtherViewContent (v) {
        this.cancelPendingLayerRemoval();

        const ov = this.otherView();
        ov.removeAllSubviews().addSubview(v);

        // start offscreen, force a reflow so the transition plays, then slide in
        ov.removeElementClassName("SvAccordionLayer-active");
        ov.appendElementClassName("SvAccordionLayer-offscreen-right");
        ov.element().getBoundingClientRect();
        ov.removeElementClassName("SvAccordionLayer-offscreen-right");
        ov.appendElementClassName("SvAccordionLayer-active");

        const nav = this.navView();
        nav.removeElementClassName("SvAccordionLayer-active");
        nav.appendElementClassName("SvAccordionLayer-behind");

        // re-sync the pushed layer's nav (header/footer, e.g. a chat input's
        // auto-height) once the slide-in transition lands — content measured
        // while the layer was offscreen can size itself wrong
        this.addWeakTimeout(() => {
            const child = this.nextStackView();
            if (child && child.navView && child.navView()) {
                child.navView().syncOrientation();
                const footer = child.navView().footerView();
                if (footer && footer.syncFromNode) {
                    footer.syncFromNode();
                }
            }
        }, 350, "accordionPostPushSync");

        return this;
    }

    /**
     * @description Pops the current child panel: slides it offscreen right,
     * restores the nav layer, and removes the child views once the
     * transition completes.
     * @returns {SvAccordionStackView} The stack view.
     */
    clearOtherView () {
        const ov = this.otherView();

        const nav = this.navView();
        if (nav) {
            nav.removeElementClassName("SvAccordionLayer-behind");
            nav.appendElementClassName("SvAccordionLayer-active");
        }

        if (ov.subviews().length === 0) {
            return this; // nothing to animate (e.g. during init)
        }

        ov.removeElementClassName("SvAccordionLayer-active");
        ov.appendElementClassName("SvAccordionLayer-offscreen-right");

        this.cancelPendingLayerRemoval();
        const tid = this.addWeakTimeout(() => {
            this.setPendingLayerRemovalTid(null);
            ov.removeAllSubviews();
            // the offscreen class stays on while empty: opacity 0 + pointer-events
            // none keep the empty layer from intercepting clicks meant for the nav
        }, 320);
        this.setPendingLayerRemovalTid(tid);

        return this;
    }

    cancelPendingLayerRemoval () {
        const tid = this.pendingLayerRemovalTid();
        if (tid) {
            this.clearTimeout(tid);
            this.setPendingLayerRemovalTid(null);
        }
        return this;
    }

    /**
     * @description The popped child stays in the view tree until its exit
     * animation finishes, but it should not count as navigation content.
     * @returns {SvDomView|null} The next stack view, if any.
     */
    nextStackView () {
        if (this.pendingLayerRemovalTid()) {
            return null; // a pop is animating out; treat as already removed
        }
        return super.nextStackView();
    }

    // --- no Miller-column compaction inside an accordion ---

    onWindowResize (/*event*/) {
        return this;
    }

    updateCompactionChain () {
        return this;
    }

    compactNavAsNeeded () {
        return false;
    }

}.initThisClass());
