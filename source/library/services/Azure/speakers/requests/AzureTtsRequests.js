/**
  * @module library.services.Azure.speakers.requests
  */

/**
  * @class AzureTtsRequests
  * @extends SvSummaryNode
  * @classdesc Represents a collection of Azure TTS requests for a speaker.
  */
(class AzureTtsRequests extends SvSummaryNode {
    /**
      * Initializes the prototype slots for the class.
      * @category Initialization
      */
    initPrototypeSlots () {

    }

    /**
      * Initializes the instance.
      * @description Sets up the initial state of the AzureTtsRequests instance.
      * @category Initialization
      */
    init () {
        super.init();
        this.setTitle("requests");
        this.setShouldStore(true);
        this.setShouldStoreSubnodes(true);
        this.setSubnodeClasses([AzureTtsRequest]);
        this.setNodeCanAddSubnode(true);
        this.setNodeCanReorderSubnodes(true);
    }

    /**
      * Performs final initialization tasks.
      * @description Sets additional properties after the main initialization.
      * @category Initialization
      */
    finalInit () {
        super.finalInit()
        this.setNoteIsSubnodeCount(true);
        this.setTitle("requests");
    }

    /*
    didInit () {
        super.didInit()
    }
    */

    /**
      * Gets the parent speaker node.
      * @returns {Object} The parent speaker node.
      * @category Data Retrieval
      */
    speaker () {
        return this.parentNode()
    }

}.initThisClass());