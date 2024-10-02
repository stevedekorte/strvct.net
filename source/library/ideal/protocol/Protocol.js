/**
 * @module library.ideal.protocol
 * @class Protocol
 * @extends ProtoClass
 * @classdesc A base class for protocol subclasses. 
 * This class provides some helper methods, such as verifying that an object supports a given protocol.
 * 
 * Declaring protocols:
 * 
 * To declare a protocol, define a subclass of Protocol and add (and document) the protocol's methods to it (as class and instance methods).
 * - Instance methods will be considered part of the class's instance method protocol. 
 * - Class methods will be considered part of the class's class method protocol.
 * 
 * These methods are inherited by subclasses of the Protocol class, so a given protocol will inherit the methods of all its superclasses
 * up to but not including the Protocol class and instance methods.
 * 
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
     * @category State
     */
    this.newClassSlot("implementers", new Set());
  }

  /**
   * @description Adds an implementer to the protocol.
   * @param {Object} implementer - The implementer class to add.
   * @category Management
   */
  static addImplementer (implementer) {
    assert(implementer.isClass(), "implementer must be a class");
    this.implementers().add(implementer);
  }

  /**
   * @description Removes an implementer from the protocol.
   * @param {Object} anImplementer - The implementer to remove.
   * @category Management
   */
  static removeImplementer (anImplementer) {
    this.implementers().delete(anImplementer);
  }

  /**
   * @description Asserts that the given value is a Protocol class.
   * @param {Object} aProtocol - The value to check.
   * @category Validation
   */
  static assertValueIsProtocolClass (aProtocol) {
    assert(aProtocol.isClass() && aProtocol.isKindOf(Protocol), "aProtocol must be a Protocol class");
  }

  /**
   * @description Throws an error because Protocol classes should not be instantiated.
   * @category Initialization
   */
  init () {
    super.init();
    throw new Error("Protocol classes should not be instantiated. They should only be used to declare protocols.");
  }

  /**
   * @description Checks if the current protocol is a subset of the given protocol.
   * @param {Protocol} aProtocol - The protocol class to check against.
   * @returns {boolean} True if the current protocol is a subset of the given protocol, false otherwise.
   * @category Comparison
   */
  isSubsetOfProtocol (aProtocol) {
    this.thisClass().assertValueIsProtocolClass(aProtocol);
    return this.conformsToProtocol(aProtocol);
  }

  /**
   * @description Checks if the current protocol is a superset of the given protocol.
   * @param {Protocol} protocol - The protocol to check against.
   * @returns {boolean} True if the current protocol is a superset of the given protocol, false otherwise.
   * @category Comparison
   */
  isSupersetOfProtocol (protocol) {
    this.thisClass().assertValueIsProtocolClass(aProtocol);
    return protocol.conformsToProtocol(this);
  }

  /**
   * @description Returns all protocols (i.e. all subclasses of Protocol).
   * @returns {Array} An array of all protocols.
   * @category Query
   */
  static allProtocols () {
    return this.thisClass().allSubclasses();
  }

}.initThisClass());