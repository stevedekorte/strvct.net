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

        {
            const slot = this.newSlot("sha256Hash", "");
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

    onUpdateSlotImageData () {
        debugger;
        this.setSha256Hash(null);
        // we'll lazily calculate the hash if/when needed
    }

    /**
     * @description Called when the image has finished loading.
     * @returns {SvImage} The current SvImage instance.
     * @category Lifecycle
     */
    onDidLoad () {
        super.onDidLoad()
        debugger;
        this.setDataUrl(this.data())
        return this
    }

    isLoaded () {
        return this.dataURL() !== null;
    }

    async asyncAsImage () {
        await this.asyncLoadIfNeeded();
        return this.asImage();
    }

    asImage () {
        const image = new Image();
        image.src = this.dataURL();
        return image;
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


    async asyncSha256Hash () {
        if (!this.sha256Hash()) {
            this.setSha256Hash(await this.asyncCalculateSha256Hash());
        }

        return this.sha256Hash();
    }

    sha256Hash () {
        return this._sha256Hash;
    }

    async asyncCalculateSha256Hash () {
        const imageData = this.getImageData();
        if (!imageData) {
            throw new Error("No image data available for hashing");
        }

        // Check if it's a data URL or regular URL
        if (imageData.startsWith('data:')) {
            // Extract the base64 data part (after the comma)
            const base64Data = imageData.split(',')[1];
            if (!base64Data) {
                throw new Error("Invalid data URL format");
            }
            
            // Convert base64 to array buffer
            const binaryString = atob(base64Data);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
            }
            
            // Use the TypedArray's promiseSha256Digest method
            const hashBuffer = await bytes.promiseSha256Digest();
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
            return hashHex;
        } else {
            // For URLs, use String's promiseSha256Digest
            const hashBuffer = await imageData.promiseSha256Digest();
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
            return hashHex;
        }
    }

    /**
     * @description Generates a filename based on the SHA256 hash of the image content
     * @returns {Promise<string>} The filename in format "hash.extension" (e.g., "a3f5b8c9d2e1f4g6.png")
     * @category Utility
     */
    async asyncGetHashFileName () {
        const imageData = this.getImageData();
        if (!imageData) {
            throw new Error("No image data available for generating filename");
        }

        // Generate hash
        const hash = await this.asyncSha256Hash();
        
        // Determine file extension from data URL
        let extension = "png"; // default
        if (imageData.startsWith("data:image/")) {
            const mimeMatch = imageData.match(/^data:image\/([^;]+)/);
            if (mimeMatch && mimeMatch[1]) {
                extension = mimeMatch[1].toLowerCase();
                // Handle special cases
                if (extension === "jpeg") {
                    extension = "jpg";
                } else if (extension === "svg+xml") {
                    extension = "svg";
                }
            }
        }
        
        // Return filename with hash and extension
        return `${hash}.${extension}`;
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