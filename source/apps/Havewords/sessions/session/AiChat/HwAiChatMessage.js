"use strict";

/*

    HwAiChatMessage

*/

(class HwAiChatMessage extends BMTextAreaField {

  initPrototypeSlots () {

  }

  init () {
    super.init();
    this.removeNodeAction("add");
    this.setCanDelete(true);
    this.setNodeCanEditTitle(true);
    this.setTitle("");
    this.setSubtitle("message");
    this.setNodeCanReorderSubnodes(false);
    this.setShouldStore(true);
    this.setShouldStoreSubnodes(true);
    this.setKey("speaker")
    this.setValue("content")
  }

  finalInit () {
    super.finalInit();
    this.setNodeTileClassName("BMChatFieldTile")
    this.setKeyIsVisible(true)
  }

  /*
  nodeViewClassName () {
    debugger;
    return super.nodeViewClassName()
  }

  nodeViewClass () {
    debugger;
    return super.nodeViewClass()
  }

  overrideSubviewProto () {
    debugger;
    return this.overrideSubviewProto()
  }
  */

  onValueInput () {
    //debugger;
    this.send()
    return this;
  }

  send () {

  }

}).initThisClass();
