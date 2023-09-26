"use strict";

/* 
    CharacterInventory

*/

(class CharacterInventory extends CharacterFlex {

    sampleJson () {
        return {
            "Weapons": {
                "Scimitar": {
                    //"type": "Scimitar",
                    "damage": "1d6 slashing",
                    "properties": "Finesse, light"
                }
            },
            "Armor": {
                "Hide Armor": {
                    //"type": "Hide Armor",
                    "armor class": "12 + Dexterity modifier (max 2)"
                }
            },
            "Items": {
                "Druidic Focus": {
                    //"type": "Druidic Focus",
                    "description": "A carved wooden staff that Xhor uses to channel his druidic spells."
                }
            }
        }
    }

    updateFormatting () {
        super.updateFormatting()
        this.subnodes().forEach(sn => {
            sn.setSummaryFormat("key value")
            sn.subnodes().forEach(sn2 => {
              sn2.setSummaryFormat("key")
            })
        })
       return this
    }
    
}.initThisClass());
