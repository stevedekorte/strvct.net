"use strict";

/**
 * @module library.services.Firebase
 */

/**
 * @class FirestoreDocument
 * @extends SvStorableNode
 * @classdesc Represents a document stored in Firebase Firebase
 * 
 * FirestoreDatabase records
 * 
 */
(class FirestoreDocument extends SvSummaryNode {

    initPrototypeSlots () {

        {
            const slot = this.newSlot("storagePath", null);
            slot.setDescription("Firebase Storage path");
            slot.setSlotType("String");
            slot.setShouldStoreSlot(true);
            slot.setSyncsToView(true);
            slot.setIsSubnodeField(true);
        }

        {
            const slot = this.newSlot("publicUrl", null);
            slot.setDescription("Firebase Storage public URL. Set after upload.");
            slot.setSlotType("String");
            slot.setShouldStoreSlot(true);
            slot.setSyncsToView(true);
            slot.setIsSubnodeField(true);
        }


        // Upload status
        {
            const slot = this.newSlot("uploadStatus", "");
            slot.setSlotType("String");
            slot.setShouldStoreSlot(true);
            slot.setSyncsToView(true);
            slot.setIsSubnodeField(true);
            slot.setCanEditInspection(false);
        }

        // Error message
        {
            const slot = this.newSlot("error", "");
            slot.setSlotType("String");
            slot.setShouldStoreSlot(false);
            slot.setSyncsToView(true);
            slot.setIsSubnodeField(true);
            slot.setCanEditInspection(false);
        }

        // Upload action
        {
            const slot = this.newSlot("uploadAction", null);
            slot.setInspectorPath("");
            slot.setLabel("Upload to Firebase");
            slot.setSyncsToView(true);
            slot.setDuplicateOp("duplicate");
            slot.setSlotType("Action");
            slot.setIsSubnodeField(true);
            slot.setActionMethodName("uploadToFirebase");
        }

        // Delete action
        {
            const slot = this.newSlot("deleteAction", null);
            slot.setInspectorPath("");
            slot.setLabel("Delete from Firebase");
            slot.setSyncsToView(true);
            slot.setDuplicateOp("duplicate");
            slot.setSlotType("Action");
            slot.setIsSubnodeField(true);
            slot.setActionMethodName("deleteFromFirebase");
        }

        // Test download action
        {
            const slot = this.newSlot("testDownloadAction", null);
            slot.setInspectorPath("");
            slot.setLabel("Test Download");
            slot.setSyncsToView(true);
            slot.setDuplicateOp("duplicate");
            slot.setSlotType("Action");
            slot.setIsSubnodeField(true);
            slot.setActionMethodName("testDownload");
        }
    }

    initPrototype () {
        this.setShouldStore(true);
        this.setShouldStoreSubnodes(false);
        this.setNodeCanAddSubnode(false);
        this.setCanDelete(true);
    }

    /**
     * @description Gets the title for this image
     * @returns {string} The title
     * @category UI
     */
    title () {
        return this.storagePath();
    }

    /**
     * @description Gets the subtitle for this image
     * @returns {string} The subtitle
     * @category UI
     */
    subtitle () {
        if (this.error()) {
            return "Error: " + this.error();
        }
        if (this.uploadStatus()) {
            return this.uploadStatus();
        }
        if (this.hasPublicUrl()) {
            return "Uploaded";
        }
        if (this.hasDataUrl()) {
            return "Ready to upload";
        }
        return "No image";
    }

    /**
     * @description Checks if image has a data URL
     * @returns {boolean} True if has data URL
     * @category Status
     */
    hasDataUrl () {
        return this.dataUrl() !== null && this.dataUrl() !== "";
    }

    /**
     * @description Checks if image has been uploaded
     * @returns {boolean} True if uploaded
     * @category Status
     */
    hasPublicUrl () {
        return this.publicUrl() !== null && this.publicUrl() !== "";
    }


    /**
     * @description Uploads the image to Firebase Storage via AccountServer
     * @returns {Promise<void>}
     * @category Upload
     */
    async asyncUpload () {
      
        
    }

    /**
     * @description Deletes the image from Firebase Storage
     * @returns {Promise<void>}
     * @category Delete
     */
    async asyncDelete () {
  
        
    }

    /**
     * @description Gets action info for upload action
     * @returns {Object} Action info
     * @category Actions
     */
    uploadActionInfo () {
        return {
            isEnabled: this.hasDataUrl() && !this.hasPublicUrl(),
            isVisible: true
        };
    }

    /**
     * @description Gets action info for delete action
     * @returns {Object} Action info
     * @category Actions
     */
    deleteActionInfo () {
        return {
            isEnabled: this.hasPublicUrl(),
            isVisible: this.hasPublicUrl()
        };
    }

    /**
     * @description Checks if the public URL is still accessible
     * @returns {Promise<boolean>} True if accessible
     * @category Validation
     */
    async isUrlAccessible () {
        if (!this.hasPublicUrl()) {
            return false;
        }

        try {
            const response = await fetch(this.publicUrl(), { method: 'HEAD' });
            return response.ok;
        } catch (error) {
            console.error("URL accessibility check failed:", error);
            return false;
        }
    }

    /**
     * @description Re-uploads the image if the URL has expired
     * @returns {Promise<void>}
     * @category Upload
     */
    async reuploadIfNeeded () {
        const isAccessible = await this.isUrlAccessible();
        if (!isAccessible && this.hasDataUrl()) {
            console.log("Firebase URL not accessible, re-uploading...");
            // Clear old references
            this.setPublicUrl(null);
            this.setStoragePath(null);
            // Re-upload
            await this.uploadToFirebase();
        }
    }

    /**
     * @description Tests downloading the image from Firebase
     * @returns {Promise<void>}
     * @category Testing
     */
    async downloadFromFirebase () {
      
    }

    /**
     * @description Gets action info for test download action
     * @returns {Object} Action info
     * @category Actions
     */
    testDownloadActionInfo () {
        return {
            isEnabled: this.hasPublicUrl(),
            isVisible: true
        };
    }

}.initThisClass());