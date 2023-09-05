"use strict";

/* 
    CharacterProficiencies

*/

(class CharacterProficiencies extends CharacterFlex {

  metaInfo () {
    return {
    }
  }

  /*
  initPrototypeSlots() {

  }
  */

  subtitle () {
    return this.childrenSummary()
  }
 
}).initThisClass();
