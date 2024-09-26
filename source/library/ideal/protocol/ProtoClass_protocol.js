/**
 * @module library.ideal.protocol 
 */

"use strict";

/**
 * @class ProtoClass_protocol
 * @extends ProtoClass
 * Extends the Protocol class with some methods for working with protocols.
 * 
 * ## Implementing protocols
 * ProtoClass subclasses that implement a protocol can declare this by calling the addProtocol(protocolClass) method.
 * This is typically within their initPrototype() method.
 *
 */

(class ProtoClass_protocol extends ProtoClass {

  /*
  initPrototypeSlots () {
    {
      const slot = this.newSlot("protocols", new Set());
      slot.setSlotType("Set");
    }
  }
  */

  static protocolWithName (protocolClassName) {
    Type.assertString(protocolClassName);
      const protocolClass = getGlobalThis()[protocol];
      if (protocolClass) {
        if (protocolClass.isKindOf(Protocol)) {
            return protocolClass;
        }
        //throw new Error("Protocol '" + protocolClassName + "' is not a subclass of Protocol");
      }
      return undefined;
  }

  addProtocol (protocol) {
    // Ensure protocol is a subclass of Protocol.
    assert(protocol.isClass() && protocol.isKindOf(Protocol), "Protocol " + protocol + " is not a subclass of Protocol");

    // Add protocol to set of protocols.
    if (this.methodsConformToProtocol(protocol)) {
      this.protocols().add(protocol);
    } else {
      throw new Error("Protocol " + protocol + " not found in " + this);
    }

    protocol.addImplementer(this);
  }

  allProtocolMethodNames () {
    return this.protocols().allSlotsMap().valuesArray().map(slot => slot.name()).unique();
  }

  methodsConformToProtocol (protocol) {
    return this.protocols().allSlotsMap().valuesArray().select(slot => slot.conformsToProtocol(protocol));
  }

  conformsToProtocol (protocol) {
    return this.protocols().has(protocol);
  }

  assertConformsToProtocol (protocol) {
    assert(this.conformsToProtocol(protocol), "Protocol " + protocol + " not found in " + this);
  }

}).initThisCategory();

