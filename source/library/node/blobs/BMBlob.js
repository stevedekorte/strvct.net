"use strict"

/*

    BMBlob

*/

window.BMBlob = class BMBlob extends BMNode {

    initPrototype() {

        {
            const slot = this.newSlot("name", null)
            slot.setSyncsToView(true)
            slot.setShouldStoreSlot(true)
            slot.setDoesHookSetter(true)
        }

        {
            const slot = this.newSlot("valueHash", null)
            slot.setSyncsToView(true)
            slot.setShouldStoreSlot(true)
            slot.setDoesHookSetter(true)
        }

        {
            const slot = this.newSlot("valueSize", null)
            slot.setSyncsToView(true)
            slot.setShouldStoreSlot(true)
            slot.setDoesHookSetter(true)
        }

        {
            const slot = this.newSlot("lastModifiedTime", null)
            slot.setSyncsToView(true)
            slot.setShouldStoreSlot(true)
            slot.setDoesHookSetter(true)
        }

        {
            const slot = this.newSlot("expirationDate", null)
            slot.setSyncsToView(true)
            slot.setShouldStoreSlot(true)
            slot.setDoesHookSetter(true)
        }

        {
            const slot = this.newSlot("value", null)
            slot.setSyncsToView(true)
            slot.setShouldStoreSlot(false)
            slot.setDoesHookSetter(true)
        }
    }

    init() {
        super.init()
        this.setNodeMinWidth(600)
        this.setShouldStore(true)
        this.setShouldStoreSubnodes(false)
        this.setCanDelete(true)
        return this
    }

    age () {
        return new Date().getTime() - this.lastModifiedTime() 
    }

    prepareForFirstAccess() {
        super.prepareForFirstAccess()
        this.setupValueField()
    }

    setupValueField() {
        const field = BMTextAreaField.clone().setKey("value")
        field.setValueMethod("value")
        field.setValueIsEditable(false)
        field.setIsMono(true)
        field.setTarget(this)
        field.getValueFromTarget()
        this.addSubnode(field)

        this.asyncReadValue()
        this.scheduleSyncToView()
    }

    title () {
        return this.name()
    }

    subtitle () {
        const size = this.valueSize()
        if (size) {
            return size.byteSizeDescription() 
        }
        return null
    }

    // key

    hash() {
        return this.name() // for subnode lookup
    }

    didUpdateSlotValue (oldValue, newValue) {
        if (newValue) {
            this.setValueSize(newValue.length)
            this.setLastModifiedTime(new Date().getTime())
            this.asyncWriteValue()
        }
        return this
    }

    store () {
        return this.parentNode().store()
    }

    async asyncWriteValue () {
        const v = this.value()
        const digest = await v.asyncSha256Digest()
        const h = digest.base64Encoded()
        this.setValueHash(h)

        assert(this.isValid())

        const success = () => {
            //console.log("did write hash/value pair: " + this.description())
        }

        this.store().asyncAtPut(h, v, success, null)
    }

    asyncReadValue (resolve, reject) {
        if (this.value()) {
            resolve()
        }

        assert(this.isValid())

        this.store().asyncAt(this.valueHash(), (value) => {
            this._value = value
            this.didUpdateNode()
            if (resolve) {
                resolve()    
            }     
        }, reject)
    }

    isValid () {
        if (Type.isNull(this.name())) {
            return false
        }

        if (Type.isNull(this.valueHash())) {
            return false
        }

        if (Type.isNull(this.valueSize())) {
            return false
        }

        if (Type.isNull(this.lastModifiedTime()) || this.lastModifiedTime() === 0) {
            return false
        }

        return true
    }

    description () {
        const slotNames = ["name", "valueHash", "valueSize", "lastModifiedTime"]
        const parts = [this.typeId()]
        slotNames.forEach(slotName => {
            parts.push(slotName + ":" + this[slotName]())
        })
        return parts.join(", ")
    }

    /*
    recordForStore (aStore) {
        const r = super.recordForStore(aStore)
        console.log(this.typeId() + " recordForStore : ", JSON.stringify(r, null, 2))
        return r
    }

    loadFromRecord (aRecord, aStore) {
        const result = super.loadFromRecord(aRecord, aStore)
        console.log("after loadFromRecord:" + JSON.stringify(aRecord, null, 2))
        return result
    }

    addMutationObserver (anObserver) {
        //console.log(this.typeId() + ".addMutationObserver(" + anObserver.typeId() + ")")
        return super.addMutationObserver(anObserver)
    }

    didMutate () {
        //console.log("didMutate:" + this.description())
        return super.didMutate()
    }
    */

}.initThisClass()


