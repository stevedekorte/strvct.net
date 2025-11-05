"use strict";

/**
 * @class SvErrorCatalog
 * @extends ProtoClass
 * @classdesc Singleton registry of error definitions.
 * Manages error pattern matching and provides access to friendly error metadata.
 *
 * Usage:
 * // Register a definition
 * SvErrorCatalog.shared().registerDefinition(errorDef);
 *
 * // Find matching definition for an error
 * const def = SvErrorCatalog.shared().definitionForError(error);
 */
(class SvErrorCatalog extends ProtoClass {

    static _shared = null;

    /**
     * Returns the singleton instance
     * @returns {SvErrorCatalog}
     * @category Singleton
     */
    static shared () {
        if (!this._shared) {
            this._shared = this.clone();
        }
        return this._shared;
    }

    /**
     * @description Initialize the prototype slots
     * @category Initialization
     */
    initPrototypeSlots () {
        /**
         * @member {Map} definitions
         * @category Registry
         */
        {
            const slot = this.newSlot("definitions", null);
            slot.setSlotType("Map");
        }

        /**
         * @member {Array} definitionList
         * @category Registry
         */
        {
            const slot = this.newSlot("definitionList", null);
            slot.setSlotType("Array");
        }
    }

    /**
     * @description Initialize the instance
     * @category Initialization
     */
    init () {
        super.init();
        this.setDefinitions(new Map());
        this.setDefinitionList([]);
        this.registerAllDefinitions();
        return this;
    }

    /**
     * @description Register all error definitions from categories
     * @category Registration
     */
    registerAllDefinitions () {
        // Categories add registration methods like:
        // - registerAuthenticationErrors()
        // - registerConfigurationErrors()
        // - registerFirebaseErrors()

        // Call each registration method if it exists
        if (this.registerAuthenticationErrors) {
            this.registerAuthenticationErrors();
        }

        if (this.registerConfigurationErrors) {
            this.registerConfigurationErrors();
        }

        if (this.registerFirebaseErrors) {
            this.registerFirebaseErrors();
        }

        return this;
    }

    /**
     * @description Register an error definition
     * @param {SvErrorDefinition} definition - The definition to register
     * @returns {SvErrorCatalog} This instance for chaining
     * @category Registry
     */
    registerDefinition (definition) {
        const id = definition.id();

        if (!id) {
            console.error("Cannot register error definition without an id:", definition);
            return this;
        }

        if (this.definitions().has(id)) {
            console.warn("Overwriting existing error definition:", id);
        }

        this.definitions().set(id, definition);
        this.definitionList().push(definition);

        return this;
    }

    /**
     * @description Get a definition by its ID
     * @param {String} id - The definition ID
     * @returns {SvErrorDefinition|null} The definition or null if not found
     * @category Registry
     */
    definitionWithId (id) {
        return this.definitions().get(id) || null;
    }

    /**
     * @description Find the first definition that matches the given error
     * @param {Error|Object} error - The error to match
     * @returns {SvErrorDefinition|null} The matching definition or null
     * @category Matching
     */
    definitionForError (error) {
        if (!error) {
            return null;
        }

        // Try each definition in registration order
        for (const definition of this.definitionList()) {
            if (definition.matchesError(error)) {
                return definition;
            }
        }

        return null;
    }

    /**
     * @description Check if any definition matches the given error
     * @param {Error|Object} error - The error to check
     * @returns {Boolean} True if a matching definition exists
     * @category Matching
     */
    hasDefinitionForError (error) {
        return this.definitionForError(error) !== null;
    }

    /**
     * @description Get all definitions in a specific category
     * @param {String} category - The category name
     * @returns {Array} Array of definitions in that category
     * @category Query
     */
    definitionsInCategory (category) {
        return this.definitionList().filter(def => def.category() === category);
    }

    /**
     * @description Get all category names
     * @returns {Array} Array of unique category names
     * @category Query
     */
    categories () {
        const categorySet = new Set();
        for (const definition of this.definitionList()) {
            if (definition.category()) {
                categorySet.add(definition.category());
            }
        }
        return Array.from(categorySet);
    }

    /**
     * @description Clear all registered definitions
     * @returns {SvErrorCatalog} This instance for chaining
     * @category Registry
     */
    clearDefinitions () {
        this.definitions().clear();
        this.setDefinitionList([]);
        return this;
    }

    /**
     * @description Get count of registered definitions
     * @returns {Number} The number of definitions
     * @category Query
     */
    definitionCount () {
        return this.definitionList().length;
    }

}.initThisClass());
