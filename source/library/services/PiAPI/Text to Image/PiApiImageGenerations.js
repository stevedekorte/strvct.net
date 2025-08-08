"use strict";

/**
* @module library.services.PiAPI.Text_to_Image
*/

/**
* @class PiApiImageGenerations
* @extends SvJsonArrayNode
* @classdesc Collection of PiAPI image generation tracking objects.
*/
(class PiApiImageGenerations extends SvJsonArrayNode {
    
    initPrototypeSlots () {
    this.setShouldStore(true);
    this.setShouldStoreSubnodes(true);
    this.setSubnodeClasses([PiApiImageGeneration]);
    this.setNodeCanReorderSubnodes(false);
    this.setNodeCanAddSubnode(true);
    this.setCanDelete(false);
    }

    /**
    * @description Gets the title for this collection.
    * @returns {string} The title.
    * @category Metadata
    */
    title () {
    return "Generations";
    }

    /**
    * @description Gets the subtitle for this collection.
    * @returns {string} The subtitle.
    * @category Metadata
    */
    subtitle () {
    const count = this.subnodeCount();
    return count + " generation" + (count === 1 ? "" : "s");
    }

    /**
    * @description Adds a new generation.
    * @returns {PiApiImageGeneration} The new generation.
    * @category Collection
    */
    add () {
    const generation = PiApiImageGeneration.clone();
    this.addSubnode(generation);
    return generation;
    }

}.initThisClass());