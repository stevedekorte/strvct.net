"use strict"

/*

    BMCache

*/

window.BMCache = class BMCache extends BMStorableNode {
    
    static initThisClass () {
        super.initThisClass()
        this.setIsSingleton(true)
		return this
    }
    
    initPrototype () {
        this.newSlot("asyncDict", null)
    }

    init () {
        super.init()
        this.setTitle("Cache")
        this.setNodeMinWidth(400)
        this.setNoteIsSubnodeCount(true)
        this.setShouldStore(true)
        this.setShouldStoreSubnodes(true)
        this.setNodeCanReorderSubnodes(true)

        this.setAsyncDict(PersistentAsyncDictionary.clone().setName("cache"))
        return this
    }

    expireEntries () {
        this.subnodes().shallowCopy().forEach(sn => sn.expireIfNeeded())
        return this
    }

    hasKey (key) {
        const entry = this.entryWithKey(key)
        return !Type.isNullOrUndefined(entry)
    }

    entryWithKey (key) {
        return this.firstSubnodeWithTitle(key)
        //return this.subnodeWithHash(key)
    }

    valueForKey (key) {
        const entry = this.entryWithKey(key)
        if (entry) {
            return entry.value()
        }
        return undefined
    }

    setKeyValueTimeout (key, value, timeout) {
        let entry = this.entryWithKey(key)
        if (!entry) {
            entry = BMCacheEntry.clone()
            entry.setKey(key)
            this.addSubnode(entry)
        } 
        entry.setValue(value)
        entry.updateLastModifiedDate()
        if (timeout) {
            entry.setMaxAge(timeout)
        }
        //entry.isValid()
        return this
    }

}.initThisClass()
