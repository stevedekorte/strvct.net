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

        if (!this.methodsConformToProtocol(protocol)) {
            const missing = protocol.protocolMethodNames().filter(name => typeof (this[name]) !== "function");
            throw new Error(this.svType() + " does not conform to protocol " + protocol.svType() + " — missing: " + missing.join(", "));
        }

        // The protocols slot default is a single Set shared by every prototype
        // that hasn't set its own, so mutating it would mark the entire class
        // tree as conforming. Copy-on-write an own set first (seeded with any
        // protocols inherited from ancestor classes).
        if (!Object.hasOwn(this, "_protocols")) {
            this.setProtocols(new Set(this.protocols()));
        }
        this.protocols().add(protocol);

        protocol.addImplementer(this.thisClass());
    }

    /**
    * @method allProtocolMethodNames
    * @returns {Array}
    * @category Protocol Analysis
    */
    allProtocolMethodNames () {
        return this.protocols().valuesArray().map(protocol => protocol.protocolMethodNames()).flat().unique();
    }

    /**
    * @method methodsConformToProtocol
    * @param {Protocol} protocol
    * @returns {Boolean} True if this object implements every method the protocol declares.
    * @category Protocol Analysis
    */
    methodsConformToProtocol (protocol) {
        return protocol.protocolMethodNames().every(name => typeof (this[name]) === "function");
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
        assert(this.implementsMethodNamesSet(methodNamesSet), this.svType() + " is missing methods: " + methodNamesSet.difference(this.allSlotsNamesSet()));
    }

}).initThisCategory();
