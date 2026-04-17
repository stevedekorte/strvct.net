"use strict";

/**
* @module library.services.Azure.speakers
*/

/**
* @class SvAzureSpeakers
* @extends SvSummaryNode
* @classdesc Represents a collection of Azure Speakers.
*/
(class SvAzureSpeakers extends SvSummaryNode {
    /**
    * @description Initializes the prototype slots for the SvAzureSpeakers class.
    * @category Initialization
    */
    initPrototypeSlots () {
        this.setShouldStore(true);
        this.setShouldStoreSubnodes(true);
    }

    /**
    * @description Initializes the SvAzureSpeakers instance.
    * @returns {SvAzureSpeakers} The initialized instance.
    * @category Initialization
    */
    init () {
        super.init();
        this.setNodeCanAddSubnode(true);
        return this;
    }

    /**
    * @description Performs final initialization for the SvAzureSpeakers instance.
    * @category Initialization
    */
    finalInit () {
        super.finalInit();
        this.setTitle("Speakers");
        this.setSubnodeClasses([SvAzureSpeaker]);
        this.setNodeCanReorderSubnodes(true);
        this.setNoteIsSubnodeCount(true);
    }

    /**
    * @description Gets the parent service node.
    * @returns {Object} The parent service node.
    * @category Hierarchy
    */
    service () {
        return this.parentNode();
    }

}.initThisClass());
