/**
 * @module library.view.webbrowser
 */

/**
 * @class WebDocument
 * @extends ProtoClass
 * @classdesc Abstraction for web document object.
 */
"use strict";

assert(SvGlobals.has("WbCookieManager"), "WbCookieManager is not defined");

(class WebDocument extends ProtoClass {
    
    /**
     * @static
     * @description Initializes the class by setting it as a singleton.
     * @category Initialization
     */
    static initClass () {
        this.setIsSingleton(true);
    }
    
    /**
     * @description Initializes the prototype slots.
     * @category Initialization
     */
    initPrototypeSlots () {

        {
            const slot = this.newSlot("cookieManager", WbCookieManager.shared());
            slot.setSlotType("WbCookieManager");
        }
    }

    /**
     * @description Returns the shared DocumentBody instance.
     * @returns {DocumentBody} The shared DocumentBody instance.
     * @category Document Structure
     */
    body () {
        return DocumentBody.shared();
    }

    /**
     * @description Retrieves all style sheets in the document.
     * @returns {Array<StyleSheet>} An array of StyleSheet objects.
     * @category Styling
     */
    styleSheets () {
        const elements = document.styleSheets;
        const sheets = [];

        for (let i = 0; i < elements.length; i ++) {
            const sheetElement = elements[i];
            sheets.push(StyleSheet.clone().setSheetElement(sheetElement));
        }

        return sheets;
    }

    /**
     * @description Adds a new style sheet to the document using a CSS string.
     * @param {string} cssCode - The CSS code to be added as a style sheet.
     * @returns {WebDocument} The current WebDocument instance.
     * @category Styling
     */
    addStyleSheetString (cssCode) {
        const styleElement = document.createElement('style');
        styleElement.innerHTML = cssCode;
        document.head.appendChild(styleElement);
        return this;
    }

    /**
     * @description Displays debug information about the document's style sheets.
     * @returns {WebDocument} The current WebDocument instance.
     * @category Debugging
     */
    show () {
        this.debugLog(":");
        this.styleSheets().forEach(sheet => sheet.show());
        return this;
    }

}.initThisClass());