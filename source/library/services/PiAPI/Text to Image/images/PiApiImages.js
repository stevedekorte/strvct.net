"use strict";

/**
 * @module library.services.PiAPI.Text_to_Image.images
 */

/**
 * @class PiApiImages
 * @extends SvJsonArrayNode
 * @classdesc Collection of PiAPI generated images.
 */
(class PiApiImages extends SvJsonArrayNode {
  
  initPrototypeSlots () {
    this.setShouldStore(true);
    this.setShouldStoreSubnodes(true);
    this.setSubnodeClasses([PiApiImage]);
    this.setNodeCanAddSubnode(true);
    this.setCanDelete(true);
    this.setNodeCanReorderSubnodes(true);
  }

  /**
   * @description Gets the title for the images collection.
   * @returns {string} The title.
   * @category Metadata
   */
  title () {
    return "Generated Images";
  }

  /**
   * @description Gets the subtitle for the images collection.
   * @returns {string} The subtitle.
   * @category Metadata
   */
  subtitle () {
    const count = this.subnodeCount();
    return count + " image" + (count !== 1 ? "s" : "");
  }

  /**
   * @description Creates a new image.
   * @returns {PiApiImage} The newly created image.
   * @category Management
   */
  add () {
    const image = PiApiImage.clone();
    this.addSubnode(image);
    return image;
  }

  /**
   * @description Gets the status summary of all images.
   * @returns {string} The status summary.
   * @category Status
   */
  status () {
    const images = this.subnodes();
    if (images.length === 0) {
      return "";
    }

    const loadedCount = images.filter(img => img.hasLoaded()).length;
    const errorCount = images.filter(img => img.hasError()).length;
    
    if (errorCount > 0) {
      return `${errorCount} error${errorCount !== 1 ? 's' : ''}`;
    }
    
    if (loadedCount === images.length) {
      return `${loadedCount} loaded`;
    }
    
    return `${loadedCount}/${images.length} loaded`;
  }

}.initThisClass());