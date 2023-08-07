"use strict";

/* 
    RzPeerPicker

*/

(class RzPeerPicker extends BMFolderNode {

  initPrototypeSlots() {
    //this.newSlot("validTitlesMethod", "availablePeerIds")
    this.newSlot("chooseMethod", null)

    this.setShouldStore(false);
    this.setShouldStoreSubnodes(false);
    this.setCanDelete(true)
  }
  
  title () {
    return "choose peer"
  }

  /*
  didUpdateSlotParentNode(oldValue, newValue) {
    super.didUpdateSlotParentNode(oldValue, newValue)

    if (newValue) {
      const titles = ["a", "b"]
      titles.forEach(title => this.addChoice(title))
    }
  }
  */

  prepareForFirstAccess () {
    super.prepareForFirstAccess()
    this.setupSubnodes()
  }

  serverConn () {
    return this.parentNode().parentNode()
  }

  /*
  validTitles () {
    const p = this.serverConn()
    const method = p[this.validTitlesMethod()]
    return method.apply(p, [])
  }
  */

  setupSubnodes () {
    const titles = this.serverConn().availablePeerIds()
    titles.forEach(title => this.addChoice(title))
  }

  addChoice (title) {
    const sn = BMFolderNode.clone()
    sn.setTitle(title)
    sn.setNodeCanEditTitle(false)
    sn.setNodeCanEditSubtitle(false)
    sn.setNoteIconName(null)
    sn.setTarget(this).setMethodName("didChoose") //.setInfo(aClass)
    sn.setCanDelete(false)
    this.addSubnode(sn)
    return this
  }

  didChoose (sender) { // sender?
    const peerId = sender.title()
    this.serverConn().connectToPeerId(peerId)
    this.removeFromParentNode()
    //const peerConn = RzPeerConn.clone().
    //debugger;
  }

}.initThisClass());
