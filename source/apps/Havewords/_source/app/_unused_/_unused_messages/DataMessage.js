"use strict";

/* 
    DataMessage

    An object wrapper for a json message sent over WebRTC data connection.

*/

(class DataMessage extends Base {

  static newFromJson(json) {
    if (!json.type) {
      throw new Error("no message type in message: ", json);
    }

    if (json.type.endsWith("Message")) {
      throw new Error("message type doesn't has suffix 'Message': ", json);
    }

    const messageClass = getGlobalThis(json.type);
    if (!messageClass) {
      throw new Error("no message class '" + json.type + "'found for message type: '" + json.type + "'");
    }

    return messageClass.clone().fromJson(json);
  }

  initPrototypeSlots() {
    this.newSlot("messageFields", new Set());
    this.newMessageFieldSlot("id", {});
    this.newMessageFieldSlot("nickname", {});
  }

  newMessageFieldSlot (slotName, defaultValue) {
    this.newSlot("slotName", defaultValue);
    this.messageFields().add(slotName);
    return this;
  }

  init() {
    super.init();
    this.json().type = this.type();
    this.setIsDebugging(true);
  }

  fromJson (json) {
    assert(json.type === this.type())
    this.messageFields().forEach((slotName) => {
      const v = json[slotName];
      const isMissing = v === undefined;
      if (isMissing) {
        throw new Error(this.type() + " missing field '" + slotName + "' in json ", json);
      }
      const setter = "set" + slotName.capitalized();
      this[setter].apply(this, v);
    });
    return this;
  }
  
  asJson () {
    const json = {}
    this.messageFields().forEach((slotName) => {
      const v = this[slotName].apply(this);
      json[slotName] = v;
      // TODO: check for undefined?
    })
    return json;
  }

  send () {

  }

  onReceived () {

  }


}).initThisClass();
