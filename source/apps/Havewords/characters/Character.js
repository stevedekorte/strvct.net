"use strict";

/* 
    Character

*/

(class Character extends JsonGroup {
  initPrototypeSlots() {

    {
      const slot = this.newSlot("characterDetails", CharacterDetails.clone());
      //slot.setInspectorPath("")
      slot.setShouldStoreSlot(true);
      slot.setDuplicateOp("duplicate");
      slot.setSlotType("Pointer");
      slot.setIsSubnodeField(true);
      slot.setCanEditInspection(true);
      slot.setSyncsToView(true)
    }

    {
      const slot = this.newSlot("combatStats", CombatStats.clone());
      //slot.setInspectorPath("")
      slot.setShouldStoreSlot(true);
      slot.setDuplicateOp("duplicate");
      slot.setSlotType("Pointer");
      slot.setIsSubnodeField(true);
      slot.setCanEditInspection(true);
      slot.setSyncsToView(true)
    }


    {
      const slot = this.newSlot("abilityScores", AbilityScores.clone());
      //slot.setInspectorPath("")
      slot.setShouldStoreSlot(true);
      slot.setDuplicateOp("duplicate");
      slot.setSlotType("Pointer");
      slot.setIsSubnodeField(true);
      slot.setCanEditInspection(true);
      slot.setSyncsToView(true)
    }

    {
      const slot = this.newSlot("skills", CharacterSkills.clone());
      //slot.setInspectorPath("")
      slot.setShouldStoreSlot(true);
      slot.setDuplicateOp("duplicate");
      slot.setSlotType("Pointer");
      slot.setIsSubnodeField(true);
      slot.setCanEditInspection(true);
      slot.setSyncsToView(true)
    }

    {
      const slot = this.newSlot("actions", CharacterActions.clone());
      //slot.setInspectorPath("")
      slot.setShouldStoreSlot(true);
      slot.setDuplicateOp("duplicate");
      slot.setSlotType("Pointer");
      slot.setIsSubnodeField(true);
      slot.setCanEditInspection(true);
      slot.setSyncsToView(true)
    }

    {
      const slot = this.newSlot("features", CharacterFeatures.clone());
      //slot.setInspectorPath("")
      slot.setShouldStoreSlot(true);
      slot.setDuplicateOp("duplicate");
      slot.setSlotType("Pointer");
      slot.setIsSubnodeField(true);
      slot.setCanEditInspection(true);
      slot.setSyncsToView(true)
    }


    {
      const slot = this.newSlot("proficiencies", CharacterProficiencies.clone());
      //slot.setInspectorPath("")
      slot.setShouldStoreSlot(true);
      slot.setDuplicateOp("duplicate");
      slot.setSlotType("Pointer");
      slot.setIsSubnodeField(true);
      slot.setCanEditInspection(true);
      slot.setSyncsToView(true)
    }

    {
      const slot = this.newSlot("inventory", CharacterInventory.clone());
      //slot.setInspectorPath("")
      slot.setShouldStoreSlot(true);
      slot.setDuplicateOp("duplicate");
      slot.setSlotType("Pointer");
      slot.setIsSubnodeField(true);
      slot.setCanEditInspection(true);
      slot.setSyncsToView(true)
    }



    // ------

    {
      const slot = this.newSlot("jsonString", "");
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
    this.setCanDelete(true);
    this.setShouldStoreSubnodes(false);
    this.setNodeCanEditTitle(true);
  }

  finalInit () {
    super.finalInit()
  }

  title () {
    return this.characterDetails().name()
  }

  subtitle () {
    return this.characterDetails().description()
  }

  jsonString () {
    //debugger
    return super.jsonString()
  }

}.initThisClass());
