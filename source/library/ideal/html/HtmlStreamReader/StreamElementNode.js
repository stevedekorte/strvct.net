/**
 * @module library.ideal.html.HtmlStreamReader
 * @class StreamElementNode
 * @extends StreamNode
 * @classdesc StreamElementNode represents an HTML element node in a stream of HTML elements.
 */
"use strict";

(class StreamElementNode extends StreamNode {
    
    /**
     * Initializes the prototype slots for the class.
     * @category Initialization
     */
    initPrototypeSlots () {
        {
            /**
             * @member {string} name
             * @description The name of the HTML element.
             */
            const slot = this.newSlot("name", ""); // string
            slot.setSlotType("String");
        }

        {
            /**
             * @member {Object} attributes
             * @description A dictionary of attributes for the HTML element.
             */
            const slot = this.newSlot("attributes", null); // dictionary TODO: make this a Map
            slot.setSlotType("Object");
        }

        {
            /**
             * @member {string} text
             * @description The text content of the HTML element.
             */
            const slot = this.newSlot("text", ""); // string
            slot.setSlotType("String");
        }

    }

    /**
     * Initializes the prototype.
     * @category Initialization
     */
    initPrototype () {}

    /**
     * Initializes an instance of the class.
     * @category Initialization
     */
    init () {
        super.init();
        this.setAttributes({});
        this.setChildren([]);
    }

    /**
     * @description Checks if the node represents a text node.
     * @returns {boolean} False, since this class represents an HTML element node and not a text node.
     * @category Node Type
     */
    isTextNode () {
        return false;
    }

    /**
     * @description Returns the last text node child of the current node, if any.
     * @returns {StreamNode|null} The last text node child, or null if there is none.
     * @category Node Traversal
     */
    lastTextNode () {
        const last = this.children().last();
        if (last && last.isTextNode()) {
            return last;
        }
        return null;
    }

    /**
     * @description Adds a child node to the current node.
     * @param {StreamNode} aNode The node to be added as a child.
     * @returns {StreamElementNode} The current node instance.
     * @category Node Manipulation
     */
    addChild (aNode) {
        aNode.setParent(this);
        this.children().push(aNode);
        this.domNode().appendChild(aNode.domNode());
        return this;
    }

    /**
     * @description Generates a string representation of the attributes of the node.
     * @returns {string} The string representation of the attributes.
     * @category HTML Generation
     */
    attributesString () {
        const parts = [];
        for (const [key, value] of Object.entries(this.attributes())) {
            parts.push(key + '="' + value + '"');
        }
        return parts.join(" ");
    }

    /**
     * @description Generates the opening tag string for the node.
     * @returns {string} The opening tag string.
     * @category HTML Generation
     */
    openTagString () {
        const as = this.attributesString();
        return "<" + this.name() + (as ? " " + as : "") + ">";
    }

    /**
     * @description Generates the closing tag string for the node, if it is a closed node.
     * @returns {string} The closing tag string, or an empty string if the node is not closed.
     * @category HTML Generation
     */
    closeTagString () {
        if (this.isClosed()) {
            return "</" + this.name() + ">";
        }
        return "";
    }

    /**
     * @description Generates a description of the node, including its opening and closing tags, and a clipped version of its inner HTML.
     * @returns {string} The description of the node.
     * @category HTML Generation
     */
    description () {
        return this.openTagString() + this.innerHtml().clipWithEllipsis(15) + this.closeTagString();
    }

    /**
     * @description Generates the HTML representation of the node, including its opening and closing tags, and its inner HTML.
     * @returns {string} The HTML representation of the node.
     * @category HTML Generation
     */
    asHtml () {
        // NOTE: this is not normalized HTML, use asHtmlNormalized() on the returned value before comparing
        return this.openTagString() + this.innerHtml() + this.closeTagString();
    }

    /**
     * @description Generates the inner HTML of the node, including the HTML representation of its child nodes.
     * @returns {string} The inner HTML of the node.
     * @category HTML Generation
     */
    innerHtml () {
        // NOTE: this is not normalized HTML, use asHtmlNormalized() on the returned value before comparing
        const strings = this.children().map(child => child.asHtml());
        return strings.join("");
    }

    /**
     * @description Generates the text content of the node, including the text content of its child nodes.
     * @returns {string} The text content of the node.
     * @category Content Extraction
     */
    textContent () {
        return this.children().map(c => c.textContent()).join("");
    }

    /**
     * @description Logs the node and its child nodes to the console, displaying their opening and closing tags and depth.
     * @returns {StreamElementNode} The current node instance.
     * @category Debugging
     */
    show () {
        console.log(this.depthSpacer() + this.openTagString());
        this.children().forEach(child => child.show());
        console.log(this.depthSpacer() + this.closeTagString());
        return this;
    }

    /**
     * @description Creates a new DOM node representing the current node, including its attributes.
     * @returns {HTMLElement} The new DOM node.
     * @category DOM Manipulation
     */
    asDomNode () {
        const newNode = document.createElement(this.name());
        const attributes = this.attributes();

        if (attributes) {
            for (const [key, value] of Object.entries(attributes)) {
                newNode.setAttribute(key, value);
            }
        }
        return newNode;
    }

    // --- helpers ---

    /**
     * @description Returns the data-note attribute value of the node, if present.
     * @returns {string|undefined} The value of the data-note attribute, or undefined if not present.
     * @category Attribute Access
     */
    dataNote () {
        return this.attributes()["data-note"];
    }

}.initThisClass());