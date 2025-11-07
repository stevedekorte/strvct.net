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
 * // Add character views (assumes SvImageNode instances are loaded)
 * mosaic.addImageNode(frontViewImageNode);
 * mosaic.addImageNode(sideViewImageNode);
 * mosaic.addImageNode(backViewImageNode);
 *
 * // Compose the mosaic
 * await mosaic.asyncCompose();
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

(class SvImageMosaic extends SvSummaryNode {

    /**
     * @description Initializes the prototype slots for the SvImageMosaic class.
     * @category Initialization
     */
    initPrototypeSlots () {
        /**
         * @member {SvImagesNode} svImagesNode - Node containing SvImage objects to compose
         * @category Data
         */
        {
            const slot = this.newSlot("svImagesNode", null);
            slot.setLabel("Images to Composite");
            slot.setSlotType("SvImagesNode");
            slot.setFinalInitProto("SvImagesNode");
            slot.setCanInspect(true);
            slot.setShouldStoreSlot(true);
            slot.setSyncsToView(true);
            slot.setIsSubnodeField(true);
        }

        /**
         * @member {SvImageNode} compositeImageNode - The resulting composite image node after mosaic generation
         * @category Data
         */
        {
            const slot = this.newSlot("compositeImageNode", null);
            slot.setLabel("Composite Image");
            slot.setFinalInitProto("SvImageNode");
            slot.setCanInspect(true);
            slot.setShouldStoreSlot(true);
            slot.setSyncsToView(true);
            slot.setIsSubnodeField(true);
            slot.setFieldInspectorClassName("SvImageWellField");
        }

        // compose promise
        {
            const slot = this.newSlot("composePromise", null);
            slot.setSlotType("Promise");
        }

        /**
         * @member {Number} dividerWidth - Width of the divider between images in pixels
         * @category Configuration
         */
        {
            const slot = this.newSlot("dividerWidth", 10);
            slot.setSlotType("Number");
            slot.setIsSubnodeField(true);
            slot.setShouldStoreSlot(true);
            slot.setSyncsToView(true);
            slot.setCanEditInspection(true);
            slot.setSummaryFormat("key: value");
        }

        /**
         * @member {String} dividerColor - Color of the divider between images (CSS color string)
         * @category Configuration
         */
        {
            const slot = this.newSlot("dividerColor", "#a0a0a0"); // good if background is #7f7f7f
            slot.setSlotType("String");
            slot.setIsSubnodeField(true);
            slot.setShouldStoreSlot(true);
            slot.setSyncsToView(true);
            slot.setCanEditInspection(true);
            slot.setSummaryFormat("key: value");
        }

        // status
        {
            const slot = this.newSlot("status", "");
            slot.setLabel("Status");
            slot.setSlotType("String");
            slot.setShouldStoreSlot(true);
            slot.setSyncsToView(true);
            slot.setCanEditInspection(false);
            slot.setSummaryFormat("value");
        }

        // composite action
        {
            const slot = this.newSlot("compositeAction", null);
            slot.setSlotType("Action");
            slot.setLabel("Compose");
            slot.setIsSubnodeField(true);
            slot.setShouldStoreSlot(true);
            slot.setActionMethodName("asyncCompose");
        }

        // clear action
        {
            const slot = this.newSlot("clearAction", null);
            slot.setSlotType("Action");
            slot.setLabel("Clear");
            slot.setIsSubnodeField(true);
            slot.setShouldStoreSlot(true);
            slot.setActionMethodName("clear");
        }
    }

    /**
     * @description Initializes the prototype.
     * @category Initialization
     */
    initPrototype () {
        this.setTitle("Image Mosaic");
        this.setShouldStore(true);
        this.setShouldStoreSubnodes(false);
        this.setCanDelete(true);
    }

    finalInit () {
        super.finalInit();
        this.initPrototype();
        this.compositeImageNode().setTitle("Composite Image");
    }

    subtitle () {
        const parts = [];
        if (this.status().length > 0) {
            parts.push(this.status());
        }
        parts.push(this.svImagesNode().subnodeCount() + " images");
        //parts.push(this.dividerWidth() + "px divider");
        //parts.push(this.dividerColor());
        if (this.isComposed()) {
            parts.push("composed ✓");
        }
        return parts.join("\n");
    }

    isComposed () {
        return this.compositeImageNode().dataURL() !== null;
    }


    /**
     * @description Adds an image node to the mosaic
     * @param {SvImageNode} svImageNode - The image node to add
     * @returns {SvImageMosaic} Returns this for method chaining
     * @category Image Management
     */
    addImageNode (svImageNode) {
        this.svImagesNode().addSubnode(svImageNode);
        return this;
    }

    /**
     * @description Adds multiple image nodes to the mosaic at once
     * @param {Array<SvImageNode>} svImageNodeArray - Array of image nodes to add
     * @returns {SvImageMosaic} Returns this for method chaining
     * @category Image Management
     */
    addImageNodes (svImageNodeArray) {
        this.svImagesNode().addSubnodes(svImageNodeArray);
        return this;
    }

    /**
     * @description Clears all images from the mosaic
     * @returns {SvImageMosaic} Returns this for method chaining
     * @category Image Management
     */
    clear () {
        this.svImagesNode().removeAllSubnodes();
        this.setCompositeImageNode().clear();
        return this;
    }

    /**
     * @description Composes all images into a horizontal mosaic with colored dividers
     * @returns {Promise<SvImageNode>} The composite image node
     * @category Composition
     */
    async asyncCompose () {
        if (this.composePromise()) {
            return this.composePromise();
        }
        this.setComposePromise(Promise.clone());

        try {
            this.setStatus("Composing...");
            await this.asyncJustCompose();
            this.setStatus("Composed");
            this.composePromise().callResolveFunc(this.compositeImageNode());
        } catch (error) {
            this.setStatus(error.message);
            this.composePromise().callRejectFunc(error);
        }

        return this.composePromise();
    }

    async asyncJustCompose () {

        if (this.svImagesNode().subnodeCount() === 0) {
            console.warn("**WARNING**:", this.logPrefix(), "No images to compose");
            return null;
        }

        const imageObjects = await this.svImagesNode().asyncImageObjects();

        // Calculate target height and scaled dimensions
        const targetHeight = this.calculateMaxHeight(imageObjects);
        const scaledDimensions = this.calculateScaledDimensions(imageObjects, targetHeight);
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
        for (let i = 0; i < imageObjects.length; i++) {
            const img = imageObjects[i];
            const { width: scaledWidth } = scaledDimensions[i];

            // Draw image scaled to target height
            ctx.drawImage(img, xOffset, 0, scaledWidth, targetHeight);

            // Move x offset for next image (including divider)
            xOffset += scaledWidth;

            // Add divider width if not the last image
            if (i < imageObjects.length - 1) {
                xOffset += this.dividerWidth();
            }
        }

        // Convert canvas to data URL and create SvImageNode
        const dataURL = canvas.toDataURL("image/png");
        const compositeImageNode = this.compositeImageNode();
        compositeImageNode.setDataURL(dataURL);

        return compositeImageNode;
    }

    /**
     * @description Calculates scaled dimensions for all images to match target height
     * @param {Array<Image>} images - Array of loaded Image elements
     * @param {Number} targetHeight - Target height for all images
     * @returns {Array<Object>} Array of {width, height} objects with scaled dimensions
     * @category Helper
     */
    calculateScaledDimensions (imageObjects, targetHeight) {
        return imageObjects.map(img => {
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
    calculateTotalWidth (imageObjects) {
        const imageWidths = imageObjects.reduce((sum, img) => sum + img.width, 0);
        const dividerWidths = this.dividerWidth() * (imageObjects.length - 1);
        return imageWidths + dividerWidths;
    }

    /**
     * @description Calculates the maximum height among all images
     * @param {Array<Image>} images - Array of loaded Image elements
     * @returns {Number} Maximum height in pixels
     * @category Helper
     */
    calculateMaxHeight (imageObjects) {
        return Math.max(...imageObjects.map(img => img.height));
    }

    compositeDataURL () {
        return this.compositeImageNode().dataURL();
    }

}.initThisClass());
