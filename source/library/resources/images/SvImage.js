/**
 * @module library.resources.images
 */

/**
 * @class SvImage
 * @extends SvResource
 * @classdesc Represents an image resource.
 */
(class SvImage extends BMResource {
    
    /**
     * @static
     * @description Returns an array of supported file extensions for images.
     * @returns {string[]} An array of supported file extensions.
     * @category File Management
     */
    static supportedExtensions () {
        return ["apng", "avif", "gif", "jpg", "jpeg", "jfif", "pjpeg", "pjp", "png", "webp", /* these aren't well supported -> */ "tif", "tiff", "ico", "cur", "bmp"]
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
        return this.path().fileName()
    }

    /**
     * @description Gets the subtitle of the image, which is the file extension.
     * @returns {string} The file extension of the image.
     * @category Metadata
     */
    subtitle () {
        return this.path().pathExtension()
    }

    /**
     * @description Called when the image has finished loading.
     * @returns {SvImage} The current BMImage instance.
     * @category Lifecycle
     */
    onDidLoad () {
        super.onDidLoad()
        debugger;
        this.setDataUrl(this.data())
        return this
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