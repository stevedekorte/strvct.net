"use strict";

/**
 * @module library.services.Firebase
 */

/**
 * @class FirestoreImages
 * @extends SvJsonArrayNode
 * @classdesc Collection of Firestore images for testing and management
 * 
 * This class provides a UI for managing and testing Firestore image uploads.
 * Images can be added, uploaded, and their public URLs can be tested.
 */
(class FirestoreImages extends SvJsonArrayNode {

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


    }

    initPrototype () {
        this.setShouldStore(true);
        this.setShouldStoreSubnodes(true);
        this.setSubnodeClasses([FirestoreImage]);
        this.setNodeCanAddSubnode(true);
        this.setNodeCanReorderSubnodes(true);
        this.setNodeCanEditTitle(false);
        this.setTitle("Firestore Images");
        this.setSubtitle("Test image uploads");
        this.setNodeFillsRemainingWidth(false);
    }

    finalInit () {
        super.finalInit();
        this.setTitle("Firestore Images");
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
     * @returns {FirestoreImage} The new image
     * @category Actions
     */
    addTestImage () {
        const image = FirestoreImage.clone();
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
     * @returns {Promise<FirestoreImage>} The new image
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
                    const image = FirestoreImage.clone();
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
     * @description Returns the accepted subnode types for drag and drop
     * @returns {Array} Array of accepted class names
     * @category DragDrop
     */
    acceptedSubnodeTypes () {
        return ["FirestoreImage"];
    }

    /**
     * @description Returns true if this node can accept the given subnode
     * @param {Object} aNode - The node to check
     * @returns {boolean} True if can accept
     * @category DragDrop
     */
    canAddSubnode (aNode) {
        return aNode.svType() === "FirestoreImage";
    }

    /**
     * @description Adds and uploads an SvImage to Firestore
     * @param {SvImage} svImage - The SvImage to upload
     * @returns {Promise<FirestoreImage>} The FirestoreImage after upload completes
     * @category Upload
     */
    async asyncAddSvImage (svImage) {
        assert(svImage && svImage.isKindOf(SvImage), "SvImage is not a valid SvImage");
        assert(svImage.hasDataURL(), "SvImage has no dataURL");

        // Return existing FirestoreImage if it exists
        const label = await svImage.asyncGetHashFileName();
        const existingImage = this.subnodeWithLabel(label);
        if (existingImage) {
            await existingImage.asyncCompleteUploadIfNeeded(); // in case it was added by another thread but not completed
            return existingImage;
        }

        // Otherwise, create and add new FirestoreImage
        const fbImage = FirestoreImage.clone();        
        fbImage.setDataUrl(svImage.dataURL());        
        fbImage.setImageLabel(label);
        this.addSubnode(fbImage);

        // Upload to Firebase with the hash-based filename
        try {
            // The uploadToFirebase method will use the imageLabel as the filename
            await fbImage.uploadToFirebase();
            console.log(`FirestoreImages.asyncAddSvImage: Successfully uploaded ${label}`);
        } catch (error) {
            console.error(`FirestoreImages.asyncAddSvImage: Failed to upload ${label}:`, error);
            throw error;
        }
        
        return fbImage;
    }

    subnodeWithLabel (label) {
        return this.subnodes().find(img => img.imageLabel() === label);
    }

    async asyncFirestoreImageForSvImage (svImage) {
        const fbImage = await this.asyncAddSvImage(svImage);
        return fbImage;
    }

}.initThisClass());