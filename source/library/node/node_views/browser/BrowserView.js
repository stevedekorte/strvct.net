"use strict";

/*
    
    BrowserView

    A generalization of a Miller Column browser, where each level can have it's own orientation.
    For example, the top level could use a left orientation on top for horizontal menus, 
    and right orientation for subsequent level would produce left-right miller columns below the horizontal menus.
    The levels are implemented with StackViews. 

    Notes:

    We need a way to update the header and back arrow depending on the currently selected stack view navigation item.
    
*/

(class BrowserView extends HeaderFooterView {
    
    initPrototype () {

        
    }

    init () {
        super.init()
        this.setDisplay("flex")
        this.setPosition("relative")
        /*
        this.setPosition("absolute")
        this.setTopPx(0)
        this.setLeftPx(0)
        */
        this.setWidth("100%")
        this.setHeight("100%")

        this.setFlexDirection("column")
        this.setFlexWrap("nowrap")
        this.setOverflow("hidden")

        this.setHeaderClass(BrowserHeader)
        this.setMiddleClass(StackView)
        this.setupHeaderMiddleFooterViews()

        //this.headerView().setBorder("1px dashed yellow")

        const mv = this.middleView()
        mv.setPosition("relative")
        mv.setDisplay("flex")
        mv.setFlexDirection("row")
        //mv.setBorder("1px dashed blue")       
        mv.setWidth("100%")
        mv.setHeight("100%")

        //this.setIsRegisteredForDocumentResize(true)

        /*
        // default header is a absolute positioned top bar to ensure that the 
        // column group bars appear to be continued all the way across the BrowserView
        const dh = DomView.clone().setDivClassName("BrowserDefaultHeader")
        this.setDefaultHeader(dh)
        this.middleView().addSubview(dh)
        */

        //this.addGestureRecognizer(LeftEdgePanGestureRecognizer.clone()) 
        //this.addGestureRecognizer(RightEdgePanGestureRecognizer.clone()) 

        return this
    }

    setNode (aNode) {
        super.setNode(aNode)
        this.stackView().setNode(aNode)
        return this
    }


    stackView () {
        return this.middleView()
    }

    syncFromNode () {

    }

}.initThisClass());
