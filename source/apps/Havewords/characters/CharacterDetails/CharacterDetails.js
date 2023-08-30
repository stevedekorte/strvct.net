"use strict";

/* 
    CharacterDetails

*/

(class CharacterDetails extends JsonGroup {

  classOptions () {
    return [
      {"label": "Barbarian", "subtitle": "Raging warrior of primal fury"},
      {"label": "Bard", "subtitle": "Charismatic performer and versatile mage"},
      {"label": "Cleric", "subtitle": "Divine agent, healer, and protector"},
      {"label": "Druid", "subtitle": "Nature's spellcaster and shape-changer"},
      {"label": "Fighter", "subtitle": "Skilled martial combatant and tactician"},
      {"label": "Monk", "subtitle": "Master of martial arts and ki"},
      {"label": "Paladin", "subtitle": "Holy warrior bound by sacred oaths"},
      {"label": "Ranger", "subtitle": "Hunter and nature's roving guardian"},
      {"label": "Rogue", "subtitle": "Stealthy, agile, and cunning trickster"},
      {"label": "Sorcerer", "subtitle": "Innate caster with arcane bloodline"},
      {"label": "Warlock", "subtitle": "Mage bound to otherworldly patron"},
      {"label": "Wizard", "subtitle": "Scholar of arcane and mystic arts"}
    ]  
  }

  raceOptions () {
      return [
        {
            "label": "Dwarf",
            "subtitle": "Stout folk, poison-resistant."
        },
        {
            "label": "Elf",
            "subtitle": "Magic affinity, keen senses."
        },
        {
            "label": "Halfling",
            "subtitle": "Small, nimble, optimistic, lucky."
        },
        {
            "label": "Human",
            "subtitle": "Versatile, adaptable, diverse."
        },
        {
            "label": "Dragonborn",
            "subtitle": "Breath weapon, elemental resistance."
        },
        {
            "label": "Gnome",
            "subtitle": "Small, illusion magic affinity."
        },
        {
            "label": "Half-Elf",
            "subtitle": "Combines human and elf traits."
        },
        {
            "label": "Half-Orc",
            "subtitle": "Strong, durable, combat gifted."
        },
        {
            "label": "Tiefling",
            "subtitle": "Infernal heritage, magic, fire resistant."
        },
        {
            "label": "Aarakocra",
            "subtitle": "Bird-like, can fly."
        },
        {
            "label": "Genasi",
            "subtitle": "Elemental touch, varied traits."
        },
        {
            "label": "Goliath",
            "subtitle": "Mountain giants, strong."
        }
    ]
  }

  alignmentOptions () {
    return [
      {
        "label": "Lawful Good",
        "subtitle": "Follows law, does the right thing"
      },
      {
        "label": "Neutral Good",
        "subtitle": "Does right, regardless of law"
      },
      {
        "label": "Chaotic Good",
        "subtitle": "Values freedom, does the right thing"
      },
      {
        "label": "Lawful Neutral",
        "subtitle": "Follows law, regardless of morality"
      },
      {
        "label": "True Neutral",
        "subtitle": "Balances law and chaos"
      },
      {
        "label": "Chaotic Neutral",
        "subtitle": "Values freedom, avoids moral decisions"
      },
      {
        "label": "Lawful Evil",
        "subtitle": "Uses law for personal gain"
      },
      {
        "label": "Neutral Evil",
        "subtitle": "Selfish, avoids law and chaos"
      },
      {
        "label": "Chaotic Evil",
        "subtitle": "Values freedom, acts maliciously"
      }
    ]
  }    

  initPrototypeSlots() {
    {
      const slot = this.newSlot("name", "Unnamed");
        //slot.setInspectorPath("")
        slot.setShouldStoreSlot(true);
        slot.setDuplicateOp("duplicate");
        slot.setSlotType("String");
        slot.setIsSubnodeField(true);
        slot.setCanEditInspection(true);
        slot.setSyncsToView(true)
        slot.setSummaryFormat("key value")
      }

    {
      const slot = this.newSlot("level", 10);
      //slot.setInspectorPath("")
      slot.setShouldStoreSlot(true);
      slot.setDuplicateOp("duplicate");
      slot.setSlotType("Number");
      slot.setIsSubnodeField(true);
      slot.setCanEditInspection(true);
      slot.setSyncsToView(true)
      slot.setSummaryFormat("key value")
      slot.setValidValues([
        1, 2, 3, 4, 5,
        6, 7, 8, 9, 10,
        11, 12, 13, 14, 15,
        16, 17, 18, 19, 20 /*,
        21, 22, 23, 24, 25, 
        26, 27, 28, 29, 30*/
      ])
    }

    {
      const slot = this.newSlot("race", "");
      //slot.setInspectorPath("")
      slot.setShouldStoreSlot(true);
      slot.setDuplicateOp("duplicate");
      slot.setSlotType("String");
      slot.setIsSubnodeField(true);
      slot.setCanEditInspection(true);
      slot.setSyncsToView(true);
      slot.setSummaryFormat("key value");
      slot.setValidValues(this.raceOptions());
    }

    {
      const slot = this.newSlot("class", "");
      //slot.setInspectorPath("")
      slot.setShouldStoreSlot(true);
      slot.setDuplicateOp("duplicate");
      slot.setSlotType("String");
      slot.setIsSubnodeField(true);
      slot.setCanEditInspection(true);
      slot.setSyncsToView(true)
      slot.setSummaryFormat("key value")
      slot.setValidValues(this.classOptions());
    }

    {
      const slot = this.newSlot("alignment", "");
      //slot.setInspectorPath("")
      slot.setShouldStoreSlot(true);
      slot.setDuplicateOp("duplicate");
      slot.setSlotType("String");
      slot.setIsSubnodeField(true);
      slot.setCanEditInspection(true);
      slot.setSyncsToView(true);
      slot.setValidValues(this.alignmentOptions());
      slot.setSummaryFormat("key value")
    }

    // --- info ---
    {
      const slot = this.newSlot("portrait", null)
      slot.setShouldStoreSlot(true);
      slot.setDuplicateOp("duplicate");
      slot.setSlotType("ImageWell")
      slot.setIsSubnodeField(true);
      slot.setCanEditInspection(true);
      slot.setSyncsToView(true);
      /*
      slot.setFinalInitProto(BMImageNode);
      slot.setIsSubnode(true);
      */
    }

    {
      const slot = this.newSlot("appearance", "");
      //slot.setInspectorPath("")
      slot.setShouldStoreSlot(true);
      slot.setDuplicateOp("duplicate");
      slot.setSlotType("String");
      slot.setIsSubnodeField(true);
      slot.setCanEditInspection(true);
      slot.setSyncsToView(true)
    }


    {
      const slot = this.newSlot("back story", "");
      //slot.setInspectorPath("")
      slot.setShouldStoreSlot(true);
      slot.setDuplicateOp("duplicate");
      slot.setSlotType("String");
      slot.setIsSubnodeField(true);
      slot.setCanEditInspection(true);
      slot.setSyncsToView(true)
    }

  }

  init() {
    super.init();
    this.setCanDelete(true);
    this.setShouldStoreSubnodes(false);
  }

  finalInit () {
    super.finalInit()
    this.setTitle("Details")
    this.setCanDelete(true);
    this.setNodeCanEditTitle(true);
    this.setShouldStoreSubnodes(false);
    this.setCanDelete(true);
    this.setNodeSubtitleIsChildrenSummary(true);
  }

  description () {
    return this.levelName() + " " + this.race() + " " + this.class() 
  }

  levelName () {
    return this.level().withOrdinalIndicator() + " level"
  }

}.initThisClass());
