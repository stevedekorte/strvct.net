"use strict";

/*

    ImageView

*/

(class ImageView extends NodeView {
    
    initPrototypeSlots () {
        this.newSlot("imageContainer", null);
        this.newSlot("rawImageView", null);
        this.newSlot("closeButtonView", null);
        this.newSlot("srcUrl", null);

        {
            const slot = this.newSlot("dataURL", null);
            slot.setSyncsToNode(true);
        }

        this.newSlot("isEditable", false);
    }

    init () {
        super.init();
        this.setDisplay("flex");
        this.setPosition("relative");
        this.setJustifyContent("center");
        this.setAlignItems("center");
        this.setOverflow("hidden");
        this.setWidth("auto");
        this.setHeight("auto");
        //this.setIsRegisteredForBrowserDrop(false);

        // image container
        const ic = this.newImageViewContainer();
        this.setImageContainer(ic);
        this.addSubview(ic);

        // close button
        const cb = this.newCloseButtonView();
        this.setCloseButtonView(cb);
        this.addSubview(cb);

        this.setIsEditable(false);
        this.dragUnhighlight();
        this.turnOffUserSelect();
        return this;
    }

    newCloseButtonView () {
        const v = ButtonView.clone().setElementClassName("ImageCloseButton");
        v.setDisplay("flex");
        v.setPosition("absolute");
        v.setTitleIsVisible(false);
        v.setTopPx(0);
        v.setRightPx(0);
        v.setTarget(this).setAction("close");
        v.setIconName("close");
        return v;
    }

    newImageViewContainer () {
        const v = FlexDomView.clone().setElementClassName("ImageViewImageContainer");
        v.setDisplay("flex");
        v.setPosition("relative");
        v.setJustifyContent("center");
        v.setAlignItems("center");
        v.setOverflow("hidden");
        v.setWidth("auto");
        v.setHeight("auto");
        return v;
    }

    setIsRegisteredForBrowserDrop(aBool) {
        throw new Error("shouldn't be called");
    }

    // --- editable ---
    
    setIsEditable (aBool) {
        this.closeButtonView().setIsDisplayHidden(!aBool);
        return this;
    }

    setEditable (aBool) {
        // to avoid editable content?
        return this;
    }
    
    acceptsDrop () {
        return false;
    }

    // --- close button ---

    collapse () {
        this.closeButtonView().setOpacity(0).setTarget(null);
        this.setOpacity(0);
		
        this.setWidth("0px");
		
        this.setPaddingLeftPx(0);
        this.setPaddingRightPx(0);
		
        this.setMarginLeft(0);
        this.setMarginRightPx(0);
    }
    
    close () {
        const seconds = 0.3;
		
        this.collapse();
        
        this.addTimeout( () => { 
            this.closeButtonView().hideDisplay();
            const parentView = this.parentView();
            this.removeFromParentView();
            parentView.scheduleSyncToNode(); // is this needed?
        }, seconds * 1000);
    }

    // --- sync ---

    hasImageUrl (url) {
        return (url === v.dataURL() || url === v.srcUrl());
    }
    
    removeRawImageView () {
        if (this.rawImageView()) {
            this.imageContainer().removeSubview(this.rawImageView());
            this.setRawImageView(null);
        }
        return this;
    }
    
    fetchDataURLFromSrc (src) {
        if (src.startsWith("data:")) {
	        this.setFromDataURL(src);
        } else {
            const img = new Image();
            img.setDelegate(this);
            img.loadUrl(src);
            this.setSrcUrl(src);
        }
		
        return this;
    }
    
    didFetchDataUrl (dataURL) {
        this.setFromDataURL(dataURL);
        return this;
    }

    newRawImageViewForImage (image) {
        const v = FlexDomView.clone().setElement(image).setElementClassName("RawImageView");
        v.setDisplay("flex");
        v.setPosition("relative");
        v.setJustifyContent("center");
        v.setAlignItems("center");
        v.setOverflow("hidden");
        v.makeStandardFlexView();
        v.setWidth("fit-content");
        v.setHeight("auto");
        return v;
    }

    setFromDataURL (dataURL) {
        //console.log("setFromDataURL: ", dataURL);
        assert(!Type.isNull(dataURL));
        assert(dataURL.startsWith("data:")) ;

        this.removeRawImageView();
        this.setDataURL(dataURL);

        const image = new Image();
        image.src = dataURL;

        const v = this.newRawImageViewForImage(image);
        this.setRawImageView(v);
        this.imageContainer().addSubview(v);
	
        return this;
    }
    
}.initThisClass());
