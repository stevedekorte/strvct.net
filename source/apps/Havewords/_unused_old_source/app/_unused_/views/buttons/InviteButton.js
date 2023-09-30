"use strict";

/* 
    InviteButton

    When clicked, button copies link string value to clip board.

*/

(class InviteButton extends Button {
  initPrototypeSlots() {
    this.newSlot("link", null)
  }

  init() {
    super.init();
    this.setId("CopyInviteButton");
    //this.setIsHidden(!App.shared().isHost());
    this.hide();
  }

  setLink (aString) {
    //console.log('Setting invite link:', aString);
    this._link = aString;
    //this.element().style.opacity = 1;
    return this
  }

  submit () {
    const e = this.element();
    const oldColor = e.style.color;
    event.target.style.color = "white";
    setTimeout(() => {
      e.style.color = oldColor;
    }, 0.2 * 1000);
    Sounds.shared().playSendBeep();
    this.link().copyToClipboard();
  }

}.initThisClass());

