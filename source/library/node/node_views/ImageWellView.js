"use strict"

/*

    ImageWellView

*/

window.ImageWellView = class ImageWellView extends NodeView {
    
    initPrototype () {
        this.newSlot("imageView", null)
        this.newSlot("isEditable", true)
    }

    init () {
        super.init()
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

    /*
    syncFromNode () {
        super.syncFromNode()
        this.valueView().setBackgroundColor("transparent")
        return this
    }
    */
    
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
       //const accepts = (!this.isFull()) && (this.isEditable() !== false)
       const accepts = this.isEditable()
       /*
        this.debugLog(".acceptsDrop():")
        console.log("    isEditable: " + this.isEditable())
        console.log("        isFull: " + this.isFull())
        console.log("       accepts: " + accepts)
        console.log("\n")
        */
       //console.log(this.debugTypeId() + " acceptsDrop() -> " + accepts)
       return accepts        
    }

    onBrowserDrop (event) {
        return super.onBrowserDrop(event)
    }

    onBrowserDragOver (event) {
        const r =  super.onBrowserDragOver(event)
        //console.log(this.debugTypeId() + " onBrowserDragOver() -> " + r)
        return r
    }

    setValue (aValue) {
        this.setImageDataUrl(aValue)
        return this
    }

    value () {
        return this.imageDataUrl()
    }
    
    setImageDataUrl (dataURL) {
        if (Type.isArray(dataURL)) {
            dataURL = dataURL[0]
        }

        if (dataURL === this.imageDataUrl()) {
            return this
        }

        if (Type.isNull(dataURL) || Type.isUndefined(dataURL)) {
            dataURL = ""
        }
        
        //this.debugLog(".setImageDataUrl = ", dataURL)
        this.removeAllSubviews()

        if (dataURL) {
            this.setImageView(ImageView.clone())
            this.addSubview(this.imageView())

            const iv = this.imageView()
            iv.fetchDataURLFromSrc(dataURL)
            iv.autoFitChildHeight()
            iv.autoFitParentWidth()
        }

        return this
    }
    
    imageDataUrl () {
        const iv = this.imageView()
        if (iv && iv.dataURL()) {
            return iv.dataURL()
        }
        return null
    }
    
    onBrowserDropImageDataUrl (dataURL) {
        this.setImageDataUrl(dataURL)
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
