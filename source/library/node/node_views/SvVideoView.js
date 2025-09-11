/**
 * @module library.node.node_views
 * @class SvVideoView
 * @extends NodeView
 * @classdesc SvVideoView is a specialized view for displaying videos with additional features like a close button, playback controls, and editability.
 */
"use strict";

(class SvVideoView extends NodeView {
    
    initPrototypeSlots () {
        /**
         * @member {FlexDomView} videoContainer - Container for the video
         * @category UI Components
         */
        {
            const slot = this.newSlot("videoContainer", null);
            slot.setSlotType("FlexDomView");
        }
        /**
         * @member {FlexDomView} rawVideoView - View for the raw video
         * @category UI Components
         */
        {
            const slot = this.newSlot("rawVideoView", null);
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
         * @member {FlexDomView} downloadButtonView - View for the download button
         * @category UI Components
         */
        {
            const slot = this.newSlot("downloadButtonView", null);
            slot.setSlotType("FlexDomView");
        }
        /**
         * @member {String} srcUrl - Source URL of the video
         * @category Data
         */
        {
            const slot = this.newSlot("srcUrl", null);
            slot.setSlotType("String");
        }
        /**
         * @member {String} dataURL - Data URL of the video
         * @category Data
         */
        {
            const slot = this.newSlot("dataURL", null);
            slot.setSyncsToNode(true);
            slot.setSlotType("String");
        }
        /**
         * @member {Boolean} isEditable - Indicates if the video view is editable
         * @category State
         */
        {
            const slot = this.newSlot("isEditable", false);
            slot.setSlotType("Boolean");
        }
        /**
         * @member {Boolean} hasControls - Indicates if the video should show playback controls
         * @category State
         */
        {
            const slot = this.newSlot("hasControls", true);
            slot.setSlotType("Boolean");
        }
        /**
         * @member {Boolean} autoplay - Indicates if the video should autoplay
         * @category State
         */
        {
            const slot = this.newSlot("autoplay", false);
            slot.setSlotType("Boolean");
        }
        /**
         * @member {Boolean} loop - Indicates if the video should loop
         * @category State
         */
        {
            const slot = this.newSlot("loop", false);
            slot.setSlotType("Boolean");
        }
        /**
         * @member {Boolean} muted - Indicates if the video should be muted
         * @category State
         */
        {
            const slot = this.newSlot("muted", false);
            slot.setSlotType("Boolean");
        }
    }

    initPrototype () {
    }

    /**
     * @description Initializes the VideoView
     * @returns {VideoView} The initialized VideoView instance
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

        // video container
        const vc = this.newVideoViewContainer();
        this.setVideoContainer(vc);
        this.addSubview(vc);

        // close button
        const cb = this.newCloseButtonView();
        this.setCloseButtonView(cb);
        this.addSubview(cb);

        // download button
        const db = this.newDownloadButtonView();
        this.setDownloadButtonView(db);
        this.addSubview(db);

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
        const v = ButtonView.clone().setElementClassName("VideoCloseButton");
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
     * @description Creates a new download button view
     * @returns {ButtonView} The created download button view
     * @category UI Components
     */
    newDownloadButtonView () {
        const v = ButtonView.clone().setElementClassName("VideoDownloadButton");
        v.setDisplay("flex");
        v.setPosition("absolute");
        v.setTitleIsVisible(false);
        v.setTopPx(0);
        v.setRightPx(30); // Position next to close button
        v.setTarget(this).setAction("downloadVideo");
        v.setIconName("download"); // This might need to be a different icon name based on available icons
        return v;
    }

    /**
     * @description Creates a new video view container
     * @returns {FlexDomView} The created video view container
     * @category UI Components
     */
    newVideoViewContainer () {
        const v = FlexDomView.clone().setElementClassName("VideoViewVideoContainer");
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
     * @description Sets whether the video view is editable
     * @param {Boolean} aBool - Whether the video view is editable
     * @returns {VideoView} The VideoView instance
     * @category State
     */
    setIsEditable (aBool) {
        this._isEditable = aBool;
        this.closeButtonView().setIsDisplayHidden(!aBool);
        this.downloadButtonView().setIsDisplayHidden(!aBool);
        return this;
    }

    /**
     * @description Sets whether the video view is editable (placeholder method)
     * @param {Boolean} aBool - Whether the video view is editable
     * @returns {VideoView} The VideoView instance
     * @category State
     */
    setEditable (aBool) {
        // to avoid editable content?
        if (aBool) {
            console.warn("setEditable is not implemented for " + this.type());
        }
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
     * @description Collapses the video view
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
     * @description Closes the video view with an animation
     * @category UI Operations
     */
    close () {
        const seconds = 0.3;
		
        this.collapse();
        
        this.addTimeout( () => { 
            this.closeButtonView().hideDisplay();
            const parentView = this.parentView();
            this.removeFromParentView();
            parentView.scheduleSyncToNode();
        }, seconds * 1000);
    }

    /**
     * @description Checks if the view has a specific video URL
     * @param {String} url - The URL to check
     * @returns {Boolean} Whether the view has the specified video URL
     * @category Data
     */
    hasVideoUrl (url) {
        return (url === this.dataURL() || url === this.srcUrl());
    }
    
    /**
     * @description Removes the raw video view
     * @returns {VideoView} The VideoView instance
     * @category UI Operations
     */
    removeRawVideoView () {
        if (this.rawVideoView()) {
            this.videoContainer().removeSubview(this.rawVideoView());
            this.setRawVideoView(null);
        }
        return this;
    }
    
    /**
     * @description Fetches the data URL from a source URL
     * @param {String} src - The source URL
     * @returns {VideoView} The VideoView instance
     * @category Data
     */
    async asyncFetchDataURLFromSrc (src) {
        if (src.startsWith("data:")) {
	        this.setFromDataURL(src);
        } else {
            // For regular URLs, we just use them directly
            this.setSrcUrl(src);
            this.setFromSrcURL(src);
        }
		
        return this;
    }
    
    /**
     * @description Callback for when the data URL is fetched
     * @param {String} dataURL - The fetched data URL
     * @returns {VideoView} The VideoView instance
     * @category Data
     */
    didFetchDataUrl (dataURL) {
        this.setFromDataURL(dataURL);
        return this;
    }

    /**
     * @description Creates a new raw video view for a given video element
     * @param {HTMLVideoElement} videoElement - The video element to create a view for
     * @returns {FlexDomView} The created raw video view
     * @category UI Components
     */
    newRawVideoViewForVideo (videoElement) {
        const v = FlexDomView.clone().setElement(videoElement).setElementClassName("RawVideoView");
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
     * @description Sets the video from a source URL
     * @param {String} srcURL - The source URL of the video
     * @returns {VideoView} The VideoView instance
     * @category Data
     */
    setFromSrcURL (srcURL) {
        this.removeRawVideoView();
        this.setSrcUrl(srcURL);
        this.setDataURL(srcURL); // Store the URL directly, unlike images we don't convert to data URL

        const video = document.createElement("video");
        video.src = srcURL;
        video.controls = this.hasControls();
        video.autoplay = this.autoplay();
        video.loop = this.loop();
        video.muted = this.muted();
        
        // Ensure video controls are interactive
        video.style.userSelect = "auto";
        video.style.pointerEvents = "auto";
        
        // Note: Drag-to-desktop for binary files is severely limited by browser security.
        // Instead, we rely on the download button and right-click "Save video as..." options.
        
        const v = this.newRawVideoViewForVideo(video);
        this.setRawVideoView(v);
        this.videoContainer().addSubview(v);
	
        return this;
    }

    /**
     * @description Sets the video from a data URL
     * @param {String} dataURL - The data URL of the video
     * @returns {VideoView} The VideoView instance
     * @category Data
     */
    setFromDataURL (dataURL) {
        assert(!Type.isNull(dataURL));
        assert(dataURL.startsWith("data:"));

        this.removeRawVideoView();
        this.setDataURL(dataURL);

        const video = document.createElement("video");
        video.src = dataURL;
        video.controls = this.hasControls();
        video.autoplay = this.autoplay();
        video.loop = this.loop();
        video.muted = this.muted();

        // Ensure video controls are interactive
        video.style.userSelect = "auto";
        video.style.pointerEvents = "auto";
        
        // Note: Drag-to-desktop for binary files is severely limited by browser security.
        // Instead, we rely on the download button and right-click "Save video as..." options.

        const v = this.newRawVideoViewForVideo(video);
        this.setRawVideoView(v);
        this.videoContainer().addSubview(v);
	
        return this;
    }

    /**
     * @description Updates video controls when settings change
     * @returns {VideoView} The VideoView instance
     * @category UI Operations
     */
    updateVideoControls () {
        if (this.rawVideoView()) {
            const video = this.rawVideoView().element();
            if (video) {
                video.controls = this.hasControls();
                video.autoplay = this.autoplay();
                video.loop = this.loop();
                video.muted = this.muted();
            }
        }
        return this;
    }

    /**
     * @description Sets whether the video has controls
     * @param {Boolean} aBool - Whether the video has controls
     * @returns {VideoView} The VideoView instance
     * @category State
     */
    setHasControls (aBool) {
        this._hasControls = aBool;
        this.updateVideoControls();
        return this;
    }

    /**
     * @description Sets whether the video autoplays
     * @param {Boolean} aBool - Whether the video autoplays
     * @returns {VideoView} The VideoView instance
     * @category State
     */
    setAutoplay (aBool) {
        this._autoplay = aBool;
        this.updateVideoControls();
        return this;
    }

    /**
     * @description Sets whether the video loops
     * @param {Boolean} aBool - Whether the video loops
     * @returns {VideoView} The VideoView instance
     * @category State
     */
    setLoop (aBool) {
        this._loop = aBool;
        this.updateVideoControls();
        return this;
    }

    /**
     * @description Sets whether the video is muted
     * @param {Boolean} aBool - Whether the video is muted
     * @returns {VideoView} The VideoView instance
     * @category State
     */
    setMuted (aBool) {
        this._muted = aBool;
        this.updateVideoControls();
        return this;
    }

    /**
     * @description Plays the video
     * @returns {VideoView} The VideoView instance
     * @category Playback Control
     */
    play () {
        if (this.rawVideoView()) {
            const video = this.rawVideoView().element();
            if (video) {
                video.play();
            }
        }
        return this;
    }

    /**
     * @description Pauses the video
     * @returns {VideoView} The VideoView instance
     * @category Playback Control
     */
    pause () {
        if (this.rawVideoView()) {
            const video = this.rawVideoView().element();
            if (video) {
                video.pause();
            }
        }
        return this;
    }

    /**
     * @description Stops the video and resets to beginning
     * @returns {VideoView} The VideoView instance
     * @category Playback Control
     */
    stop () {
        if (this.rawVideoView()) {
            const video = this.rawVideoView().element();
            if (video) {
                video.pause();
                video.currentTime = 0;
            }
        }
        return this;
    }


    /**
     * @description Gets file extension from MIME type
     * @param {String} mimeType - The MIME type
     * @returns {String} The file extension
     * @category File Operations
     */
    getFileExtensionFromMimeType (mimeType) {
        const mimeToExt = {
            "video/mp4": "mp4",
            "video/webm": "webm",
            "video/ogg": "ogv",
            "video/avi": "avi",
            "video/mov": "mov",
            "video/quicktime": "mov"
        };
        return mimeToExt[mimeType] || "mp4";
    }

    /**
     * @description Downloads the video to the user's computer
     * @returns {VideoView} The VideoView instance
     * @category File Operations
     */
    downloadVideo () {
        const dataURL = this.dataURL();
        if (!dataURL) {
            console.warn("No video data available for download");
            return this;
        }

        try {
            // Determine file extension and filename
            let filename = "video.mp4";
            let downloadUrl = dataURL;
            
            if (dataURL.startsWith("data:")) {
                const mimeMatch = dataURL.match(/^data:([^;]+)/);
                const mimeType = mimeMatch ? mimeMatch[1] : "video/mp4";
                const extension = this.getFileExtensionFromMimeType(mimeType);
                filename = `video.${extension}`;
                
                // For large data URLs, convert to blob URL for better browser support
                try {
                    const base64Data = dataURL.split(',')[1];
                    const byteCharacters = atob(base64Data);
                    const byteNumbers = new Array(byteCharacters.length);
                    for (let i = 0; i < byteCharacters.length; i++) {
                        byteNumbers[i] = byteCharacters.charCodeAt(i);
                    }
                    const byteArray = new Uint8Array(byteNumbers);
                    const blob = new Blob([byteArray], { type: mimeType });
                    downloadUrl = URL.createObjectURL(blob);
                    
                    // Clean up blob URL after download
                    this.addTimeout(() => URL.revokeObjectURL(downloadUrl), 30000);
                } catch (blobError) {
                    console.warn("Failed to create blob URL, using data URL directly:", blobError);
                    // downloadUrl remains as dataURL
                }
            }

            // Create a temporary anchor element for download
            const link = document.createElement("a");
            link.href = downloadUrl;
            link.download = filename;
            link.style.display = "none";
            
            // Add to DOM, click, and remove
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            this.log("Video download initiated:", filename);
        } catch (error) {
            console.error("Failed to download video:", error);
            
            // Fallback: try to open in new window
            try {
                const newWindow = window.open(dataURL, "_blank");
                if (!newWindow) {
                    console.warn("Popup blocked. Please allow popups or try right-clicking the video and selecting 'Save as...'");
                }
            } catch (fallbackError) {
                console.error("Fallback download also failed:", fallbackError);
            }
        }
        
        return this;
    }
    
}.initThisClass());