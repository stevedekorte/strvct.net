/**
 * @module library.ideal.html.HtmlStreamReader
 * @class StreamNode
 * @classdesc StreamNode represents a generic node in a stream of HTML elements.
 */
"use strict";

(class StreamNode extends ProtoClass {

    /**
     * Initializes the prototype slots for the class.
     * @category Initialization
     */
    initPrototypeSlots() {
        {
            /**
             * @member {string} id
             * @description The unique identifier for the node.
             */
            const slot = this.newSlot("id", ""); // string
            slot.setSlotType("String");
        }

        {
            /**
             * @member {StreamNode|null} parent
             * @description The parent node of the current node.
             */
            const slot = this.newSlot("parent", null); // StreamNode
            slot.setSlotType("StreamNode");
        }

        {
            /**
             * @member {Array} children
             * @description An array of child nodes.
             */
            const slot = this.newSlot("children", []); // array of StreamNode
            slot.setSlotType("Array");
        }
    }

    /**
     * Initializes the prototype.
     * @category Initialization
     */
    initPrototype() {
    }

    /**
     * Detects an ancestor node that satisfies the given function.
     * @description Checks if the current node satisfies the provided function. If not, recursively checks the parent node until a match is found or the root node is reached.
     * @param {Function} func The function to test each node against.
     * @returns {StreamNode|null} The ancestor node that satisfies the function, or null if none is found.
     * @category Tree Traversal
     */
    detectAncestor(func) {
        if (func(this)) {
            return this;
        }
        if (this.parent()) {
            return this.parent().detectAncestor(func);
        }
        return null;
    }

    /**
     * Handles the opening of the node.
     * @description Creates and sets the domNode property based on the `asDomNode` method.
     * @returns {StreamNode} The current instance.
     * @category Node Lifecycle
     */
    onOpen() {
        const domNode = this.asDomNode();
        /*
        // parent responsible for calling appendChild
        if (this.parent()) {
            domNode.setParent(this.parent().domNode())
        }
        */
        this.setDomNode(domNode);
        return this;
    }

    /**
     * Handles the closing of the node.
     * @description Sets the `isClosed` property to true.
     * @returns {StreamNode} The current instance.
     * @category Node Lifecycle
     */
    onClose() {
        // called by HtmlStreamReader
        this.setIsClosed(true);
        return this;
    }

    /**
     * Retrieves the root node of the node tree.
     * @description Returns the current node if it has no parent, otherwise recursively calls the `rootNode` method on the parent node.
     * @returns {StreamNode} The root node of the node tree.
     * @category Tree Traversal
     */
    rootNode() {
        if (this.parent()) {
            return this.parent().rootNode();
        }
        return this;
    }

    /**
     * Retrieves the tag path from the root node to the current node.
     * @description Constructs an array of nodes representing the path from the root node to the current node, including the current node.
     * @returns {StreamNode[]} An array of nodes representing the tag path.
     * @category Tree Traversal
     */
    tagPath() {
        const path = this.parent() ? this.parent().tagPath() : [];
        path.push(this);
        return path;
    }

    /**
     * Retrieves the number path from the root node to the current node.
     * @description Constructs an array of child indices representing the path from the root node to the current node.
     * @returns {number[]} An array of child indices representing the number path.
     * @category Tree Traversal
     */
    numberPath() {
        return this.tagPath().map(tag => tag.childIndex());
    }

    /**
     * Retrieves the depth of the current node in the node tree.
     * @description Calculates the depth of the current node by counting the number of nodes in the tag path.
     * @returns {number} The depth of the current node in the node tree.
     * @category Tree Analysis
     */
    depth() {
        return this.tagPath().length;
    }

    /**
     * Generates a string of spaces based on the depth of the current node.
     * @description Creates a string with a number of spaces equal to twice the depth of the current node.
     * @returns {string} A string of spaces representing the depth of the current node.
     * @category Formatting
     */
    depthSpacer() {
        return "  ".repeat(this.depth());
    }

}.initThisClass());