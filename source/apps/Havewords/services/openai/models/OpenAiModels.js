"use strict";

/* 
    OpenAiModels

*/

(class OpenAiModels extends BMSummaryNode {
  initPrototypeSlots() {
    this.newSlot("models", null);
    this.newSlot("didModelCheck", false);
  }

  init() {
    super.init();
    this.setTitle("models");
    this.setShouldStore(true);
    this.setShouldStoreSubnodes(true);
  }

  finalInit() {
    super.finalInit();
    this.nodeSubtitleIsChildrenSummary(true)
    this.syncModelsToAllModelNames();
  }

  syncModelsToAllModelNames () {
    this.removeSubnodesWithTitlesNotInArray(this.allModelNames())

    const models = this.allModelNames().map(name => {
      const subnode = this.firstSubnodeWithTitle(name)
      if (!subnode) {
        const model = OpenAiChatModel.clone().setName(name)
        this.addSubnode(model)
      }
    });
    return this
  }

  removeSubnodesWithTitlesNotInArray (titles) {
    const subnodesToRemove = this.subnodes().select(sn => !titles.includes(sn.title()));
    this.removeSubnodes(subnodesToRemove)
    return this
  }

  didInit () {
    super.didInit()
    this.asyncCheckAvailability();
  }

  service () {
    return this.parentNode()
  }

  allModelNames () {
    // model names with versions numbers are ones soon to be depricated, 
    // so we don't include those, to avoid wasting requests
    return [
      "gpt-4", 
      "gpt-4-32k", 
      "gpt-3.5-turbo", 
      "gpt-4-0613", 
      "gpt-3.5-turbo-0613"
    ];
  }

  async asyncCheckAvailability () {
      for (const model of this.subnodes()) { 
        model.asyncCheckAvailability();
      }
  }

}.initThisClass());
