"use strict";

/*

    BMPostDraftTile



*/

(class BMPostDraftTile extends Tile {
    
    initPrototypeSlots () {
        this.newSlot("topView", null)
        this.newSlot("leftView", null)
        this.newSlot("iconView", null)
        this.newSlot("rightView", null)
        this.newSlot("placeHolderView", null)
        this.newSlot("textContentView", null)
        //deleteButton: null,
        this.newSlot("bottomView", null)
        this.newSlot("sendButton", null)
    }

    init () {
        this.setShouldCenterCloseButton(false) // hack, TODO: change this
        super.init()

        this.setHeight("auto")
        this.setMinHeight("fit-content")
        this.setMaxHeight("fit-content")

        // trying to avoid height animation but this isn't working

        // ------------------------------------------
        
        this.contentView().setDisplay("block")
        this.contentView().setPosition("relative")
        this.contentView().setHeight("auto")
        this.contentView().setMinHeight("fit-content")
        this.contentView().setMaxHeight("fit-content")

        // --------------------------------------------------
        this.addCloseButton()
        
        {
            const cb = this.closeButtonView()
            cb.setElementClassName("TileCloseButtonTopRight")
            cb.setDisplay("inline-block")
            cb.setTopPx(0)
            cb.setRightPx(13)
            cb.setColor("#aaa")
            cb.setMinWidth("11px")
            cb.setMaxWidth("11px")
            cb.setMinHeight("11px")
            cb.setMaxHeight("11px")
            cb.setBorder("0px dashed #ddd")
            cb.setOpacity("0.4")
        }

        this.setTopView(this.addContentSubview(DomView.clone().setElementClassName("BMPostDraftTileTopView")))

        // left view
        this.setLeftView(this.topView().addSubview(DomView.clone().setElementClassName("BMPostDraftTileLeftView")))

        // icon view
    	this.setIconView(this.leftView().addSubview(ImageView.clone().setElementClassName("BMPostAvatarView")))
        this.iconView().setBackgroundSizeWH(64, 64)     

        // right view
        this.setRightView(this.topView().addSubview(DomView.clone().setElementClassName("BMPostDraftTileRightView")))
        

        // placeholder
        this.setPlaceHolderView(this.rightView().addSubview(TextField.clone().setElementClassName("BMPostDraftTilePlaceHolderView")))
        this.placeHolderView().setString("What's happening?")
                
        // content view
        this.setTextContentView(this.rightView().addSubview(TextField.clone().setElementClassName("BMPostDraftTileContentView")))
        this.textContentView().setIsEditable(true)

        this.closeButtonView().setBackgroundImageUrlPath(this.pathForIconName("close"))
        this.closeButtonView().setTopPx(15).setRightPx(15).setMinAndMaxWidth(10).setMinAndMaxHeight(10)
        // delete button
        /*
        this.setDeleteButton(this.rightView().addSubview(DomView.clone().setElementClassName("BMPostDraftTileCloseButton")))
        this.deleteButton().setTarget(this).setAction("delete")
        //this.deleteButton().setBackgroundSizeWH(20, 20) 
        this.deleteButton().setBackgroundImageUrlPath(this.pathForIconName("close"))
        this.deleteButton().makeBackgroundContain().makeBackgroundCentered().makeBackgroundNoRepeat()  
        */  
        
        this.setBottomView(this.addContentSubview(DomView.clone().setElementClassName("BMPostDraftTileBottomView")))
        this.setSendButton(this.bottomView().addSubview(DomView.clone().setElementClassName("BMPostDraftTileSendButton")))
        this.sendButton().setInnerHtml("Post")
        this.sendButton().setTarget(this).setAction("post")

        this.setupTextContentView()
        this.updateSubviews()
        this.setIsSelectable(true)
		
        this.closeButtonView().orderFront()

        //this.sendAllViewDecendants("setTransition", ["all 0s"])
				
        return this
    }

    setupTextContentView () {
        const tv = this.textContentView()
        tv.insertElementClassName(this.type() + "Title")
        //tv.setWidth("auto")
        tv.setPosition("relative")
        tv.setMarginRightPx(0)
        tv.setMarginLeft(0)
        this.setPaddingBottomPx(0)
        tv.setWhiteSpace("normal")
        //tv.setFontFamily("AppRegular, Sans-Serif")       
        tv.setTransition("all 0s")
        return this
    }
    
    setIconDataUrl (imageDataUrl) {
        const iv = this.iconView()
        
        if (imageDataUrl) {
    		iv.setBackgroundImageUrlPath(imageDataUrl)        
        } else {
            iv.setBackgroundColor("#aaa")
        }
        
        return this
    }

    updateSubviews () {
        super.updateSubviews()
    
        const node = this.node()
        
        if (node && this.textContentView()) {
            /*
            const placeText = this.textContentView().innerHtml().length ? "" : "What's happening?"    
            this.placeHolderView().setInnerHtml(placeText)
            */

            const opacity = this.textContentView().innerHtml().length ? 0 : 1
            this.placeHolderView().setOpacity(opacity)
        }

        //this.sendAllViewDecendants("setTransition", ["all 0s"])

        return this
    }

    // --- edit ---

    onDidEdit (changedView) {   
        //this.debugLog(".onDidEdit")
        this.updateSubviews()
        this.scheduleSyncToNode()
        return true
    }

    didInput () {
        this.scheduleSyncToNode() //this.syncToNode()
    }

    // --- sync ---
    
    syncToNode () {   
        //console.log("syncToNode")
        this.node().setContent(this.textContentView().innerHtml())
        //this.node().tellParentNodes("onDidEditNode", this.node())  
        return this
    }

    syncFromNode () {
        const node = this.node()
        this.textContentView().setString(node.content())
        this.setIconDataUrl(node.avatarImageDataUrl())
        this.updateSubviews()
        return this
    }
    
    // actions
    
    post () {
        this.node().post()
        return this
    }
    
    /*
    delete () {
        this.sendAllViewDecendants("setTransition", ["all 0.2s"])
        this.addTimeout(() => { this.node().delete() })
        //this.delete()
        //this.node().delete()
        return this
    }
    */
   
}.initThisClass());

