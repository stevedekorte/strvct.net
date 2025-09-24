/**
 * @module library.image
 */

/**
 * @class SvImageMosaic
 * @extends BaseNode
 * @classdesc Creates a horizontal mosaic of multiple images with configurable dividers.
 * All images are proportionally scaled to the same height for consistent reference sheets.
 * 
 * @example
 * // Create a character reference sheet for Midjourney
 * const mosaic = SvImageMosaic.clone();
 * mosaic.setDividerWidth(2);
 * mosaic.setDividerColor("#a0a0a0");
 * 
 * // Add character views (assumes SvImage instances are loaded)
 * mosaic.addImage(frontViewImage);
 * mosaic.addImage(sideViewImage);
 * mosaic.addImage(backViewImage);
 * 
 * // Compose the mosaic
 * const compositeImage = await mosaic.asyncCompose();
 * 
 * // Get as data URL for display or upload
 * const dataUrl = mosaic.compositeDataURL();
 * 
 * NOTES:
 * Recommended background color for reference images (on MidJourney) is:
 * Something around #7f7f7f (RGB 127,127,127) or 50% brightness.
 * ⚪ Other safe options
Light neutral gray (#d0d0d0) if your characters are mostly dark-clad.
Dark neutral gray (#404040) if your characters are mostly pale/light-clad.
 */
"use strict";

(class SvImageMosaic extends BaseNode {

    /**
     * @description Initializes the prototype slots for the SvImageMosaic class.
     * @category Initialization
     */
    initPrototypeSlots () {
        /**
         * @member {Array} images - Array of SvImage (or compatible) objects to compose
         * @category Data
         */
        {
            const slot = this.newSlot("images", null);
            slot.setSlotType("Array");
        }

        /**
         * @member {Image} compositeImage - The resulting composite image after mosaic generation
         * @category Data
         */
        {
            const slot = this.newSlot("compositeImage", null);
            slot.setSlotType("Image");
        }

        /**
         * @member {Number} dividerWidth - Width of the divider between images in pixels
         * @category Configuration
         */
        {
            const slot = this.newSlot("dividerWidth", 10);
            slot.setSlotType("Number");
        }

        /**
         * @member {String} dividerColor - Color of the divider between images (CSS color string)
         * @category Configuration
         */
        {
            const slot = this.newSlot("dividerColor", "#a0a0a0"); // good if background is #7f7f7f
            slot.setSlotType("String");
        }
    }

    /**
     * @description Initializes the prototype.
     * @category Initialization
     */
    initPrototype () {
    }

    /**
     * @description Initializes the instance.
     * @category Initialization
     */
    init () {
        super.init();
        this.setImages([]);
        return this;
    }

    /**
     * @description Adds an image to the mosaic
     * @param {SvImage|Image|Object} image - The image to add (SvImage object or Image element)
     * @returns {SvImageMosaic} Returns this for method chaining
     * @category Image Management
     */
    addImage (image) {
        this.images().push(image);
        return this;
    }

    /**
     * @description Adds multiple images to the mosaic at once
     * @param {Array<SvImage|Image|Object>} images - Array of images to add
     * @returns {SvImageMosaic} Returns this for method chaining
     * @category Image Management
     */
    addImages (images) {
        this.images().push(...images);
        return this;
    }

    /**
     * @description Clears all images from the mosaic
     * @returns {SvImageMosaic} Returns this for method chaining
     * @category Image Management
     */
    clearImages () {
        this.setImages([]);
        this.setCompositeImage(null);
        return this;
    }

    /**
     * @description Composes all images into a horizontal mosaic with colored dividers
     * @returns {Promise<Image>} The composite image
     * @category Composition
     */
    async asyncCompose () {
        const images = this.images();
        
        if (!images || images.length === 0) {
            console.warn("**WARNING**:", this.logPrefix(), "No images to compose");
            return null;
        }

        // Load all images first
        const loadedImages = await this.loadAllImages(images);
        
        // Calculate target height and scaled dimensions
        const targetHeight = this.calculateMaxHeight(loadedImages);
        const scaledDimensions = this.calculateScaledDimensions(loadedImages, targetHeight);
        const totalWidth = this.calculateTotalWidthFromDimensions(scaledDimensions);
        
        // Create canvas
        const canvas = document.createElement("canvas");
        canvas.width = totalWidth;
        canvas.height = targetHeight;
        
        const ctx = canvas.getContext("2d");
        
        // Fill background with divider color
        ctx.fillStyle = this.dividerColor();
        ctx.fillRect(0, 0, totalWidth, targetHeight);
        
        // Draw each image scaled to target height
        let xOffset = 0;
        for (let i = 0; i < loadedImages.length; i++) {
            const img = loadedImages[i];
            const { width: scaledWidth } = scaledDimensions[i];
            
            // Draw image scaled to target height
            ctx.drawImage(img, xOffset, 0, scaledWidth, targetHeight);
            
            // Move x offset for next image (including divider)
            xOffset += scaledWidth;
            
            // Add divider width if not the last image
            if (i < loadedImages.length - 1) {
                xOffset += this.dividerWidth();
            }
        }
        
        // Convert canvas to image
        const compositeImage = new Image();
        compositeImage.src = canvas.toDataURL("image/png");
        
        // Wait for the image to load
        await new Promise((resolve, reject) => {
            compositeImage.onload = resolve;
            compositeImage.onerror = reject;
        });
        
        this.setCompositeImage(compositeImage);
        
        return compositeImage;
    }

    /**
     * @description Loads all images and returns them as Image elements
     * @param {Array} images - Array of image sources
     * @returns {Promise<Array<Image>>} Array of loaded Image elements
     * @category Helper
     */
    async loadAllImages (images) {
        const promises = images.map(async (imageSource, index) => {
            // assume it's an SvImage
            console.log(`Loading image ${index + 1}/${images.length}`);
            
            // Get the dataURL directly to ensure we're using local data
            const dataUrl = imageSource.dataURL();
            if (!dataUrl) {
                throw new Error(`No dataURL for image ${index + 1}`);
            }
            
            // Create a fresh Image element for each one
            const img = new Image();
            
            // Don't set crossOrigin for dataURLs - it's not needed and can cause issues
            // img.crossOrigin = "anonymous"; // DON'T DO THIS for dataURLs
            
            return new Promise((resolve, reject) => {
                img.onload = () => {
                    console.log(`Image ${index + 1} loaded successfully`);
                    img.onload = null;
                    img.onerror = null;
                    resolve(img);
                };
                
                img.onerror = (error) => {
                    console.error(`Image ${index + 1} failed to load:`, error);
                    img.onload = null;
                    img.onerror = null;
                    reject(new Error(`Failed to load image ${index + 1}`));
                };
                
                // Set the dataURL as source
                img.src = dataUrl;
            });
        });
        
        return await Promise.all(promises);
    }

    /**
     * @description Calculates scaled dimensions for all images to match target height
     * @param {Array<Image>} images - Array of loaded Image elements
     * @param {Number} targetHeight - Target height for all images
     * @returns {Array<Object>} Array of {width, height} objects with scaled dimensions
     * @category Helper
     */
    calculateScaledDimensions (images, targetHeight) {
        return images.map(img => {
            const scale = targetHeight / img.height;
            return {
                width: Math.round(img.width * scale),
                height: targetHeight
            };
        });
    }

    /**
     * @description Calculates total width from pre-calculated scaled dimensions
     * @param {Array<Object>} dimensions - Array of {width, height} objects
     * @returns {Number} Total width in pixels including dividers
     * @category Helper
     */
    calculateTotalWidthFromDimensions (dimensions) {
        const imageWidths = dimensions.reduce((sum, dim) => sum + dim.width, 0);
        const dividerWidths = this.dividerWidth() * (dimensions.length - 1);
        return imageWidths + dividerWidths;
    }

    /**
     * @description Calculates the total width needed for the mosaic (deprecated - use scaled version)
     * @param {Array<Image>} images - Array of loaded Image elements
     * @returns {Number} Total width in pixels
     * @category Helper
     */
    calculateTotalWidth (images) {
        const imageWidths = images.reduce((sum, img) => sum + img.width, 0);
        const dividerWidths = this.dividerWidth() * (images.length - 1);
        return imageWidths + dividerWidths;
    }

    /**
     * @description Calculates the maximum height among all images
     * @param {Array<Image>} images - Array of loaded Image elements
     * @returns {Number} Maximum height in pixels
     * @category Helper
     */
    calculateMaxHeight (images) {
        return Math.max(...images.map(img => img.height));
    }

    /**
     * @description Gets the composite image as a data URL
     * @returns {string|null} Data URL of the composite image or null if not composed
     * @category Output
     */
    compositeDataURL () {
        const img = this.compositeImage();
        if (!img) {
            return null;
        }
        
        // If it's already a data URL in the src, return it
        if (img.src && img.src.startsWith("data:")) {
            return img.src;
        }
        
        // Otherwise, draw to canvas and get data URL
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0);
        return canvas.toDataURL("image/png");
    }

    /**
     * @description Gets the composite image as a Blob
     * @returns {Promise<Blob>} Blob of the composite image
     * @category Output
     */
    async compositeBlob () {
        const img = this.compositeImage();
        if (!img) {
            return null;
        }
        
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0);
        
        return new Promise((resolve) => {
            canvas.toBlob(resolve, "image/png");
        });
    }

}.initThisClass());