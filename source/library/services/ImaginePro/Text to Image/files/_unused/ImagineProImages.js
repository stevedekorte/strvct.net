/**
 * @module library.services.ImaginePro.Text_to_Image.images
 */

/**
 * @class ImagineProImages
 * @extends SvJsonArrayNode
 * @classdesc A collection of ImaginePro generated images.
 */
"use strict";

(class ImagineProImages extends SvJsonArrayNode {

    /**
   * @description Initializes the prototype.
   * @category Initialization
   */
    initPrototype () {
        this.setShouldStore(true);
        this.setShouldStoreSubnodes(false);
        this.setCanDelete(false);
        this.setSubnodeClasses([ImagineProImage]);
        this.setNodeCanAddSubnode(false);
        this.setNodeCanReorderSubnodes(false);
    }

    /**
   * @description Performs final initialization.
   * @category Initialization
   */
    finalInit () {
        super.finalInit();
        this.setTitle("images");
    }

    /**
   * @description Creates a new image.
   * @returns {ImagineProImage} The new image.
   * @category Creation
   */
    add () {
        const image = ImagineProImage.clone();
        this.addSubnode(image);
        return image;
    }

    /**
   * @description Gets the status of all images.
   * @returns {string} The status.
   * @category Status
   */
    status () {
        const images = this.subnodes();
        if (images.length === 0) {
            return "";
        }

        const loaded = images.filter(img => img.hasLoaded()).length;
        const total = images.length;

        if (loaded === total) {
            return `${total} image${total !== 1 ? "s" : ""} loaded`;
        } else {
            return `${loaded}/${total} images loaded`;
        }
    }

}.initThisClass());
