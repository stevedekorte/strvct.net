"use strict";

/*
    
    Tile

    Base tile view. This is a sort of empty canvas for subclasses to put subviews in.
    It's important that subviews are put within the contentView, as this is used
    to support features like slide-to-delete.

    Tile supports tile features such as:
    
        - selection
        - applying styles to match state
        - slide-to-delete gesture
        - long-press + pan-to-reorder gesture
        - dragging
        - close/delete button on right side
    
    NOTES
    
    Tile styles lookup order:

        node -> (fallback to) -> tile -> (fallback to) -> column

    See lookedUpStyles method.

*/

(class Tile extends NodeView {
    
    initPrototypeSlots () {
        this.newSlot("isSelectable", true) //.setDuplicateOp("copyValue")
        this.newSlot("closeButtonView", null)
        this.newSlot("defaultHeight", 30)
        this.newSlot("restCloseButtonOpacity", 0.4)
        this.newSlot("transitionStyle", "all 0s")
        this.newSlot("selectedFlashColor", "#ccc")
        this.newSlot("shouldShowFlash", false)
        this.newSlot("shouldCenterCloseButton", true)

        this.newSlot("contentView", null)
    
        this.newSlot("slideDeleteOffset", 0)
        this.newSlot("dragDeleteButtonView", null)
        this.newSlot("isDeleting", false)
        this.newSlot("lastTapDate", null)
        this.newSlot("lastSelectionDate", null)
    }

    applyStyles () {
        // we default to using the current theme, but 
        // we need to give view a chance to override style
        // also, NodeView should override this method to give node a chance to override style

        const state = this.currentThemeState()
        if (state) {
            /*
            if (this.thisClass() === BreadCrumbsTile) {
                debugger;
            }
            */
            state.applyBorderStylesToView(this) // apply only border styles
            state.applyNonBorderStylesToView(this.contentView()) // apply non border styles
        }
        return this
    }

    /*
    setDisplay (v) {
        if (v === "block") {
            console.log(this.typeId() + " setDisplay " + v)
        }
        return super.setDisplay(v)
    }
    */

    init () {
        super.init()

        this.setThemeClassName("Tile")

        this.setDisplay("inline-block")
        this.setPosition("relative") // so absolute position on close button works
        //this.setFlexGrow(0)
        //this.setFlexShrink(0)
        this.makeOrientationRight()

        this.setWidth("100%")
        this.setHeight("fit-content")
        this.setWhiteSpace("no-wrap")
        //this.setHeight("auto")

        //this.setMinHeight("4em")
        //this.setColor("rbga(255, 255, 255, 0.5)")
        this.setTransition("all 0s")
        this.setOverflow("hidden")
        this.setWhiteSpace("nowrap")
        //this.setTransitionStyle("all 0.0s ease, width 0s, max-width 0s, min-width 0s")
        
        /*
        this.setBorderStyle("solid")
        this.setBorderColor("transparent")
        this.setBorderLeft("0px")
        this.setBorderRight("0px")
        this.setBorderTop("1px")
        this.setBorderBottom("1px")
        this.setTextAlign("left")
        */

        this.setWebkitOverflowScrolling("touch")

        this.turnOffUserSelect()
        this.setAcceptsFirstResponder(false)
        this.setupTileContentView()

        if (TouchScreen.shared().isSupported() || true) { // testing 
            //
        } else {
            //this.addCloseButton()
        }

        this.setTransition(this.transitionStyle())

        //this.animateOpen()
        
        this.addGestureRecognizer(LongPressGestureRecognizer.clone()) // for long press & pan reordering
        this.addGestureRecognizer(SlideGestureRecognizer.clone()) // for slide delete
        //this.addGestureRecognizer(TapGestureRecognizer.clone()) // for selection, and tap-longpress
        this.addDefaultTapGesture()
        //this.defaultTapGesture().setShouldRequestActivation(true) // test to avoid tapping button within tile and row

        //this.addGestureRecognizer(RightEdgePanGestureRecognizer.clone()) // for adjusting width?
        //this.addGestureRecognizer(BottomEdgePanGestureRecognizer.clone()) // for adjusting height?

        this.setIsRegisteredForKeyboard(true)
        this.setIsDebugging(false)
        return this
    }

    /*
    setNode (aNode) {
        super.setNode(aNode)
        return this
    }
    */

    duplicate () {
        const dup = super.duplicate()
        dup.setNode(this.node().duplicate())
        return dup
    }

    // -- contentView -- 
    // a special subview within the Tile for it's content
    // we route style methods to it

    setupTileContentView () {
        const cv = FlexDomView.clone().setElementClassName("TileContentView")
        cv.setDisplay("flex")
        cv.setHeight("auto")
        cv.setMinHeightPx(60)
        cv.setWidthPercentage(100)
        cv.setHeightPercentage(100) 
        cv.setPosition("relative")
        cv.setFloat("left")

        //cv.autoFitParentWidth().autoFitParentHeight() // can't do this since we need to float left for sliding

        //cv.setTransition("all 0.2s ease, transform 0s, left 0s, right 0s, width 0s, min-width 0s, max-width 0s")
        cv.setTransition("all 0s")
        cv.setZIndex(2) // so it will be above other views like the slide delete button 
        this.setZIndex(1)
        this.setContentView(cv)
        this.addSubview(cv)

        return this
    }

    desiredWidth () {
        return this.calcWidth()
    }

    /*
    setMinAndMaxWidth (w) {
        super.setMinAndMaxWidth(w)
        this.contentView().setMinAndMaxWidth(w)
        return this
    }

    setMinAndMaxHeight (h) {
        super.setMinAndMaxHeight(h)
        this.contentView().setMinAndMaxHeight(h)
        return this
    }
    */

    addContentSubview (aView) {
        return this.contentView().addSubview(aView)
    }

    removeContentSubview (aView) {
        return this.contentView().removeSubview(aView)
    }


    // --- helpers --------
    
    browser () {
        return this.column().browser()
    }

    column () {
        return this.parentView()
    }
    
    navView () {
        return this.column().navView()
    }

    // ----

    didUpdateSlotIsInspecting (oldValue, newValue) {
        //super.didUpdateSlotIsSelected (oldValue, newValue)
        this.tilesView().didChangeNavSelection()
        //this.updateSubviews()
    }

    didUpdateSlotIsSelected (oldValue, newValue) {
        super.didUpdateSlotIsSelected (oldValue, newValue)

        
        if (this.isSelected()) {
            this.setLastSelectionDate(Date.clone())
        } else {
            //this.setShouldShowFlash(true)
            this.setLastSelectionDate(null)
        }
        

        this.tilesView().didChangeNavSelection()
        //this.updateSubviews()
    }
    
    // update
     
    updateSubviews () {   
        if (this.closeButtonView()) {
            const node = this.node()

            if (node) {
                this.closeButtonView().setColor(this.currentColor()) // needed?
            }
			
            if (this.canDelete()) {
                this.closeButtonView().setOpacity(this.restCloseButtonOpacity())
            } else {
                this.closeButtonView().setOpacity(0)
            }

            if (node) {
                const h = node.nodeMinTileHeight()
                if (h) {
                    this.setMinAndMaxHeight(h) 
                    this.contentView().autoFitParentHeight()
                }
            }
        }

        /*
        // take up full height if node asks for it
        const node = this.node()
        if (node && node.nodeMinTileHeight()) {
            const e = this.element()
            if (node.nodeMinTileHeight() === -1) {
                this.setHeight("auto")                
                this.setPaddingBottom("calc(100% - 20px)")
            } else {
                this.setHeight(this.pxNumberToString(node.nodeMinTileHeight()))
            }
        }
        */
        
        this.scheduleMethod("applyStyles")
        //this.applyStyles()

        return this
    }
    
    // -------------
    
    onDidEdit (aView) {
        this.scheduleSyncToNode() 
        return true // stop propogation
    }
    
    // --- sync ---
	
    syncFromNode () {
        // is this ever called?
        this.updateSubviews()
        this.syncOrientation()
        return this
    }

    tilesView () {
        return this.parentView()
    }

    stackView () {
        const scrollView = this.tilesView().parentView()
        const navView = scrollView.parentView()
        const stackView = navView.parentView()
        return stackView
        //return this.firstParentViewWithAncestorClass(StackView)
    }

    syncOrientation () {
        if (!this.parentView()) {
            return this
        }

        const d = this.stackView().direction()

        if (d === "right") {
            this.makeOrientationRight()
        } else if (d === "down") {
            this.makeOrientationDown()
        }
        return this
    }

    makeOrientationRight () {  //stackview is right (other view is on the right and nav is top to bottom)
        //this.debugLog("makeOrientationRight")

        this.setDisplay("inline-block")  
        this.setWidth("100%")
        //this.setWidth("fit-content")
        //this.setHeight("fit-content")
        //this.setHeight(this.parentView().desiredHeight())
        //this.setBorderBottom("1px solid rgba(255, 255, 255, 0.3)")

        //this.setBorderRight("1px solid rgba(255, 0, 0, 1)")
        this.setMinAndMaxWidth(null) // new
        this.setMinAndMaxHeight(null)
        //this.setBoxShadow("inset -10px 0 20px rgba(0, 0, 0, 0.05)")

        /*
        if (this.contentView()) {
            this.contentView().setMinAndMaxHeight(null)
        }
        */
    }

    makeOrientationDown () { 
        //this.debugLog("makeOrientationDown")

        this.setDisplay("inline-block")
        //this.setWidth("fit-content")
        //this.setWidth("170px")
        this.setWidth(null)
        this.setMinAndMaxWidth("100%")
        //this.setMinAndMaxWHeight(null) // new
        //this.setWidth("100%") // want 100% if single item, like breadcrumb
        // otherwise, the stack view should figure out the widths using one of
        // several policy options?
        //this.setHeight("fit-content")
        //this.setHeight("100%")
        //this.setBorderRight("1px solid rgba(255, 255, 255, 0.3)")
        //this.setBoxShadow("inset -10px 0 20px rgba(0, 0, 0, 0.05)")

        
        if (this.stackView()) {
            // apply node height hint
            const node = this.stackView().node()
            if (node) {
                const h = node.nodeMinTileHeight()
                //console.log("node " + this.node().title() + " height " + h)
                if (h) {
                    this.setMinAndMaxHeight(h)
                    this.contentView().setMinAndMaxHeight(h)
                }
            }
        }
    }
    
    // close button
    
    addCloseButton () {
        if (this.closeButtonView() === null) {
            const cb = SvgIconView.clone().setIconName("close")
            cb.setStrokeColor("white")
            cb.setFillColor("white")
            this.setCloseButtonView(cb)
            this.contentView().addSubview(cb) 
            cb.setMinAndMaxWidthAndHeight(8)
            cb.setAction("delete")
            cb.setOpacity(0).setTransition(this.transitionStyle())
        }
        return this
    }
    
    removeCloseButton () {
        if (this.closeButtonView() !== null) {
            this.contentView().removeSubview(this.closeButtonView()) 
            this.setCloseButtonView(null)
        }
    }
    
    // ---

    passFirstResponderToColumn () {
        if (this.isFirstResponder()) {
            if (this.column()) {
                this.column().becomeFirstResponder()
            }
        }
        return this
    }

    // --- delete ---

    canDelete () {
        if (this.node()) {
            return this.node().canDelete()
        }
        return false
    }

    delete () {
        //console.log("delete")
        if (this.canDelete()) {
            this.removeFromParentView()
            this.node().delete()
        }
    }

    /*
	animateOpen () {
		this.setTransition(this.transitionStyle())
		this.setOpacity(0)
		this.setMinAndMaxHeight(0)
		this.addTimeout(() => {
			this.setOpacity(1)
			this.setMinAndMaxHeight(this.defaultHeight())
		}, 0)		
	},
	*/
  

    // -------------------

    /*
    unselectNextColumnTiles () {
        const c = this.column().nextColumn()
        if (c) {
            c.unselectAllTiles()
        }
        return this
    }
    */
    
    decendantReleasedFocus (aView) {
        this.focus() // this doesn't seem right 
        return true
    }

    // --- selecting ---
	
    willAcceptFirstResponder () {
        super.willAcceptFirstResponder()
	    //this.debugLog(".willAcceptFirstResponder()")
        return this
    }

    // -------------------------
    
    nodeTileLink () {
        //this.debugLog(".visibleSubnodes() isInspecting:" + this.isInspecting())
        if (this.isInspecting()) {
            return  this.node().nodeInspector()
        }

        return this.node().nodeTileLink()
    }

}.initThisClass());
