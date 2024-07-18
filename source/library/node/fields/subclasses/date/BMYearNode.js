"use strict";

/*

    BMYearNode 
    
*/

(class BMYearNode extends BaseNode {
    
    initPrototypeSlots () {
        {
            const slot = this.newSlot("allowsMultiplePicks", false);
            slot.setSlotType("Boolean");
        }
        {
            const slot = this.newSlot("value", 0);
            slot.setSlotType("Number");
        }
    }

    initPrototype () {
        this.setCanDelete(true);
        this.setNodeCanEditTitle(true);

        //this.setSubnodeProto(BMFolderNode);
        this.setSubnodeProto(BMOptionNode);
        this.setNodeCanReorderSubnodes(true);

        //this.setNodeViewClassName("BMOptionsNodeView");
    }

    title () {
        return this.value();
    }

    hasSubnodes () {
        return true;
    }
    
    prepareToAccess () {
        //console.log("this.storeHasChanged() = ", this.storeHasChanged());
        if (this.subnodeCount() === 0) {
            //this.refreshSubnodes();
        }
    }
    
    nodeTileLink () {
        // used by UI tile views to browse into next column
        return this;
    }

    prepareToSyncToView () {
        // called after Node is selected
        if (!this.subnodeCount()) {
            for (let i = 1; i < 12 + 1; i++) {
                const month = this.addSubnode(BMMonthNode.clone().setValue(i));
                month.setCanDelete(false);
            }
        }
    }
    
}.initThisClass());
