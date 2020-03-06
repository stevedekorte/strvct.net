"use strict"

/*

    ImageView

*/

window.ImageView = class ImageView extends NodeView {
    
    initPrototype () {
        this.newSlot("imageContainer", null)
        this.newSlot("rawImageView", null)
        this.newSlot("closeButtonView", null)
        this.newSlot("dataURL", null)
        this.newSlot("isEditable", false)
    }

    init () {
        super.init()
        
        //this.setIsRegisteredForBrowserDrop(false)
        //this.setWidthPercentage(100)
        //this.setHeightPercentage(100)
        this.setWidth("auto")
        this.setHeight("auto")

        // image container
        const ic = DomFlexView.clone().setDivClassName("ImageViewImageContainer")
        ic.setWidth("auto")
        ic.setHeight("auto")
        this.setImageContainer(ic)
        this.addSubview(ic)

        // close button
        const cb = ButtonView.clone().setDivClassName("ImageCloseButton")
        cb.setDisplay("flex")
        cb.setPosition("absolute")
        cb.setTitleIsVisible(false)
        cb.setTop("0px").setRight("0px")
        cb.setTarget(this).setAction("close")
        cb.setIconName("close")
        this.setCloseButtonView(cb)
        this.addSubview(cb)

        this.setIsEditable(false)
        this.dragUnhighlight()
        this.turnOffUserSelect()
        this.setTransition("all 0.3s")
        return this
    }

    setIsRegisteredForBrowserDrop(aBool) {
        throw new Error("shouldn't be called")
    }

    // --- editable ---
    
    setIsEditable (aBool) {
        this.closeButtonView().setDisplayIsHidden(!aBool)
        return this
    }

    setEditable (aBool) {
        // to avoid editable content?
        return this
    }
    
    acceptsDrop () {
        return false
    }

    // --- close button ---

    collapse () {
        this.closeButtonView().setOpacity(0).setTarget(null)
        this.setOpacity(0)
		
        this.setWidth("0px")
		
        this.setPaddingLeftPx(0)
        this.setPaddingRightPx(0)
		
        this.setMarginLeft(0)
        this.setMarginRight(0)
    }
    
    close () {
        const seconds = 0.3
		
        this.collapse()
        
        this.addTimeout( () => { 
            this.closeButtonView().hideDisplay()
            const parentView = this.parentView()
            this.removeFromParentView()
            /*
            if (parentView && parentView.subviewRequestsClose) {
                parentView.subviewRequestsClose(this)
            }
            */
            //this.debugLog(".close complete parentView = ", parentView)
            parentView.scheduleSyncToNode()
        }, seconds * 1000)
    }

    // --- sync ---
    
    removeRawImageView () {
        if (this.rawImageView()) {
            this.imageContainer().removeSubview(this.rawImageView())
            this.setRawImageView(null)
        }
        return this
    }
    
    fetchDataURLFromSrc (src) {
        if (src.beginsWith("data:")) {
	        this.setFromDataURL(src)
        } else {
            const img = new Image();
            img.setDelegate(this)
            img.loadUrl(src)
        }
		
        return this
    }
    
    didFetchDataUrl (dataURL) {
        this.setFromDataURL(dataURL)
        this.scheduleSyncToNode() 
        return this
    }

    setFromDataURL (dataURL) {
        //console.log("setFromDataURL: ", dataURL)
        assert(!Type.isNull(dataURL))
        assert(dataURL.beginsWith("data:")) 

        this.removeRawImageView()
        this.setDataURL(dataURL)

        const image = new Image();
        image.src = dataURL;

        {
            const riv = DomFlexView.clone().setElement(image).setDivClassName("RawImageView")
            riv.makeStandardFlexView()
            riv.setWidth("fit-content")
            riv.setHeight("auto")
            this.setRawImageView(riv)
            this.imageContainer().addSubview(riv)
        }
	
        return this
    }
    
}.initThisClass()
