"use strict";

/**
 * @module library.node.node_views.browser.stack.Tile
 * @class Tile
 * @extends NodeView
 * @classdesc Base tile view. This is a sort of empty canvas for subclasses to put subviews in.
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
        {
            /**
             * @member {boolean} isSelectable
             * @description Indicates if the tile is selectable.
             */
            const slot = this.newSlot("isSelectable", true);
            slot.setSlotType("Boolean");
        }
        {
            /**
             * @member {DomView} closeButtonView
             * @description The close button view.
             */
            const slot = this.newSlot("closeButtonView", null);
            slot.setSlotType("DomView");
        }
        {
            /**
             * @member {number} defaultHeight
             * @description The default height of the tile.
             */
            const slot = this.newSlot("defaultHeight", 30);
            slot.setSlotType("Number");
        }
        {
            /**
             * @member {number} restCloseButtonOpacity
             * @description The rest close button opacity.
             */
            const slot = this.newSlot("restCloseButtonOpacity", 0.4);
            slot.setSlotType("Number");
        }
        {
            /**
             * @member {string} transitionStyle
             * @description The transition style.
             */
            const slot = this.newSlot("transitionStyle", "all 0s");
            slot.setSlotType("String");
        }
        {
            /**
             * @member {string} selectedFlashColor
             * @description The selected flash color.
             */
            const slot = this.newSlot("selectedFlashColor", "#ccc");
            slot.setSlotType("String");
        }
        {
            /**
             * @member {boolean} shouldShowFlash
             * @description Indicates if the flash should be shown.
             */
            const slot = this.newSlot("shouldShowFlash", false);
            slot.setSlotType("Boolean");
        }
        {
            /**
             * @member {boolean} shouldCenterCloseButton
             * @description Indicates if the close button should be centered.
             */
            const slot = this.newSlot("shouldCenterCloseButton", true);
            slot.setSlotType("Boolean");
        }
        {
            /**
             * @member {DomView} contentView
             * @description The content view.
             */
            const slot = this.newSlot("contentView", null);
            slot.setSlotType("DomView");
        }

        {
            /**
             * @member {number} slideDeleteOffset
             * @description The slide delete offset.
             */
            const slot = this.newSlot("slideDeleteOffset", 0);
            slot.setSlotType("Number");
        }
        {
            /**
             * @member {DomView} dragDeleteButtonView
             * @description The drag delete button view.
             */
            const slot = this.newSlot("dragDeleteButtonView", null);
            slot.setSlotType("DomView");
        }
        {
            /**
             * @member {boolean} isDeleting
             * @description Indicates if the tile is deleting.
             */
            const slot = this.newSlot("isDeleting", false);
            slot.setSlotType("Boolean");
        }
        {
            /**
             * @member {Date} lastTapDate
             * @description The last tap date.
             */
            const slot = this.newSlot("lastTapDate", null);
            slot.setSlotType("Date");
        }
        {
            /**
             * @member {Date} lastSelectionDate
             * @description The last selection date.
             */
            const slot = this.newSlot("lastSelectionDate", null);
            slot.setSlotType("Date");
        }
    }

    /**
     * @description Applies styles to the tile.
     */
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
            console.log(this.svTypeId() + " setDisplay " + v)
        }
        return super.setDisplay(v)
    }
    */

    /**
     * @description Initializes the tile.
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

        this.setOverflowScrolling("touch")

        this.turnOffUserSelect()
        this.setAcceptsFirstResponder(false)
        this.setupTileContentView()

        /*
        if (TouchScreen.shared().isSupported() || true) { // testing 
            //
        } else {
            //this.addCloseButton()
        }
        */

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

    /**
     * @description Turns on user select.
     */
    turnOnUserSelect () {
        debugger;
        super.turnOnUserSelect()
        return this
    }

    /*
    setNode (aNode) {
        super.setNode(aNode)
        return this
    }
    */

    /**
     * @description Duplicates the tile.
     * @returns {Tile} The duplicated tile.
     */
    duplicate () {
        const dup = super.duplicate()
        dup.setNode(this.node().duplicate())
        return dup
    }

    // -- contentView -- 
    // a special subview within the Tile for it's content
    // we route style methods to it

    /**
     * @description Sets up the content view, a special subview within the Tile for it's content.
     * We route style methods to it.
     */
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

    /**
     * @description Adds a content subview.
     * @param {DomView} aView - The view to add.
     * @returns {Tile} The current instance.
     */
    addContentSubview (aView) {
        return this.contentView().addSubview(aView)
    }
   
    /**
     * @description Removes a content subview.
     * @param {DomView} aView - The view to remove.
     * @returns {Tile} The current instance.
     */
    removeContentSubview (aView) {
        return this.contentView().removeSubview(aView)
    }


    // --- helpers --------
    
    /**
     * @description Gets the browser.
     * @returns {Browser} The browser.
     */
    browser () {
        return this.column().browser()
    }

    /**
     * @description Gets the column.
     * @returns {Column} The column.
     */
    column () {
        const pv = this.parentView()
        if (pv && pv.isKindOf(TilesView)) {
            return pv
        }
        return null
    }
    
    /**
     * @description Gets the nav view.
     * @returns {NavView} The nav view.
     */
    navView () {
        return this.column().navView()
    }

    // ----

    /**
     * @description Updates the slot is inspecting.
     * @param {any} oldValue - The old value.
     * @param {any} newValue - The new value.
     */
    didUpdateSlotIsInspecting (/*oldValue, newValue*/) {
        //super.didUpdateSlotIsSelected (oldValue, newValue)
        this.tilesView().didChangeNavSelection()
        //this.updateSubviews()
    }

    /**
     * @description Updates the slot is selected.
     * @param {any} oldValue - The old value.
     * @param {any} newValue - The new value.
     */
    didUpdateSlotIsSelected (oldValue, newValue) {
        super.didUpdateSlotIsSelected (oldValue, newValue)

        
        if (this.isSelected()) {
            this.setLastSelectionDate(Date.clone())
        } else {
            //this.setShouldShowFlash(true)
            this.setLastSelectionDate(null)
        }
        
        this.tilesView().didChangeNavSelection() // handed by onTap?
        //this.updateSubviews()
    }
    
    // update
     
    /**
     * @description Updates the subviews.
     */
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
    
    onDidEdit (/*aView*/) {
        this.scheduleSyncToNode() 
        return true // stop propogation
    }
    
    // --- sync ---
	
    /**
     * @description Syncs from the node.
     */
    syncFromNode () {
        // is this ever called?
        //this.syncCssFromNode()
        const node = this.node();
        if (node) {
            this.setIsDisplayHidden(!node.isVisible());
        }
        this.updateSubviews();
        this.syncOrientation();
        return this;
    }

    /**
     * @description Gets the tiles view.
     * @returns {TilesView} The tiles view.
     */
    tilesView () {
        return this.parentView()
    }

    stackView () {
        const tilesView = this.tilesView()
        if (tilesView) {        
            const scrollView = tilesView.parentView()
            const navView = scrollView.parentView()
            const stackView = navView.parentView()
            if (stackView && stackView.thisClass().isKindOf(StackView)) {
                return stackView
            }
        }
        return null
        //return this.firstParentViewWithAncestorClass(StackView)
    }

    /**
     * @description Gets the direction.
     * @returns {string} The direction.
     */
    direction () {
        const sv = this.stackView()
        if (sv) {
            const d = sv.direction()
            return d
        }

        const pv = this.parentView()
        if (pv && pv.direction) {
            return pv.direction()
        }

        return "down"
    }

    syncOrientation () {
        if (!this.parentView()) {
            return this
        }

        const d = this.direction()

        if (d === "right") {
            this.makeOrientationRight()
        } else if (d === "down") {
            this.makeOrientationDown()
        }
        return this
    }

    /**
     * @description Makes the orientation right.
     */
    makeOrientationRight () {  
        // stackview is right so tiles are top to bottom

        this.setDisplay("inline-block")  

        this.setMinAndMaxWidth("100%")
        this.setMinHeight("5em")
        this.setHeight("fit-content")
        this.setMaxHeight(null)

        //this.setWidth("fit-content")
        //this.setHeight("fit-content")
        //this.setHeight(this.parentView().desiredHeight())
        //this.setBorderBottom("1px solid rgba(255, 255, 255, 0.3)")

        //this.setBorderRight("1px solid rgba(255, 0, 0, 1)")
        //this.setMinAndMaxWidth(null) // new
        //his.setMinAndMaxHeight(null)
        //this.setBoxShadow("inset -10px 0 20px rgba(0, 0, 0, 0.05)")

        /*
        if (this.contentView()) {
            this.contentView().setMinAndMaxHeight(null)
        }
        */
    }

    makeOrientationDown () { 

        // stackview is down so tiles are left to right
        //this.logDebug("makeOrientationDown")

        this.setDisplay("inline-block")
        //this.setWidth("fit-content")
        //this.setWidth("170px")

        this.setMinAndMaxWidth("17em")
        //this.setWidth("fit-content")
        this.setWidth("-webkit-fill-available")

        this.setMaxWidth(null)

        this.setMinAndMaxHeight("100%")
        


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
                    //this.contentView().setMinAndMaxHeight(h)
                }
            }
        }
    }
    
    // close button
    
    /**
     * @description Adds a close button.
     */
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
    /**
     * @description Passes the first responder to the column.
     * @returns {Tile} The current instance.
     */
    passFirstResponderToColumn () {
        if (this.isFirstResponder()) {
            if (this.column()) {
                this.column().becomeFirstResponder()
            }
        }
        return this
    }

    // --- delete ---

    /**
     * @description Checks if the tile can be deleted.
     * @returns {boolean} Whether the tile can be deleted.
     */
    canDelete () {
        if (this.node()) {
            return this.node().canDelete()
        }
        return false
    }

    /**
     * @description Deletes the tile.
     */
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
    
    /**
     * @description Decendant released focus.
     * @param {DomView} aView - The view.
     * @returns {boolean} Whether the focus was released.
     */
    decendantReleasedFocus (/*aView*/) {
        this.focus() // this doesn't seem right 
        return true
    }

    // --- selecting ---
	
    /**
     * @description Will accept first responder.
     * @returns {Tile} The current instance.
     */
    willAcceptFirstResponder () {
        super.willAcceptFirstResponder()
	    //this.logDebug(".willAcceptFirstResponder()")
        return this
    }

    // -------------------------
    
    /**
     * @description Gets the node tile link.
     * @returns {DomView} The node tile link.
     */
    nodeTileLink () {
        //this.logDebug(".visibleSubnodes() isInspecting:" + this.isInspecting())
        /*
        if(this.node().hasDefaultInspector && this.node().hasDefaultInspector()) {
            return this.node().nodeDefaultInspector()
        }
        */

        if (this.isInspecting()) {
            return this.node().nodeInspector()
        }

        return this.node().nodeTileLink()
    }

    // --- delegate ---

    /**
     * @description Sends the node delegate.
     * @param {string} methodName - The method name.
     * @param {array} args - The arguments.
     * @param {boolean} isStrict - Whether to be strict.
     * @returns {any} The result.
     */
    sendNodeDelegate (methodName, args = [this], isStrict = false) {
        const d = this.node();
    
        if (d) {
          const f = d[methodName];
          if (f) {
            return f.apply(d, args);
          }
        } else {
          if (isStrict) {
            const error = this.svType() + " delegate missing method '" + methodName + "'";
            console.log(error);
            debugger;
            throw new Error(error);
          }
        }
        return undefined;
    }
    
    getFromNodeDelegate (methodName, args = [], isStrict = false) {
        const d = this.node();
    
        if (d) {
          const f = d[methodName];
          if (f) {
            return f.apply(d, args);
          }
        } else {
          if (isStrict) {
            const error = this.svType() + " delegate missing method '" + methodName + "'";
            console.log(error);
            debugger;
            throw new Error(error);
          }
        }
        return undefined;
    }

    // copy and paste keyboard events

    onMetaLeft_c_KeyDown (/*event*/) {
        // MacOScopy
        this.logDebug("onMetaLeft_c_KeyDown");
    }

    onMetaLeft_v_KeyDown (/*event*/) {
        // MacOS paste
        this.logDebug("onMetaLeft_v_KeyDown");
    }

    onControl_c_KeyDown (/*event*/) {
        // Windows copy
        this.logDebug("onControl_c_KeyDown");
    }

    onControl_v_KeyDown (/*event*/) {
        // Windows paste
        this.logDebug("onControl_v_KeyDown");
    }

}.initThisClass());
