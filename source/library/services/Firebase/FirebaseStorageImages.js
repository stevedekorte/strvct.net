"use strict";

/**
 * @module library.services.Firebase
 */

/**
 * @class FirebaseStorageImages
 * @extends SvJsonArrayNode
 * @classdesc Collection of Firebase Storage images for testing and management
 * 
 * This class provides a UI for managing and testing Firebase Storage image uploads.
 * Images can be added, uploaded, and their public URLs can be tested.
 */
(class FirebaseStorageImages extends SvJsonArrayNode {

    initPrototypeSlots () {
        // Add image action
        {
            const slot = this.newSlot("addImageAction", null);
            slot.setInspectorPath("");
            slot.setLabel("Add Test Image");
            slot.setSyncsToView(true);
            slot.setDuplicateOp("duplicate");
            slot.setSlotType("Action");
            //slot.setIsSubnodeField(true);
            slot.setActionMethodName("addTestImage");
        }

        // Clear all action
        {
            const slot = this.newSlot("clearAllAction", null);
            slot.setInspectorPath("");
            slot.setLabel("Clear All Images");
            slot.setSyncsToView(true);
            slot.setDuplicateOp("duplicate");
            slot.setSlotType("Action");
            //slot.setIsSubnodeField(true);
            slot.setActionMethodName("clearAllImages");
        }

        // Upload all action
        {
            const slot = this.newSlot("uploadAllAction", null);
            slot.setInspectorPath("");
            slot.setLabel("Upload All Images");
            slot.setSyncsToView(true);
            slot.setDuplicateOp("duplicate");
            slot.setSlotType("Action");
            //slot.setIsSubnodeField(true);
            slot.setActionMethodName("uploadAllImages");
        }
    }

    initPrototype () {
        this.setShouldStore(true);
        this.setShouldStoreSubnodes(true);
        this.setSubnodeClasses([FirebaseStorageImage]);
        this.setNodeCanAddSubnode(true);
        this.setNodeCanReorderSubnodes(true);
        this.setNodeCanEditTitle(false);
        this.setTitle("Firebase Images");
        this.setSubtitle("Test image uploads");
        this.setNodeFillsRemainingWidth(false);
    }

    finalInit () {
        super.finalInit();
        this.setTitle("Firebase Images");
    }

    /**
     * @description Gets the subtitle showing image counts
     * @returns {string} The subtitle
     * @category UI
     */
    subtitle () {
        const total = this.subnodeCount();
        const uploaded = this.subnodes().filter(img => img.hasPublicUrl()).length;
        const pending = total - uploaded;
        
        if (total === 0) {
            return "No images";
        } else if (pending === 0) {
            return `${total} image${total !== 1 ? 's' : ''} uploaded`;
        } else {
            return `${uploaded}/${total} uploaded, ${pending} pending`;
        }
    }

    /**
     * @description Adds a test image with sample data
     * @returns {FirebaseStorageImage} The new image
     * @category Actions
     */
    addTestImage () {
        const image = FirebaseStorageImage.clone();
        const timestamp = Date.now();
        image.setImageLabel(`Test Image ${timestamp}`);
        
        // Create a simple test image data URL (1x1 pixel red PNG)
        const testDataUrl = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==";
        image.setDataUrl(testDataUrl);
        
        this.addSubnode(image);
        return image;
    }

    /**
     * @description Adds an image from file selection
     * @returns {Promise<FirebaseStorageImage>} The new image
     * @category Actions
     */
    async addImageFromFile () {
        return new Promise((resolve, reject) => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/*';
            
            input.onchange = async (e) => {
                const file = e.target.files[0];
                if (file) {
                    const image = FirebaseStorageImage.clone();
                    image.setImageLabel(file.name);
                    await image.setFromFile(file);
                    this.addSubnode(image);
                    resolve(image);
                } else {
                    reject(new Error('No file selected'));
                }
            };
            
            input.click();
        });
    }

    /**
     * @description Clears all images from the collection
     * @category Actions
     */
    clearAllImages () {
        this.removeAllSubnodes();
    }

    /**
     * @description Uploads all images that haven't been uploaded yet
     * @returns {Promise<void>}
     * @category Actions
     */
    async uploadAllImages () {
        const pendingImages = this.subnodes().filter(img => 
            img.hasDataUrl() && !img.hasPublicUrl()
        );
        
        if (pendingImages.length === 0) {
            console.log("No images to upload");
            return;
        }
        
        console.log(`Uploading ${pendingImages.length} images...`);
        
        const uploadPromises = pendingImages.map(img => 
            img.uploadToFirebase().catch(error => {
                console.error(`Failed to upload ${img.imageLabel()}:`, error);
                return null;
            })
        );
        
        await Promise.all(uploadPromises);
        console.log("Upload complete");
    }

    /**
     * @description Gets action info for add image action
     * @returns {Object} Action info
     * @category Actions
     */
    addImageActionInfo () {
        return {
            isEnabled: true,
            isVisible: true
        };
    }

    /**
     * @description Gets action info for clear all action
     * @returns {Object} Action info
     * @category Actions
     */
    clearAllActionInfo () {
        return {
            isEnabled: this.subnodeCount() > 0,
            isVisible: true
        };
    }

    /**
     * @description Gets action info for upload all action
     * @returns {Object} Action info
     * @category Actions
     */
    uploadAllActionInfo () {
        const hasUnuploadedImages = this.subnodes().some(img => 
            img.hasDataUrl() && !img.hasPublicUrl()
        );
        
        return {
            isEnabled: hasUnuploadedImages,
            isVisible: true
        };
    }

    /**
     * @description Returns the accepted subnode types for drag and drop
     * @returns {Array} Array of accepted class names
     * @category DragDrop
     */
    acceptedSubnodeTypes () {
        return ["FirebaseStorageImage"];
    }

    /**
     * @description Returns true if this node can accept the given subnode
     * @param {Object} aNode - The node to check
     * @returns {boolean} True if can accept
     * @category DragDrop
     */
    canAddSubnode (aNode) {
        return aNode.type() === "FirebaseStorageImage";
    }

}.initThisClass());