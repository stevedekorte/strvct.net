"use strict";

/**
 * @module library.services.Azure
 */

/**
 * @class AzureService
 * @extends BMStorableNode
 * @classdesc AzureService for text-to-speech functionality
 */
(class AzureService extends BMStorableNode {
  /**
   * @description Initializes the prototype slots for the AzureService
   */
  initPrototypeSlots () {
    /**
     * @member {Array} regionOptions - Options for Azure regions
     */
    {
      const slot = this.newSlot("regionOptions", []);
      slot.setSlotType("Array");
    }

    /**
     * @member {string} apiKey - API Key for Azure service
     */
    {
      const slot = this.newSlot("apiKey", "");
      slot.setLabel("API Key");
      slot.setShouldStoreSlot(true);
      slot.setSyncsToView(true);
      slot.setDuplicateOp("duplicate");
      slot.setSlotType("String");
      slot.setIsSubnodeField(true);
    }

    /**
     * @member {string} region - Server Region for Azure service
     */
    {
      const slot = this.newSlot("region", "");
      slot.setLabel("Server Region");
      slot.setShouldStoreSlot(true);
      slot.setSyncsToView(true);
      slot.setDuplicateOp("duplicate");
      slot.setSlotType("String");
      slot.setIsSubnodeField(true);
      slot.setInitValue(this.validRegions().first())
      slot.setValidValues(this.validRegions());
      slot.setInitValue("eastus");
    }

    /**
     * @member {AzureSpeakers} speakers - Speakers for Azure service
     */
    {
      const slot = this.newSlot("speakers", null);
      slot.setLabel("speakers");
      slot.setFinalInitProto(AzureSpeakers);
      slot.setShouldStoreSlot(true);
      slot.setIsSubnode(true);
    }

    /**
     * @member {AzureVoices} voices - Voices for Azure service
     */
    {
      const slot = this.newSlot("voices", null);
      slot.setLabel("voices");
      slot.setFinalInitProto(AzureVoices);
      slot.setShouldStoreSlot(false);
      slot.setIsSubnode(true);
    }

    this.setShouldStore(true);
    this.setShouldStoreSubnodes(false);
  }

  /**
   * @description Initializes the AzureService
   */
  init() {
    super.init();
    this.setTitle("Azure Text to Speech");
    this.setSubtitle("text-to-speech service");
  }

  /**
   * @description Returns an array of valid Azure regions
   * @returns {Array} Array of valid Azure regions
   */
  validRegions () {
    return [
      // regions that support intonation features
      ["Asia", "Southeast Asia", "southeastasia"],
      ["Australia", "Australia East", "australiaeast"],
      ["Europe", "North Europe", "northeurope"],
      ["Europe", "West Europe", "westeurope"],
      ["North America", "East US", "eastus"],
      ["North America", "East US 2", "eastus2"],
      ["North America", "South Central US", "southcentralus"],
      ["North America", "West Central US", "westcentralus"],
      ["North America", "West US", "westus"],
      ["North America", "West US 2", "westus2"],
      ["South America", "Brazil South", "brazilsouth"],
    ].map((entry) => entry[2]) // only return the values (the 3rd item in each entry)
  }

  /**
   * @description Validates the API key
   * @param {string} s - The API key to validate
   * @returns {boolean} True if the key is valid, false otherwise
   */
  validateKey(s) {
    if (!s) {
      return false;
    }
    return s.length === 32 && s.isHexadecimal();
  }

  /**
   * @description Validates the region
   * @param {string} s - The region to validate
   * @returns {boolean} True if the region is valid, false otherwise
   */
  validateRegion(s) {
    if (!s) {
      return false;
    }

    const isLowercaseOrUnderscore = (str) => {
      return /^[a-z_]+$/.test(str);
    };
    return isLowercaseOrUnderscore(s);
  }

  /**
   * @description Checks if the service has API access
   * @returns {boolean} True if the service has API access, false otherwise
   */
  hasApiAccess() {
    return (
      this.validateKey(this.apiKey()) && this.validateRegion(this.region())
    );
  }
  
}).initThisClass();