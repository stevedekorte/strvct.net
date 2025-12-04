"use strict";

/**
 * @module library.view.dom.DomView.subclasses
 */

/**
 * @class SvPanelView
 * @extends DomView
 * @classdesc SvPanelView is a customizable panel component with a title, subtitle, and a button.
 *
 * Example:
 * const panel = SvPanelView.clone().setTitle("Hello, world!").openInWindow();
 * panel.setButton1(ButtonView.clone().setTitle("OK").setTarget(this).setAction("onHitButton1"));
 * panel.setButton2(ButtonView.clone().setTitle("Cancel").setTarget(this).setAction("onHitButton2"));
 * panel.openInWindow(); // opens the panel in the main window, it will close when a button is hit
 */

(class SvPanelView extends DomView {

    /**
     * Initialize prototype slots for the SvPanelView.
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

        // buttons row view
        {
            const slot = this.newSlot("buttonsRowView", null);
            slot.setSlotType("DomView");
        }
        /**
         * @member {ButtonView} button1 - The primary button of the panel.
         * @category UI Components
         */
        {
            const slot = this.newSlot("buttons", null);
            slot.setSlotType("Array");
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

        // completion promise
        {
            const slot = this.newSlot("completionPromise", null);
            slot.setSlotType("Promise");
        }

        {
            const slot = this.newSlot("result", null);
            slot.setSlotType("Object");
        }

        /**
         * @member {SvScrimView} scrimView - The backdrop scrim view behind the panel.
         * @category UI Components
         */
        {
            const slot = this.newSlot("scrimView", null);
            slot.setSlotType("SvScrimView");
        }
    }

    /**
     * Initialize the SvPanelView.
     * @returns {SvPanelView} - Returns this for chaining.
     * @category Initialization
     */
    init () {
        super.init();
        this.setButtons([]);

        // Create scrim view
        this.setScrimView(SvScrimView.clone());

        this.setDisplay("flex");
        this.setPosition("absolute");

        this.setAlignItems("center");
        this.setJustifyContent("center");
        this.setTop("50%");
        this.setLeft("50%");
        this.setTransform("translate(-50%, -50%)");
        this.setFlexDirection("column");
        //this.setMinAndMaxHeight("fit-content");
        this.setWidth("fit-content");
        this.setMinWidth("12em");
        this.setHeight("fit-content");
        this.setBorder("1px solid rgb(68, 68, 68)");
        this.setZIndex(10000);
        this.setBackgroundColor("rgb(25, 25, 25)");

        {
            // title view
            const v = SvTextView.clone().setElementClassName("PanelTitleView");
            v.setTextAlign("center");
            v.setHeight("3em");
            //v.centerInParentView();
            v.setValue("");
            v.setColor("white");
            v.setWhiteSpace("pre-wrap");
            v.setWidth("100%");
            v.setTextAlign("left");
            v.setHeight("fit-content");
            v.setPaddingLeft("2em");
            v.setPaddingRight("2em");
            v.setPaddingTop("1.5em");
            v.setPaddingBottom("0.5em");
            v.setFontWeight("bold");
            //v.setBorder("1px solid rgb(68, 68, 68)");
            this.setTitleView(v);
            this.addSubview(v);
        }

        // subtitleView
        {
            const v = SvTextView.clone().setElementClassName("PanelSubtitleView");
            v.setTextAlign("center");
            v.setHeight("3em");
            v.setWhiteSpace("pre-wrap");
            v.setWidth("100%");
            v.setTextAlign("left");
            v.setHeight("fit-content");
            v.setPaddingLeft("2em");
            v.setPaddingRight("2em");
            v.setPaddingTop("0.5em");
            v.setPaddingBottom("1em");
            v.setFontWeight("bold");
            v.setColor("#999");
            //v.setBorder("1px solid rgb(68, 68, 68)");
            this.setSubtitleView(v);
            this.addSubview(v);
        }

        //this.setSubtitleView(SvTextView.clone().setElementClassName("PanelSubtitleView"))
        //this.addSubview(this.subtitleView())

        // buttonsRowView
        {
            const v = DomView.clone();
            v.setDisplay("flex");
            v.setFlexDirection("row");
            v.setJustifyContent("space-between");
            v.setAlignItems("flex-end");
            v.setMarginTop("1em");
            v.setWidth("100%");
            v.setHeight("2em");
            v.setBorderTop("1px solid rgb(68, 68, 68)");
            v.setPadding("0em");
            this.addSubview(v);
            this.setButtonsRowView(v);
        }

        return this;
    }

    addOption (title) {
        const button = this.addButton();
        button.setTitle(title);
        return this;
    }

    setOptionDicts (optionDicts) {
        optionDicts.forEach((optionDict) => {
            const button = this.addButton();
            button.setTitle(optionDict.label);
            button.setInfo(optionDict);
        });
        return this;
    }

    addButton () {
        const button = this.newHitButton();
        this.buttonsRowView().addSubview(button);
        if (this.buttons().length > 0) {
            button.setBorderLeft("1px solid rgb(68, 68, 68)");
        }
        this.buttons().push(button);
        return button;
    }

    newHitButton () {
        const v = ButtonView.clone();
        v.setWidth("100%");
        v.setPaddingTop("0em");
        v.setPaddingBottom("0em");
        v.setPaddingLeft("0.5em");
        v.setPaddingRight("0.5em");
        v.setColor("#999");
        v.setHeight("2em");
        v.setTarget(this);
        v.setAction("hitButton");
        // let's set it to have a drak gray background when hovered
        //v.setHoverBackgroundColor("rgba(128, 128, 128, 0.4)");
        //v.element().style.hoverBackgroundColor = "rgba(128, 128, 128, 0.4)";
        return v;
    }

    /**
     * Set the title of the panel.
     * @param {string} s - The title text.
     * @returns {SvPanelView} - Returns this for chaining.
     * @category UI Manipulation
     */
    setTitle (s) {
        this.titleView().setValue(s);
        return this;
    }

    setSubtitle (s) {
        this.subtitleView().setValue(s);
        return this;
    }

    /**
     * Open the panel in the main window.
     * @returns {SvPanelView} - Returns this for chaining.
     * @category Lifecycle
     */
    openInWindow () {
        const documentBody = SvApp.shared().userInterface().mainWindow().documentBody();

        // Show scrim first (lower z-index)
        this.scrimView().showInWindow();

        // Then add panel on top (higher z-index)
        documentBody.addSubview(this);

        return this;
    }

    prepareForOpen () {
        if (this.titleView().value().length === 0) {
            this.titleView().setDisplay("none");
        }
        if (this.subtitleView().value().length === 0) {
            this.subtitleView().setDisplay("none");
        }
        return this;
    }

    async asyncOpen () {
        assert(this.buttons().length > 0, "buttons should be set");
        assert(!this.completionPromise(), "completionPromise should not be set");
        this.setCompletionPromise(Promise.clone());
        this.openInWindow();
        return await this.completionPromise();
    }

    /**
     * Show an error panel.
     * @static
     * @param {Error} error - The error object to display.
     * @returns {SvPanelView} - The created error panel.
     * @category Error Handling
     */
    static showError (error) {
        const panel = SvPanelView.clone().setTitle(error.message);
        //.setMinAndMaxWidth(300).setMinAndMaxHeight(200);
        panel.centerInParentView();
        panel.setTopPx(0);
        panel.setBackgroundColor("red");
        panel.setColor("white");
        panel.openInWindow();
        return panel;
    }

    /**
     * Handle the click event of the primary button.
     * @returns {SvPanelView} - Returns this for chaining.
     * @category Event Handling
     */
    hitButton (aButtonView) {
        const title = aButtonView.title();
        const info = aButtonView.info();
        const result = info ? info : title;
        //console.log("hitButton: ", result);
        this.close();
        this.completionPromise().callResolveFunc(result);
        return this;
    }

    /**
     * Close the panel by removing it from its parent view.
     * @returns {SvPanelView} - Returns this for chaining.
     * @category Lifecycle
     */
    close () {
        // Hide scrim first
        this.scrimView().hide();

        // Then remove panel
        this.removeFromParentView();

        return this;
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

    static async asyncTestPanel () {
        //const panel = SvPanelView.clone().setTitle("Delete").setSubtitle("Delete this session?").setOptionDicts([
        const panel = SvPanelView.clone().setSubtitle("Restart 'The Eternal Arena' session?").setOptionDicts([
            //{ label: "Maybe", value: 0 },
            //{ label: "Not Sure", value: 1 },
            { label: "Cancel", value: 2 },
            { label: "Delete Session", value: 3 }
        ]);

        const result = await panel.asyncOpen();
        await SvPanelView.clone().setTitle("Got result").setSubtitle(JSON.stringify(result, null, 2)).addOption("OK").asyncOpen();
    }

}.initThisClass());
