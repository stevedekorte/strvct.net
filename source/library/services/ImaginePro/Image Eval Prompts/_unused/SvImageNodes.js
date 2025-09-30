/**
 * @module library.services.ImaginePro
 */

/**
 * @class SvImageNodes
 * @extends SvJsonArrayNode
 * @classdesc Collection class for managing multiple SvImage objects.
 */
"use strict";

(class SvImageNodes extends SvSummaryNode {

    /**
   * @description Initializes the prototype slots for the class.
   * @category Initialization
   */
    initPrototypeSlots () {
    // No additional slots needed - inherits array functionality from SvJsonArrayNode
    }

    /**
   * @description Initializes the prototype.
   * @category Initialization
   */
    initPrototype () {
        this.setTitle("Images");
        this.setSubnodeClasses([SvImage]);
        this.setNodeCanAddSubnode(true);
        this.setNodeCanReorderSubnodes(true);
        this.setShouldStore(true);
        this.setShouldStoreSubnodes(true);
    }

    /**
   * @description Adds an SvImage to the collection.
   * @param {SvImage} svImage - The SvImage to add.
   * @returns {SvImage} The added image.
   * @category Images
   */
    addImage (svImage) {
        return this.addSubnode(svImage);
    }

    /**
   * @description Adds multiple SvImage objects to the collection.
   * @param {Array<SvImage>} svImages - Array of SvImage objects to add.
   * @returns {SvImageNodes} Returns this for chaining.
   * @category Images
   */
    addImages (svImages) {
        svImages.forEach(img => this.addImage(img));
        return this;
    }

    /**
   * @description Creates and adds a new SvImage from a URL.
   * @param {string} url - The image URL.
   * @returns {SvImage} The created image.
   * @category Images
   */
    addImageFromUrl (url) {
        const image = SvImage.clone();
        image.setImageUrl(url);
        return this.addImage(image);
    }

    /**
   * @description Creates and adds a new SvImage from a data URL.
   * @param {string} dataUrl - The data URL.
   * @returns {SvImage} The created image.
   * @category Images
   */
    addImageFromDataUrl (dataUrl) {
        const image = SvImage.clone();
        image.setDataURL(dataUrl);
        return this.addImage(image);
    }

    /**
   * @description Gets all images in the collection.
   * @returns {Array<SvImage>} Array of SvImage objects.
   * @category Images
   */
    images () {
        return this.subnodes();
    }

    /**
   * @description Gets the count of images.
   * @returns {number} The number of images.
   * @category Images
   */
    imageCount () {
        return this.subnodeCount();
    }

    /**
   * @description Removes all images from the collection.
   * @returns {SvImageNodes} Returns this for chaining.
   * @category Images
   */
    removeAllImages () {
        this.removeAllSubnodes();
        return this;
    }

    /**
   * @description Gets public URLs for all images (excluding data URLs).
   * @returns {Array<string>} Array of public URLs.
   * @category Images
   */
    publicUrls () {
        return this.images()
            .map(img => img.imageUrl() || img.url())
            .filter(url => url && !url.startsWith("data:"));
    }

    async asyncPublicUrls () {
    // we want to do this in parallel
        const promises = this.images().map(img => img.asyncPublicFirestoreUrl());
        return await Promise.all(promises);
    }

    /**
   * @description Gets the subtitle for the collection.
   * @returns {string} The subtitle.
   * @category UI
   */
    subtitle () {
        const count = this.imageCount();
        if (count === 0) {
            return "No images";
        } else if (count === 1) {
            return "1 image";
        } else {
            return `${count} images`;
        }
    }

}).initThisClass();
