/**
 * @module library.ideal.protocol
 * @class Protocol
 * @extends ProtoClass
 * @classdesc A base class for protocol subclasses. 
 * The subclasses are used to define protocols for communication between objects.
 * This class provides some helper methods, such as verifying that an object supports a given protocol.
 * The ProtoClass should support:
 * - conformsToProtocol() method.
 * - addProtocol() method, which 1) checks for conformance to a protocol and 2) adds the protocol to a supportedProtocols set.
 * would addProtocol() typically be called in initPrototype()? What about class protocols?
 * Notes:
 * Protocols should support inheritance from other protocols.
 */
"use strict";

(class Protocol extends ProtoClass {

  /*
  initPrototypeSlots() {

  }

  initPrototype() {
  }

  init() {
    super.init();
  }
  */

  /**
   * @description Checks if the current protocol is a subset of the given protocol.
   * @param {Protocol} protocol - The protocol to check against.
   * @returns {boolean} True if the current protocol is a subset of the given protocol, false otherwise.
   */
  isSubsetOfProtocol(protocol) {
    return this.conformsToProtocol(protocol);
  }

  /**
   * @description Checks if the current protocol is a superset of the given protocol.
   * @param {Protocol} protocol - The protocol to check against.
   * @returns {boolean} True if the current protocol is a superset of the given protocol, false otherwise.
   */
  isSupersetOfProtocol(protocol) {
    return protocol.conformsToProtocol(this);
  }

}.initThisClass());