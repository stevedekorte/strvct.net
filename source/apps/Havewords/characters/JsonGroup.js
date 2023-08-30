"use strict";

/* 
    JsonGroup

*/

(class JsonGroup extends BMSummaryNode {
  initPrototypeSlots() {
  }

  setJsonString (s) {
    return this
  }

  jsonString () {
    //return JSON.stableStringify(this.asJson(), 2, 2) // hard to read and no formatting
    return JSON.stringify(this.jsonArchive(), 2, 2)
  }

  setJson (dict) {
    Object.keys(dict).forEach(k => {
      const v = dict[k]
      const sn = this.firstSubnodeWithTitle(k)
      if (sn) {
        sn.setJson(v)
      }
    })
    return this
  }

  jsonArchive () {
    const dict = {
      type: this.title(),
    }

    this.subnodes().filter(sn => sn.title() !== "jsonString").map(sn => {
      if (sn.jsonArchive && sn.jsonArchive() !== undefined) { // skip things like images
        console.log(sn.title() + " = " + JSON.stringify(sn.jsonArchive()))
        dict[sn.title()] = sn.jsonArchive()
      }
    })

    return dict
  }

}.initThisClass());
