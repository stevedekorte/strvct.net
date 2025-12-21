/** * @module library.ideal.html.HtmlStreamReader
 */

/** * @class StreamTextNode
 * @extends StreamNode
 * @classdesc Represents a text node in the HTML stream reader. This class is responsible for handling text nodes in the HTML document.
 
 
 */

/**

 */
"use strict";

(class StreamTextNode extends StreamNode {
    /**
     * Initializes the prototype slots for the class.
     * @category Initialization
     */
    initPrototypeSlots () {
        {
            const slot = this.newSlot("text", ""); // string
            slot.setSlotType("String");
        }
    }

    /**
     * Initializes the prototype for the class.
     * @category Initialization
     */
    initPrototype () {
    }

    /**
     * @description Appends the given text to the existing text.
     * @param {string} s - The string to be appended.
     * @returns {StreamTextNode} This instance of StreamTextNode.
     * @category Text Manipulation
     */
    appendText (s) {
        assert(Type.isString(s));
        this.setText(this.text() + s);
        this.domNode().textContent = this.text();
        return this;
    }

    /**
     * @description Checks if the current node is a text node.
     * @returns {boolean} True if the node is a text node, false otherwise.
     * @category Node Type
     */
    isTextNode () {
        return true;
    }

    /**
     * @description Returns the HTML representation of the text node.
     * @returns {string} The HTML representation of the text node.
     * @category Conversion
     */
    asHtml () {
        return this.text();
    }

    /**
     * @description Returns the text content of the text node.
     * @returns {string} The text content of the text node.
     * @category Retrieval
     */
    textContent () {
        return this.text();
    }

    /**
     * @description Returns a description of the text node, clipping the text with an ellipsis if it exceeds 15 characters.
     * @returns {string} The description of the text node.
     * @category Utility
     */
    description () {
        return this.text().clipWithEllipsis(15);
    }

    /**
     * @description Logs the text content of the text node to the console, with depth spacing.
     * @category Debug
     */
    show () {
        console.log(this.depthSpacer() + this.text());
    }

    /**
     * @description Creates and returns a DOM text node representation of the text node.
     * @returns {Node} The DOM text node representation.
     * @category DOM Manipulation
     */
    asDomNode () {
        const domNode = document.createTextNode(this.textContent());
        return domNode;
    }

}.initThisClass());
