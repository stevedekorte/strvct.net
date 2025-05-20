"use strict";

/**
 * @module library.node.fields
 * @class BMCreatorNode
 * @extends BMStorableNode
 * @classdesc A stand-in node that lets the user select a field to replace it with.
 */
(class BMCreatorNode extends BMStorableNode {
    
    /**
     * @description Initializes the prototype slots for the BMCreatorNode.
     * @category Initialization
     */
    initPrototypeSlots () {
        /**
         * @member {Array} subnodes - Overrides the subnodes slot.
         * @category Data Structure
         */
        {
            const slot = this.overrideSlot("subnodes");
            slot.setShouldStoreSlot(false);
            slot.setSlotType("Array");
        }

        /**
         * @member {Array} typeChoices - An array of type choices.
         * @category Data Structure
         */
        {
            const slot = this.newSlot("typeChoices", []);
            slot.setInitProto(Array);
            slot.setSlotType("Array");
        }
    }
  
    /**
     * @description Initializes the prototype with default values and settings.
     * @category Initialization
     */
    initPrototype () {
        this.setNodeCanEditTitle(false);
        this.setShouldStore(true);
        this.setShouldStoreSubnodes(false);
        this.setNodeCanReorderSubnodes(false);
        this.setCanDelete(true);
        this.setNoteIconName("right-arrow");
        this.setTitle("Chose type");
    }

    /**
     * @description Prepares the node for first access by setting up subnodes.
     * @category Initialization
     */
    prepareForFirstAccess () {
        super.prepareForFirstAccess();
        this.setupSubnodes();
    }

    /**
     * @description Returns an array of field types.
     * @returns {string[]} An array of field type names.
     * @static
     * @category Data Structure
     */
    static fieldTypes () {
        return [
            "BMActionField", 
            "BMBooleanField", 
            "BMDateNode",
            "BMImageWellField", 
            "BMJsonDictionaryNode",
            "BMJsonArrayNode",
            "BMFolderNode", 
            "BMNumberField", 
            "BMOptionsNode",
            "BMStringField",
            "BMTextAreaField",
            //"BMChatField",
            //"BMTextNode",
            "BMTimeNode",
            "BMLinkNode",
            "BMUrlField",
        ];
    }

    /**
     * @description Returns an array of prototype objects.
     * @returns {Array} An empty array (commented out code suggests it could return prototype objects).
     * @category Data Structure
     */
    protoObjects () {
        return []
        /*
        const app = this.rootNode()
        const protosNode = app.firstSubnodeWithTitle("Prototypes")
        const protos = protosNode.subnodes()
        return protos
        */
    }

    /**
     * @description Sets up subnodes if they don't exist.
     * @returns {BMCreatorNode} The current instance.
     * @category Initialization
     */
    setupSubnodes () {
        if (this.subnodes().length == 0) {
            this.addSubnodesForObjects(BMNode.primitiveNodeClasses())
            //this.addSubnodesForObjects(this.protoObjects())
        }
        return this
    }
    
    /**
     * @description Adds subnodes for the given objects.
     * @param {Array} objects - An array of objects to create subnodes for.
     * @category Initialization
     */
    addSubnodesForObjects (objects) {
        const newSubnodes = objects.map((aClass) => {
            const newNode = BMFolderNode.clone()
            newNode.setTitle(aClass.nodeCreateName())
            newNode.setNodeCanEditTitle(false)
            newNode.setNodeCanEditSubtitle(false)
            newNode.setNoteIconName(null)
            newNode.setTarget(this).setMethodName("didChoose").setInfo(aClass)
            newNode.setCanDelete(false)
            return newNode
        })
        this.addSubnodes(newSubnodes)
    }

    /**
     * @description Handles the choice of a new node type.
     * @param {Object} actionNode - The node that was chosen.
     * @returns {BMCreatorNode} The current instance.
     * @category User Interaction
     */
   didChoose (actionNode) {
        const obj = actionNode.info()
        const newNode = obj.nodeCreate()
        newNode.setCanDelete(true)
        this.replaceSelfWithNode(newNode)
        return this
   }

    /**
     * @description Replaces this node with a new node in the parent's subnodes.
     * @param {Object} newNode - The new node to replace this one with.
     * @category Data Structure
     */
    replaceSelfWithNode (newNode) {
        const parentNode = this.parentNode()
        assert(parentNode)
        parentNode.replaceSubnodeWith(this, newNode)
        parentNode.postShouldFocusAndExpandSubnode(newNode) 
    }

    /**
     * @description Returns a summary of the node.
     * @returns {string} An empty string.
     * @category Data Retrieval
     */
    nodeSummary () {
        return ""
    }
    
}.initThisClass());