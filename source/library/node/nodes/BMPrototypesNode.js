"use strict"

/*

    BMPrototypesNode
 
 

*/

window.BMPrototypesNode = class BMPrototypesNode extends BMStorableNode {
    
    initPrototype () {
    }

    init () {
        super.init()
        this.setTitle("Prototypes")
        this.setNodeCanReorderSubnodes(true)
        //this.setupSubnodes()
        return this
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

}.initThisClass()

