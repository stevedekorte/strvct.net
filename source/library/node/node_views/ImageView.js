"use strict";

/*

    ImageView

*/

(class ImageView extends NodeView {
    
    initPrototype () {
        this.newSlot("imageContainer", null)
        this.newSlot("rawImageView", null)
        this.newSlot("closeButtonView", null)
        this.newSlot("dataURL", null)
        this.newSlot("isEditable", false)
    }

    init () {
        super.init()
        this.setDisplay("flex")
        this.setPosition("relative")
        this.setJustifyContent("center")
        this.setAlignItems("center")
        this.setTransition("all 0.5s")
        this.setOverflow("hidden")
        this.setWidth("auto")
        this.setHeight("auto")
        //this.setIsRegisteredForBrowserDrop(false)

        // image container
        const ic = this.newImageViewContainer()
        this.setImageContainer(ic)
        this.addSubview(ic)

        // close button
        const cb = this.newCloseButtonView()
        this.setCloseButtonView(cb)
        this.addSubview(cb)

        this.setIsEditable(false)
        this.dragUnhighlight()
        this.turnOffUserSelect()
        this.setTransition("all 0.3s")
        return this
    }

    newCloseButtonView () {
        const v = ButtonView.clone().setDivClassName("ImageCloseButton")
        v.setDisplay("flex")
        v.setPosition("absolute")
        v.setTitleIsVisible(false)
        v.setTopPx(0)
        v.setRightPx(0)
        v.setTarget(this).setAction("close")
        v.setIconName("close")
        return v
    }

    newImageViewContainer () {
        const v = DomFlexView.clone().setDivClassName("ImageViewImageContainer")
        v.setDisplay("flex")
        v.setPosition("relative")
        v.setJustifyContent("center")
        v.setAlignItems("center")
        v.setOverflow("hidden")
        v.setWidth("auto")
        v.setHeight("auto")
        return v
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
        this.setMarginRightPx(0)
    }
    
    close () {
        const seconds = 0.3
		
        this.collapse()
        
        this.addTimeout( () => { 
            this.closeButtonView().hideDisplay()
            const parentView = this.parentView()
            this.removeFromParentView()
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

    newRawImageViewForImage (image) {
        const v = DomFlexView.clone().setElement(image).setDivClassName("RawImageView")
        v.setDisplay("flex")
        v.setPosition("relative")
        v.setJustifyContent("center")
        v.setAlignItems("center")
        v.setOverflow("hidden")
        v.makeStandardFlexView()
        v.setWidth("fit-content")
        v.setHeight("auto")
        return v
    }

    setFromDataURL (dataURL) {
        //console.log("setFromDataURL: ", dataURL)
        assert(!Type.isNull(dataURL))
        assert(dataURL.beginsWith("data:")) 

        this.removeRawImageView()
        this.setDataURL(dataURL)

        const image = new Image();
        image.src = dataURL;

        const v = this.newRawImageViewForImage(image)
        this.setRawImageView(v)
        this.imageContainer().addSubview(v)
	
        return this
    }
    
}.initThisClass());
