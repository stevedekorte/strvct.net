"use strict";

/* 
    CharacterFlex

*/

(class CharacterFlex extends BMJsonDictionaryNode {

  initPrototypeSlots() {
    {
      const slot = this.newSlot("subnodesSummaryFormat", "key")
    }
  }

  init() {
    super.init();
    this.setCanDelete(true);
    this.setShouldStoreSubnodes(false);
  }

  finalInit () {
    super.finalInit()
    this.setTitle(this.type().after("Character"))
    this.setCanDelete(false);
    this.setNodeCanEditTitle(false);
    this.setShouldStoreSubnodes(true);
    this.setNodeSubtitleIsChildrenSummary(true);
    //this.setNodeSubtitleIsChildrenSummary(true);
    this.updateFormatting()
  }

  subtitle () {
    return this.childrenSummary()
  }

  updateFormatting () {
    this.forEachSubnodeRecursively(sn => {
      sn.setNodeSubtitleIsChildrenSummary(true);
    })

    /*
    if (this.subnodesSummaryFormat()) {
      this.subnodes().forEach(sn => {
        this.setSummaryFormat(this.subnodesSummaryFormat())
      })
    }
    */
   return this
  }

  setJson (json) {
    super.setJson(json)
    this.updateFormatting()
    return this
  }

  setupAsSample () {
    if (this.sampleJson) {
      const json = this.sampleJson()
      if (json) {
        this.setJson(json)
      }
    }
    return this
  }

}.initThisClass());
