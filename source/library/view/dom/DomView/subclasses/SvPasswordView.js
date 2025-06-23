"use strict";

/**
 * @module library.view.dom.DomView.subclasses
 * @class SvPasswordView
 * @extends SvTextView
 * @classdesc A specialized text view for password input. 
 * Uses an actual input element with type="password" instead of a contenteditable div.
 * This provides native password masking and better integration with password managers.
 */

(class SvPasswordView extends SvTextView {
    
    /**
     * @description Initializes the prototype slots
     * @category Initialization
     */
    initPrototypeSlots () {
        
        /**
         * @member {String} elementType
         * @description Override to use input element instead of div
         */
        {
            const slot = this.overrideSlot("elementType", "input");
            slot.setSlotType("String");
        }
        
        /**
         * @member {Boolean} showPasswordToggle
         * @description Whether to show a toggle button for revealing the password
         */
        {
            const slot = this.newSlot("showPasswordToggle", false);
            slot.setSlotType("Boolean");
        }

        /**
         * @member {String} autocompleteType
         * @description The autocomplete attribute value (e.g., "current-password", "new-password")
         */
        {
            const slot = this.newSlot("autocompleteType", "current-password");
            slot.setSlotType("String");
        }

        /**
         * @member {String} emptyPlaceholder
         * @description Placeholder text when password is empty
         */
        {
            const slot = this.newSlot("emptyPlaceholder", "Enter password");
            slot.setSlotType("String");
        }

        /**
         * @member {String} filledPlaceholder
         * @description Placeholder text when password has a value (typically dots)
         */
        {
            const slot = this.newSlot("filledPlaceholder", "••••••••");
            slot.setSlotType("String");
        }
    }

    /**
     * @description Initializes the prototype
     * @category Initialization
     */
    initPrototype () {
        
        // Password-specific settings
        this.setAllowsHtml(false); // Input elements can't contain HTML
        this.setIsMergeable(false); // No merge support for password fields
        this.setUsesDoubleTapToEdit(false); // Always editable like normal input
    }

    /**
     * @description Sets up the element after creation
     * @returns {SvPasswordView}
     * @category Setup
     */
    setupElement () {
        super.setupElement();
        
        const e = this.element();
        if (e) {
            e.setAttribute("type", "password");
            e.setAttribute("autocomplete", this.autocompleteType());
            
            // Apply consistent styling
            this.setStyleIfUnset("appearance", "none");
            this.setStyleIfUnset("-webkit-appearance", "none");
            this.setStyleIfUnset("border", "none");
            this.setStyleIfUnset("outline", "none");
            this.setStyleIfUnset("box-sizing", "border-box");
            this.setStyleIfUnset("display", "block");
            this.setStyleIfUnset("width", "100%");
            
            // Ensure we're registered for input events
            this.setIsRegisteredForKeyboard(true);
        }
        
        return this;
    }

    /**
     * @description Sets a style property only if it hasn't been set already
     * @param {String} property - The CSS property name
     * @param {String} value - The CSS property value
     * @returns {SvPasswordView}
     * @category Styling
     */
    setStyleIfUnset (property, value) {
        const e = this.element();
        if (e && !e.style[property]) {
            e.style[property] = value;
        }
        return this;
    }

    /**
     * @description Sets the string value of the password field
     * @param {String} newValue - The password value
     * @returns {SvPasswordView}
     * @category Value Management
     */
    setString (newValue) {
        if (Type.isNullOrUndefined(newValue)) {
            newValue = "";
        }
        
        const e = this.element();
        if (e) {
            if (e.value !== newValue) {
                e.value = newValue;
                this.didEdit();
            }
            
            // Update placeholder to indicate if password is set
            if (newValue && newValue.length > 0) {
                e.placeholder = this.filledPlaceholder();  // Show dots as placeholder when password exists
            } else {
                e.placeholder = this.emptyPlaceholder();
            }
        }
        
        return this;
    }

    /**
     * @description Gets the string value of the password field
     * @returns {String} The password value
     * @category Value Management
     */
    string () {
        const e = this.element();
        if (e) {
            return e.value || "";
        }
        return "";
    }

    /**
     * @description Sets the editable state of the field
     * @param {Boolean} aBool - Whether the field should be editable
     * @returns {SvPasswordView}
     * @category Editable State
     */
    setIsEditable (aBool) {
        super.setIsEditable(aBool);
        this.element().disabled = !aBool;
        return this;
    }

    /**
     * @description Checks if the field is editable
     * @returns {Boolean}
     * @category Editable State
     */
    isEditable () {
        return !this.element().disabled;
    }

    /**
     * @description Selects all text in the password field
     * @returns {SvPasswordView}
     * @category Selection
     */
    selectAll () {
        this.element().select();
        return this;
    }

    /**
     * @description Gets the selected text (returns masked version for security)
     * @returns {String} Masked password characters
     * @category Selection
     */
    selectedText () {
        const e = this.element();
        const start = e.selectionStart;
        const end = e.selectionEnd;
        
        if (start !== end) {
            // Return masked characters instead of actual password
            return "•".repeat(end - start);
        }
        
        return "";
    }

    /**
     * @description Replaces selected text
     * @param {String} newText - The replacement text
     * @returns {SvPasswordView}
     * @category Selection
     */
    replaceSelectedText (newText) {
        const e = this.element();
        e.setRangeText(newText);
        this.didEdit();
        return this;
    }

    /**
     * @description Override to disable HTML content methods
     * @category Disabled Methods
     */
    setInnerHtml (html) {
        throw new Error("SvPasswordView does not support HTML content");
    }

    /**
     * @description Override to use value property
     * @category Value Management
     */
    setTextContent (text) {
        return this.setString(text);
    }

    /**
     * @description Override to disable content editable
     * @category Disabled Methods
     */
    setContentEditable (aBool) {
        // Input elements don't use contentEditable
        return this;
    }

    /**
     * @description Sets the autocomplete type
     * @param {String} type - The autocomplete type
     * @returns {SvPasswordView}
     * @category Configuration
     */
    setAutocompleteType (type) {
        this._autocompleteType = type;
        if (this.element()) {
            this.element().autocomplete = type;
        }
        return this;
    }

    /**
     * @description Sets the value (alias for setString for compatibility)
     * @param {String|Password} newValue - The password value
     * @returns {SvPasswordView}
     * @category Value Management
     */
    setValue (newValue) {
        return this.setString(newValue);
    }

    /**
     * @description Gets the value (alias for string for compatibility)
     * @returns {String} The password value
     * @category Value Management
     */
    value () {
        const val = this.string();
        return val;
    }

}.initThisClass());