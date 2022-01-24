"use strict";

/*

    BMCacheEntry

*/

getGlobalThis().BMCacheEntry = class BMCacheEntry extends BMStorableNode {
    
    initPrototype () {
        this.newSlot("key", null).setShouldStoreSlot(true) 

        {
            const slot = this.newSlot("data", null)
            slot.setShouldStoreSlot(true)
            slot.setDoesHookGetter(true)
            slot.setHookedGetterIsOneShot(true)
            slot.setIsLazy(true)
            slot.setInitProto(BMData)
            assert(slot.doesHookGetter())
            slot.setupInOwner()
        }

        this.newSlot("lastModifiedDate", null).setShouldStoreSlot(true) 
        this.newSlot("maxAge", 60*60*24).setShouldStoreSlot(true)
        return this
    }

    init () {
        super.init()
        this.setTitle("CacheEntry")
        this.setNodeMinWidth(600)
        this.setShouldStore(true)
        this.updateLastModifiedDate()
        this.setCanDelete(true)
        this.setShouldStoreSubnodes(false)
        return this
    }

    setValue (v) {
        this.data().setValue(v)
        return this
    }

    value () {
        return this.data().value()
    }

    didUpdateSlotValue (oldValue, newValue) {
        this.updateLastModifiedDate()
    }

    updateLastModifiedDate () {
        this.setLastModifiedDate(new Date().getTime())
        return this
    }

    hash () {
        return this.key() 
    }

    title () {
        return this.key()
    }

    valueByteCount () {
        return this.value() ? this.value().length : 0
    }

    ageInSeconds () {
        const dt = new Date().getTime()  - this.lastModifiedDate()
        return dt/1000
    }

    ageDescription () {
        return TimePeriodFormatter.clone().setValueInSeconds(this.ageInSeconds()).formattedValue()
    }

    subtitle () {
        if (this.value()) {
            return this.value().byteSizeDescription() + ", " + this.ageDescription() + " old"
        }
        return "no value"
    }

    prepareForFirstAccess () {
        super.prepareForFirstAccess()
        this.removeAllSubnodes()
        assert (!this.subnodes().length)
        const field = BMTextAreaField.clone().setKey("value")
        field.setValueMethod("value").setValueIsEditable(false).setIsMono(true)
        field.setTarget(this) 
        field.getValueFromTarget()
        this.addSubnode(field)
    }

    isExpired () {
        return Date.clone().now() > this.lastModifiedDate() + this.maxAge()
    }

    expireIfNeeded () {
        if (this.isExpired()) {
            this.delete()
            // TODO: schedule storage garabge collection?
        }
    }

}.initThisClass()
