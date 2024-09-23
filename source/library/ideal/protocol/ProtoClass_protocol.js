/**
 * @module library.ideal.protocol 
 */

"use strict";

/**
 * @class ProtoClass_protocol
 * @extends ProtoClass
 * Extends the Protocol class with some useful methods for working with protocols.
 */

(class ProtoClass_protocol extends ProtoClass {

  /*
  initPrototypeSlots() {
    {
      const slot = this.newSlot("protocols", new Set());
      slot.setSlotType("Set");
    }
  }
    */

  addProtocol(protocol) {
    if (this.conformsToProtocol(protocol)) {
      this.protocols().add(protocol);
    } else {
      throw new Error("Protocol " + protocol + " not found in " + this);
    }
  }

  conformsToProtocol(protocol) {
    return this.protocols().includes(protocol);
  }

}).initThisCategory();

