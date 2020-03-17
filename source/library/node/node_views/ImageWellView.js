"use strict"

/*

    ImageWellView

    - designed to contain an ImagineView
    - can have it's own frame and decoration
    - supports drag & drop of images

*/

window.ImageWellView = class ImageWellView extends NodeView {
    initPrototype () {
        this.newSlot("imageView", null)
        this.newSlot("isEditable", true)
    }


    init () {
        super.init()
        this.setDisplay("flex")
        this.setPosition("relative")
        this.setJustifyContent("center")
        this.setAlignItems("center")
        this.setMinHeight("10em")
        this.setMinWidth("10em")
        this.setOverflowX("hidden")
        this.setOverflowY("hidden")
        this.setBorder("1px solid #444")
        this.setColor("white")
        this.setBackgroundColor("transparent")

        this.setIsRegisteredForBrowserDrop(true)
        this.dragUnhighlight()
        this.turnOffUserSelect()
        this.setTransition("all 0.3s")
        this.autoFitParentWidth()
        this.autoFitChildHeight()
        this.setMinHeightPx(100)
        this.setPadding("0px")
        return this
    }

    syncToNode () {
        super.syncToNode()
        this.tellParentViews("didUpdateImageWellView", this)
        return this
    }
    
    isEditable () {
        // we need this to override the normal isContentEditable return value
        return this._isEditable
    }
    
    setIsEditable (aBool) {
        this._isEditable = aBool
        if (this.imageView()) {
            this.imageView().setIsEditable(aBool)
        }
        return this
    }
    
    dragHighlight () {
        this.setBackgroundColor("rgba(128, 128, 128, 0.5)")
    }
    
    dragUnhighlight () {
        this.setBackgroundColor("transparent")
    }
    
    isFull () {
        //console.log("this.imageView().dataURL()  = ", this.imageView().dataURL() )
        return this.subviews().length > 0
    }
    
    acceptsDrop (event) {
        return true
        //return this.isEditable()        
    }

    /*
    onBrowserDrop (event) {
        return super.onBrowserDrop(event)
    }

    onBrowserDragOver (event) {
        const r =  super.onBrowserDragOver(event)
        //console.log(this.debugTypeId() + " onBrowserDragOver() -> " + r)
        return r
    }
    */

    setValue (aValue) {
        this.setImageDataUrl(aValue)
        return this
    }

    value () {
        return this.imageDataUrl()
    }
    
    setImageDataUrl (dataURL) {
        assert(!Type.isArray(dataURL)) 

        if (dataURL === this.imageDataUrl()) {
            return this
        }
        
        this.removeAllSubviews()

        if (!Type.isNullOrUndefined(dataURL)) {
            const v = ImageView.clone()
            this.setImageView(v)
            this.addSubview(v)

            v.fetchDataURLFromSrc(dataURL)
            v.autoFitChildHeight()
            v.autoFitParentWidth()
        }

        return this
    }
    
    imageDataUrl () {
        const v = this.imageView()
        if (v && v.dataURL()) {
            return v.dataURL()
        }
        return null
    }
    

    // need these as method name is constructed from MIME type

    onBrowserDropImageJpeg (dataChunk) {
        this.droppedImageData(dataChunk)
    }

    onBrowserDropImageGif (dataChunk) {
        this.droppedImageData(dataChunk)
    }

    onBrowserDropImagePng (dataChunk) {
        this.droppedImageData(dataChunk)
    }

    // image data chunk

    droppedImageData (dataChunk) {
        this.setImageDataUrl(dataChunk.dataUrl())
        this.scheduleSyncToNode() //this.syncToNode()
        return this        
    }
    
    willRemoveSubview (aSubview) {
        super.willRemoveSubview(aSubview)

        if (aSubview === this.imageView()) {
            this.setImageView(null)
        }
        return this
    }
    
}.initThisClass()
