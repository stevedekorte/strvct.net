"use strict";

/**
 * @module library.view.dom.DomView.subclasses
 */

/**
 * @class PanelView
 * @extends DomView
 * @classdesc PanelView is a customizable panel component with a title, subtitle, and a button.
 */
(class PanelView extends DomView {

    /**
     * Initialize prototype slots for the PanelView.
     * @private
     */
    initPrototypeSlots () {
        /**
         * @member {SvTextView} titleView - The title view of the panel.
         * @category UI Components
         */
        {
            const slot = this.newSlot("titleView", null);
            slot.setSlotType("SvTextView");
        }
        /**
         * @member {SvTextView} subtitleView - The subtitle view of the panel.
         * @category UI Components
         */
        {
            const slot = this.newSlot("subtitleView", null);
            slot.setSlotType("SvTextView");
        }
        /**
         * @member {ButtonView} button1 - The primary button of the panel.
         * @category UI Components
         */
        {
            const slot = this.newSlot("button1", null);
            slot.setSlotType("ButtonView");
        }
        /**
         * @member {Boolean} isDragging - Indicates if the panel is currently being dragged.
         * @category State
         */
        {
            const slot = this.newSlot("isDragging", false);
            slot.setSlotType("Boolean");
        }

        {
            const slot = this.newSlot("isModal", false);
            slot.setSlotType("Boolean");
        }

        {
            const slot = this.newSlot("isOpen", false);
            slot.setSlotType("Boolean");
        }
    }

    /**
     * Set CSS properties on a subview.
     * @param {DomView} view - The subview to apply CSS to.
     * @returns {PanelView} - Returns this for chaining.
     * @category Styling
     */
    setCssOnSubview (view) {
        //view.setPadding("10px");
        //view.setBorder("1px solid #ddd");
        view.setMarginBottom("5px");
        view.setPaddingLeft("1em");
        view.setPaddingRight("1em");
        view.setWidth("fit-content");
        view.setHeight("fit-content");
        view.setInset(null);
        return this;
    }

    /**
     * Initialize the PanelView.
     * @returns {PanelView} - Returns this for chaining.
     * @category Initialization
     */
    init () {
        super.init();
        this.setDisplay("flex");
        this.setPosition("absolute");

        this.setAlignItems("center");
        this.setJustifyContent("center");
        this.setTop("0%");
        this.setLeft("50%");
        this.setTransform("translate(-50%, -50%)");
        this.setFlexDirection("column");
        //this.setMinAndMaxHeight("fit-content");
        this.setWidth("fit-content");
        this.setHeight("fit-content");
        this.setZIndex(1000);

        {
            // title view
            const view = SvTextView.clone().setElementClassName("PanelTitleView");
            this.setTitleView(view);
            this.addSubview(view);
            view.setTextAlign("center");
            view.setHeight("3em");
            view.setWhiteSpace("normal");
            view.centerInParentView();
            view.setValue("");
            view.setColor("white");
            this.setCssOnSubview(view);
        }

        //this.setSubtitleView(SvTextView.clone().setElementClassName("PanelSubtitleView"))
        //this.addSubview(this.subtitleView())

        {
            // button 1
            const view = ButtonView.clone();
            this.setButton1(view);
            this.addSubview(view);
            //view.setPosition("absolute").setRightPx(10).setBottomPx(10);
            //view.setMinAndMaxWidth(100);
            view.setTitle("OK");
            view.setTarget(this).setAction("hitButton1");
            view.setBorder("1px solid rgba(255,255,255,0.5)");
            view.setPaddingTop("0em");
            view.setPaddingBottom("0em");

            this.setCssOnSubview(view);
        }

        return this;
    }

    /**
     * Set the title of the panel.
     * @param {string} s - The title text.
     * @returns {PanelView} - Returns this for chaining.
     * @category UI Manipulation
     */
    setTitle (s) {
        this.titleView().setValue(s);
        return this;
    }

    /**
     * Open the panel in the main window.
     * @returns {PanelView} - Returns this for chaining.
     * @category Lifecycle
     */
    openInWindow () {
        SvApp.shared().userInterface().mainWindow().documentBody().addSubview(this);
        return this;
    }

    /**
     * Show an error panel.
     * @static
     * @param {Error} error - The error object to display.
     * @returns {PanelView} - The created error panel.
     * @category Error Handling
     */
    static showError (error) {
        const panel = PanelView.clone().setTitle(error.message);
        //.setMinAndMaxWidth(300).setMinAndMaxHeight(200);
        panel.centerInParentView();
        panel.setTopPx(0);
        panel.setBackgroundColor("red");
        panel.setColor("white");
        panel.openInWindow();
        return panel;
    }

    /*
    // --- dragging ---

    setupForDraggingWithMouse () {
        this.setIsRegisteredForMouse(true)
    }

    mouseMoveTracker (event) {
        //console.log("mouse pos: ", event.clientX, " x ", event.clientY)
        if (this.isDragging()) {
            this.setLeftPx(event.clientX - (this._startClientX - this._startLeft))
            this.setTopPx(event.clientY  - (this._startClientY - this._startTop))
        }
    }

    onMouseDown (event) {
        //console.log("onMouseDown")
        this.setIsDragging(true)

        this.parentView().element().addEventListener("mousemove", this._mouseMoveTrackerFunc, false);

        this._startLeft = this.left()
        this._startTop = this.top()
        this._startClientX = event.clientX
        this._startClientY = event.clientY
    }

    onMouseMove (event) {
    }

    onMouseUp (event) {
        this.setIsDragging(false)
        //this.setBackgroundColor(this.normalColor())
        this.parentView().element().removeEventListener("mousemove", this._mouseMoveTrackerFunc, false);
    }
    */

    /**
     * Handle the click event of the primary button.
     * @returns {PanelView} - Returns this for chaining.
     * @category Event Handling
     */
    hitButton1 () {
        this.close();
        return this;
    }

    /**
     * Close the panel by removing it from its parent view.
     * @returns {PanelView} - Returns this for chaining.
     * @category Lifecycle
     */
    close () {
        this.removeFromParentView();
        return this;
    }

}.initThisClass());
