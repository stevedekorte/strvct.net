"use strict";

/*
    ElevenLabsSfxSessions

*/

(class ElevenLabsSfxSessions extends BMSummaryNode {

    initPrototypeSlots () {
        this.setSubnodeClasses([ElevenLabsSfxSession]);
        this.setShouldStore(true);
        this.setShouldStoreSubnodes(true);
        this.setNodeCanAddSubnode(true);
        this.setNodeCanReorderSubnodes(true);
        this.setTitle("Text to Sound Effect Sessions");
        this.setNoteIsSubnodeCount(true);
    }

    service () {
        return this.parentNode();
    }

}.initThisClass());
