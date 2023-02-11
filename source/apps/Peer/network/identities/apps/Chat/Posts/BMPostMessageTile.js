"use strict";

/*

    BMPostMessageTile

*/

(class BMPostMessageTile extends Tile {
    
    initPrototypeSlots () {
        this.newSlot("leftView", null)
        this.newSlot("iconView", null)
        this.newSlot("middleView", null)
        this.newSlot("titleBarView", null)
        this.newSlot("titleBarTextView", null)
        this.newSlot("dateView", null)
        this.newSlot("textView", null)
        this.newSlot("bottomBarView", null)
        this.newSlot("replyButton", null)
        this.newSlot("replyCountView", null)
        this.newSlot("repostButton", null)
        this.newSlot("repostCountView", null)
        this.newSlot("likeButton", null)
        this.newSlot("likeCountView", null)
        //rightView: null,
    }

    init () {
        super.init()

        this.setMinHeightPx(100)
        //this.contentView()

        // left view
        this.setLeftView(this.addContentSubview(DomView.clone().setElementClassName("BMPostMessageTileLeftView")))
        this.setIconView(this.leftView().addSubview(ImageView.clone().setElementClassName("BMPostAvatarView")))
        this.iconView().setBackgroundSizeWH(64, 64).setTarget(this).setAction("clickedIconView")

        // middle view
        this.setMiddleView(this.addContentSubview(DomView.clone().setElementClassName("BMPostMessageTileMiddleView")))

        // title view
        this.setTitleBarView(this.middleView().addSubview(DomView.clone().setElementClassName("BMPostTitleBarView")))

        this.setTitleBarTextView(this.titleBarView().addSubview(DomView.clone().setElementClassName("BMPostTitleBarTextView")))
        this.setDateView(this.titleBarView().addSubview(DomView.clone().setElementClassName("BMPostDateView")))

        // content
        this.setTextView(this.middleView().addSubview(TextField.clone().setElementClassName("BMPostMessageTileContent")))

        // bottom bar
        this.setBottomBarView(this.middleView().addSubview(DomView.clone().setElementClassName("BMPostMessageTileBottomBar")))

        // reply
        this.setReplyButton(this.bottomBarView().addSubview(DomView.clone().setElementClassName("BMPostMessageTileReplyButton")))
        this.replyButton().setTarget(this).setAction("reply")
        this.replyButton().setBackgroundImageUrlPath(this.pathForIconName("reply"))
        this.replyButton().makeBackgroundContain().makeBackgroundNoRepeat()
        this.replyButton().setToolTip("reply")
        this.setReplyCountView(this.bottomBarView().addSubview(DomView.clone().setElementClassName("BMPostMessageTileCountView")))

        // repost
        this.setRepostButton(this.bottomBarView().addSubview(DomView.clone().setElementClassName("BMPostMessageTileRepostButton")))
        this.repostButton().setTarget(this).setAction("repost")
        this.repostButton().setBackgroundImageUrlPath(this.pathForIconName("repost"))
        this.repostButton().makeBackgroundContain().makeBackgroundNoRepeat()
        this.repostButton().setToolTip("repost")
        this.setRepostCountView(this.bottomBarView().addSubview(DomView.clone().setElementClassName("BMPostMessageTileCountView")))

        // like
        this.setLikeButton(this.bottomBarView().addSubview(DomView.clone().setElementClassName("BMPostMessageTileLikeButton")))
        this.likeButton().setTarget(this).setAction("like")
        this.likeButton().setBackgroundImageUrlPath(this.pathForIconName("heart-black-filled"))
        this.likeButton().makeBackgroundContain().makeBackgroundNoRepeat()
        this.likeButton().setToolTip("like")
        this.setLikeCountView(this.bottomBarView().addSubview(DomView.clone().setElementClassName("BMPostMessageTileCountView")))

        // right view
        //this.setRightView(this.addContentSubview(DomView.clone().setElementClassName("BMPostMessageTileRightView")))


        this.setupContentView()
        this.updateSubviews()
        this.setIsSelectable(true)

        return this
    }

    clickedIconView () {
        console.log("clickedIconView")
        return this
    }

    addCloseButton () {
        // avoid adding normal Tile closeButtonView
        return this
    }

    /*
	setupIconView () {
		let iv = DomView.clone().setElementClassName("ShelfIconView")
		this.setIconView(iv)
        this.leftView().addSubview(iv)
        
        let iconSize = 46
        iv.setPosition("relative")
        iv.setLeftPx((itemSize-iconSize)/2)
        iv.setTopPx((itemSize-iconSize)/2)
		iv.setMinAndMaxWidth(iconSize)
		iv.setMinAndMaxHeight(iconSize)
		iv.makeBackgroundNoRepeat()
		//this.makeBackgroundContain()
		iv.makeBackgroundCentered()
		iv.setBackgroundColor("transparent")
		iv.setOpacity(1)
        return this
    }
    */

    setIconDataUrl (imageDataUrl) {
        let iv = this.iconView()

        if (imageDataUrl) {
            iv.setBackgroundImageUrlPath(imageDataUrl)
        } else {
            iv.setBackgroundColor("#aaa")
        }

        return this
    }

    setupContentView () {
        const tv = this.textView()
        tv.setMinWidth(50)
        //tv.setPosition("relative")
        tv.setMarginRightPx(0)
        tv.setMarginLeft(0)
        tv.setPaddingTopPx(0)
        tv.setPaddingBottomPx(4)
        tv.setWhiteSpace("normal")
        //tv.setFontFamily("AppRegular, Sans-Serif")
    }

    showButtonNamed (name) {
        // TODO: abstract this into something like a PostAttributeButton 
        const node = this.node()
        const countView = this.perform(name + "CountView")
        const button = this.perform(name + "Button")
        const count = node.perform(name + "Count")
        const did = node.perform("did" + name.capitalized())

        if (count) {
            countView.setString(count)
        } else {
            countView.setString("")
        }

        if (did) {
            countView.setOpacity(1)
            button.setOpacity(1)
        } else {
            countView.setOpacity(0.5)
            button.setOpacity(0.5)
        }
    }

    updateSubviews () {
        super.updateSubviews()

        let node = this.node()

        if (node) {
            this.titleBarTextView().setString(node.senderName())
            this.dateView().setString(node.ageDescription())

            this.showButtonNamed("reply")
            this.showButtonNamed("repost")
            this.showButtonNamed("like")

        } else {
            this.titleBarTextView().setString("[no node]")
        }

        return this
    }

    // --- edit ---

    /*
    onDidEdit (changedView) {
        this.debugLog(".onDidEdit")
        this.scheduleSyncToNode()
        return true
    }
    */

    didInput () {
        this.scheduleSyncToNode() //this.syncToNode()
    }

    // --- sync ---

    syncToNode () {
        //console.log("syncToNode")
        this.node().setContent(this.textView().innerHtml())
        //his.node().tellParentNodes("onDidEditNode", this.node())
        return this
    }

    syncFromNode () {
        let node = this.node()
        this.setIconDataUrl(node.avatarImageDataUrl())
        this.textView().setString(node.content())
        this.updateSubviews()
        return this
    }

    // actions

    reply () {
        console.log("reply")
        this.node().incrementReplyCount()
        this.scheduleSyncToNode()
        return this
    }

    repost () {
        console.log("repost")
        this.node().incrementRepostCount()
        this.scheduleSyncToNode()
        return this
    }

    like () {
        console.log("like")
        this.node().incrementLikeCount()
        this.scheduleSyncToNode()
        return this
    }

}.initThisClass());
