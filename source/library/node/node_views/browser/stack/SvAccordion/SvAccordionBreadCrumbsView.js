"use strict";

/** * @module library.node.node_views.browser.stack.SvAccordion
 */

/** * @class SvAccordionBreadCrumbsView
 * @extends SvFlexDomView
 * @classdesc The breadcrumb bar at the top of an SvAccordionPanelView.
 *
 * Shows the selected node path of one accordion stack (e.g. "Adventure › Azrakos
 * › Spells"); clicking a segment pops the accordion back to that level. The
 * root segment always shows, acting as the panel's title.
 *
 * Unlike SvBreadCrumbsTile (a tile coupled to the global Miller-column path
 * notifications), this view observes "onAccordionStackViewPathChange" from its
 * own accordion stack only.
 */

(class SvAccordionBreadCrumbsView extends SvFlexDomView {

    initPrototypeSlots () {
        /**
         * @member {SvAccordionStackView} accordionStackView - the stack this bar reflects and controls
         * @category Data
         */
        {
            const slot = this.newSlot("accordionStackView", null);
            slot.setSlotType("SvAccordionStackView");
        }
        /**
         * @member {SvObservation} pathChangeObs
         * @category Observation
         */
        {
            const slot = this.newSlot("pathChangeObs", null);
            slot.setSlotType("SvObservation");
        }
    }

    initPrototype () {
        this.setupCss();
    }

    setupCss () {
        SvWebDocument.shared().addStyleSheetString(`
            .SvAccordionBreadCrumbsView {
                animation: SvAccordionCrumbsFadeIn 0.3s ease-in-out;
            }

            @keyframes SvAccordionCrumbsFadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }

            .SvAccordionCrumbLabel {
                font-size: 0.85em;
                font-weight: 300;
                color: rgba(255, 255, 255, 0.4);
                transition: color 0.15s;
                cursor: pointer;
                white-space: nowrap;
            }

            .SvAccordionCrumbLabel:hover {
                color: rgba(255, 255, 255, 0.7);
            }

            .SvAccordionCrumbLabel.current {
                font-weight: 600;
                color: rgba(255, 255, 255, 0.8);
                cursor: default;
            }

            .SvAccordionCrumbSeparator {
                font-size: 0.85em;
                color: rgba(255, 255, 255, 0.25);
                padding: 0 0.5em;
                white-space: nowrap;
            }
        `);
    }

    init () {
        super.init();
        this.setElementClassName("SvAccordionBreadCrumbsView");
        this.setDisplay("flex");
        this.setFlexDirection("row");
        this.setAlignItems("center");
        this.setFlexGrow(0);
        this.setFlexShrink(0);
        this.setWidth("100%");
        this.setMinHeight("2.8em");
        this.setPaddingLeft("0.8em");
        this.setPaddingRight("0.8em");
        this.setBorderBottom("1px solid rgba(255, 255, 255, 0.08)");
        this.setOverflow("hidden");
        this.setWhiteSpace("nowrap");
        this.turnOffUserSelect();

        // Accessibility
        this.setAriaRole("navigation");
        this.setAriaLabel("Panel breadcrumb");

        return this;
    }

    /**
     * @description Wires this bar to an accordion stack and starts observing
     * its path changes.
     * @param {SvAccordionStackView} aStackView The accordion stack to follow.
     * @returns {SvAccordionBreadCrumbsView} The current instance.
     * @category Data
     */
    didUpdateSlotAccordionStackView (oldValue, newValue) {
        if (this.pathChangeObs()) {
            this.pathChangeObs().stopWatching();
            this.setPathChangeObs(null);
        }
        if (newValue) {
            const obs = SvNotificationCenter.shared().newObservation();
            obs.setName("onAccordionStackViewPathChange");
            obs.setSender(newValue);
            obs.setObserver(this);
            obs.startWatching();
            this.setPathChangeObs(obs);
            this.scheduleMethod("setupPathViews");
        }
        return this;
    }

    /**
     * @description Handles a path change in the observed accordion stack.
     * @category Event Handling
     */
    onAccordionStackViewPathChange (/*aNote*/) {
        this.scheduleMethod("setupPathViews");
        return this;
    }

    /**
     * @description The selected node path, starting with the accordion root's node.
     * @returns {Array} The path nodes.
     * @category Data
     */
    pathNodes () {
        const stack = this.accordionStackView();
        if (stack && stack.node()) {
            return stack.selectedNodePathArray();
        }
        return [];
    }

    /**
     * @description Rebuilds the crumb segment views from the current path.
     * @returns {SvAccordionBreadCrumbsView} The current instance.
     * @category View Creation
     */
    setupPathViews () {
        this.removeAllSubviews();

        const pathNodes = this.pathNodes();
        pathNodes.forEach((node, i) => {
            if (i > 0) {
                this.addSubview(this.newSeparatorView());
            }
            this.addSubview(this.crumbViewForNode(node, i, pathNodes));
        });

        return this;
    }

    /**
     * @description Creates a clickable crumb segment for a path node.
     * @param {SvNode} node The node.
     * @param {number} i The index within the path.
     * @param {Array} pathNodes The full path.
     * @returns {SvButtonView} The crumb view.
     * @category View Creation
     */
    crumbViewForNode (node, i, pathNodes) {
        const isCurrent = (i === pathNodes.length - 1);

        const v = SvButtonView.clone();
        v.setDisplay("inline-block");
        v.setWidth("fit-content");
        v.setHeight("fit-content");
        v.setPaddingLeft("0em");
        v.setPaddingRight("0em");
        v.titleView().setPaddingLeft("0em");
        v.titleView().setPaddingRight("0em");
        v.titleView().setOverflow("hidden");
        v.titleView().setTextOverflow("ellipsis");
        v.titleView().setElementClassName("SvAccordionCrumbLabel" + (isCurrent ? " current" : ""));
        v.setTitle(node.translatedValueOfSlotNamed("title"));

        if (!isCurrent) {
            v.setInfo(pathNodes.slice(0, i + 1));
            v.setTarget(this);
            v.setAction("onClickPathComponent");
        }

        return v;
    }

    /**
     * @description Pops the accordion back to the clicked crumb's level.
     * @param {SvButtonView} crumbView The clicked crumb.
     * @returns {SvAccordionBreadCrumbsView} The current instance.
     * @category Event Handling
     */
    onClickPathComponent (crumbView) {
        const stack = this.accordionStackView();
        if (!stack) {
            return this;
        }
        const nodePath = crumbView.info().shallowCopy();
        nodePath.shift(); // selectNodePathArray expects the path *after* the stack's own node
        stack.selectNodePathArray(nodePath);
        return this;
    }

    /**
     * @description Creates a separator between crumb segments.
     * @returns {SvTextView} The separator view.
     * @category View Creation
     */
    newSeparatorView () {
        const v = SvTextView.clone();
        v.setElementClassName("SvAccordionCrumbSeparator");
        v.setString("›");
        return v;
    }

}.initThisClass());
