"use strict";

/* 
    AzureService

*/

(class AzureService extends BMStorableNode {
  initPrototypeSlots () {
    this.newSlot("regionOptions", []);

    {
      const slot = this.newSlot("apiKey", "");
      //slot.setInspectorPath("")
      slot.setLabel("API Key");
      slot.setShouldStoreSlot(true);
      slot.setSyncsToView(true);
      slot.setDuplicateOp("duplicate");
      slot.setSlotType("String");
      slot.setIsSubnodeField(true);
      //slot.setValidValues(values)
    }

    {
      const slot = this.newSlot("region", "");
      //slot.setInspectorPath("")
      slot.setLabel("Server Region");
      slot.setShouldStoreSlot(true);
      slot.setSyncsToView(true);
      slot.setDuplicateOp("duplicate");
      slot.setSlotType("String");
      slot.setIsSubnodeField(true);
      slot.setInitValue(this.validRegions().first())
      slot.setValidValues(this.validRegions());
      slot.setInitValue("eastus");
      //slot.setValidValues(values)
    }

    {
      const slot = this.newSlot("speakers", null);
      slot.setLabel("speakers");
      slot.setFinalInitProto(AzureSpeakers);
      slot.setShouldStoreSlot(true);
      slot.setIsSubnode(true);
    }

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

  init() {
    super.init();
    this.setTitle("Azure Text to Speech");
    this.setSubtitle("text-to-speech service");
  }

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

  // --- api key ---

  validateKey(s) {
    if (!s) {
      return false;
    }
    return s.length === 32 && s.isHexadecimal();
  }

  // --- region ---

  validateRegion(s) {
    if (!s) {
      return false;
    }

    const isLowercaseOrUnderscore = (str) => {
      return /^[a-z_]+$/.test(str);
    };
    return isLowercaseOrUnderscore(s);
  }

  // --- api check ---

  hasApiAccess() {
    return (
      this.validateKey(this.apiKey()) && this.validateRegion(this.region())
    );
  }
  
}).initThisClass();
