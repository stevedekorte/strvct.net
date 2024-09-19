/**
 * @module library.node.node_views
 * @class ImageWellView
 * @extends NodeView
 * @classdesc ImageWellView
 * 
 * - designed to contain an ImageView
 * - can have its own frame and decoration
 * - supports drag & drop of images
 */

"use strict";

(class ImageWellView extends NodeView {

    /**
     * @description Initializes prototype slots for the ImageWellView.
     */
    initPrototypeSlots () {
        /**
         * @property {ImageView} imageView - The image view contained within this well.
         */
        {
            const slot = this.newSlot("imageView", null);
            slot.setSlotType("ImageView");
        }
        /**
         * @property {Boolean} isEditable - Determines if the image well is editable.
         */
        {
            const slot = this.newSlot("isEditable", true);
            slot.setSlotType("Boolean");
        }
    }

    /**
     * @description Initializes the ImageWellView.
     * @returns {ImageWellView} The initialized ImageWellView instance.
     */
    init () {
        super.init();
        this.setDisplay("flex");
        this.setPosition("relative");
        this.setJustifyContent("center");
        this.setAlignItems("center");
        this.setMinHeight("10em");
        this.setMinWidth("10em");
        this.setOverflowX("hidden");
        this.setOverflowY("hidden");
        this.setBorder("1px solid #444");
        this.setColor("white");
        this.setBackgroundColor("transparent");

        this.setIsRegisteredForBrowserDrop(true);
        this.dragUnhighlight();
        this.turnOffUserSelect();
        this.autoFitParentWidth();
        this.autoFitChildHeight();
        this.setMinHeightPx(100);
        this.setPadding("0px");
        return this;
    }

    /**
     * @description Synchronizes the view with its associated node.
     * @returns {ImageWellView} The current ImageWellView instance.
     */
    syncToNode () {
        super.syncToNode();
        if (this.imageView()) {
            this.node().setDataUrl(this.imageView().dataURL()); // untested
        }
        this.tellParentViews("didUpdateImageWellView", this);
        return this
    }
    
    /**
     * @description Checks if the image well is editable.
     * @returns {Boolean} True if editable, false otherwise.
     */
    isEditable () {
        // we need this to override the normal isContentEditable return value
        return this._isEditable;
    }
    
    /**
     * @description Sets the editable state of the image well.
     * @param {Boolean} aBool - The new editable state.
     * @returns {ImageWellView} The current ImageWellView instance.
     */
    setIsEditable (aBool) {
        this._isEditable = aBool;
        if (this.imageView()) {
            this.imageView().setIsEditable(aBool);
        }
        return this;
    }
    
    /**
     * @description Highlights the image well during drag operations.
     */
    dragHighlight () {
        this.setBackgroundColor("rgba(128, 128, 128, 0.5)");
    }
    
    /**
     * @description Removes the highlight from the image well after drag operations.
     */
    dragUnhighlight () {
        this.setBackgroundColor("transparent");
    }
    
    /**
     * @description Checks if the image well is full (contains an image).
     * @returns {Boolean} True if full, false otherwise.
     */
    isFull () {
        //console.log("this.imageView().dataURL()  = ", this.imageView().dataURL() );
        return this.subviews().length > 0;
    }
    
    /**
     * @description Determines if the image well accepts drops.
     * @param {Event} event - The drop event.
     * @returns {Boolean} Always returns true in this implementation.
     */
    acceptsDrop (event) {
        return true;
        //return this.isEditable();     
    }

    /*
    onBrowserDrop (event) {
        return super.onBrowserDrop(event);
    }

    onBrowserDragOver (event) {
        const r =  super.onBrowserDragOver(event);
        //console.log(this.debugTypeId() + " onBrowserDragOver() -> " + r);
        return r;
    }
    */

    /**
     * @description Sets the value of the image well (its image data URL).
     * @param {string} aValue - The image data URL.
     * @returns {ImageWellView} The current ImageWellView instance.
     */
    setValue (aValue) {
        this.setImageDataUrl(aValue)
        return this
    }

    /**
     * @description Gets the value of the image well (its image data URL).
     * @returns {string|null} The image data URL or null if not set.
     */
    value () {
        return this.imageDataUrl()
    }
    
    /**
     * @description Sets the image data URL for the image well.
     * @param {string} dataURL - The image data URL.
     * @returns {ImageWellView} The current ImageWellView instance.
     */
    setImageDataUrl (dataURL) {
        assert(!Type.isArray(dataURL)) 

        if (this.hasImageUrl(dataURL)) {
            return this
        }
        
        this.removeAllSubviews()

        const v = ImageView.clone()
        this.setImageView(v)
        this.addSubview(v)

        if (!Type.isNullOrUndefined(dataURL) && Type.isString(dataURL)) {
            /*
            const v = ImageView.clone()
            this.setImageView(v)
            this.addSubview(v)
            */

            v.fetchDataURLFromSrc(dataURL)
            v.autoFitChildHeight()
            v.autoFitParentWidth()
        }

        return this
    }

    /**
     * @description Checks if the image well already has the given image URL.
     * @param {string} url - The URL to check.
     * @returns {Boolean} True if the image well has the URL, false otherwise.
     */
    hasImageUrl (url) {
        const v = this.imageView()
        if (v) {
            if (url === v.dataURL() || url === v.srcUrl()) {
                return true
            }
        }
        return false
    }
    
    /**
     * @description Gets the current image data URL.
     * @returns {string|null} The image data URL or null if not set.
     */
    imageDataUrl () {
        const v = this.imageView()
        if (v && v.dataURL()) {
            return v.dataURL()
        }
        return null
    }
    

    // need these as method name is constructed from MIME type

    /**
     * @description Handles browser drop of JPEG images.
     * @param {Object} dataChunk - The dropped image data.
     */
    onBrowserDropImageJpeg (dataChunk) {
        this.droppedImageData(dataChunk)
    }

    /**
     * @description Handles browser drop of GIF images.
     * @param {Object} dataChunk - The dropped image data.
     */
    onBrowserDropImageGif (dataChunk) {
        this.droppedImageData(dataChunk)
    }

    /**
     * @description Handles browser drop of PNG images.
     * @param {Object} dataChunk - The dropped image data.
     */
    onBrowserDropImagePng (dataChunk) {
        this.droppedImageData(dataChunk)
    }

    // image data chunk

    /**
     * @description Processes dropped image data.
     * @param {Object} dataChunk - The dropped image data.
     * @returns {ImageWellView} The current ImageWellView instance.
     */
    droppedImageData (dataChunk) {
        this.setImageDataUrl(dataChunk.dataUrl())
        this.scheduleSyncToNode();
        return this        
    }
    
    /**
     * @description Called before removing a subview.
     * @param {Object} aSubview - The subview being removed.
     * @returns {ImageWellView} The current ImageWellView instance.
     */
    willRemoveSubview (aSubview) {
        super.willRemoveSubview(aSubview)

        if (aSubview === this.imageView()) {
            this.setImageView(null)
        }
        return this
    }
    
}.initThisClass());