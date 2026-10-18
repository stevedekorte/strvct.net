"use strict";

/**
 * @module library.ideal.html.SvHtmlStreamReader
 */

/**
 * @class SvStreamReaderDelegateProtocol
 * @extends Protocol
 * @classdesc Delegate protocol for SAX-style HTML and JSON stream reader token callbacks.
 */

(class SvStreamReaderDelegateProtocol extends Protocol {

    /**
     * @description Handles stream tag opening tokens.
     * @param {string} tagName - Tag name string.
     * @param {Object} attributes - Attribute key-value map.
     */
    onStreamTagOpen (tagName, attributes) {
    }

    /**
     * @description Handles stream tag inner text content.
     * @param {string} tagName - Tag name string.
     * @param {string} content - Tag text content.
     */
    onStreamTagContent (tagName, content) {
    }

    /**
     * @description Handles stream tag closing tokens.
     * @param {string} tagName - Tag name string.
     */
    onStreamTagClose (tagName) {
    }

    /**
     * @description Handles stream parsing errors.
     * @param {Error} error - Parse error instance.
     */
    onStreamParseError (error) {
    }

}.initThisProtocol());
