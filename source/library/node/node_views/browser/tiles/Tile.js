"use strict";

/*
    
    Tile

    Base tile view. This is a sort of empty canvas for subclasses to put subviews in.
    It's important that subviews are put within the contentView, as this is used
    to support features like slide to delete.

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
    
    initPrototype () {
        this.newSlot("isSelectable", true) //.setDuplicateOp("copyValue")
        this.newSlot("closeButtonView", null)
        this.newSlot("defaultHeight", 30)
        this.newSlot("restCloseButtonOpacity", 0.4)
        this.newSlot("transitionStyle", "all 0.2s ease, width 0s, max-width 0s, min-width 0s")
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

    setDisplay (v) {
        if (v === "block") {
            console.log(this.typeId() + " setDisplay " + v)
        }
        return super.setDisplay(v)
    }

    init () {
        super.init()
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
        this.setTransition("all 0s, top 0.3s, background-color .3s ease-out")
        this.setOverflow("hidden")
        this.setWhiteSpace("nowrap")
        
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
        this.setIsDebugging(true)
        return this
    }

    setNode (aNode) {
        super.setNode(aNode)
        return this
    }

    duplicate () {
        const dup = super.duplicate()
        dup.setNode(this.node().duplicate())
        return dup
    }

    // bottom edge pan 

    acceptsBottomEdgePan () {
        if (this.node().nodeCanEditTileHeight) {
            if (this.node().nodeCanEditTileHeight()) {
                return true
            }
        }
        return false
    }

    onBottomEdgePanBegin (aGesture) {
        this._beforeEdgePanBorderBottom = this.borderBottom()
        this.setBorderBottom("1px dashed red")
        this.setTransition("min-height 0s, max-height 0s")
    }

    onBottomEdgePanMove (aGesture) {
        const p = aGesture.currentPosition() // position in document coords
        const f = this.frameInDocument()
        const newHeight = p.y() - f.y()
        const minHeight = this.node() ? this.node().nodeMinTileHeight() : 10;
        if (newHeight < 10) {
            newHeight = 10;
        }
        this.node().setNodeMinTileHeight(newHeight)
        this.updateSubviews()

        /*
            this.node().setNodeMinTileHeight(h)
            this.updateSubviews()
            //this.setMinAndMaxHeight(newHeight) // what about contentView?
            //this.contentView().autoFitParentHeight()
        */

        return this
    }

    onBottomEdgePanComplete (aGesture) {
        this.setBorderBottom(this._beforeEdgePanBorderBottom)
    }

    // -- contentView -- 
    // a special subview within the Tile for it's content
    // we route style methods to it

    setupTileContentView () {
        //const cv = DomView.clone().setDivClassName("TileContentView")
        const cv = DomFlexView.clone().setDivClassName("TileContentView")
        cv.setDisplay("flex")
        cv.setHeight("auto")
        cv.setMinHeightPx(60)
        cv.setWidthPercentage(100)
        cv.setHeightPercentage(100) 
        cv.setPosition("relative")
        cv.setFloat("left")

        //cv.autoFitParentWidth().autoFitParentHeight() // can't do this since we need to float left for sliding

        cv.setTransition("all 0.2s ease, transform 0s, left 0s, right 0s, width 0s, min-width 0s, max-width 0s")
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

    // ----

    setBackgroundColor (s) {
        this.contentView().setBackgroundColor(s)
        return this
    }

    setColor (s) {
        this.contentView().setColor(s)
        return this
    }

    setOpacity (v) {
        this.contentView().setOpacity(v)
        return this
    }

    // --- helpers --------
    
    browser () {
        return this.column().browser()
    }

    column () {
        return this.parentView()
    }
    
    stackNavView () {
        return this.column().stackNavView()
    }

    // node style dict
    
    tileStyles () {
        return null
    }

    didUpdateSlotParentView (oldValue, newValue) {
        super.didUpdateSlotParentView(oldValue, newValue)
        //this.scheduleMethod("applyStyles")
        this.applyStyles()
        return this
    }

    lookedUpStyles () {
        const debugStyles = false

        if (this.node()) {
            const ns = this.node().nodeTileStyles()
            if (ns) {
                if (debugStyles) {
                    this.debugLog(" using nodeTileStyles")
                }
                return ns
            }
        }

        const rs = this.tileStyles()
        if (rs) {
            if (debugStyles) {
                this.debugLog(" using tileStyles")
            }
            return rs
        }

        if (this.column() && this.column().tileStyles) {
            const cs = this.column().tileStyles()
            if (cs) {
                if (debugStyles) {
                    this.debugLog(" using column().tileStyles()")
                }
                return cs
            }
        } else if (debugStyles) {
            const title = this.node() ? this.node().title() : "no node yet"
            this.debugLog(" (" + title + ") has no column yet")
        }

        return BMViewStyles.shared().sharedWhiteOnBlackStyle()
    }

    /*
    currentTileStyle () {
        const styles = this.node().nodeTileStyles()
        //styles.selected().set
        
        if (this.isSelected()) {
        	return styles.selected()
 		}
        
        return styles.unselected()
    }
    */

    didUpdateSlotIsInspecting (oldValue, newValue) {
        //super.didUpdateSlotIsSelected (oldValue, newValue)
        this.itemSetView().didChangeNavSelection()
        //this.updateSubviews()
    }

   didUpdateSlotIsSelected (oldValue, newValue) {
        super.didUpdateSlotIsSelected (oldValue, newValue)

        if (this.isSelected()) {
            this.setLastSelectionDate(Date.clone())
        } else {
            this.setShouldShowFlash(true)
            this.setLastSelectionDate(null)
        }

        this.itemSetView().didChangeNavSelection()
        this.updateSubviews()
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
        
        this.applyStyles()

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

    itemSetView () {
        return this.parentView()
    }

    stackView () {
        const scrollView = this.itemSetView().parentView()
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
        this.setMinAndMaxHeight(null)
        //this.setBoxShadow("inset -10px 0 20px rgba(0, 0, 0, 0.05)")
    }

    makeOrientationDown () { 
        //this.debugLog("makeOrientationDown")

        this.setDisplay("inline-block")
        //this.setWidth("fit-content")
        //this.setWidth("170px")
        this.setWidth(null)
        this.setMinAndMaxWidth(170)
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

    // --- styles ---
    
    styles () { 
        const lookedUpStyles = this.lookedUpStyles()
        if (lookedUpStyles) {
            return lookedUpStyles
        } else {
            this.lookedUpStyles() // for debugging
        }
        throw new Error("missing styles")
    }

    applyStyles () {
        super.applyStyles()

        // flash
        
        /*
        if (this.shouldShowFlash() && this.selectedFlashColor()) {
            this.setBackgroundColor(this.selectedFlashColor())
            this.setTransition("background-color 0.3s")
            //this.addTimeout(() => { this.setBackgroundColor(this.currentBgColor()) }, 100)
            this.addTimeout(() => { super.applyStyles() }, 100)
            this.setShouldShowFlash(false)
        }
        */
        
        return this
    }
    
    
    // close button
    
    addCloseButton () {
        if (this.closeButtonView() === null) {

            const cb = DomView.clone().setDivClassName("TileCloseButton")
            cb.setCssDict({
                "display": "block",
                "right": "20px",
                "top": "16px",
                
                "min-width": "20px",
                "max-width": "20px",
                "min-height": "20px",
                "max-height": "20px",
                
                "font-size": "2em",
                "line-height": "2em",
                "font-weight": "normal",
                "white-space": "nowrap",
                "border": "0px dashed yellow",
                "color": "rgba(255, 255, 255, 0.5)",
                "margin": "0px",
                "padding": "0px",
                "padding-bottom": "10px",
            })

            cb.setPosition("absolute")
            this.setCloseButtonView(cb)
            this.contentView().addSubview(cb) 
            
            cb.setBackgroundImageUrlPath(this.pathForIconName("close-white"))
            cb.makeBackgroundContain()
            cb.makeBackgroundCentered()
            cb.makeBackgroundNoRepeat()  
            
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
    
    passFirstResponderToColumn () {
        if (this.isFirstResponder()) {
            if (this.column()) {
                this.column().becomeFirstResponder()
            }
        }
        return this
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
    
    canDelete () {
        if (this.node()) {
            return this.node().canDelete()
        }
        return false
    }

    // --- tap gesture -------- 

    acceptsTapBegin (aGesture) {
        return true
    }

    debugTypeId () {
        const comment = " '" + (this.node() ? this.node().title() : "untitled node") + "'"
        return super.debugTypeId() + comment
    }

    onTapComplete (aGesture) {
        //console.log(this.debugTypeId() + " onTapComplete")
        this.setLastTapDate(new Date())
        const keyModifiers = BMKeyboard.shared().modifierNamesForEvent(aGesture.upEvent());
        ///const hasThreeFingersDown = aGesture.numberOfFingersDown() === 3;
        //const isAltTap = keyModifiers.contains("Alternate");
    
        //if (keyModifiers.length) {
            // TODO: abstract this to DomView or GestureRecognizer?
            const methodName = "just" + keyModifiers.join("") + "Tap"
            //this.debugLog(" tap method " + methodName)
            if (this[methodName]) {
                this[methodName].apply(this)
                return this
            }
        //} 
        
        /*
        if (hasThreeFingersDown || isAltTap) {
            this.justInspect()
        } else {
            this.setIsInspecting(false)
            this.justTap()
        }
        */

        return this
    }

    // -- just taps ---

    justTap () {
        this.setIsInspecting(false)
        this.column().didTapItem(this)

        //console.log(this.debugTypeId() + " justTap")
        if (this.isSelectable()) {
            //this.select()

            const node = this.node()
            if (node) {
                node.onTapOfNode()
                node.onRequestSelectionOfNode(this)
            }

            if (this.isFocused() && node.nodeUrlLink) {
                // TODO: move to specialized view (something like UrlLinkTile?) 
                if (!BMKeyboard.shared().hasKeysDown()) {
                    const url = node.nodeUrlLink()
                    window.open(url, "_blank")
                }
            }
        }
    }

    justShiftTap () {
        this.setIsInspecting(false)
        this.column().didShiftTapItem(this)
    }

    justAlternateTap () {
        this.debugLog(".justInspect()")
        if (this.node().nodeCanInspect()) { 
            this.setIsInspecting(true) // will call didUpdateSlotIsInspecting and update nav
            this.column().didTapItem(this)
        }
    }

    justMetaTap () {
        this.setIsInspecting(false)
        this.toggleSelection()
    }

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

    // --- keyboard controls ---

   onEnterKeyUp () {
        //this.debugLog(this.type() + " for " + this.node().title() + " onEnterKeyUp")
        this.justTap()
        return false // stop propogation
    }

    onShiftBackspaceKeyUp (event) {
        this.debugLog(this.type() + " for " + this.node().title() + " onBackspaceKeyUp")
        this.delete()
        return false // stop propogation
    }

    // --- dragging key ---

    onMeta_a_KeyDown (event) {
        // only select subnodes if this tile can have them,
        // otherwise, like the column handle this event
        const c = this.column().nextColumn()
        if (c) {
            c.selectAllTiles()
        }
        event.stopPropagation()
        return false 
    }

    on_d_KeyDown (event) {
        this.debugLog(" on_d_KeyDown ", event._id)
        this.setIsRegisteredForBrowserDrag(true)
        return true
    }

    on_d_KeyUp (event) {
        this.debugLog(" on_d_KeyUp ", event._id)
        this.setIsRegisteredForBrowserDrag(false)
        return true
    }
    
    decendantReleasedFocus (aView) {
        this.focus()
        return true
    }

    /*
    onEscapeKeyDown (event) {
        console.log(" onEscapeKeyDown ", event._id)
        this.column().onLeftArrowKeyUp()
        return true
    }
    */

    // -- slide gesture ---

    acceptsSlide () {
        return this.canDelete()
    }

    onSlideBegin () {
        //this.debugLog(".onSlideBegin()")
        this.setSlideDeleteOffset(this.clientWidth() * 0.5);
        this.contentView().setTransition("all 0s") 
        this.setupSlide() 
        return this
    }

    underContentViewColor () {
        return "black"
    }

    setupSlide () {
        if (!this.dragDeleteButtonView()) {
            const h = this.clientHeight()

            // need to do this because we re-route setBackgroundColor
            this.element().style.backgroundColor = this.underContentViewColor()
            const cb = CloseButton.clone().setOpacity(0).setTransition("opacity 0.1s").setPosition("absolute")
            this.addSubview(cb)
            //cb.setBorder("1px dashed white")

            const size = 10
            cb.setMinAndMaxWidthAndHeight(size)
            cb.verticallyAlignAbsoluteNow()
            cb.setRightPx(size * 2)
            cb.setZIndex(0)
            this.setDragDeleteButtonView(cb)
        }
        return this
    }

    cleanupSlide () {
        if (this.dragDeleteButtonView()) {
            this.dragDeleteButtonView().removeFromParentView()
            this.setDragDeleteButtonView(null)
        }
        this.setTouchRight(null)
    }
	
    onSlideMove (slideGesture) {
        const d = slideGesture.distance()
        const isReadyToDelete = d >= this._slideDeleteOffset

        this.setTouchRight(d)

        if (this._dragDeleteButtonView) {
            this._dragDeleteButtonView.setOpacity(isReadyToDelete ? 1 : 0.2)
        }
    }

    setTouchRight (v) {
        //this.setTransform("translateX(" + (v) + "px)");
        //this.setLeftPx(-v)
        //this.setRightPx(v)
        this.contentView().setRightPx(v)
    }
	
    onSlideComplete (slideGesture) {
        //console.log(">>> " + this.type() + " onSlideComplete")
        const d = slideGesture.distance()
        const isReadyToDelete  = d >= this._slideDeleteOffset

        if (isReadyToDelete) {
            this.finishSlideAndDelete()
        } else {
            this.slideBack()
        }
    }

    onSlideCancelled (aGesture) {
        this.slideBack()
    }

    finishSlideAndDelete () {
        this.setIsDeleting(true)
        const dt = 0.08 // seconds
        this.contentView().setTransition("right " + dt + "s")
        this.setTransition(this.transitionStyle())
        //this.contentView().animationListener().setDelegate(this).setMethodSuffix().setIsListening(true)

        this.addTimeout(() => {
            this.setTouchRight(this.clientWidth())
            this.addTimeout(() => {
                this.cleanupSlide()
                this.delete()
            }, dt * 1000)
        }, 0)
    }

    /*
    onAnimationStart (event) {
        console.log(this.debugTypeId() + " onAnimationStart")
    }

    onAnimationEnd (event) {
        console.log(this.debugTypeId() + " onAnimationEnd")
        this.contentView().animationListener().setIsListening(false)
    }
    */

    slideBack () {
        //this.disableColumnUntilTimeout(400)

        this.contentView().setTransition("all 0.2s ease")

        this.addTimeout(() => {
            this.setTouchRight(0)
            this.contentView().setTransition(this.transitionStyle())
        })

        this.addTimeout(() => {
            this.didCompleteSlide()
        }, 300)
    }

    /*
    disableColumnUntilTimeout (ms) {
        //this.column().columnGroup().disablePointerEventsUntilTimeout(ms)
        //this.setPointerEvents("none")
    }
    */

    didCompleteSlide () {
        this.cleanupSlide()
    }
    
    hasCloseButton () {
        return this.closeButtonView() && this.closeButtonView().target() != null
    }

    // --- tap hold ---
    // TODO: move to GestureRecognizer or DomView?

    acceptsLongPress () {
        if (!this.column()) {
            console.log("missing parent view on: " + this.typeId())
        }

        if (this.column()) {
            return this.column().canReorderTiles()
        }
        return false
    }
    
    onLongPressBegin (aGesture) {
        if (this.isRegisteredForBrowserDrag()) {
            aGesture.cancel() // don't allow in-browser drag when we're doing a drag outside
        }
    }

    onLongPressCancelled (aGesture) {
    }

    isTapLongPress () {
        // ok, now we need to figure out if this is a tap-hold or tap-tap-hold
        const maxDt = 0.7 // between tap time + long tap hold time before complete is triggered
        let isTapTapHold = false
        const t1 = this.lastTapDate()
        const t2 = new Date()
        if (t1) {
            const dtSeconds = (t2.getTime() - t1.getTime())/1000
            //console.log("dtSeconds = " + dtSeconds)
            
            if (dtSeconds < maxDt) {
                isTapTapHold = true
            }
        }
        return isTapTapHold
    }

    onLongPressComplete (longPressGesture) {
        longPressGesture.deactivate() // needed?

        const isTapLongPress = this.isTapLongPress() // is tap-hold

        if (!this.isSelected()) {
            this.column().unselectAllTilesExcept(this)
        }

        this.select()
        const dv = DragView.clone().setItems(this.column().selectedTiles()).setSource(this.column())

        if (isTapLongPress) {
            dv.setDragOperation("copy")
        } else { // otherwise, it's just a normal long press
            dv.setDragOperation("move")
        }
        
        dv.openWithEvent(longPressGesture.currentEvent())
    }

    // --- handle pan gesture ---

    acceptsPan () {
        return this._isReordering
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

    /*
    show () {
        const d = this.getComputedCssAttribute("display")
        const p = this.getComputedCssAttribute("position")
        console.log("row display:" + d + " position:" + p)
    }
    */

    // --- dragging source protocol ---

    hideForDrag () {
        //this.setVisibility("hidden")
        this.hideDisplay()
    }

    unhideForDrag () {
        //this.setVisibility("visible")
        this.unhideDisplay()
    }

    /*
    onDragItemBegin (aDragView) {
    }

    onDragItemCancelled (aDragView) {
    }

    onDragItemDropped (aDragView) {
    }
    */

    onDragRequestRemove () {
        //assert(this.hasParentView()) //
        if (this.hasParentView()) {
            this.removeFromParentView()
        }
        assert(!this.hasParentView()) //

        this.node().removeFromParentNode()
        assert(!this.node().parentNode())

        //this.delete() // we don't want to delete it, we want to move it
        return true
    }

    // --- dropping destination protocol implemented to handle selecting/expanding tile ---

    acceptsDropHover (dragView) {
        return this.canDropSelect() || this.acceptsDropHoverComplete(dragView)
    }

    onDragDestinationEnter (dragView) {
        if (this.canDropSelect()) {
            this.setupDropHoverTimeout()
        }
    }

    onDragDestinationHover (dragView) {
        //console.log(this.typeId() + " onDragDestinationHover")
    }

    onDragDestinationExit (dragView) {
        this.cancelDropHoverTimeout()
        //this.unselect()
        //this.column().unselectAllTilesExcept(anItem)
    }

    // --- dropping on tile - usefull for LinkNode? ---

    acceptsDropHoverComplete (dragView) {
        const node = this.node()
        if (node && node.nodeAcceptsDrop) {
            return node.nodeAcceptsDrop(dragView.item().node())
        }
    }

    onDragDestinationDropped (dragView) {
        console.log(this.typeId() + " onDragDestinationDropped")

        const itemNode = dragView.item().node()

        const node = this.node()
        if (itemNode && node && node.nodeDropped) {
            return node.nodeDropped(itemNode)
        }
    }

    dropCompleteDocumentFrame () {
        return this.frameInDocument()
    }

    // ----

    dropHoverDidTimeoutSeconds () {
        return 0.3
    }

    canDropSelect () {
        // only want to prevent this for non-navigation nodes
        return true
        //return this.node().hasSubnodes() || this.node().nodeCanReorderSubnodes()
    }

    // -----------------

    dropHoverEnterTimeoutName () {
        return "dropHoverEnter"
    }

    setupDropHoverTimeout () {
        const ms = this.dropHoverDidTimeoutSeconds() * 1000
        this.addTimeout(() => this.dropHoverDidTimeout(), ms, this.dropHoverEnterTimeoutName())
    }

    cancelDropHoverTimeout () {
        this.clearTimeoutNamed(this.dropHoverEnterTimeoutName())
        return this
    }

    dropHoverDidTimeout () {
        this.justTap()
    }

    // Browser style drag

    onBrowserDragStart (event) {  
        let dKey = BMKeyboard.shared().keyForName("d")
        if (!dKey.isDown()) {
            return false
        }

        const node = this.node()
        if (node && node.getBMDataUrl) {
            const bdd = node.getBMDataUrl()
            if (bdd) {
                event.dataTransfer.setData(bdd.transferMimeType(), bdd.dataUrlString())
                return true;
            }
        }

        return false;
    }

    // focus

    onFocusIn () {
        return super.onFocusIn()
    }

}.initThisClass());
