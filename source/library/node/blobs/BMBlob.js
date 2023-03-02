"use strict";

/*

    BMBlob

*/

(class BMBlob extends BaseNode {

    initPrototypeSlots () {

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

    init () {
        super.init()
        this.setShouldStore(true)
        this.setShouldStoreSubnodes(false)
        this.setCanDelete(true)
        return this
    }

    age () {
        return new Date().getTime() - this.lastModifiedTime() 
    }

    prepareForFirstAccess () {
        super.prepareForFirstAccess()
        this.setupValueField()
    }

    setupValueField () {
        const field = BMTextAreaField.clone().setKey("value")
        field.setValueMethod("value")
        field.setValueIsEditable(false)
        field.setIsMono(true)
        field.setTarget(this)
        field.getValueFromTarget()
        this.addSubnode(field)

        this.asyncReadValue(() => { this.didReadValue() })
        this.scheduleSyncToView()
    }

    didReadValue () {
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

    hash () {
        return this.valueHash() // for subnode lookup
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

    asyncWriteValue () {
        //const v = "abc" 
        const v = this.value()
        // what about number or null values
        // const digestPromise = 
        v.asyncSha256Digest((digestBuffer) => {
            const h = digestBuffer.base64Encoded()
            if (this.valueHash()) {
                console.log("valueSize:" + this.valueSize())
                console.log("     size:" + v.byteLength)
                console.log("valueHash:" + this.valueHash())
                console.log("     hash:" + h)
                assert(this.valueHash() === h)
            }
            this.asyncWriteValueWithHash(v, h)
        }, (error) => {
            throw new Error("sha256 failed")    
        })
    }

    asyncWriteValueWithHash (v, h) {
        this.setValueHash(h)
        
        if (Type.isArrayBuffer(value)) {
            assert(value.byteLength)
        }

        assert(this.isValid())

        const resolve = () => {
            console.log("did write hash/value pair: " + this.description())
        }

        const reject = (error) => {
            console.log("error writing hash/value pair: " + this.description())
            debugger
        }

        this.store().asyncOpen(() => {
            this.store().asyncAtPut(h, v, resolve, reject)
        }, reject)
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

    static testHash () {
        // code from nodejs
        // crypto.createHash('sha256').update(Buffer.from("abc", "utf8")).digest("base64")
        const nodejsHash = 'ungWv48Bz+pBQUDeXa4iI7ADYaOWF3qctBD/YfIAFa0='

        const enc = new TextEncoder(); // always utf-8
        const uint8Array = enc.encode("abc");
        const arrayBuffer = uint8Array.buffer
        arrayBuffer.asyncSha256Digest((digestBuffer) => {
            const h = digestBuffer.base64Encoded()
            assert(h === nodejsHash)
            console.log("hashes match!")
            debugger;
        })
    }

}.initThisClass());



//BMBlob.testHash()