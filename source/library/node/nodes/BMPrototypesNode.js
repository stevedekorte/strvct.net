"use strict";

/*

    BMPrototypesNode
 
 

*/

(class BMPrototypesNode extends BMStorableNode {
    
    initPrototypeSlots () {
    }

    initPrototype () {
        this.setTitle("Prototypes");
        this.setNodeCanReorderSubnodes(true);
    }

    init () {
        super.init();

        //this.setupSubnodes();
        return this;
    }

    setupSubnodes () {
        /*
        let primitives = BMFolderNode.clone().setTitle("Primitives")
        primitives.setShouldStoreSubnodes(false)

        this.addSubnode(primitives)

        primitives.addSubnodes(this.primitiveSubnodes())
        */
        return this
    }

}.initThisClass());

