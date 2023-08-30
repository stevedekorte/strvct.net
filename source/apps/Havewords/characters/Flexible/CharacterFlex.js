"use strict";

/* 
    CharacterFlex

*/

(class CharacterFlex extends BMJsonDictionaryNode {

  initPrototypeSlots() {

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
    //this.setNodeSubtitleIsChildrenSummary(true);
  }

  subtitle () {
    return null
  }

}.initThisClass());
