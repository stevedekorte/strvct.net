"use strict";

/**
* @module library.services.Azure.locales
*/

/**
* @class SvAzureLocale
* @extends SvSummaryNode
* @classdesc Represents an Azure Locale node in the application.
*/
(class SvAzureLocale extends SvSummaryNode {
    /**
    * @description Initializes the prototype slots for the SvAzureLocale class.
    * @category Initialization
    */
    initPrototypeSlots () {
    }

    /**
    * @description Initializes the prototype for the SvAzureLocale class.
    * @category Initialization
    */
    initPrototype () {
        this.setNodeSubtitleIsChildrenSummary(true);
        this.setShouldStoreSubnodes(false);
        this.setCanDelete(false);
        this.setNoteIsSubnodeCount(true);
    }

    /**
    * @description Initializes a new instance of the SvAzureLocale class.
    * @category Initialization
    */
    init () {
        super.init();
        this.setSubtitle("Azure Locale");
    }

    /**
    * @description Adds a voice to the Azure Locale.
    * @param {Object} aVoice - The voice to be added.
    * @returns {SvAzureLocale} - The current instance of SvAzureLocale.
    * @category Voice Management
    */
    addVoice (aVoice) {
        this.addSubnode(aVoice.duplicate());
        return this;
    }

}.initThisClass());
