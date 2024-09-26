/**
 * @module library.ideal.protocol
 * @class Protocol
 * @extends ProtoClass
 * @classdesc A base class for protocol subclasses. 
 * This class provides some helper methods, such as verifying that an object supports a given protocol.
 * 
 * Declaring protocols:
 * 
 * To declare a protocol, define a subclass of Protocol and add (and document) the protocol's methods to it (as instance methods).
 * Be sure that the jsdoc comment for the protocol class includes "interface" (instead of class) tag in the class jsdocs.
 * 
 * Notes:
 * 
 * Using the instance methods of subclasses of the Protocol class to define Protocols has pros and cons:
 * 
 * Pros:
 * - they support inheritance from other protocols.
 * - they support the use of the isKindOf method to check for conformance to a protocol.
 * 
 * Cons:
 * - conflicts with the instance method namespace (somewhat avoided by only looking at instance methods up to the Protocol class's instance methods)
 * 
 */

"use strict";

(class Protocol extends ProtoClass {

  static initClass () {
    /**
     * @member {Set} implementers - A set of all implementers of the protocol.
     */
    this.newClassSlot("implementers", new Set());
  }

  /**
   * @description Adds an implementer to the protocol.
   * @param {Object} implementer - The object to add as an implementer.
   */
  static addImplementer (implementer) {
    this.implementers().add(implementer);
  }

  /**
   * @description Removes an implementer from the protocol.
   * @param {Object} implementer - The object to remove as an implementer.
   */
  static removeImplementer (implementer) {
    this.implementers().delete(implementer);
  }

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

  /**
   * @description Returns all protocols (i.e. all subclasses of Protocol).
   * @returns {Array} An array of all protocols.
   */
  static allProtocols () {
    return this.thisClass().allSubclasses();
  }

}.initThisClass());