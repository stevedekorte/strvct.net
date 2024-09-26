/**
 * @module browser.stack.Tile
 * @class TitledTile
 * @extends Tile
 * @classdesc 
 * TitledTile
 * 
 * Adds a few subviews for typical tile functionality:
 * 
 *     - titleView
 *     - subtitleView
 *     - noteView
 *     - noteIconView
 *     - thumbnailView
 * 
 * Most of these can easily be disabled, if not needed.
 */
"use strict";

(class TitledTile extends Tile {
    
    initPrototypeSlots () {
        /**
         * @member {DomView} titleView
         */
        {
            const slot = this.newSlot("titleView", null);
            slot.setSlotType("DomView");
        }
        /**
         * @member {DomView} subtitleView
         */
        {
            const slot = this.newSlot("subtitleView", null);
            slot.setSlotType("DomView");
        }
        /**
         * @member {DomView} noteView
         */
        {
            const slot = this.newSlot("noteView", null);
            slot.setSlotType("DomView");
        }
        /**
         * @member {DomView} noteIconView - created lazily
         */
        {
            const slot = this.newSlot("noteIconView", null);
            slot.setSlotType("DomView");
        }
        /**
         * @member {DomView} thumbnailView
         */
        {
            const slot = this.newSlot("thumbnailView", null);
            slot.setSlotType("DomView");
        }
    }

    /**
     * @static
     * @description Returns the left padding for the title
     * @returns {string}
     */
    static titleLeftPadding () {
        return "30px"
    }

    /**
     * @description Returns the top content area
     * @returns {DomView}
     */
    topContentArea () {
        let lv = this.contentView().subviews().at(0)
        return lv
    }

    /**
     * @description Returns the bottom content area
     * @returns {DomView}
     */
    bottomContentArea () {
        let lv = this.contentView().subviews().at(1)
        return lv
    }

    /**
     * @description Initializes the TitledTile
     * @returns {TitledTile}
     */
    init () {
        super.init()
        const cv = this.contentView()

        cv.setMinHeight("5em")
        cv.flexSplitIntoColumns(2)

        const lv = this.topContentArea()

        lv.setDisplay("flex")
        lv.setFlex("10")
        lv.setAlignItems("flex-start") // alignment in direction of flex
        lv.setJustifyContent("center") // alignment perpendicutal to flex
        lv.setFlexDirection("column")

        const tv = TileTitleView.clone()
        lv.addSubview(tv)
        this.setTitleView(tv)
        tv.setThemeClassName("TileTitle")
        tv.setUsesDoubleTapToEdit(true)
        //tv.setOverflow("visible")
        tv.setPaddingLeft("0em")

        const st = TileSubtitleView.clone()
        lv.addSubview(st)
        this.setSubtitleView(st)
        st.setThemeClassName("TileSubtitle")
        st.setPaddingLeft("0em")
        st.setPaddingTop("0em")
        st.setOpacity(0.6)


        const rv = this.bottomContentArea()
        rv.setDisplay("flex")
        rv.setAlignItems("center")
        this.setNoteView(rv.addSubview(TileNoteView.clone()))
        rv.setMinWidth("3em")
        rv.setJustifyContent("center")

        const icon = SvgIconView.clone()
        //icon.setElementClassName("NoteIconView")
        icon.setMinAndMaxWidth(12)
        icon.setMinAndMaxHeight(15)
        //icon.setFillColor("white")
        icon.setStrokeColor("white") // use currentColor?
        icon.setOpacity(0.2)
        this.setNoteIconView(rv.addSubview(icon))
        
        this.updateSubviews()
        this.setIsSelectable(true)
        return this
    }

    /**
     * @description Sets up the thumbnail view if it doesn't exist
     * @returns {TitledTile}
     */
    setupThumbnailViewIfAbsent () {
        if (!this.thumbnailView()) {
            const tv = DomView.clone().setElementClassName("TileThumbnailView")
            tv.setDisplay("block")
            tv.setLeftPx(10)
            tv.setTopPx(5)
            tv.setMinHeight("40px")
            tv.setMinWidth("40px")
            tv.setBorderRadiusPx(7)
            tv.setBackgroundColor("transparent")
            tv.setBorder("0px solid #aaa")

    		tv.makeBackgroundNoRepeat()
            tv.makeBackgroundCentered()
            //tv.makeBackgroundContain()
            tv.setBackgroundSizeWH(50, 50)

            this.setThumbnailView(tv)
            this.addSubview(tv)
            
            // TODO: make this dynamic with subview for title & subtitle
            const offset = 60
            this.titleView().setLeftPx(offset)
            this.subtitleView().setLeftPx(offset)
        }
        return this
    }
    
    /**
     * @description Checks if the tile has a subtitle
     * @returns {boolean}
     */
    hasSubtitle () {
        const node = this.node()

        if (node) {
            if (node.subtitle() !== null && node.subtitle() !== "") {
                return true
            }

            if (node.nodeCanEditSubtitle()) {
                return true
            }
        }

        return false
    }

    /**
     * @description Updates the subviews of the tile
     * @returns {TitledTile}
     */
    updateSubviews () {
        super.updateSubviews()
	
        const node = this.node()

        if (node) {
            this.titleView().setIsEditable(node.nodeCanEditTitle())
            this.subtitleView().setIsEditable(node.nodeCanEditSubtitle())
            this.subtitleView().setIsDisplayHidden(!this.hasSubtitle())
    
            if (node) {
                const imageUrl = node.nodeThumbnailUrl()
                if (imageUrl) {
                    this.setupThumbnailViewIfAbsent()
                    this.thumbnailView().setBackgroundImageUrlPath(imageUrl)
                }
            } 

            if (node.noteIconName()) {
                this.hideNoteView()
                this.showNoteIconView()
            } else {
                this.showNoteView()
                this.hideNoteIconView()
            }
        } else {
            this.titleView().setIsEditable(false)
            this.subtitleView().setIsEditable(false)
            this.subtitleView().setIsDisplayHidden(true) 
        }

        this.syncStylesToSubviews()

        /*
        const state = this.currentThemeState()
        if (state) {
            state.applyToView(this.titleView())
            state.applyToView(this.subtitleView())
        }
        */

        return this
    }

    /**
     * @description Synchronizes styles to subviews
     * @returns {TitledTile}
     */
    syncStylesToSubviews () {
        const b = this.isSelected()
        this.titleView().syncStateFrom(this)
        this.subtitleView().syncStateFrom(this)
        this.noteView().syncStateFrom(this)
        /*
        this.titleView().setIsSelected(b)
        this.subtitleView().setIsSelected(b)
        this.noteView().setIsSelected(b)
        */
        return this
    }

    /**
     * @description Shows the note view
     */
    showNoteView () {
        this.noteView().unhideDisplay()   
        this.noteView().setString(this.node().note())
    }

    /**
     * @description Hides the note view
     */
    hideNoteView () {
        this.noteView().hideDisplay()     
    }

    /**
     * @description Shows the note icon view
     */
    showNoteIconView () {
        const v = this.noteIconView()
        if (v.iconName() != this.node().noteIconName()) {
            v.unhideDisplay()    
            v.setIconName(this.node().noteIconName())
            //v.setDoesMatchParentColor(true)

        }
        //const color = this.currentColor()
        const color = this.getComputedCssProperty("color")

        v.setColor(color)
        v.setFillColor(color)
        v.setOpacity(0.95)
        //console.log( this.node().title() + " - " + color)
        //v.updateAppearance()
    }

    /**
     * @description Hides the note icon view
     */
    hideNoteIconView () {
        this.noteIconView().hideDisplay()  
    }

    /**
     * @description Calculates the desired width of the tile
     * @returns {number}
     */
    desiredWidth () {
        /*
        const tw = this.titleView().calcWidth()
        const sw = this.subtitleView().calcWidth()
        let w = Math.max(sw, tw)
        //console.log("calcCssWidth of tile title '" + this.node().title() + "' = " + w)
        return w + 50
        */
        return this.calcWidth()
    }

    /**
     * @description Handles input events
     */
    didInput () {
        this.scheduleSyncToNode()
    }

    /**
     * @description Handles edit events
     * @param {DomView} aView - The view that was edited
     */
    onDidEdit (aView) {
        super.onDidEdit() 
    }

    /**
     * @description Synchronizes the tile to its node
     * @returns {TitledTile}
     */
    syncToNode () {   
        //console.log("syncToNode")
        const node = this.node()
        node.setTitle(this.titleView().innerText())
        node.setSubtitle(this.subtitleView().innerText())
        return this
    }

    /**
     * @description Synchronizes the tile from its node
     * @returns {TitledTile}
     */
    syncFromNode () {
        super.syncFromNode()
        const node = this.node()
        this.titleView().setString(node.title())
        this.subtitleView().setString(node.subtitle())
        //this.noteView().setString(this.node().note())
        this.updateSubviews()

        this.setIsDisplayHidden(!node.isVisible())
        
        return this
    }
    
    /**
     * @description Makes the note view a right arrow
     * @returns {TitledTile}
     */
    makeNoteRightArrow () {
        //debugger;
        const nv = this.noteView()
        
        nv.setBackgroundImageUrlPath(this.pathForIconName("right-gray"))        
        nv.setBackgroundSizeWH(10, 10)
        nv.setBackgroundRepeat("no-repeat")
        
        nv.setMinAndMaxWidth(10)
        nv.setMinAndMaxHeight(10)
        return this		
    }

    /**
     * @description Handles the enter key up event
     * @param {Event} event - The keyboard event
     */
    onEnterKeyUp (event) {
        //this.debugLog(".onEnterKeyUp()")

        if (this.titleView().isEditable()) {
            this.titleView().activate()
            event.stopPropagation()
        } else if (this.subtitleView().isEditable()) {
            this.subtitleView().activate()
            event.stopPropagation()
        } else {
            super.onEnterKeyUp(event)
        }        
    }

    /*
    removeAllGestureRecognizers () {
        debugger;
        return super.removeAllGestureRecognizers()
    }
    */
    
}.initThisClass());