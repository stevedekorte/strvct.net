"use strict";

/*
    
HwPlayers

*/

(class HwPlayers extends BMSummaryNode {
    
    initPrototypeSlots () {

    }

    init () {
        super.init()
        this.setTitle("Players");
        this.addNodeAction("add")
        this.setNodeCanReorderSubnodes(true)
        this.setShouldStore(true)
        this.setShouldStoreSubnodes(true)
        this.setSubnodeClasses([HwPlayer])
        this.setNoteIsSubnodeCount(true);
        return this
    }

    finalInit () {
        super.finalInit();
        this.createSelfIfNeeded()
    }

    ourPlayer () {
        return this.subnodes().detect(sn => sn.isSelf())
    }

    createSelfIfNeeded () {
        if (!this.ourPlayer()) {
            const ourPlayer = HwPlayer.clone().setIsSelf(true)
            this.addSubnode(ourPlayer)
        }
        return this
    }

    onUpdatePlayerJson (json) {
        const name = json["Details"]["name"]
        const player = this.playerWithName(name)
        player.updateJson(json)
    }

    playerWithName (name) {
        return this.subnodes().detect(sn => sn.name() === name)
    }

}.initThisClass());
