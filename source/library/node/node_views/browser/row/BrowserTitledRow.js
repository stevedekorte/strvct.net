"use strict"

/*
    
    BrowserTitledRow
    
*/

window.BrowserTitledRow = class BrowserTitledRow extends BrowserRow {
    
    initPrototype () {
        this.newSlot("titleView", null)
        this.newSlot("subtitleView", null)
        this.newSlot("noteView", null)
        this.newSlot("noteIconView", null) // created lazily
        this.newSlot("thumbnailView", null)
    }

    init () {
        super.init()

        this.contentView().setMinHeight("5em")
        this.contentView().flexSplitIntoColumns(2)
        let lv = this.contentView().subviews().at(0)

        lv.setPaddingTop("0.7em")
        lv.setPaddingBottom("0.7em")

        lv.setPaddingLeft("1.5em")
        lv.setPaddingRight("1em")

        lv.setDisplay("flex")
        lv.setFlex("10")
        lv.setAlignItems("flex-start") // alignment in direction of flex
        lv.setJustifyContent("center") // alignment perpendicutal to flex
        lv.setFlexDirection("column")

        this.setTitleView(lv.addSubview(BrowserRowTitle.clone()))
        this.titleView().setUsesDoubleTapToEdit(true).setOverflow("visible")
        this.setSubtitleView(lv.addSubview(BrowserRowSubtitle.clone()))

        let rv = this.contentView().subviews().at(1)
        rv.setDisplay("flex")
        rv.setAlignItems("center")
        this.setNoteView(rv.addSubview(BrowserRowNote.clone()))
        rv.setMinWidth("2em")
        rv.setJustifyContent("center")

        const icon = SvgIconView.clone().setDivClassName("NoteIconView")
        icon.setMinAndMaxWidth(12)
        icon.setMinAndMaxHeight(15)
        //icon.setFillColor("white")
        icon.setStrokeColor("white")
        icon.setOpacity(0.2)
        this.setNoteIconView(rv.addSubview(icon))
        
        this.updateSubviews()
        this.setIsSelectable(true)
        return this
    }

    hasSubtitle () {
        return this.node() && this.node().subtitle() !== null
        //return this.subtitleView().innerHTML().length > 0
    }

    setHasSubtitle (aBool) { 
        if (aBool) {
            this.subtitleView().unhideDisplay()
        } else {
            this.subtitleView().hideDisplay()  // 13   
        }
        /*       
        if (aBool) {
            this.titleView().setMarginTop(6)
        } else {
            this.titleView().setMarginTop(13)    // 13   
        }
        */

        return this
    }
    
    setupThumbnailViewIfAbsent () {
        if (!this.thumbnailView()) {
            const tv = DomView.clone().setDivClassName("BrowserRowThumbnailView")
    		tv.makeBackgroundNoRepeat()
            tv.makeBackgroundCentered()
            //tv.makeBackgroundContain()
            tv.setBackgroundSizeWH(50, 50)

            this.setThumbnailView(tv)
            this.addSubview(tv)
            
            // TODO: make this dynamic with subview for title & subtitle
            const offset = 60
            this.titleView().setLeft(offset)
            this.subtitleView().setLeft(offset)
        }
        return this
    }
    
    updateSubviews () {
        super.updateSubviews()
	
        this.setHasSubtitle(this.hasSubtitle())

        const node = this.node()

        this.titleView().setIsEditable(node ? node.nodeCanEditTitle() : false)
        this.subtitleView().setIsEditable(node ? node.nodeCanEditSubtitle() : false)
        
        if (node) {

            const b = this.isSelected()
            this.titleView().setIsSelected(b)
            this.subtitleView().setIsSelected(b)
            this.noteView().setIsSelected(b)
            
            if (node) {
                const imageUrl = node.nodeThumbnailUrl()
                if (imageUrl) {
                    this.setupThumbnailViewIfAbsent()
                    //this.thumbnailView().verticallyAlignAbsoluteNow() // TODO: optimize this
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


        }

        return this
    }

    // noteView

    showNoteView () {
        this.noteView().unhideDisplay()   
        this.noteView().setInnerHTML(this.node().note())
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
        const color = this.currentColor()
        v.setColor(color)
        v.setFillColor(color)
        v.setOpacity(0.95)
        //console.log( this.node().title() + " - " + color)
        v.updateAppearance()
    }

    hideNoteIconView () {
        this.noteIconView().hideDisplay()  
    }

    // ---

    desiredWidth () {
        const tw = this.titleView().calcCssWidth()
        const sw = this.subtitleView().calcCssWidth()
        let w = tw
        if (sw > w) {
            w = sw
        }
        //console.log("calcCssWidth of row title '" + this.node().title() + "' = " + w)
        return w + 50
        //return this.titleView().calcWidth()
    }

    // --- edit ---

    didInput () {
        // if text is blocked, sync browser?
        this.browser().fitColumns()
        this.scheduleSyncToNode()
    }

    onDidEdit (aView) {
        super.onDidEdit() 
        this.browser().fitColumns()
        return true // stop propogation
    }

    // --- sync ---

    syncToNode () {   
        //console.log("syncToNode")
        const node = this.node()
        node.setTitle(this.titleView().innerText())
        node.setSubtitle(this.subtitleView().innerText())
        //node.tellParentNodes("onDidEditNode", this.node())  
        //node.scheduleSyncToStore() // TODO: this should be handled by the node
        return this
    }

    syncFromNode () {
        const node = this.node()
        this.titleView().setString(node.title())
        this.subtitleView().setString(node.subtitle())
        //this.noteView().setString(this.node().note())
        this.updateSubviews()
        return this
    }
    
    // arrow
    
    makeNoteRightArrow () {
        const nv = this.noteView()
        
        nv.setBackgroundImageUrlPath(this.pathForIconName("right-gray"))        
        nv.setBackgroundSizeWH(10, 10)
        
        nv.setMinAndMaxWidth(10)
        nv.setMinAndMaxHeight(10)

        /*
        const icon = this.noteSvgIconForName("right-gray")
        nv.setInnerHTML("")
        nv.removeAllSubviews()
        nv.addSubview(icon)
        */
        return this		
    }

    
}.initThisClass()
