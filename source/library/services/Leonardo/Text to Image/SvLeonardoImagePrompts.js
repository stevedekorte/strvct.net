/**
  * @module library.services.Leonardo.Text_to_Image
  */

/**
  * @class SvLeonardoImagePrompts
  * @extends SvSummaryNode
  * @classdesc Represents a collection of Leonardo image prompts for text-to-image conversion.
  */
(class SvLeonardoImagePrompts extends SvSummaryNode {

    /**
      * Initializes the prototype slots for the SvLeonardoImagePrompts class.
      * @description Sets up the storage, subnode classes, and other properties for the SvOpenAiImagePrompts node.
      * @category Initialization
      */
    initPrototypeSlots () {
    }

    initPrototype () {
        this.setShouldStore(true);
        this.setShouldStoreSubnodes(true);
        this.setSubnodeClasses([SvLeonardoImagePrompt]);
        this.setNodeCanAddSubnode(true);
        this.setNodeCanReorderSubnodes(true);
        this.setTitle("Text to Image");
        this.setNoteIsSubnodeCount(true);
    }

    finalInit () {
        super.finalInit();
        this.initPrototype();
    }

    /**
      * Returns the parent service node.
      * @description Retrieves the parent node, which is expected to be the service node.
      * @returns {Object} The parent service node.
      * @category Node Relationships
      */
    service () {
        return this.parentNode();
    }

}.initThisClass());
