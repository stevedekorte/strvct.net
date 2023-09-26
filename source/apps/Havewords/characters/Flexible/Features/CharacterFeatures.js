"use strict";

/* 
    CharacterFeatures

*/

(class CharacterFeatures extends CharacterFlex {

    sampleJson () {
        return {
            "Class Features": {
                "Arcane Recovery": {
                    //"type": "Class Feature",
                    //"class": "Wizard",
                   // "name": "Arcane Recovery",
                    //"level": 2,
                    "description": "You can recover spell slots on a short rest."
                },

                "Rage": {
                    //"name": "Rage",
                    "description": "In a fury, you fight with primal ferocity.",
                    "benefits": {
                        "Advantage": "Strength checks and saving throws",
                        "BonusDamage": "Extra damage on melee strength attacks",
                        "Resistance": "Bludgeoning, piercing, and slashing damage"
                    },
                    "usage": {
                        "duration": "1 minute",
                        "limit": "Varies by level, starting at 2 per long rest",
                        "endConditions": [
                            "If you haven't attacked a hostile creature since your last turn or taken damage since then",
                            "If you are knocked unconscious"
                        ]
                    },
                    "activation": "Bonus action on your turn"
                }
            },

            "Racial Traits": {
                "Keen Senses": {
                    //"type": "Racial Trait",
                    //"race": "Elf",
                    //"name": "Keen Senses",
                    "description": "You have proficiency in the Perception skill."
                }
            },

            "Background Features": {
                "Shelter of the Faithful": {
                    //"type": "Background Feature",
                    "background": "Acolyte",
                    //"name": "Shelter of the Faithful",
                    "description": "You can receive support from temples and other religious institutions."
                }
            },

            "Personality Traits": {
                "Honesty": {
                    //"type": "Personality Trait",
                    //"name": "Honesty",
                    "description": "I always speak the truth, no matter the cost."
                }
            },
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
