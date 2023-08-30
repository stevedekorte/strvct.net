"use strict";

/* 
    MutableCharacterGroup
*/

(class MutableCharacterGroup extends BMSummaryNode {

  /*
  setupProtoFromMetaInfo () {
    this.protoMetaInfo().forEach(statDict => {
      let aClass = null;
      let statType = statDict.type

      if (statDict.finalInitProto) {
        statType = "Pointer"
      }

      let defaultValue = null;
      if (statType === "Number") {
        defaultValue = 0;
      } else if (statType === "String") {
        defaultValue = "";
      } else if (statType === "Pointer") {
        defaultValue = null;
      } else {
        throw new Error("unknown stat type '" + statType + "'");
      }

      const slot = this.newSlot(statDict.title, defaultValue);
      //slot.setInspectorPath("")
      slot.setShouldStoreSlot(true);

      if (statDict.finalInitProto) {
        const aClass = getGlobalThis()[statDict.finalInitProto];
        assert(aClass)
        slot.setFinalInitProto(aClass);
      }

      //slot.subtitle(statDict.description)
      slot.setDuplicateOp("duplicate");
      slot.setSlotType(statDict.type);
      slot.setIsSubnodeField(true);
      slot.setCanEditInspection(true);
      slot.setSyncsToView(true)
      slot.setSummaryFormat("key value")
  })
  }


  initPrototypeSlots() {
    //this.setupProtoFromMetaInfo()
  }
  */

  init() {
    super.init();
    this.setCanDelete(false);
    this.setShouldStoreSubnodes(false);
    this.setNodeCanEditTitle(false);
    this.setNodeSubtitleIsChildrenSummary(true);
  }

  finalInit () {
    super.finalInit()
  }

  /*
  title () {
    return this.type().humanized()
  }
  */

}.initThisClass());
