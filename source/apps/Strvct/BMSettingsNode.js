"use strict";

/*
    
    BMSettingsNode

    Do we want:
    - a static set of slots whose values are shown as subnodes?
    - just have some accessors that look up subnodes by title?

    Using slots might allow better use of slot meta data, and 
    we already have inspector for slot meta data...

    slot.setIsSubnodeTitled(title)
    - on didInit() (after deserialization) we enumerate these slots and:
    -- foreach slot with subnodeTitle:
    --- if subnode is present, set slot value to subnode 
    --- else alloc slot via initProto and add then add subnode for it

*/

(class BMSettingsNode extends BMStorableNode {
    
    initPrototypeSlots () {
        // model
        this.newSlot("prototypes", null).setShouldStoreSlot(false) //.setInitProto(BMNode)
        this.newSlot("resources", null).setShouldStoreSlot(false)  //.setInitProto(BMDataStore)
        this.newSlot("storage", null).setShouldStoreSlot(false)  //.setInitProto(BMBlobs)
        this.newSlot("blobs", null).setShouldStoreSlot(false)  //.setInitProto(BMBlobs)
    }

    init () {
        super.init()
        this.setNodeCanReorderSubnodes(false)
        this.addAction("add")

        // settings are effectively a global node that references other globals
        // so we don't need to store it (for now)

        this.setShouldStore(false)
        this.setShouldStoreSubnodes(false)

        if (!this.isDeserializing()) {
            this.setupSubnodes()
        }
        return this
    }

    setupSubnodes () {
        this.addSettingNameAndClass("Resources", BMResources)
        this.addSettingNameAndClass("Storage", BMDataStore)
        this.addSettingNameAndClass("Blobs", BMBlobs)
    }

    addSettingNameAndClass (aName, aClass) {
        // like subnodeWithTitleIfAbsentInsertProto but we also set this class's slot aName to the subnode
        const subnode = this.subnodeWithTitleIfAbsentInsertProto(aName, aClass)
        this.removeOtherSubnodeWithSameTitle(subnode)
        const slot = this.thisPrototype().slotNamed(aName.toLowerCase())
        assert(slot)
        if (slot) {
            slot.onInstanceSetValue(this, subnode) 
        }
        return subnode
    }

}.initThisClass());