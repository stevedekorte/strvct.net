/**
 * @module library.view.webbrowser
 */

/**
 * @class BMStyleSheet
 * @extends ProtoClass
 * @classdesc
 * BMStyleSheet
 *
 * const sheet = DocumentBody.shared().styleSheets().first()
 * sheet.setSelectorProperty("body", "color", "red")
 */
(class BMStyleSheet extends ProtoClass {
    
    /**
     * @description Initializes the prototype slots for the BMStyleSheet class.
     */
    initPrototypeSlots () {
        /**
         * @property {CSSStyleSheet} sheetElement - The CSSStyleSheet element.
         */
        {
            const slot = this.newSlot("sheetElement", null);
            slot.setSlotType("CSSStyleSheet");
        }
    }

    /**
     * @description Gets the href of the stylesheet.
     * @returns {string} The href of the stylesheet.
     */
    href () {
        return this.sheetElement().href
    }

    /**
     * @description Changes a rule in the stylesheet or adds a new one if it doesn't exist.
     * @param {string} selector - The CSS selector to target.
     * @param {string} property - The CSS property to change.
     * @param {string} value - The new value for the CSS property.
     * @returns {BMStyleSheet} The current BMStyleSheet instance.
     */
    changeStylesheetRule (selector, property, value) {
        const sheet = this.sheetElement()

        selector = selector.toLowerCase();
        property = property.toLowerCase();
        value = value.toLowerCase(); // assumed to be a string?

        // Change it if it exists
        for(let i = 0; i < sheet.cssRules.length; i++) {
            const rule = sheet.cssRules[i];
            if (rule.selectorText === selector) {
                rule.style[property] = value;
                return this;
            }
        }

        // Add it if it does not
        sheet.insertRule(selector + " { " + property + ": " + value + "; }", 0);
        return this;
    }

    /**
     * @description Displays the sheetElement in the console.
     */
    show () {
        console.log("sheetElement:", this.sheetElement())
    }

}.initThisClass());