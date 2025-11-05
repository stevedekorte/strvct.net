"use strict";

/**
 * @class SvErrorDefinition
 * @extends ProtoClass
 * @classdesc Represents a single error type configuration with user-friendly metadata.
 * Includes patterns for matching errors, friendly messages, images, and action buttons.
 *
 * Example usage:
 * const def = SvErrorDefinition.clone()
 *   .setId("auth-not-logged-in")
 *   .setPatterns([/not.*logged.*in/i, /authentication.*required/i])
 *   .setCategory("authentication")
 *   .setFriendlyTitle("Login Required")
 *   .setFriendlyMessage("You need to be logged in to access this feature.")
 *   .setImageName("auth-lock.svg")
 *   .setActions([
 *     { label: "Login", method: "navigateToLogin" },
 *     { label: "Dismiss", method: "dismiss" }
 *   ]);
 */
(class SvErrorDefinition extends ProtoClass {

    /**
     * @description Initialize the prototype slots
     * @category Initialization
     */
    initPrototypeSlots () {
        /**
         * @member {String} id
         * @category Identity
         */
        {
            const slot = this.newSlot("id", null);
            slot.setSlotType("String");
        }

        /**
         * @member {Array} patterns
         * @category Matching
         */
        {
            const slot = this.newSlot("patterns", null);
            slot.setSlotType("Array");
        }

        /**
         * @member {String} category
         * @category Classification
         */
        {
            const slot = this.newSlot("category", null);
            slot.setSlotType("String");
        }

        /**
         * @member {String} friendlyTitle
         * @category User Interface
         */
        {
            const slot = this.newSlot("friendlyTitle", null);
            slot.setSlotType("String");
        }

        /**
         * @member {String} friendlyMessage
         * @category User Interface
         */
        {
            const slot = this.newSlot("friendlyMessage", null);
            slot.setSlotType("String");
        }

        /**
         * @member {String} imageName
         * @category User Interface
         */
        {
            const slot = this.newSlot("imageName", null);
            slot.setSlotType("String");
        }

        /**
         * @member {Array} actions
         * @category User Interface
         */
        {
            const slot = this.newSlot("actions", null);
            slot.setSlotType("Array");
        }
    }

    /**
     * @description Initialize the instance
     * @category Initialization
     */
    init () {
        super.init();
        this.setPatterns([]);
        this.setActions([]);
        return this;
    }

    /**
     * @description Check if this definition matches the given error
     * @param {Error|Object} error - The error to match against
     * @returns {Boolean} True if this definition matches the error
     * @category Matching
     */
    matchesError (error) {
        const errorMessage = this.extractErrorMessage(error);
        if (!errorMessage) {
            return false;
        }

        // Try each pattern
        for (const pattern of this.patterns()) {
            if (pattern.test(errorMessage)) {
                return true;
            }
        }

        return false;
    }

    /**
     * @description Extract the error message from various error types
     * @param {Error|Object|String} error - The error object
     * @returns {String|null} The error message or null
     * @category Utilities
     */
    extractErrorMessage (error) {
        if (!error) {
            return null;
        }

        if (typeof error === "string") {
            return error;
        }

        if (error.message) {
            return error.message;
        }

        if (error.reason && error.reason.message) {
            return error.reason.message;
        }

        return String(error);
    }

    /**
     * @description Add a pattern to the patterns array
     * @param {RegExp} pattern - The regex pattern to add
     * @returns {SvErrorDefinition} This instance for chaining
     * @category Configuration
     */
    addPattern (pattern) {
        this.patterns().push(pattern);
        return this;
    }

    /**
     * @description Add an action to the actions array
     * @param {Object} action - Action configuration {label, method}
     * @returns {SvErrorDefinition} This instance for chaining
     * @category Configuration
     */
    addAction (action) {
        this.actions().push(action);
        return this;
    }

    /**
     * @description Get the image path for this error definition
     * @returns {String|null} The resolved image path
     * @category User Interface
     */
    imagePath () {
        if (!this.imageName()) {
            return null;
        }

        if (SvGlobals.has("SvErrorImageResolver")) {
            return SvErrorImageResolver.shared().resolveImagePath(this.imageName());
        }

        return null;
    }

    /**
     * @description Get the image URL for this error definition
     * @returns {String|null} The resolved image URL
     * @category User Interface
     */
    imageUrl () {
        if (!this.imageName()) {
            return null;
        }

        if (SvGlobals.has("SvErrorImageResolver")) {
            return SvErrorImageResolver.shared().resolveImageUrl(this.imageName());
        }

        return null;
    }

    /**
     * @description Convert this definition to a JSON-serializable object
     * @returns {Object} JSON representation
     * @category Serialization
     */
    asJson () {
        return {
            id: this.id(),
            category: this.category(),
            friendlyTitle: this.friendlyTitle(),
            friendlyMessage: this.friendlyMessage(),
            imageName: this.imageName(),
            imagePath: this.imagePath(),
            actions: this.actions()
        };
    }

}.initThisClass());
