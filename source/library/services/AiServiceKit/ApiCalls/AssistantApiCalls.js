"use strict";

/*
* @module library.services.AiServiceKit.ApiCalls
* @class AssistantApiCalls
* @extends BMSummaryNode
* @classdesc
* A collection of AssistantApiCall instances.
*/

(class AssistantApiCalls extends BMSummaryNode {
  /*
   * Initializes the prototype slots.
   * @category Initialization
   */
  initPrototypeSlots () {
    {
      const slot = this.newSlot("apiCallClasses", null);
      slot.setSlotType("Array");
      slot.setCanInspect(true);

    }


    {
      const slot = this.newSlot("apiSpecPromptString", null);
      slot.setDescription("A string which describes the API call to the Assistant.");
      slot.setSlotType("String");
      //slot.setShouldJsonArchive(false);
      //slot.setIsSubnodeField(false);
      slot.setCanInspect(true);
      slot.setInspectorPath("API");
      assert(slot.inspectorPath() === "API");
      //slot.setCanEditInspection(false);
      //slot.setIsInJsonSchema(false);
      //slot.setValueWhiteSpace("pre-wrap");
    }

    //this.setSubnodeClasses([AssistantApiCall]);
    this.setShouldStore(false);
    this.setShouldStoreSubnodes(false);
    this.setSummaryFormat("value");
    this.setHasNewlineAfterSummary(true);
    this.setNodeCanReorderSubnodes(false);
    this.setCanDelete(false);

    /*
    this.setSummaryFormat("value");
    this.setHasNewlineAfterSummary(true);
    */
  }

  init () {
    super.init();
    this.setApiCallClasses([]);
  }

  finalInit () {
    super.finalInit();
    this.setTitle("Assistant API Calls");
  }

  setApiCallClasses (arrayOfClasses) {
    this._apiCallClasses = arrayOfClasses;
    this.setupSubnodes();
    return this;
  }

  setupSubnodes () {
    const apiCallClasses = this.apiCallClasses();
    const subnodes = apiCallClasses.map(aClass => aClass.clone());
    this.setSubnodes(SubnodesArray.from(subnodes));
  }

  apiSpecPromptString () {
    return this.apiSpecPrompt();
  }

  apiSpecPrompt () {
      let s = "The following APIs are available for you to use:\n\n";
      s += this.subnodes().map(c => c.apiSpecPrompt()).join("\n\n");
      return s;
  }

}.initThisClass());