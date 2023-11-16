"use strict";

/*

    Broadcaster

    Fast notifications that immediately message listeners 
    instead of using Observer and Notification objects.
    As multiple notifications of the same name are not merged
    within the same event loop, it's up to listeners to implement handlers efficiently.

    Example use:

        // inside a storable node
        init () {
            ...
            Broadcaster.shared().addListenerForName(this, "didChangeStoredSlot")
            ...
        }

        // inside a StoreableNode, on slot change
        onSlotChange (...) {
            ...
            Broadcaster.shared().broadcastNameAndArgument("didChangeStoredSlot", this)
            ...
        }

        // inside a persistent store
        didChangeStoredSlot (aSender) {
            ... tell store to persist it ...
        }

    Example use:
*/

(class Broadcaster extends ProtoClass {

    static initClass () {
        this.setIsSingleton(true)
        return this
    }
    
    initPrototypeSlots () {
        this.newSlot("nameToListenersMap", null)  // dict to set
    }

    init () {
        super.init()
        this.setNameToListenersMap(new Map())
    }

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
	
    addListenerForName (aListener, name) {
        this.listenerSetForName(name).add(aListener)
        return this
    }
    
    removeListenerForName (aListener, name) {
        this.listenerSetForName(name).delete(aListener)
        return this
    }

    broadcastNameAndArgument (methodName, anArgument) {
        this.listenerSetForName(methodName).forEach(v => {
            v[methodName].call(v, anArgument)
        })
        return this
    }

    removeListenersForName (name) {
        this.nameToListenersMap().delete(name)
        return this
    }

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

    broadcastMessage: function(methodName) {
        Broadcaster.shared().broadcastNameAndArgument(methodName, this)
        return this
    }
    
})
