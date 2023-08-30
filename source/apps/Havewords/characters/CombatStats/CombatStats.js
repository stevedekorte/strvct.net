"use strict";

/* 

    CombatStats



*/

(class CombatStats extends CharacterGroup {

    protoMetaInfo () {
    return [
        {
            //"title": "Hit Points (HP)",
            "title": "Hit Points",
            "description": "Indicates the amount of damage a character can take before falling unconscious or dying.",
            "valueType": "Numerical value.",
            "type": "Number"
        },

        {
            "title": "Speed",
            "description": "Specifies how far a character can move in a single round of combat.",
            "valueType": "Numerical value (often in feet, e.g., '30 ft.').",
            "type": "String"
        },

        {
            //"title": "Armor Class (AC)",
            "title": "Armor Class",
            "description": "Represents how difficult it is to land a damaging blow on the character, considering armor, shields, and dexterity.",
            "valueType": "Numerical value.",
            "type": "Number",
            "editable": false
        },

        {
            "title": "Hit Dice",
            "description": "Used primarily for healing during short rests, it's a pool of dice based on the character's class and level.",
            "valueType": "Combination of a numerical value and a type of dice (e.g., '3d10').",
            "type": "String",
            "editable": false  // calculated
        },

        /*
        {
            "title": "Initiative",
            "description": "Typically derived from the dexterity modifier, it determines the order of turns in combat.",
            "valueType": "Numerical modifier.",
            "type": "Number"
        },

        {
            "title": "Proficiency Bonus",
            "description": "A bonus that's added to attack rolls with proficient weapons, as well as proficient skills and saving throws.",
            "valueType": "Numerical value.",
            "type": "Number"
        },
        {
            "title": "Attack Bonus",
            "description": "Determines how likely a character is to hit with a weapon or spell attack.",
            "valueType": "Numerical value.",
            "type": "Number"
        },

        {
            "title": "Damage Rolls",
            "description": "Dictate how much damage a character deals with a successful attack.",
            "valueType": "Combination of numerical values and dice types, often with modifiers.",
            "type": "String"
        },

        {
            "title": "Saving Throws",
            "description": "Represent a character's ability to resist or avoid certain effects, like spells or poisons.",
            "valueType": "Each ability has a numerical modifier.",
            "type": "Pointer",
            "finalInitProto" : "MutableCharacterGroup"
        },
        */

        {
            "title": "Spell Save Difficulty Class", 
            "description": "For spellcasting classes, this determines how difficult it is for targets to resist or avoid the effects of their spells.",
            "valueType": "Numerical value.",
            "type": "Number",
            "editable": false  // calculated
        },

        /*
        {
            "title": "Spell Attack Bonus",
            "description": "Used when casting spells that require an attack roll.",
            "valueType": "Numerical value.",
            "type": "Pointer",
            "finalInitProto" : "MutableCharacterGroup"
        },

        {
            "title": "Condition Immunities, Resistances, and Vulnerabilities",
            "description": "Specify which conditions a character might be immune to, which types of damage they resist, or which they are vulnerable to.",
            "valueType": "Textual descriptions.",
            "type": "Pointer",
            "finalInitProto" : "MutableCharacterGroup"
        },

        {
            //"title": "Special Abilities/Features",
            "title": "Special Abilities",
            "description": "Class-specific or race-specific abilities that can be used in combat.",
            "valueType": "Textual descriptions detailing the specifics of the ability or feature.",
            "type": "Pointer",
            "finalInitProto" : "MutableCharacterGroup"
        },
        {
            "title": "Reactions",
            "description": "Specific abilities or actions that can be taken outside of one's turn in response to a trigger.",
            "valueType": "Textual descriptions.",
            "type": "Pointer",
            "finalInitProto" : "MutableCharacterGroup"
        },
        {
            "title": "Bonus Actions",
            "description": "Some abilities or spells require a bonus action to use, a type of action that can be used in addition to the main action on a character's turn.",
            "valueType": "Textual descriptions with mechanics that can vary.",
            "type": "Pointer",
            "finalInitProto" : "MutableCharacterGroup"
        },
        */
       
        {
            "title": "Death Saving Throws",
            "description": "When a character is reduced to 0 hit points and is dying, they make these throws to determine whether they stabilize or edge closer to death.",
            "valueType": "Results are tallied as successes and failures.",
            "type": "String",
            "editable": false  // calculated
        }
    ]
    
  }

  initPrototypeSlots() {
    // can't inherit this - it's called only once on the proto when setting up the class
    this.setupProtoFromMetaInfo() 
  }

  /*
  initPrototypeSlots() {

    this.protoMetaInfo().forEach(statDict => {
        const defaultValue = statDict.type === "Number" ? 0 : "";
        const slot = this.newSlot(statDict.title, defaultValue);
        //slot.setInspectorPath("")
        slot.setShouldStoreSlot(true);
        //slot.subtitle(statDict.description)
        slot.setDuplicateOp("duplicate");
        slot.setSlotType(statDict.type);
        slot.setIsSubnodeField(true);
        slot.setCanEditInspection(true);
        slot.setSyncsToView(true)
        slot.setSummaryFormat("key value")
    })

  }

  init() {
    super.init();
    this.setTitle("Combat")
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
  */

  title () {
    return this.type().humanized();
  }

}.initThisClass());
