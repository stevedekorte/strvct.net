"use strict";

/* 
    CharacterGroup
*/

(class CharacterGroup extends JsonGroup {

  protoMetaInfo () {
    return [
      /*

      EXAMPLE:

      {
          "title": "Armor Class",
          "description": "Represents how difficult it is to land a damaging blow on the character, considering armor, shields, and dexterity.",
          "valueType": "Numerical value.",
          "type": "Number"
      },
      */
    ]
  }

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

      if (Type.isBoolean(statDict.editable)) {
        slot.setCanEditInspection(statDict.editable);
      } else {
        slot.setCanEditInspection(true);
      }

      slot.setLabel(statDict.title.toLowerCase())

      //slot.subtitle(statDict.description)
      slot.setDuplicateOp("duplicate");
      slot.setSlotType(statDict.type);
      slot.setIsSubnodeField(true);
      slot.setSyncsToView(true)
      slot.setSummaryFormat("key value")
  })
  }


  initPrototypeSlots() {
    this.setupProtoFromMetaInfo()
  }

  init() {
    super.init();
    this.setCanDelete(false);
    this.setShouldStoreSubnodes(false);
    this.setNodeCanEditTitle(false);
    this.setNodeSubtitleIsChildrenSummary(true);
  }

  finalInit () {
    super.finalInit()
    this.setTitle(this.type().humanized());
  }

}.initThisClass());
