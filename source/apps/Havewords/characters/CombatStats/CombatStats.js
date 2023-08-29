"use strict";

/* 
    CombatStats


    [
    {
        "title": "Armor Class (AC)",
        "description": "Represents how difficult it is to land a damaging blow on the character, considering armor, shields, and dexterity."
    },
    {
        "title": "Hit Points (HP)",
        "description": "Indicates the amount of damage a character can take before falling unconscious or dying."
    },
    {
        "title": "Hit Dice",
        "description": "Used primarily for healing during short rests, it's a pool of dice based on the character's class and level."
    },
    {
        "title": "Speed",
        "description": "Specifies how far a character can move in a single round of combat."
    },
    {
        "title": "Initiative",
        "description": "Typically derived from the dexterity modifier, it determines the order of turns in combat."
    },
    {
        "title": "Proficiency Bonus",
        "description": "A bonus that's added to attack rolls with proficient weapons, as well as proficient skills and saving throws."
    },
    {
        "title": "Attack Bonus",
        "description": "Determines how likely a character is to hit with a weapon or spell attack."
    },
    {
        "title": "Damage Rolls",
        "description": "Dictate how much damage a character deals with a successful attack."
    },
    {
        "title": "Saving Throws",
        "description": "Represent a character's ability to resist or avoid certain effects, like spells or poisons."
    },
    {
        "title": "Spell Save DC",
        "description": "For spellcasting classes, this determines how difficult it is for targets to resist or avoid the effects of their spells."
    },
    {
        "title": "Spell Attack Bonus",
        "description": "Used when casting spells that require an attack roll."
    },
    {
        "title": "Condition Immunities, Resistances, and Vulnerabilities",
        "description": "Specify which conditions a character might be immune to, which types of damage they resist, or which they are vulnerable to."
    },
    {
        "title": "Special Abilities/Features",
        "description": "Class-specific or race-specific abilities that can be used in combat."
    },
    {
        "title": "Reactions",
        "description": "Specific abilities or actions that can be taken outside of one's turn in response to a trigger."
    },
    {
        "title": "Bonus Actions",
        "description": "Some abilities or spells require a bonus action to use, a type of action that can be used in addition to the main action on a character's turn."
    },
    {
        "title": "Death Saving Throws",
        "description": "When a character is reduced to 0 hit points and is dying, they make these throws to determine whether they stabilize or edge closer to death."
    }
]

*/

(class CombatStats extends BMSummaryNode {
  initPrototypeSlots() {
    {
      const slot = this.newSlot("hit points", 0);
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
      const slot = this.newSlot("armor class", 0);
      //slot.setInspectorPath("")
      slot.setShouldStoreSlot(true);
      slot.setDuplicateOp("duplicate");
      slot.setSlotType("Number");
      slot.setIsSubnodeField(true);
      slot.setCanEditInspection(true);
      slot.setSyncsToView(true)
      slot.setSummaryFormat("key value")
    }



  }

  init() {
    super.init();
    this.setTitle("Combat Stats")
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
