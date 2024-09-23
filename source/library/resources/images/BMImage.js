/**
 * @module library.resources.images
 */

/**
 * @class BMImage
 * @extends BMResource
 * @classdesc Represents an image resource.
 */
(class BMImage extends BMResource {
    
    /**
     * @static
     * @description Returns an array of supported file extensions for images.
     * @returns {string[]} An array of supported file extensions.
     */
    static supportedExtensions () {
        return ["apng", "avif", "gif", "jpg", "jpeg", "jfif", "pjpeg", "pjp", "png", "webp", /* these aren't well supported -> */ "tif", "tiff", "ico", "cur", "bmp"]
    }

    /**
     * @description Initializes the prototype slots for the BMImage class.
     */
    initPrototypeSlots () {
        /*
        {
            const slot = this.newSlot("path", "");
            slot.setSlotType("String");
        }
        */
        /**
         * @property {string} dataURL - The data URL of the image.
         */
        {
            const slot = this.newSlot("dataURL", "");
            slot.setSlotType("String");
        }
    }

    /**
     * @description Initializes the prototype for the BMImage class.
     */
    initPrototype () {
    }

    /**
     * @description Gets the title of the image, which is the file name.
     * @returns {string} The file name of the image.
     */
    title () {
        return this.path().fileName()
    }

    /**
     * @description Gets the subtitle of the image, which is the file extension.
     * @returns {string} The file extension of the image.
     */
    subtitle () {
        return this.path().pathExtension()
    }

    /**
     * @description Called when the image has finished loading.
     * @returns {BMImage} The current BMImage instance.
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