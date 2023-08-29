"use strict";

/* 
    AbilityScores

*/

(class AbilityScores extends BMSummaryNode {
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
    }

    // ----------------------------

    {
      const slot = this.newSlot("dictString", "");
      //slot.setInspectorPath("")
      slot.setShouldStoreSlot(false);
      slot.setDuplicateOp("duplicate");
      slot.setSlotType("String");
      slot.setIsSubnodeField(true);
      slot.setCanEditInspection(false);
      slot.setSyncsToView(false)
    }
  }

  init() {
    super.init();
    this.setTitle("Abilities")
    this.setCanDelete(true);
    this.setShouldStoreSubnodes(false);
  }

  finalInit () {
    super.finalInit()
    this.setCanDelete(true);
    this.setNodeCanEditTitle(true);
    this.setShouldStoreSubnodes(false);
    this.setCanDelete(true);
    this.setNodeSubtitleIsChildrenSummary(true);
  }

}.initThisClass());
