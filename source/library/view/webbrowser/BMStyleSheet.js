"use strict";

/*

    BMStyleSheet

    const sheet = DocumentBody.shared().styleSheets().first()
    sheet.setSelectorProperty("body", "color", "red")
*/

(class BMStyleSheet extends ProtoClass {
    
    initPrototypeSlots () {
        {
            const slot = this.newSlot("sheetElement", null);
            slot.setSlotType("CSSStyleSheet");
        }
    }

    href () {
        return this.sheetElement().href
    }

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

    show () {
        console.log("sheetElement:", this.sheetElement())
    }

}.initThisClass());

