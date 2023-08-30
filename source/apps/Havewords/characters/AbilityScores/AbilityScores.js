"use strict";

/* 
    AbilityScores

*/

(class AbilityScores extends JsonGroup {
  abilityOptions () {
    return [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20]
  }

  initPrototypeSlots() {
    {
      const slot = this.newSlot("strength", 0);
        //slot.setInspectorPath("")
        slot.setShouldStoreSlot(true);
        slot.setDuplicateOp("duplicate");
        slot.setSlotType("Number");
        slot.setIsSubnodeField(true);
        slot.setCanEditInspection(true);
        slot.setSyncsToView(true)
        slot.setSummaryFormat("key value")
        slot.setValidValues(this.abilityOptions())
    }

    {
      const slot = this.newSlot("dexterity", 0);
      //slot.setInspectorPath("")
      slot.setShouldStoreSlot(true);
      slot.setDuplicateOp("duplicate");
      slot.setSlotType("Number");
      slot.setIsSubnodeField(true);
      slot.setCanEditInspection(true);
      slot.setSyncsToView(true)
      slot.setSummaryFormat("key value")
      slot.setValidValues(this.abilityOptions())
    }

    {
      const slot = this.newSlot("constitution", 0);
      //slot.setInspectorPath("")
      slot.setShouldStoreSlot(true);
      slot.setDuplicateOp("duplicate");
      slot.setSlotType("Number");
      slot.setIsSubnodeField(true);
      slot.setCanEditInspection(true);
      slot.setSyncsToView(true)
      slot.setSummaryFormat("key value")
      slot.setValidValues(this.abilityOptions())
    }

    {
      const slot = this.newSlot("intelligence", 0);
      //slot.setInspectorPath("")
      slot.setShouldStoreSlot(true);
      slot.setDuplicateOp("duplicate");
      slot.setSlotType("Number");
      slot.setIsSubnodeField(true);
      slot.setCanEditInspection(true);
      slot.setSyncsToView(true)
      slot.setSummaryFormat("key value")
      slot.setValidValues(this.abilityOptions())
    }

    {
      const slot = this.newSlot("wisdom", 0);
      //slot.setInspectorPath("")
      slot.setShouldStoreSlot(true);
      slot.setDuplicateOp("duplicate");
      slot.setSlotType("Number");
      slot.setIsSubnodeField(true);
      slot.setCanEditInspection(true);
      slot.setSyncsToView(true)
      slot.setSummaryFormat("key value")
      slot.setValidValues(this.abilityOptions())
    }

    {
      const slot = this.newSlot("charisma", 0);
      //slot.setInspectorPath("")
      slot.setShouldStoreSlot(true);
      slot.setDuplicateOp("duplicate");
      slot.setSlotType("Number");
      slot.setIsSubnodeField(true);
      slot.setCanEditInspection(true);
      slot.setSyncsToView(true)
      slot.setSummaryFormat("key value")
      slot.setValidValues(this.abilityOptions())
    }

  }

  init() {
    super.init();
    this.setCanDelete(true);
    this.setShouldStoreSubnodes(false);
  }

  finalInit () {
    super.finalInit()
    this.setTitle(this.type().humanized());
    this.setCanDelete(true);
    this.setNodeCanEditTitle(true);
    this.setShouldStoreSubnodes(false);
    this.setCanDelete(true);
    this.setNodeSubtitleIsChildrenSummary(true);
  }

}.initThisClass());
