"use strict";

/**
 * @module library.notification
 */

/**
 * @class Broadcaster
 * @extends ProtoClass
 * @classdesc Fast notifications that immediately message listeners 
 * instead of using Observer and Notification objects.
 * As multiple notifications of the same name are not merged
 * within the same event loop, it's up to listeners to implement handlers efficiently.
 *
 * Example use:
 *
 *     // inside a storable node
 *     init () {
 *         ...
 *         Broadcaster.shared().addListenerForName(this, "didChangeStoredSlot")
 *         ...
 *     }
 *
 *     // inside a StoreableNode, on slot change
 *     onSlotChange (...) {
 *         ...
 *         Broadcaster.shared().broadcastNameAndArgument("didChangeStoredSlot", this)
 *         ...
 *     }
 *
 *     // inside a persistent store
 *     didChangeStoredSlot (aSender) {
 *         ... tell store to persist it ...
 *     }
 */
(class SvBroadcaster extends ProtoClass {

    /**
     * @static
     * @description Initialize the class
     * @category Initialization
     */
    static initClass () {
        this.setIsSingleton(true)
    }
    
    /**
     * @description Initialize prototype slots
     * @category Initialization
     */
    initPrototypeSlots () {
        {
            /**
             * @member {Map} nameToListenersMap
             * @category Storage
             */
            const slot = this.newSlot("nameToListenersMap", null);  // Map to set
            slot.setSlotType("Map");
        }
    }

    /**
     * @description Initialize prototype
     * @category Initialization
     */
    initPrototype () {
    }

    /**
     * @description Initialize the instance
     * @category Initialization
     */
    init () {
        super.init()
        this.setNameToListenersMap(new Map())
    }

    /**
     * @description Get the listener set for a given name
     * @param {string} name - The name to get the listener set for
     * @returns {Set} The set of listeners for the given name
     * @category Listener Management
     */
    listenerSetForName (name) {
        assert(!Type.isNullOrUndefined(name))

        // probably not inneficient since 
        // 1. we don't remove listeners often
        // 2. we don't have many names
        const n2l = this.nameToListenersMap()

        if (!n2l.has(name)) {
            n2l.set(name, new Set())
        }
        return n2l.get(name)
    }
	
    /**
     * @description Add a listener for a given name
     * @param {Object} aListener - The listener to add
     * @param {string} name - The name to add the listener for
     * @returns {Broadcaster} The broadcaster instance
     * @category Listener Management
     */
    addListenerForName (aListener, name) {
        this.listenerSetForName(name).add(aListener)
        return this
    }
    
    /**
     * @description Remove a listener for a given name
     * @param {Object} aListener - The listener to remove
     * @param {string} name - The name to remove the listener for
     * @returns {Broadcaster} The broadcaster instance
     * @category Listener Management
     */
    removeListenerForName (aListener, name) {
        this.listenerSetForName(name).delete(aListener)
        return this
    }

    /**
     * @description Broadcast a name and argument to all listeners
     * @param {string} methodName - The name of the method to call on listeners
     * @param {*} anArgument - The argument to pass to the method
     * @returns {Broadcaster} The broadcaster instance
     * @category Broadcasting
     */
    broadcastNameAndArgument (methodName, anArgument) {
        this.listenerSetForName(methodName).forEach(v => {
            v[methodName].call(v, anArgument)
        })
        return this
    }

    /**
     * @description Remove all listeners for a given name
     * @param {string} name - The name to remove listeners for
     * @returns {Broadcaster} The broadcaster instance
     * @category Listener Management
     */
    removeListenersForName (name) {
        this.nameToListenersMap().delete(name)
        return this
    }

    /**
     * @description Clean up empty listener sets
     * @category Maintenance
     */
    clean () {
        const n2l = this.nameToListenersMap()
        n2l.shallowCopy().forEachKV((name, listenerSet) => {
            if (listenerSet.size === 0) {
                n2l.delete(name)
            }
        })
    }

}.initThisClass());

Object.defineSlots(ProtoClass.prototype, {

    /**
     * @description Broadcast a message to all listeners
     * @param {string} methodName - The name of the method to call on listeners
     * @returns {ProtoClass} The instance
     * @category Broadcasting
     */
    broadcastMessage: function (methodName) {
        Broadcaster.shared().broadcastNameAndArgument(methodName, this)
        return this
    }
    
})