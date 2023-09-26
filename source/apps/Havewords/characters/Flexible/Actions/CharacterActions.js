"use strict";

/* 
    CharacterActions

*/

(class CharacterActions extends CharacterFlex {

    sampleJson () {
        return {
            "Spell Casting": {
              "description": "As a level 10 Druid, Xhor has the ability to cast spells. He has access to spells up to 5th level.",
              "spell slots": {
                "1st level": 4,
                "2nd level": 3,
                "3rd level": 3,
                "4th level": 3,
                "5th level": 2
              }
            }
          }  
    }s

    updateFormatting () {
        super.updateFormatting()
        this.subnodes().forEach(sn => {
            sn.setSummaryFormat("key")
        })
       return this
    }

}.initThisClass());
