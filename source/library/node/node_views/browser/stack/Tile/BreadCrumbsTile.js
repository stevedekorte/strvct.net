/**
 * @module browser.stack.Tile
 */

"use strict";

/**
 * @class BreadCrumbsTile
 * @extends Tile
 * @classdesc View for a typical bread crumbs path e.g.: a / b / c / d
 * Supports compacting path to fit in view size (using back arrow) as needed.
 * Registers for onStackViewPathChange notifications (sent by top StackView) to auto update path.
 * TODO: register *only* for our own top stack view.
 */
(class BreadCrumbsTile extends Tile { 
    
    initPrototypeSlots () {
        /**
         * @member {String} path
         * @category Data
         */
        {
            const slot = this.newSlot("path", null);
            slot.setSlotType("String");
        }

        /**
         * @member {String} separatorString
         * @category Display
         */
        {
            const slot = this.newSlot("separatorString", "/");
            slot.setSlotType("String");
        }

        /**
         * @member {SvObservation} onStackViewPathChangeObs
         * @category Observation
         */
        {
            const slot = this.newSlot("onStackViewPathChangeObs", null);
            slot.setSlotType("SvObservation");
        }

        /**
         * @member {Array} crumbObservations
         * @category Observation
         */
        {
            const slot = this.newSlot("crumbObservations", null);
            slot.setSlotType("Array");
        }

        /**
         * @member {Array} previousPathNodes
         * @category Data
         */
        {
            const slot = this.newSlot("previousPathNodes", []);
            slot.setSlotType("Array");
        }
    }

    initPrototype () {
        this.setupCss();
        return this;
    }

    /**
     * @description Initializes the BreadCrumbsTile
     * @returns {BreadCrumbsTile}
     * @category Initialization
     */
    init () {
        super.init();
        this.setThemeClassName("BreadCrumbsTile");
        this.setOnStackViewPathChangeObs(SvNotificationCenter.shared().newObservation().setName("onStackViewPathChange").setObserver(this));
        this.setWidth("100%");
        this.setIsSelectable(true);
        this.setIsRegisteredForWindowResize(true);
        this.setCrumbObservations([]);
        return this;
    }

    setupCss () {
        WebDocument.shared().addStyleSheetString(`
            .BreadCrumbsTile-fadeIn {
                animation: breadcrumbFadeIn 0.3s ease-in-out forwards;
            }

            @keyframes breadcrumbFadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
        `);
    }


    /**
     * @description Makes the orientation down and sets the width to 100%
     * @returns {BreadCrumbsTile}
     * @category Layout
     */
    makeOrientationDown () {
        super.makeOrientationDown();
        this.setMinAndMaxWidth(null);
        this.setWidth("100%");
        return this;
    }

    makeOrientationRight () {
        super.makeOrientationRight();
        return this;
    }

    /**
     * @description Gets the root stack view
     * @returns {StackView|null}
     * @category View Hierarchy
     */
    rootStackView () {
        return this.parentView() ? this.parentView().stackView().rootStackView() : null;
    }

    /**
     * @description Gets the target stack view
     * @returns {StackView|null}
     * @category View Hierarchy
     */
    targetStackView () {
        const col = this.column();
        if (col) {
            const nc = col.nextColumn();
            if (nc) {
                const sv = nc.stackView();
                return sv;
            }
        }
        return null;
    }

    /**
     * @description Watches the root stack view
     * @category Observation
     */
    watchRootStackView () {
        const obs = this.onStackViewPathChangeObs();
        if (!obs.isWatching()) {
            const target = this.rootStackView();
            if (target) {
                obs.setSender(target);
                obs.startWatching();
            } else {
                obs.stopWatching();
            }
        }
    }
  
    /**
     * @description Gets the path nodes
     * @returns {Array}
     * @category Data
     */
    pathNodes () {
        if (this.targetStackView()) {
            const nodes = this.targetStackView().selectedNodePathArray();
            return nodes;
        }
        return [];
    }

    /**
     * @description Synchronizes the path to the stack
     * @category Synchronization
     */
    syncPathToStack () {
        this.scheduleMethod("setupPathViews");
    }

    /**
     * @description Sets the height of the tile
     * @param {string|number} v - The height value
     * @returns {BreadCrumbsTile}
     * @category Layout
     */
    setHeight (v) {
        if (v === "100%") {
            debugger;
        }
        return super.setHeight(v);
    }

    /**
     * @description Handles the update of the parent view slot
     * @param {*} oldValue - The old value of the slot
     * @param {*} newValue - The new value of the slot
     * @returns {BreadCrumbsTile}
     * @category Event Handling
     */
    didUpdateSlotParentView (oldValue, newValue) {
        super.didUpdateSlotParentView(oldValue, newValue);
        if (this.parentView()) {
            this.watchRootStackView();
            this.syncPathToStack();
        }
        return this;
    }

    /**
     * @description Handles the stack view path change notification
     * @param {*} aNote - The notification object
     * @category Event Handling
     */
    onStackViewPathChange (/*aNote*/) {
        this.syncPathToStack();
        const path = this.targetStackView().selectedNodePathString();
        SvApp.shared().userInterface().updateQueryParameter("path", path);
    }

    /**
     * @description Handles the click event on a path component
     * @param {*} aPathComponentView - The clicked path component view
     * @returns {BreadCrumbsTile}
     * @category Event Handling
     */
    onClickPathComponent (aPathComponentView) {
        const nodePathArray = aPathComponentView.info();
        if (nodePathArray.length === 0) {
            debugger;
        }
        console.log("select path: " + nodePathArray.map(n => n.title()).join("/"));
        const t = this.targetStackView();
        nodePathArray.shift(); 
        t.selectNodePathArray(nodePathArray);
        this.setupPathViews();
        return this;
    }

    /**
     * @description Handles the window resize event
     * @param {Event} event - The resize event
     * @returns {BreadCrumbsTile}
     * @category Event Handling
     */
    /*
    onWindowResize (event) {
        this.updateCompaction()
        return this
    }
    */

    /**
     * @description Handles the click event on the back button
     * @param {*} backButton - The back button object
     * @category Event Handling
     */
    onClickBackButton (/*backButton*/) {
        const crumb = this.previousCrumb();
        if (crumb) {
            crumb.sendActionToTarget();
        }
    }

    /**
     * @description Gets the previous crumb
     * @returns {*|null}
     * @category Data
     */
    previousCrumb () {
        const crumbs = this.crumbs().select(crumb => crumb.title() !== "/");
        if (crumbs.length > 1) {
            return crumbs[crumbs.length - 2];
        }
        return null;
    }

    /**
     * @description Gets all the crumbs
     * @returns {Array}
     * @category Data
     */
    crumbs () {
        return this.subviews().first().subviews();
    }

    /**
     * @description Gets the hidden crumbs
     * @returns {Array}
     * @category Data
     */
    hiddenCrumbs () {
        return this.crumbs().detect(sv => sv._isCrumb && sv.isDisplayHidden());
    }

    /**
     * @description Gets the last hidden crumb
     * @returns {*|null}
     * @category Data
     */
    lastHiddenCrumb () {
        return this.hiddenCrumbs().last();
    }
    
    /**
     * @description Creates a new unpadded button
     * @returns {ButtonView}
     * @category View Creation
     */
    newUnpaddedButton () {
        const v = ButtonView.clone();
        v.setDisplay("inline-block");
        v.titleView().setOverflow("visible");
        v.setHeightPercentage(100);
        v.setWidth("fit-content");
        v.setPaddingLeft("0em");
        v.setPaddingRight("0em");
        v.titleView().setPaddingLeft("0em");
        v.titleView().setPaddingRight("0em");
        return v;
    }

    /**
     * @description Creates a button for a given name
     * @param {string} aName - The name for the button
     * @returns {ButtonView}
     * @category View Creation
     */
    buttonForName (aName) {
        const v = this.newUnpaddedButton();
        v.setTitle(aName);
        v.setTarget(this);
        v.setAction("onClickPathComponent");
        v._isCrumb = true;
        return v;
    }

    /**
     * @description Creates a new back button
     * @returns {ButtonView}
     * @category View Creation
     */
    newBackButton () {
        const v = this.newUnpaddedButton();
        v.setTitle("←");
        v.titleView().setPaddingLeft("0em");
        v.titleView().setPaddingRight("0.5em");
        v.setTarget(this);
        v.setAction("onClickBackButton");
        return v;
    }

    /**
     * @description Creates a new separator view
     * @returns {ButtonView}
     * @category View Creation
     */
    newSeparatorView () {
        const v = this.newUnpaddedButton();
        v.titleView().setPaddingLeft("0.5em");
        v.titleView().setPaddingRight("0.5em");
        v.setTitle(this.separatorString());
        return v;
    }

    /**
     * @description Creates a crumb view for a given node
     * @param {*} node - The node object
     * @param {number} i - The index of the node
     * @param {Array} pathNodes - The array of path nodes
     * @returns {ButtonView}
     * @category View Creation
     */
    crumbViewForNode (node, i, pathNodes) {
        const name = node.title();
        const crumb = this.buttonForName(name);
        if (crumb.setNode) {
            crumb.setNode(node);
        }
        const crumbNodePath = pathNodes.slice(0, i+1);
        crumb.setInfo(crumbNodePath);
        return crumb;
    }

    /**
     * @description Creates new path component views
     * @returns {Array}
     * @category View Creation
     */
    newPathComponentViews () {
        const pathNodes = this.pathNodes();
        //pathNodes.shift();
        const views = pathNodes.map((node, i, pathNodes) => this.crumbViewForNode(node, i, pathNodes));
        return views;
    }

    /**
     * @description Sets up the path views
     * @returns {BreadCrumbsTile}
     * @category View Setup
     */
    setupPathViews () {
        const currentPathNodes = this.pathNodes();
        const previousPathNodes = this.previousPathNodes();
        
        // Find the common prefix length
        let commonPrefixLength = 0;
        const minLength = Math.min(currentPathNodes.length, previousPathNodes.length);
        for (let i = 0; i < minLength; i++) {
            if (currentPathNodes[i] === previousPathNodes[i]) {
                commonPrefixLength++;
            } else {
                break;
            }
        }
        
        const existingViews = this.contentView().subviews();
        
        // If we have no existing views or the path completely changed, do a full rebuild
        if (existingViews.length === 0 || commonPrefixLength === 0) {
            const views = this.newPathComponentViews();
            const separatedViews = views.joinWithFunc(() => this.newSeparatorView());
            separatedViews.unshift(this.newBackButton());
            
            this.contentView().removeAllSubviews();
            this.contentView().addSubviews(separatedViews);
            
            // Mark all views except back button for fade-in animation
            separatedViews.forEach((view, index) => {
                if (index > 0) { // Skip back button
                    this.applyFadeInAnimation(view);
                }
            });
        } else {
            // Differential update
            this.performDifferentialUpdate(currentPathNodes, previousPathNodes, commonPrefixLength);
        }
        
        this.setPreviousPathNodes(currentPathNodes.slice()); // Store a copy
        this.updateCompaction();
        this.watchPathNodes();
        return this;
    }

    /**
     * @description Performs differential update of path views
     * @param {Array} currentPathNodes - Current path nodes
     * @param {Array} previousPathNodes - Previous path nodes
     * @param {number} commonPrefixLength - Length of common prefix
     * @returns {BreadCrumbsTile}
     * @category View Setup
     */
    performDifferentialUpdate (currentPathNodes, previousPathNodes, commonPrefixLength) {
        const existingViews = this.contentView().subviews();
        
        // Calculate the view index where changes start
        // Pattern: [back] [crumb] [sep] [crumb] [sep] [crumb]...
        // The back button is at index 0
        // First crumb at index 1, then alternating separators and crumbs
        
        let viewIndexOfFirstChange;
        if (commonPrefixLength === 0) {
            // Remove everything after back button
            viewIndexOfFirstChange = 1;
        } else {
            // For the nth crumb (1-indexed), its position is: 1 + (n-1)*2
            // We want to remove starting after the last common crumb
            // If the last common crumb has a separator after it, we start from that separator
            viewIndexOfFirstChange = 1 + (commonPrefixLength - 1) * 2 + 1;
        }
        
        // Remove views after the common prefix
        const viewsToRemove = existingViews.slice(viewIndexOfFirstChange);
        viewsToRemove.forEach(view => view.removeFromParentView());
        
        // Create new views for the changed portion
        const newNodes = currentPathNodes.slice(commonPrefixLength);
        const newViews = newNodes.map((node, i) => {
            const actualIndex = commonPrefixLength + i;
            return this.crumbViewForNode(node, actualIndex, currentPathNodes);
        });
        
        // Add new views with separators
        const viewsToAdd = [];
        
        // If we have new views to add
        if (newViews.length > 0) {
            // Add separator before first new view if we have common prefix
            if (commonPrefixLength > 0) {
                viewsToAdd.push(this.newSeparatorView());
            }
            
            // Add first new view
            viewsToAdd.push(newViews[0]);
            
            // Add remaining views with separators before each
            for (let i = 1; i < newViews.length; i++) {
                viewsToAdd.push(this.newSeparatorView());
                viewsToAdd.push(newViews[i]);
            }
        }
        
        // Add all new views and apply fade-in animation
        this.contentView().addSubviews(viewsToAdd);
        viewsToAdd.forEach(view => this.applyFadeInAnimation(view));
        
        return this;
    }

    /**
     * @description Applies fade-in animation to a view
     * @param {DomView} view - The view to animate
     * @returns {BreadCrumbsTile}
     * @category Animation
     */
    applyFadeInAnimation (view) {
        // Set initial opacity to 0
        view.setOpacity(0);
        
        // Add animation class after a brief delay to trigger the animation
        setTimeout(() => {
            view.addCssClass("BreadCrumbsTile-fadeIn");
            view.setOpacity(1);
        }, 10);
        
        // Remove the animation class after animation completes
        setTimeout(() => {
            view.removeCssClass("BreadCrumbsTile-fadeIn");
        }, 310); // 300ms animation + 10ms buffer
        
        return this;
    }

    /**
     * @description Calculates the width of given views
     * @param {Array} views - The array of views
     * @returns {number}
     * @category Layout
     */
    widthOfViews (views) {
        return views.sum(v => v.calcWidth());
    }

    /**
     * @description Gets the crumb views
     * @returns {Array}
     * @category Data
     */
    crumbViews () {
        return this.contentView().subviews();
    }

    /**
     * @description Calculates the sum of path widths
     * @returns {number}
     * @private
     * @category Layout
     */
    sumOfPathWidths () {
        const rightMargin = 15;
        return this.crumbViews().sum(view => { 
            const w = view.cachedSize().width();
            if (Type.isNaN(w)) { 
                debugger; 
                throw new Error("invalid width value");
            }
            return w + rightMargin;
        });
    }

    /**
     * @description Updates the compaction of the bread crumbs
     * @category Layout
     */
    updateCompaction () {
        const padding = 20;
        const maxWidth = this.frameInDocument().width();
        const views = this.crumbViews();
        views.forEach(view => view.unhideDisplay());
        views.forEach(view => view.cacheClientSize());

        let didHide = false;
        for (let i = 1; i < views.length -1; i++) {
            const view = views[i];
            const sum = this.sumOfPathWidths() + padding;
            const isSeparator = view.title() === "/";
            if (isSeparator && views[i-1].isDisplayHidden()) {
                view.hideDisplay();
            }
            if (sum > maxWidth) {
                view.hideDisplay();
                didHide = true;
            } else {
                break;
            }
        }

        if (!didHide) {
            const backButton = views.first();
            backButton.hideDisplay();
        }
    }

    /**
     * @description Gets the desired width
     * @returns {number}
     * @category Layout
     */
    desiredWidth () {
        return Number.MAX_VALUE;
    }

    /**
     * @description Handles the updated node notification
     * @param {*} aNote - The notification object
     * @category Event Handling
     */
    onUpdatedNode (/*aNote*/) {
        this.scheduleMethod("setupPathViews");
    }

    /**
     * @description Watches the path nodes
     * @returns {BreadCrumbsTile}
     * @category Observation
     */
    watchPathNodes () {
        this.unwatchPathNodes();
        this.pathNodes().forEach(node => {
            const obs = this.watchSender(node);
            this.crumbObservations().push(obs);
        });
        return this;
    }

    /**
     * @description Unwatches the path nodes
     * @returns {BreadCrumbsTile}
     * @category Observation
     */
    unwatchPathNodes () {
        this.crumbObservations().forEach(obs => {
            obs.stopWatching();
        });
        this.setCrumbObservations([]);
        return this;
    }

    /**
     * @description Overrides justTap to prevent background clicks from changing path
     * Background clicks should be ignored - only path component clicks should navigate
     * @category Event Handling
     */
    justTap () {
        // Do nothing - prevent background clicks from triggering navigation
        // Path components have their own click handlers via onClickPathComponent()
        return this;
    }

}.initThisClass());