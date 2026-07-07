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

        /**
         * @member {SvButtonView} backButtonView - "←" shown at the left edge
         * while compaction is hiding leading crumbs; navigates one level up.
         * @category Compaction
         */
        {
            const slot = this.newSlot("backButtonView", null);
            slot.setSlotType("SvButtonView");
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

            /* Crumbs whose node was already visible before the path change:
               the rebuild recreates every element, so without this the whole
               path would blink on each navigation — only genuinely NEW
               segments should fade in. */
            .SvBreadCrumbLabel.settled {
                animation: none;
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
        // A too-wide path COMPACTS (updateCompaction hides leading crumbs
        // behind a back button) rather than squishing crumbs into unreadable
        // fragments. overflow-x:auto (scrollbar hidden via CSS) remains only
        // as a fallback for a single crumb wider than the whole bar.
        this.setCssProperty("overflow-x", "auto");
        this.setCssProperty("overflow-y", "hidden");
        this.setWhiteSpace("nowrap");
        this.turnOffUserSelect();

        this.setAriaRole("navigation");
        this.setAriaLabel("Breadcrumb");

        this.setLanguageChangeObs(SvNotificationCenter.shared().newObservation().setName("svI18nLanguageChanged").setObserver(this).startWatching());

        // Re-compact when the bar itself resizes — the companion panel docks/
        // undocks and columns change width without any window resize, so a
        // window-level hook isn't enough.
        this._resizeObserver = new ResizeObserver(() => {
            this.scheduleMethod("updateCompaction");
        });
        this._resizeObserver.observe(this.element());

        return this;
    }

    prepareToRetire () {
        if (this._resizeObserver) {
            this._resizeObserver.disconnect();
            this._resizeObserver = null;
        }
        return super.prepareToRetire();
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

        // The rebuild recreates every crumb element, which would replay the
        // fade-in animation on the WHOLE path. Diff the rendered segments
        // against the previous render (by node identity) and mark the common
        // prefix "settled" so only the segments that actually changed fade in.
        const renderedNodes = pathNodes.filter((node) => this.titleForNode(node) !== "");
        const previousNodes = this._lastRenderedPathNodes || [];
        let settledCount = 0;
        while (settledCount < renderedNodes.length
            && settledCount < previousNodes.length
            && renderedNodes[settledCount] === previousNodes[settledCount]) {
            settledCount++;
        }
        this._lastRenderedPathNodes = renderedNodes;

        // Back button sits at the left edge; compaction unhides it only while
        // leading crumbs are hidden (see updateCompaction).
        this.setBackButtonView(this.newBackButton());
        this.addSubview(this.backButtonView());

        let isFirst = true;
        let renderedIndex = 0;
        pathNodes.forEach((node, i) => {
            const title = this.titleForNode(node);
            if (title === "") {
                return; // skip unlabeled segments (e.g. an untitled root model node)
            }
            if (!isFirst) {
                this.addSubview(this.newSeparatorView());
            }
            isFirst = false;
            const isSettled = (renderedIndex < settledCount);
            renderedIndex++;
            this.addSubview(this.crumbViewForNode(node, i, pathNodes, isSettled));
        });

        this.scheduleMethod("updateCompaction");
        return this;
    }

    /**
     * @description Compacts the path to fit the bar's width: hides leading
     * crumb/separator pairs (never the current crumb) until the remainder
     * fits, showing the back button while anything is hidden. Runs after
     * every rebuild and on every bar resize (ResizeObserver). When everything
     * fits, all crumbs show and the back button hides. The overflow-x:auto
     * scroll remains only as a fallback for the degenerate case of a single
     * crumb wider than the bar.
     * @returns {SvBreadCrumbsView} The current instance.
     * @category Layout
     */
    updateCompaction () {
        const e = this.element();
        const views = this.subviews();
        const back = this.backButtonView();
        if (!e || !e.isConnected || !back || views.length < 2) {
            return this;
        }

        // Start from everything visible (back included, so its width counts
        // while we decide what to hide).
        views.forEach(v => v.unhideDisplay());

        // Subview order: [back, crumb, sep, crumb, sep, …, currentCrumb].
        // Hide leading (crumb, separator) pairs left-to-right until the rest
        // fits. The current crumb (last subview) is never hidden.
        let didHide = false;
        let i = 1;
        while (e.scrollWidth > e.clientWidth && i < views.length - 1) {
            views[i].hideDisplay(); // crumb
            if (i + 1 < views.length - 1) {
                views[i + 1].hideDisplay(); // its trailing separator
            }
            didHide = true;
            i += 2;
        }

        if (!didHide) {
            back.hideDisplay();
        }

        // Fallback for a single crumb wider than the bar: keep its tail visible.
        e.scrollLeft = e.scrollWidth;
        return this;
    }

    /**
     * @description Creates the "←" back button shown while leading crumbs are
     * compacted away. Clicking navigates one level up (the crumb before the
     * current one), matching the retired SvBreadCrumbsTile behavior.
     * @returns {SvButtonView} The back button view.
     * @category View Creation
     */
    newBackButton () {
        const v = SvButtonView.clone();
        v.setDisplay("inline-block");
        v.setWidth("fit-content");
        v.setHeight("fit-content");
        v.setFlexShrink(0);
        v.setPaddingLeft("0em");
        v.setPaddingRight("0em");
        v.titleView().setPaddingLeft("0em");
        v.titleView().setPaddingRight("0.5em");
        v.titleView().setElementClassName("SvBreadCrumbLabel");
        v.setTitle("←");
        v.setTarget(this);
        v.setAction("onClickBackButton");
        return v;
    }

    /**
     * @description Navigates one level up from the current crumb.
     * @returns {SvBreadCrumbsView} The current instance.
     * @category Event Handling
     */
    onClickBackButton () {
        const browser = this.browserView();
        const pathNodes = this.pathNodes();
        if (!browser || !browser.stackView() || pathNodes.length < 2) {
            return this;
        }
        // selectNodePathArray expects the path after the stack's own root node
        browser.stackView().selectNodePathArray(pathNodes.slice(1, pathNodes.length - 1));
        this.scheduleMethod("setupPathViews");
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
     * @param {boolean} [isSettled] True when this node was already visible before the path change — suppresses the fade-in.
     * @returns {SvButtonView} The crumb view.
     * @category View Creation
     */
    crumbViewForNode (node, i, pathNodes, isSettled = false) {
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
        v.titleView().setElementClassName("SvBreadCrumbLabel" + (isCurrent ? " current" : "") + (isSettled ? " settled" : ""));
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
