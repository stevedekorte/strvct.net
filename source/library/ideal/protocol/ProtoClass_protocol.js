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

    /**
    * @static
    * @method protocolWithName
    * @param {string} protocolClassName
    * @returns {Protocol|undefined}
    * @category Protocol Management
    */
    static protocolWithName (protocolClassName) {
    Type.assertString(protocolClassName);
        const protocolClass = SvGlobals.globals()[protocol];
        if (protocolClass) {
            if (protocolClass.isKindOf(Protocol)) {
                return protocolClass;
            }
            //throw new Error("Protocol '" + protocolClassName + "' is not a subclass of Protocol");
        }
        return undefined;
    }

    /**
    * @method addProtocol
    * @param {Protocol} protocol
    * @category Protocol Management
    */
    addProtocol (protocol) {
    // Ensure protocol is a subclass of Protocol.
    assert(protocol.isClass() && protocol.isKindOf(Protocol), "Protocol " + protocol + " is not a subclass of Protocol");

    // Add protocol to set of protocols.
    if (this.methodsConformToProtocol(protocol)) {
        this.protocols().add(protocol);
    } else {
        throw new Error("Protocol " + protocol + " not found in " + this);
    }

    protocol.addImplementer(this.thisClass());
    }

    /**
    * @method allProtocolMethodNames
    * @returns {Array}
    * @category Protocol Analysis
    */
    allProtocolMethodNames () {
    return this.protocols().allSlotsMap().valuesArray().map(slot => slot.name()).unique();
    }

    /**
    * @method methodsConformToProtocol
    * @param {Protocol} protocol
    * @returns {Array}
    * @category Protocol Analysis
    */
    methodsConformToProtocol (protocol) {
    return this.protocols().allSlotsMap().valuesArray().select(slot => slot.conformsToProtocol(protocol));
    }

    /**
    * @method conformsToProtocol
    * @param {Protocol} protocol
    * @returns {boolean}
    * @category Protocol Analysis
    */
    conformsToProtocol (protocol) {
    return this.protocols().has(protocol);
    }

    /**
    * @method assertConformsToProtocol
    * @param {Protocol} protocol
    * @category Protocol Validation
    */
    assertConformsToProtocol (protocol) {
    assert(this.conformsToProtocol(protocol), "Protocol " + protocol + " not found in " + this);
    }

    /**
    * @method allSlotsNamesSet
    * @returns {Set}
    * @category Slot Analysis
    */
    allSlotsNamesSet () {
    return this.allSlotsMap().keysSet();
    }

    /**
    * @method implementsMethodNamesSet
    * @param {Set} methodNamesSet
    * @returns {boolean}
    * @category Method Analysis
    */
    implementsMethodNamesSet (methodNamesSet) {
    return methodNamesSet.isSubsetOf(this.allSlotsNamesSet());
    }

    /**
    * @method assertImplementsMethodNamesSet
    * @param {Set} methodNamesSet
    * @category Method Validation
    */
    assertImplementsMethodNamesSet (methodNamesSet) {
    assert(this.implementsMethodNamesSet(methodNamesSet), this.type() + " is missing methods: " + methodNamesSet.difference(this.allSlotsNamesSet()));
    }

}).initThisCategory();