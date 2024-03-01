"use strict";

/*

    PanelView

*/

(class PanelView extends DomView { 
    
    initPrototypeSlots () {
        this.newSlot("titleView", null)
        this.newSlot("subtitleView", null)
        this.newSlot("button1", null)
        this.newSlot("isDragging", false)
    }

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

    init () {
        super.init()
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
            const view = TextField.clone().setElementClassName("PanelTitleView");
            this.setTitleView(view);
            this.addSubview(view);
            view.setTextAlign("center")
            view.setHeight("3em");
            view.setWhiteSpace("normal");
            view.centerInParentView();
            view.setValue("");
            view.setColor("white");
            this.setCssOnSubview(view);
        }

        //this.setSubtitleView(TextField.clone().setElementClassName("PanelSubtitleView"))
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

        return this
    }

    setTitle (s) {
        this.titleView().setValue(s)
        return this
    }

    openInWindow () {
        App.shared().mainWindow().documentBody().addSubview(this);
        return this
    }

    static showError (error) {
        const panel = PanelView.clone().setTitle(error.message)
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

    hitButton1 () {
        this.close()
        return this
    }

    close () {
        this.removeFromParentView()
        return this
    }
    
}.initThisClass());
