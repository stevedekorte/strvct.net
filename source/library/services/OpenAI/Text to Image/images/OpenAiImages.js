/**
* @module library.services.OpenAI.Text_to_Image.images
*/

"use strict";

/**
* @class OpenAiImages
* @extends SvSummaryNode
* @classdesc Represents a collection of OpenAI generated images.
*/
(class OpenAiImages extends SvSummaryNode {

    /**
    * @description Initializes the prototype slots for the OpenAiImages class.
    * @category Initialization
    */
    initPrototypeSlots () {
        this.setTitle("image results");
        this.setShouldStore(true);
        this.setShouldStoreSubnodes(true);
        this.setSubnodeClasses([OpenAiImage]);
        this.setNodeCanAddSubnode(false);
        this.setNodeCanReorderSubnodes(false);
        this.setNoteIsSubnodeCount(true);
    }

    /**
    * @description Returns the subtitle for the OpenAiImages instance.
    * @returns {string} The status of the OpenAiImages instance.
    * @category Display
    */
    subtitle () {
        return this.status();
    }

    /**
    * @description Determines and returns the current status of the OpenAiImages instance.
    * @returns {string} The status message.
    * @category Status
    */
    status () {
        if (this.subnodeCount() && this.hasLoadedAllImages()) {
            return "complete";
        } else if (this.hasError()) {
            return "error loading image";
        } else if (this.isLoading()) {
            return "loading images...";
        }
        return "";
    }

    /**
    * @description Retrieves the image prompt from the parent node.
    * @returns {Object} The parent node containing the image prompt.
    * @category Data Retrieval
    */
    imagePrompt () {
        return this.parentNode();
    }

    /**
    * @description Checks if all images have been loaded.
    * @returns {boolean} True if all images are loaded, false otherwise.
    * @category Status
    */
    hasLoadedAllImages () {
        return !this.subnodes().canDetect(sn => !sn.isLoaded());
    }

    /**
    * @description Checks if there is an error in any of the subnodes.
    * @returns {boolean} True if there is an error, false otherwise.
    * @category Status
    */
    hasError () {
        return this.subnodes().canDetect(sn => sn.hasError());
    }

    /**
    * @description Checks if any of the subnodes are still loading.
    * @returns {boolean} True if any subnode is loading, false otherwise.
    * @category Status
    */
    isLoading () {
        return this.subnodes().canDetect(sn => sn.isLoading());
    }

}.initThisClass());
