"use strict";

/* 
    Character

*/

(class Character extends JsonGroup {
  initPrototypeSlots() {

    {
      const slot = this.newSubnodeSlot("characterDetails", CharacterDetails);
    }

    {
      const slot = this.newSubnodeSlot("combatStats", CombatStats);
    }

    {
      const slot = this.newSubnodeSlot("abilityScores", AbilityScores);
    }

    {
      const slot = this.newSubnodeSlot("skills", CharacterSkills);
    }

    {
      const slot = this.newSubnodeSlot("actions", CharacterActions);
    }

    {
      const slot = this.newSubnodeSlot("features", CharacterFeatures);
    }

    {
      const slot = this.newSubnodeSlot("proficiencies", CharacterProficiencies);
    }

    {
      const slot = this.newSubnodeSlot("inventory", CharacterInventory);
    }

    // ------

    {
      const slot = this.newSlot("jsonString", "");
      //slot.setInspectorPath("Character")
      slot.setShouldStoreSlot(false);
      slot.setDuplicateOp("duplicate");
      slot.setSlotType("String");
      //slot.setIsSubnodeField(true);
      slot.setCanInspect(true)
      slot.setCanEditInspection(false);
      slot.setSyncsToView(false)
    }

    {
      const slot = this.newSlot("setupAsSampleAction", null);
      //slot.setInspectorPath("Character");
      slot.setLabel("Setup as Sample");
      slot.setSyncsToView(true);
      slot.setDuplicateOp("duplicate");
      slot.setSlotType("Action");
      //slot.setIsSubnodeField(true);
      slot.setCanInspect(true)
      slot.setActionMethodName("setupAsSample");
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

  newSubnodeSlot (slotName, finalProto) {
    assert(Type.isString(slotName))
    assert(Type.isClass(finalProto))

    const slot = this.newSlot(slotName, null);
    slot.setShouldStoreSlot(true);
    slot.setFinalInitProto(finalProto);
    slot.setIsSubnode(true);

    /*
    const slot = this.newSlot(slotName, null);
    slot.setFinalInitProto(finalProto)
    slot.setShouldFinalInitAsSubnode(true)
    slot.setShouldStoreSlot(true);
    slot.setDuplicateOp("duplicate");
    slot.setSyncsToView(true)
    */
    return slot
  }

  title () {
    return this.characterDetails().name()
  }

  name () {
    return this.characterDetails().name()
  }

  subtitle () {
    return [this.characterDetails().description().trim(), "character"].join(" ")
  }

  jsonString () {
    return super.jsonString()
  }

  setJson (json) {
    super.setJson(json)
    return this
  }

  setupAsSample () {
    this.subnodes().forEach(sn => {
      if (sn.setupAsSample) {
        sn.setupAsSample();
      }
    })
    return this
  }

}.initThisClass());
