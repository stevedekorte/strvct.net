"use strict";

/*
    
    TitledTile

    Adds a few subviews for typical tile functionality:

        - titleView
        - subtitleView
        - noteView
        - noteIconView
        - thumbnailView

    Most of these can easily be disabled, if not needed.
    
*/

(class TitledTile extends Tile {
    
    initPrototypeSlots () {
        this.newSlot("titleView", null)
        this.newSlot("subtitleView", null)
        this.newSlot("noteView", null)
        this.newSlot("noteIconView", null) // created lazily
        this.newSlot("thumbnailView", null)
    }

    static titleLeftPadding () {
        return "30px"
    }

    topContentArea () {
        let lv = this.contentView().subviews().at(0)
        return lv
    }

    bottomContentArea () {
        let lv = this.contentView().subviews().at(1)
        return lv
    }

    init () {
        super.init()

        this.contentView().setMinHeight("5em")
        this.contentView().flexSplitIntoColumns(2)
        let lv = this.topContentArea()

        lv.setPaddingTop("0.7em")
        lv.setPaddingBottom("0.7em")
        lv.setPaddingLeft(this.thisClass().titleLeftPadding())
        lv.setPaddingRight("1em")

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
        tv.setOverflow("visible")
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

    syncSelected () {
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

    updateSubviews () {
        super.updateSubviews()
	
        const node = this.node()

        if (node) {
            this.titleView().setIsEditable(node.nodeCanEditTitle())

            this.subtitleView().setIsEditable(node.nodeCanEditSubtitle())
            this.subtitleView().setDisplayIsHidden(!this.hasSubtitle())
    
            this.syncSelected()

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
            this.subtitleView().setDisplayIsHidden(true) 
        }

        /*
        const state = this.currentThemeState()
        if (state) {
            state.applyToView(this.titleView())
            state.applyToView(this.subtitleView())
        }
        */

        return this
    }

    // noteView

    showNoteView () {
        this.noteView().unhideDisplay()   
        this.noteView().setString(this.node().note())
    }

    hideNoteView () {
        this.noteView().hideDisplay()     
    }

    // noteIconView

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

    hideNoteIconView () {
        this.noteIconView().hideDisplay()  
    }

    // ---

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

    // --- edit ---

    didInput () {
        this.scheduleSyncToNode()
    }

    onDidEdit (aView) {
        super.onDidEdit() 
    }

    // --- sync ---

    syncToNode () {   
        //console.log("syncToNode")
        const node = this.node()
        node.setTitle(this.titleView().innerText())
        node.setSubtitle(this.subtitleView().innerText())
        return this
    }

    syncFromNode () {
        super.syncFromNode()
        const node = this.node()
        this.titleView().setString(node.title())
        this.subtitleView().setString(node.subtitle())
        //this.noteView().setString(this.node().note())
        this.updateSubviews()
        return this
    }
    
    // arrow
    
    makeNoteRightArrow () {
        debugger;
        const nv = this.noteView()
        
        nv.setBackgroundImageUrlPath(this.pathForIconName("right-gray"))        
        nv.setBackgroundSizeWH(10, 10)
        
        nv.setMinAndMaxWidth(10)
        nv.setMinAndMaxHeight(10)
        return this		
    }

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
