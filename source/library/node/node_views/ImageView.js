/**
 * @module library.node.node_views
 * @class ImageView
 * @extends NodeView
 * @classdesc ImageView is a specialized view for displaying images with additional features like a close button and editability.
 */
"use strict";

(class ImageView extends NodeView {
    
    initPrototypeSlots () {
        /**
         * @member {FlexDomView} imageContainer - Container for the image
         * @category UI Components
         */
        {
            const slot = this.newSlot("imageContainer", null);
            slot.setSlotType("FlexDomView");
        }
        /**
         * @member {FlexDomView} rawImageView - View for the raw image
         * @category UI Components
         */
        {
            const slot = this.newSlot("rawImageView", null);
            slot.setSlotType("FlexDomView");
        }
        /**
         * @member {FlexDomView} closeButtonView - View for the close button
         * @category UI Components
         */
        {
            const slot = this.newSlot("closeButtonView", null);
            slot.setSlotType("FlexDomView");
        }
        /**
         * @member {String} srcUrl - Source URL of the image
         * @category Data
         */
        {
            const slot = this.newSlot("srcUrl", null);
            slot.setSlotType("String");
        }
        /**
         * @member {String} dataURL - Data URL of the image
         * @category Data
         */
        {
            const slot = this.newSlot("dataURL", null);
            slot.setSyncsToNode(true);
            slot.setSlotType("String");
        }
        /**
         * @member {Boolean} isEditable - Indicates if the image view is editable
         * @category State
         */
        {
            const slot = this.newSlot("isEditable", false);
            slot.setSlotType("Boolean");
        }
    }

    initPrototype () {
    }

    /**
     * @description Initializes the ImageView
     * @returns {ImageView} The initialized ImageView instance
     * @category Initialization
     */
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

    /**
     * @description Creates a new close button view
     * @returns {ButtonView} The created close button view
     * @category UI Components
     */
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

    /**
     * @description Creates a new image view container
     * @returns {FlexDomView} The created image view container
     * @category UI Components
     */
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

    /**
     * @description Sets whether the view is registered for browser drop (not implemented)
     * @param {Boolean} aBool - Whether to register for browser drop
     * @throws {Error} Always throws an error as this method shouldn't be called
     * @category Uncategorized
     */
    setIsRegisteredForBrowserDrop (aBool) {
        throw new Error("shouldn't be called");
    }

    /**
     * @description Sets whether the image view is editable
     * @param {Boolean} aBool - Whether the image view is editable
     * @returns {ImageView} The ImageView instance
     * @category State
     */
    setIsEditable (aBool) {
        this.closeButtonView().setIsDisplayHidden(!aBool);
        return this;
    }

    /**
     * @description Sets whether the image view is editable (placeholder method)
     * @param {Boolean} aBool - Whether the image view is editable
     * @returns {ImageView} The ImageView instance
     * @category State
     */
    setEditable (aBool) {
        // to avoid editable content?
        return this;
    }
    
    /**
     * @description Checks if the view accepts drops
     * @returns {Boolean} Always returns false
     * @category Drag and Drop
     */
    acceptsDrop () {
        return false;
    }

    /**
     * @description Collapses the image view
     * @category UI Operations
     */
    collapse () {
        this.closeButtonView().setOpacity(0).setTarget(null);
        this.setOpacity(0);
		
        this.setWidth("0px");
		
        this.setPaddingLeftPx(0);
        this.setPaddingRightPx(0);
		
        this.setMarginLeft(0);
        this.setMarginRightPx(0);
    }
    
    /**
     * @description Closes the image view with an animation
     * @category UI Operations
     */
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

    /**
     * @description Checks if the view has a specific image URL
     * @param {String} url - The URL to check
     * @returns {Boolean} Whether the view has the specified image URL
     * @category Data
     */
    hasImageUrl (url) {
        return (url === v.dataURL() || url === v.srcUrl());
    }
    
    /**
     * @description Removes the raw image view
     * @returns {ImageView} The ImageView instance
     * @category UI Operations
     */
    removeRawImageView () {
        if (this.rawImageView()) {
            this.imageContainer().removeSubview(this.rawImageView());
            this.setRawImageView(null);
        }
        return this;
    }
    
    /**
     * @description Fetches the data URL from a source URL
     * @param {String} src - The source URL
     * @returns {ImageView} The ImageView instance
     * @category Data
     */
    async asyncFetchDataURLFromSrc (src) {
        if (src.startsWith("data:")) {
	        this.setFromDataURL(src);
        } else {
            this.setFromDataURL(Image.asyncDataUrlForSrc(src));
            this.setSrcUrl(src);
        }
		
        return this;
    }
    
    /**
     * @description Creates a new raw image view for a given image
     * @param {Image} image - The image to create a view for
     * @returns {FlexDomView} The created raw image view
     * @category UI Components
     */
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

    /**
     * @description Sets the image from a data URL
     * @param {String} dataURL - The data URL of the image
     * @returns {ImageView} The ImageView instance
     * @category Data
     */
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