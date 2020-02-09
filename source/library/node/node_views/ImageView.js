"use strict"

/*

    ImageView

*/

window.ImageView = class ImageView extends NodeView {
    
    initPrototype () {
        this.newSlot("closeButtonView", null)
        this.newSlot("dataURL", null)
        this.newSlot("isEditable", false)
        this.newSlot("imageContainer", null)
        this.newSlot("rawImageView", null)
    }

    init () {
        super.init()
        
        this.setIsRegisteredForBrowserDrop(false)
        
        this.setImageContainer(DomView.clone().setDivClassName("ImageViewImageContainer"))
        this.setWidthPercentage(100)
        this.setHeightPercentage(100)
        this.addSubview(this.imageContainer())

        this.setIsEditable(false)
        this.dragUnhighlight()
        this.turnOffUserSelect()
        this.setTransition("all 0.3s")
        return this
    }

    // --- editable ---
    
    setIsEditable (aBool) {
        if (aBool) {
            this.addCloseButton()
        } else {
            this.removeCloseButton()
        }
        return this
    }

    setEditable (aBool) {
        // to avoid editable content?
        return this
    }
    
    // --- close button ---

    addCloseButton () {
        if (this.closeButtonView() === null) {
            const cb = ButtonView.clone().setDivClassName("ImageCloseButton")
            this.setCloseButtonView(cb)
            this.addSubview(cb) 
            cb.setTarget(this).setAction("close") //.setInnerHTML("&#10799;")

	        cb.setBackgroundImageUrlPath(this.pathForIconName("close"))
            cb.setBackgroundSizeWH(10, 10) // use "contain" instead?
            cb.setBackgroundPosition("center")
            cb.makeBackgroundNoRepeat()
        }
        return this        
    }
    
    removeCloseButton () {
        if (this.closeButtonView() !== null) {
            this.removeSubview(this.closeButtonView()) 
            this.setCloseButtonView(null)
        }
    }

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
            this.removeCloseButton()
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

        this.setRawImageView(DomView.clone().setElement(image).setDivClassName("ImageViewImageObject"))
        this.imageContainer().addSubview(this.rawImageView())
	
        return this
    }
    
}.initThisClass()
