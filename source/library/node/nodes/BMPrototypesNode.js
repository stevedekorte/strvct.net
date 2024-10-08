"use strict";

/**
 * @module library.node.nodes
 * @class BMPrototypesNode
 * @extends BMStorableNode
 * @classdesc Represents a node for managing prototypes.
 */
(class BMPrototypesNode extends BMStorableNode {
    
    /**
     * @description Initializes prototype slots.
     * @category Initialization
     */
    initPrototypeSlots () {
    }

    /**
     * @description Initializes the prototype.
     * @category Initialization
     */
    initPrototype () {
        this.setTitle("Prototypes");
        this.setNodeCanReorderSubnodes(true);
    }

    /**
     * @description Initializes the node.
     * @returns {BMPrototypesNode} The initialized node.
     * @category Initialization
     */
    init () {
        super.init();

        //this.setupSubnodes();
        return this;
    }

    /**
     * @description Sets up subnodes.
     * @returns {BMPrototypesNode} The current instance.
     * @category Node Management
     */
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