/**
 * @module library.node.node_views
 * @class VideoWellView
 * @extends NodeView
 * @classdesc VideoWellView
 * 
 * - designed to contain a VideoView
 * - can have its own frame and decoration
 * - supports drag & drop of videos
 * - supports standard video controls and playback
 */

"use strict";

(class VideoWellView extends NodeView {

    /**
     * @description Initializes prototype slots for the VideoWellView.
     * @category Initialization
     */
    initPrototypeSlots () {
        /**
         * @member {VideoView} videoView - The video view contained within this well.
         * @category View Management
         */
        {
            const slot = this.newSlot("videoView", null);
            slot.setSlotType("VideoView");
        }
        /**
         * @member {Boolean} isEditable - Determines if the video well is editable.
         * @category State Management
         */
        {
            const slot = this.newSlot("isEditable", true);
            slot.setSlotType("Boolean");
        }
    }

    /**
     * @description Initializes the VideoWellView.
     * @returns {VideoWellView} The initialized VideoWellView instance.
     * @category Initialization
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
        this.setMinHeightPx(200); // Bit taller than image well to accommodate controls
        this.setPadding("0px");
        return this;
    }

    /**
     * @description Synchronizes the view with its associated node.
     * @returns {VideoWellView} The current VideoWellView instance.
     * @category Synchronization
     */
    syncToNode () {
        super.syncToNode();
        if (this.videoView() && this.node()) {
            this.node().setDataUrl(this.videoView().dataURL());
        }
        this.tellParentViews("didUpdateVideoWellView", this);
        return this;
    }
    
    /**
     * @description Checks if the video well is editable.
     * @returns {Boolean} True if editable, false otherwise.
     * @category State Management
     */
    isEditable () {
        return this._isEditable;
    }
    
    /**
     * @description Sets the editable state of the video well.
     * @param {Boolean} aBool - The new editable state.
     * @returns {VideoWellView} The current VideoWellView instance.
     * @category State Management
     */
    setIsEditable (aBool) {
        this._isEditable = aBool;
        if (this.videoView()) {
            this.videoView().setIsEditable(aBool);
        }
        return this;
    }
    
    /**
     * @description Highlights the video well during drag operations.
     * @category Visual Feedback
     */
    dragHighlight () {
        this.setBackgroundColor("rgba(128, 128, 128, 0.5)");
    }
    
    /**
     * @description Removes the highlight from the video well after drag operations.
     * @category Visual Feedback
     */
    dragUnhighlight () {
        this.setBackgroundColor("transparent");
    }
    
    /**
     * @description Checks if the video well is full (contains a video).
     * @returns {Boolean} True if full, false otherwise.
     * @category State Management
     */
    isFull () {
        return this.subviews().length > 0;
    }
    
    /**
     * @description Determines if the video well accepts drops.
     * @param {Event} event - The drop event.
     * @returns {Boolean} Returns true if editable, otherwise false.
     * @category Drag and Drop
     */
    acceptsDrop (event) {
        return this.isEditable();
    }

    /**
     * @description Sets the value of the video well (its video data URL).
     * @param {string} aValue - The video data URL.
     * @returns {VideoWellView} The current VideoWellView instance.
     * @category Data Management
     */
    setValue (aValue) {
        this.setVideoDataUrl(aValue);
        return this;
    }

    /**
     * @description Gets the value of the video well (its video data URL).
     * @returns {string|null} The video data URL or null if not set.
     * @category Data Management
     */
    value () {
        return this.videoDataUrl();
    }
    
    /**
     * @description Sets the video data URL for the video well.
     * @param {string} dataURL - The video data URL or blob URL.
     * @returns {VideoWellView} The current VideoWellView instance.
     * @category Data Management
     */
    setVideoDataUrl (dataURL) {
        assert(!Type.isArray(dataURL));

        if (this.hasVideoUrl(dataURL)) {
            return this;
        }
        
        this.removeAllSubviews();

        const v = VideoView.clone();
        this.setVideoView(v);
        this.addSubview(v);

        if (!Type.isNullOrUndefined(dataURL) && Type.isString(dataURL)) {
            v.fetchDataURLFromSrc(dataURL);
            v.autoFitChildHeight();
            v.autoFitParentWidth();
        }

        return this;
    }

    /**
     * @description Checks if the video well already has the given video URL.
     * @param {string} url - The URL to check.
     * @returns {Boolean} True if the video well has the URL, false otherwise.
     * @category Data Management
     */
    hasVideoUrl (url) {
        const v = this.videoView();
        if (v) {
            if (url === v.dataURL() || url === v.srcUrl()) {
                return true;
            }
        }
        return false;
    }
    
    /**
     * @description Gets the current video data URL.
     * @returns {string|null} The video data URL or null if not set.
     * @category Data Management
     */
    videoDataUrl () {
        const v = this.videoView();
        if (v && v.dataURL()) {
            return v.dataURL();
        }
        return null;
    }
    
    // need these as method name is constructed from MIME type

    /**
     * @description Handles browser drop of MP4 videos.
     * @param {Object} dataChunk - The dropped video data.
     * @category Drag and Drop
     */
    onBrowserDropVideoMp4 (dataChunk) {
        this.droppedVideoData(dataChunk);
    }

    /**
     * @description Handles browser drop of WebM videos.
     * @param {Object} dataChunk - The dropped video data.
     * @category Drag and Drop
     */
    onBrowserDropVideoWebm (dataChunk) {
        this.droppedVideoData(dataChunk);
    }

    /**
     * @description Handles browser drop of Ogg videos.
     * @param {Object} dataChunk - The dropped video data.
     * @category Drag and Drop
     */
    onBrowserDropVideoOgg (dataChunk) {
        this.droppedVideoData(dataChunk);
    }

    /**
     * @description Processes dropped video data.
     * @param {Object} dataChunk - The dropped video data.
     * @returns {VideoWellView} The current VideoWellView instance.
     * @category Drag and Drop
     */
    droppedVideoData (dataChunk) {
        this.setVideoDataUrl(dataChunk.dataUrl());
        this.scheduleSyncToNode();
        return this;   
    }
    
    /**
     * @description Called before removing a subview.
     * @param {Object} aSubview - The subview being removed.
     * @returns {VideoWellView} The current VideoWellView instance.
     * @category View Management
     */
    willRemoveSubview (aSubview) {
        super.willRemoveSubview(aSubview);

        if (aSubview === this.videoView()) {
            this.setVideoView(null);
        }
        return this;
    }
    
}.initThisClass());