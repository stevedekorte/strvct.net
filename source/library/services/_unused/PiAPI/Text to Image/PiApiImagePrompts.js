"use strict";

/**
* @module library.services.PiAPI.Text_to_Image
*/

/**
* @class PiApiImagePrompts
* @extends SvJsonArrayNode
* @classdesc Collection of PiAPI image prompts for managing multiple text-to-image generations.
*/
(class PiApiImagePrompts extends SvJsonArrayNode {

    initPrototypeSlots () {
        this.setShouldStore(true);
        this.setShouldStoreSubnodes(true);
        this.setSubnodeClasses([PiApiImagePrompt]);
        this.setNodeCanAddSubnode(true);
        this.setCanDelete(true);
        this.setNodeCanReorderSubnodes(true);
    }

    /**
    * @description Gets the title for the image prompts collection.
    * @returns {string} The title.
    * @category Metadata
    */
    title () {
        return "Text to Image";
    }

    /**
    * @description Gets the subtitle for the image prompts collection.
    * @returns {string} The subtitle.
    * @category Metadata
    */
    subtitle () {
        const count = this.subnodeCount();
        return count + " prompt" + (count !== 1 ? "s" : "");
    }

    /**
    * @description Creates a new image prompt.
    * @returns {PiApiImagePrompt} The newly created image prompt.
    * @category Management
    */
    add () {
        const prompt = PiApiImagePrompt.clone();
        this.addSubnode(prompt);
        return prompt;
    }

    /**
    * @description Gets the PiAPI service.
    * @returns {Object} The PiAPI service.
    * @category Service
    */
    service () {
        return PiApiService.shared();
    }

}.initThisClass());
