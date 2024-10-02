"use strict";

/**
 * @module library.view.dom.Helpers
 */

/**
 * @class DomCssInspector
 * @extends ProtoClass
 * @classdesc Used to inspect class styles since css hides stylesheet.cssRules.
 * 
 * example use:
 * const value = DomCssInspector.shared().setElementClassName("..").cssStyle.fontFamily
 */
(class DomCssInspector extends ProtoClass {
    
    /**
     * @description Initializes the prototype slots for the DomCssInspector class.
     * @category Initialization
     */
    initPrototypeSlots () {
        {
            /**
             * @member {string} idName - The ID name for the test element.
             * @category Configuration
             */
            const slot = this.newSlot("idName", "DomCssInspector");
            slot.setSlotType("String");
        }
    }

    /**
     * @description Gets or creates the test element.
     * @returns {HTMLElement} The test element.
     * @category DOM Manipulation
     */
    testElement () {
        if (!this._testElement) {
            this._testElement = this.createTestElement()
            document.body.appendChild(this._testElement);
            if (!document.getElementById(this.idName())) {
                throw new Error("missing element '" + this.idName() + "'")
            }
        }
        return this._testElement
    }
	
    /**
     * @description Creates a new test element.
     * @returns {HTMLElement} The created test element.
     * @category DOM Manipulation
     */
    createTestElement () {
        const e = document.createElement("div");
	    e.setAttribute("id", this.idName());
        e.style.display = "none";
        e.style.visibility = "hidden";
        return e
    }

    /**
     * @description Sets the class name of the test element.
     * @param {string} aName - The class name to set.
     * @returns {DomCssInspector} The current instance for chaining.
     * @category DOM Manipulation
     */
    setElementClassName (aName) {
        this.testElement().setAttribute("class", aName);
        return this
    }

    /**
     * @description Gets the CSS style of the test element.
     * @param {string} key - The CSS property key (unused in the current implementation).
     * @returns {CSSStyleDeclaration} The CSS style declaration of the test element.
     * @category CSS Inspection
     */
    cssStyle (key) {
        return this.testElement().style
    }
    
}.initThisClass());