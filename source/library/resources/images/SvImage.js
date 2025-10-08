/**
 * @module library.resources.images
 */

/**
 * @class SvImage
 * @extends SvResource
 * @classdesc Represents an image resource.
 */
(class SvImage extends SvResource {

    /**
     * @static
     * @description Returns an array of supported file extensions for images.
     * @returns {string[]} An array of supported file extensions.
     * @category File Management
     */
    static supportedExtensions () {
        return ["apng", "avif", "gif", "jpg", "jpeg", "jfif", "pjpeg", "pjp", "png", "webp", /* these aren't well supported -> */ "tif", "tiff", "ico", "cur", "bmp"];
    }

    /**
     * @description Initializes the prototype slots for the SvImage class.
     * @category Initialization
     */
    initPrototypeSlots () {
        /*
        {
            const slot = this.newSlot("path", "");
            slot.setSlotType("String");
        }
        */
        /**
         * @member {string} dataURL - The data URL of the image.
         * @category Data
         */
        {
            const slot = this.newSlot("dataURL", "");
            slot.setSlotType("String");
        }

        {
            const slot = this.newSlot("hexSha256Hash", "");
            slot.setSlotType("String");
        }

        {
            const slot = this.newSlot("imageObject", false);
            slot.setSlotType("Image");
        }
    }

    /**
     * @description Initializes the prototype slots for the SvImage class.
     * @category Initialization
     */
    initPrototype () {
    }

    /**
     * @description Gets the title of the image, which is the file name.
     * @returns {string} The file name of the image.
     * @category Metadata
     */
    title () {
        return this.path().fileName();
    }

    /**
     * @description Gets the subtitle of the image, which is the file extension.
     * @returns {string} The file extension of the image.
     * @category Metadata
     */
    subtitle () {
        return this.path().pathExtension();
    }

    onUpdateSlotDataURL () {
        this.setHexSha256Hash(null);
        // we'll lazily calculate the hash if/when needed
    }

    /**
     * @description Called when the image has finished loading.
     * @returns {SvImage} The current SvImage instance.
     * @category Lifecycle
     */
    onDidLoad () {
        super.onDidLoad();
        this.setDataUrl(this.data());
        return this;
    }

    isLoaded () {
        return this.dataURL() !== null;
    }

    assertValidDataURL () {
        const dataURL = this.dataURL();
        assert(dataURL, "dataURL is not set");
        assert(dataURL.length > 0, "dataURL is empty");
        assert(dataURL.startsWith("data:image/"), "dataURL does not start with data:image/");
    }

    async asyncAsImageObject () {
        await this.asyncLoadIfNeeded();
        this.assertValidDataURL();

        if (!this.imageObject()) {
            const image = new Image();
            image.src = this.dataURL();
            this.setImageObject(image);
        }

        return this.imageObject();
    }

    asImageObject () {
        this.assertValidDataURL();

        const image = new Image();
        image.src = this.dataURL();
        return image;
    }

    hasDataURL () {
        return this.dataURL() && this.dataURL().length > 0;
    }

    /**
     * @description Gets the image data URL, checking both dataURL and path slots.
     * @returns {string|null} The data URL or path of the image.
     * @category Data
     */
    getImageData () {
        // Try dataURL first, then path
        const dataUrl = this.dataURL();
        if (dataUrl && dataUrl.length > 0) {
            return dataUrl;
        }

        const path = this.path();
        if (path && path.length > 0) {
            return path;
        }
        return null;
    }

    /*
    // this code should be on UI side

    canvasForImage () {
        // now just to show that passing to a canvas doesn't hold the same results
        const canvas = document.createElement("canvas");
        canvas.width = myImage.naturalWidth;
        canvas.height = myImage.naturalHeight;
        canvas.getContext("2d").drawImage(myImage, 0, 0);
    }
    */

}.initThisClass());
