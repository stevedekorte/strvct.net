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

        {
            const slot = this.addSubnodeSlot("prototypes", BMNode);
        }

        {
            const slot = this.addSubnodeSlot("resources", BMResources);
        }

        {
            const slot = this.addSubnodeSlot("storage", BMDataStore);
        }

        {
            const slot = this.addSubnodeSlot("blobs", BMBlobs);
        }
        
    }

    addSubnodeSlot (slotName, proto) {
        const slot = this.newSlot(slotName, null);
        slot.setShouldStoreSlot(true);
        slot.setFinalInitProto(proto);
        slot.setIsSubnode(true);
        return slot;
    }
  
    initPrototype () {
        this.setNodeCanReorderSubnodes(false);
        this.setNodeCanAddSubnode(true);

        // settings are effectively a global node that references other globals
        // so we don't need to store it (for now)

        this.setShouldStore(false);
        this.setShouldStoreSubnodes(false);
    }

}.initThisClass());