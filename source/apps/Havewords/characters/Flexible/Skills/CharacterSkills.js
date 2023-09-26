"use strict";

/* 
    CharacterSkills

*/

/*
{
  "Strength": [
      {
          "label": "Athletics",
          "subtitle": "Physical feats, climbing, swimming"
      }
  ],
  "Dexterity": [
      {
          "label": "Acrobatics",
          "subtitle": "Balance, flips, rolls"
      },
      {
          "label": "Sleight of Hand",
          "subtitle": "Picking pockets, small tricks"
      },
      {
          "label": "Stealth",
          "subtitle": "Moving quietly, hiding"
      }
  ],
  "Intelligence": [
      {
          "label": "Arcana",
          "subtitle": "Magic, magical lore"
      },
      {
          "label": "History",
          "subtitle": "Historical events, ancient knowledge"
      },
      {
          "label": "Investigation",
          "subtitle": "Search for clues, deductions"
      },
      {
          "label": "Nature",
          "subtitle": "Flora, fauna, geography"
      },
      {
          "label": "Religion",
          "subtitle": "Deities, rites, religious lore"
      }
  ],
  "Wisdom": [
      {
          "label": "Animal Handling",
          "subtitle": "Calm, control, ride animals"
      },
      {
          "label": "Insight",
          "subtitle": "Read intentions, detect lies"
      },
      {
          "label": "Medicine",
          "subtitle": "Diagnose, stabilize, heal"
      },
      {
          "label": "Perception",
          "subtitle": "Notice, search, spot"
      },
      {
          "label": "Survival",
          "subtitle": "Track, navigate, predict weather"
      }
  ],
  "Charisma": [
      {
          "label": "Deception",
          "subtitle": "Lie, mislead, feign"
      },
      {
          "label": "Intimidation",
          "subtitle": "Threaten, coerce, bully"
      },
      {
          "label": "Performance",
          "subtitle": "Dance, sing, entertain"
      },
      {
          "label": "Persuasion",
          "subtitle": "Convince, charm, negotiate"
      }
  ]
}
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
  }

  finalInit () {
    super.finalInit()
    this.setNodeSubtitleIsChildrenSummary(true);
    if (!this.hasSubnodes()) {
      this.setupSubnodes()
    }
    this.setSubnodesSummaryFormat("key value")
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
