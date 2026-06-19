"use strict";

/** * @module library.node.node_views.browser
 */

/** * @class SvBreadCrumbsView
 * @extends SvFlexDomView
 * @classdesc The breadcrumb bar of an SvBrowserView: a back button plus one
 * clickable segment per node in the browser's selected node path.
 *
 * This is a plain view owned directly by the browser — it has no node and is
 * not a tile, so no synthetic breadcrumb node needs to be inserted into the
 * model graph. It is updated by its browser's childUpdatedNavPath() handler,
 * so it reflects only navigation beneath its own browser (multiple concurrent
 * browsers each get their own, isolated bar).
 *
 * Colors can be themed via CSS variables:
 *
 *     --SvBreadCrumbs-color
 *     --SvBreadCrumbs-current-color
 *     --SvBreadCrumbs-separator-color
 *     --SvBreadCrumbs-border-color
 */

(class SvBreadCrumbsView extends SvFlexDomView {

    initPrototypeSlots () {
        /**
         * @member {SvBrowserView} browserView - the browser whose path this bar reflects
         * @category Data
         */
        {
            const slot = this.newSlot("browserView", null);
            slot.setSlotType("SvBrowserView");
        }

        /**
         * @member {String} separatorString
         * @category Display
         */
        {
            const slot = this.newSlot("separatorString", "›");
            slot.setSlotType("String");
        }

        /**
         * @member {SvObservation} languageChangeObs - rebuilds crumb labels on language change
         * @category Observation
         */
        {
            const slot = this.newSlot("languageChangeObs", null);
            slot.setSlotType("SvObservation");
            slot.setAllowsNullValue(true);
        }
    }

    initPrototype () {
        this.setupCss();
    }

    setupCss () {
        SvWebDocument.shared().addStyleSheetString(`
            .SvBreadCrumbsView {
                scrollbar-width: none; /* Firefox: hide the horizontal scrollbar */
            }
            .SvBreadCrumbsView::-webkit-scrollbar {
                display: none; /* WebKit: hide the horizontal scrollbar */
            }

            .SvBreadCrumbLabel {
                font-size: 0.9em;
                color: var(--SvBreadCrumbs-color, rgba(255, 255, 255, 0.5));
                transition: color 0.15s;
                cursor: pointer;
                white-space: nowrap;
                animation: SvBreadCrumbFadeIn 0.3s ease-in-out;
            }

            .SvBreadCrumbLabel:hover {
                color: var(--SvBreadCrumbs-current-color, rgba(255, 255, 255, 0.85));
            }

            .SvBreadCrumbLabel.current {
                color: var(--SvBreadCrumbs-current-color, rgba(255, 255, 255, 0.85));
                cursor: default;
            }

            @keyframes SvBreadCrumbFadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }

            .SvBreadCrumbSeparator {
                font-size: 0.9em;
                color: var(--SvBreadCrumbs-separator-color, rgba(255, 255, 255, 0.3));
                padding: 0 0.5em;
                white-space: nowrap;
                /* the "›" glyph sits low in its line box; flex centering aligns the
                   box, not the glyph, so nudge it up to the optical center */
                transform: translateY(-0.08em);
            }
        `);
    }

    init () {
        super.init();
        this.setElementClassName("SvBreadCrumbsView");
        this.setDisplay("flex");
        this.setFlexDirection("row");
        this.setAlignItems("center");
        this.setFlexGrow(0);
        this.setFlexShrink(0);
        this.setWidth("100%");
        this.setMinHeight("55px");
        this.setPaddingLeft("1em");
        this.setPaddingRight("1em");
        this.setBorderBottom("1px solid var(--SvBreadCrumbs-border-color, #333)");
        // Scroll horizontally when the path is wider than the bar (e.g. a deep
        // path in a narrow companion panel) rather than squishing each crumb
        // into an unreadable fragment. The scrollbar is hidden via CSS; the bar
        // auto-scrolls to the current (last) crumb in setupPathViews.
        this.setCssProperty("overflow-x", "auto");
        this.setCssProperty("overflow-y", "hidden");
        this.setWhiteSpace("nowrap");
        this.turnOffUserSelect();

        this.setAriaRole("navigation");
        this.setAriaLabel("Breadcrumb");

        this.setLanguageChangeObs(SvNotificationCenter.shared().newObservation().setName("svI18nLanguageChanged").setObserver(this).startWatching());

        return this;
    }

    /**
     * @description Handles the i18n language change notification — rebuilds crumb labels.
     * @category Event Handling
     */
    svI18nLanguageChanged (/*aNote*/) {
        this.scheduleMethod("setupPathViews");
        return this;
    }

    /**
     * @description Called by the browser when its navigation path changes.
     * @returns {SvBreadCrumbsView} The current instance.
     * @category Synchronization
     */
    didChangeBrowserPath () {
        this.scheduleMethod("setupPathViews");
        return this;
    }

    /**
     * @description The selected node path of this bar's browser, beginning
     * with the browser's root node.
     * @returns {Array} The path nodes.
     * @category Data
     */
    pathNodes () {
        const browser = this.browserView();
        if (browser && browser.stackView() && browser.stackView().node()) {
            return browser.stackView().selectedNodePathArray();
        }
        return [];
    }

    /**
     * @description Rebuilds the crumb segment views from the current path.
     * @returns {SvBreadCrumbsView} The current instance.
     * @category View Creation
     */
    setupPathViews () {
        this.removeAllSubviews();

        const pathNodes = this.pathNodes();

        let isFirst = true;
        pathNodes.forEach((node, i) => {
            const title = this.titleForNode(node);
            if (title === "") {
                return; // skip unlabeled segments (e.g. an untitled root model node)
            }
            if (!isFirst) {
                this.addSubview(this.newSeparatorView());
            }
            isFirst = false;
            this.addSubview(this.crumbViewForNode(node, i, pathNodes));
        });

        this.scheduleMethod("scrollToCurrentCrumb");
        return this;
    }

    /**
     * @description Scrolls the bar to its end so the current (last) crumb is
     * visible when the path overflows a narrow bar. No-op when everything fits.
     * @returns {SvBreadCrumbsView} The current instance.
     * @category Layout
     */
    scrollToCurrentCrumb () {
        const e = this.element();
        if (e) {
            e.scrollLeft = e.scrollWidth;
        }
        return this;
    }

    titleForNode (node) {
        let title = null;
        if (node.translatedValueOfSlotNamed) {
            title = node.translatedValueOfSlotNamed("title");
        } else if (node.title) {
            title = node.title();
        }
        return (title === null || title === undefined) ? "" : String(title);
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
        v.setFlexShrink(0); // keep full labels; the bar scrolls rather than squishing crumbs
        v.setPaddingLeft("0em");
        v.setPaddingRight("0em");
        v.titleView().setPaddingLeft("0em");
        v.titleView().setPaddingRight("0em");
        v.titleView().setOverflow("hidden");
        v.titleView().setTextOverflow("ellipsis");
        v.titleView().setElementClassName("SvBreadCrumbLabel" + (isCurrent ? " current" : ""));
        v.setTitle(this.titleForNode(node));

        if (!isCurrent) {
            // selectNodePathArray expects the path *after* the stack's own root node
            v.setInfo(pathNodes.slice(1, i + 1));
            v.setTarget(this);
            v.setAction("onClickPathComponent");
        }

        return v;
    }

    /**
     * @description Navigates the browser back to the clicked crumb's level.
     * @param {SvButtonView} crumbView The clicked crumb.
     * @returns {SvBreadCrumbsView} The current instance.
     * @category Event Handling
     */
    onClickPathComponent (crumbView) {
        const browser = this.browserView();
        if (!browser || !browser.stackView()) {
            return this;
        }
        const subpath = crumbView.info().shallowCopy();
        browser.stackView().selectNodePathArray(subpath);
        // popping to the root unselects without firing a path-change note,
        // so rebuild the crumbs explicitly
        this.scheduleMethod("setupPathViews");
        return this;
    }

    /**
     * @description Creates a separator between crumb segments.
     * @returns {SvTextView} The separator view.
     * @category View Creation
     */
    newSeparatorView () {
        const v = SvTextView.clone();
        v.setElementClassName("SvBreadCrumbSeparator");
        v.setString(this.separatorString());
        v.setFlexShrink(0); // keep separators full-size; the bar scrolls instead
        return v;
    }

}.initThisClass());
