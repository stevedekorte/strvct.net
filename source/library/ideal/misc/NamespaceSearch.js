"use strict";

/**
 * @module library.ideal.misc
 * @class NamespaceSearch
 * @extends ProtoClass
 * @classdesc A way to search the Javascript namespace. All slots are enumerated and passed through a user-defined closure to find matches.
 *
 * Example use:
 *
 *      const search = new NamespaceSearch()
 *      search.setSlotMatchClosure(function (slotOwner, slotName, slotValue, slotPath) {
 *          return slotName === "String"
 *      })
 *      search.find()
 *      assert(search.matchingPaths()[0] === "globalThis/String")
 */
(class NamespaceSearch extends ProtoClass {

    initPrototypeSlots () {
        /**
         * @property {Set} visited
         * @private
         */
        {
            const slot = this.newSlot("visited", null);
            slot.setSlotType("Set");
        }
        /**
         * @property {Array} matchingPaths
         * @private
         */
        {
            const slot = this.newSlot("matchingPaths", null);
            slot.setSlotType("Array");
        }
        /**
         * @property {Function} slotMatchClosure
         * @private
         */
        {
            const slot = this.newSlot("slotMatchClosure", null);
            slot.setSlotType("Function");
        }
    }
  
    initPrototype () {
    }

    /**
     * @description Initializes the NamespaceSearch instance.
     */
    init () {
        super.init();
        this.clear();
    }

    /**
     * @description Clears the visited set and matchingPaths array.
     */
    clear () {
        this.setVisited(new Set([this])) // to avoid searching this object
        this.setMatchingPaths([])
    }

    /**
     * @description Finds matches based on the provided searchString or the slotMatchClosure.
     * @param {string} [searchString]
     * @returns {NamespaceSearch} The current instance for chaining.
     */
    find (searchString) {
        this.clear()

        if (searchString) {
            this.setSlotMatchClosure((slotOwner, slotName, slotValue, slotPath) => {
                return slotName === s
            })
        }

        //this.findOnObject(globalThis, ["globalThis"])
        this.findOnObject(getGlobalThis(), ["globalThis"])
        return this
    }

    /**
     * @description Recursively searches for matching slots on the given object and its properties.
     * @param {Object} v The object to search.
     * @param {Array} [path=[]] The current path to the object.
     */
    findOnObject (v, path = []) {
        if (Type.isNullOrUndefined(v)) {
            return false
        }

        if (this.visited().has(v)) {
            return false
        } else {
            this.visited().add(v)
        }

        //const joinedPath = path.join("/")

        Object.getOwnPropertyNames(v).forEach((k) => {
            if (this.canAccessSlot(v, k)) {
                this.findOnSlot(v, k, path)
            }
        })
    }

    /**
     * @description Checks if the slot can be accessed without triggering a custom getter.
     * @param {Object} v The object containing the slot.
     * @param {string} k The slot name.
     * @returns {boolean} True if the slot can be accessed, false otherwise.
     */
    canAccessSlot (v, k) {
        // to avoid illegal operation errors
        const descriptor = Object.getOwnPropertyDescriptor(v, k)
        const hasCustomGetter = Type.isUndefined(descriptor.get)
        return !hasCustomGetter
    }

    /**
     * @description Searches for matches on the given slot and recursively searches its value.
     * @param {Object} slotOwner The object containing the slot.
     * @param {string} slotName The name of the slot.
     * @param {Array} [path=[]] The current path to the slot.
     */
    findOnSlot (slotOwner, slotName, path = []) {
        const localPath = path.shallowCopy()
        localPath.push(slotName)
        
        const slotValue = slotOwner[slotName]

        if (this.doesMatchOnSlot(slotOwner, slotName, slotValue, localPath)) {
            this.addMatchingPath(localPath)
        }

        this.findOnObject(slotValue, localPath)
    }

    /**
     * @description Checks if the slot matches the slotMatchClosure criteria.
     * @param {Object} slotOwner The object containing the slot.
     * @param {string} slotName The name of the slot.
     * @param {*} slotValue The value of the slot.
     * @param {Array} slotPath The path to the slot.
     * @returns {boolean} True if the slot matches the criteria, false otherwise.
     */
    doesMatchOnSlot (slotOwner, slotName, slotValue, slotPath) {
        return this.slotMatchClosure()(slotOwner, slotName, slotValue, slotPath)
    }

    /**
     * @description Adds a matching path to the matchingPaths array.
     * @param {Array} aPath The path to add.
     * @returns {NamespaceSearch} The current instance for chaining.
     */
    addMatchingPath (aPath) {
        const stringPath = aPath.join("/")
        if (!this.matchingPaths().contains(stringPath)) {
            this.matchingPaths().push(stringPath)
        }
        return this
    }

    /**
     * @description Logs the matching paths to the console.
     */
    showMatches () {
        console.log("matchingPaths:")
        this.matchingPaths().forEach(p => console.log("  " + p))
    }

    /**
     * @description Performs a self-test of the NamespaceSearch class.
     * @static
     */
    static selfTest () {
        const ns = NamespaceSearch.clone()
        ns.setSlotMatchClosure(function (slotOwner, slotName, slotValue, slotPath) {
            return slotName === "String"
        })
        ns.find()
        assert(ns.matchingPaths()[0] === "globalThis/String")
    }

}.initThisClass());

//NamespaceSearch.selfTest()