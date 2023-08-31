"use strict";

/* 
    CharacterSkills

*/

(class CharacterSkills extends CharacterFlex {

  metaInfo () {
    return {
      "Strength": {
        "athletics": 0
      },
      "Dexterity": {
        "acrobatics": 0,
        "sleight of hand": 0,
        "stealth": 0
      },
      "Intelligence": {
        "arcana": 0,
        "history": 0,
        "investigation": 0,
        "nature": 0,
        "religion": 0
      },
      "Wisdom": {
        "animal handling": 0,
        "insight": 0,
        "medicine": 0,
        "perception": 0,
        "survival": 0
      },
      "Charisma": {
        "deception": 0,
        "intimidation": 0,
        "performance": 0,
        "persuasion": 0
      }
    }
  }

  /*
  initPrototypeSlots() {

  }
  */

  init() {
    super.init();
    this.setCanDelete(false);
    this.setShouldStoreSubnodes(true);
    this.setupSubnodes()
  }

  finalInit () {
    super.finalInit()
    this.setNodeSubtitleIsChildrenSummary(true);
  }

  setupSubnodes () {
    const dict = this.metaInfo()
    
    Object.keys(dict).forEach(k => {
      const v = dict[k];
      const sn = BMJsonDictionaryNode.clone();
      sn.setSummaryFormat("key value")
      sn.setTitle(k); 
      sn.setNodeSubtitleIsChildrenSummary(true);
      sn.setJson(v);
      this.addSubnode(sn);
    })
  }

  subtitle () {
    return this.childrenSummary()
  }
 
}).initThisClass();
