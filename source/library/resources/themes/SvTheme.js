/**
* @module library.resources.themes
*/

"use strict";

/**
* @class SvTheme
* @extends SvThemeFolder
* @classdesc A theme: the token values the UI wears (as CSS custom properties
* published at the document root) plus the SvThemeClass tree of per-state tile
* styles.
*
* Tokens come in three folders (Plans/Theme Environment, Stage 3): `tokens`
* apply in every appearance (faces, radii, measures); `lightTokens` and
* `darkTokens` layer palette values on top for that appearance. Both
* appearances are hand-authored — nothing is derived from the other. A theme
* may define only one appearance; the other then falls back to it.
*
* A theme is a stored, inspectable, cloneable node, so a realm can own one and
* a user can edit one with the generated tiles. `themeJson()` /
* `setThemeJson()` carry the token folders as plain data for seeding built-in
* themes and copying one theme into another.
*/
(class SvTheme extends SvThemeFolder {

    initPrototypeSlots () {
        /**
         * @member {SvThemeTokens} tokens - values shared by every appearance
         * @category Tokens
         */
        {
            const slot = this.newSlot("tokens", null);
            slot.setSlotType("SvThemeTokens");
            slot.setFinalInitProto(SvThemeTokens);
            slot.setShouldStoreSlot(true);
        }
        /**
         * @member {SvThemeTokens} lightTokens - the light appearance's values
         * @category Tokens
         */
        {
            const slot = this.newSlot("lightTokens", null);
            slot.setSlotType("SvThemeTokens");
            slot.setFinalInitProto(SvThemeTokens);
            slot.setShouldStoreSlot(true);
        }
        /**
         * @member {SvThemeTokens} darkTokens - the dark appearance's values
         * @category Tokens
         */
        {
            const slot = this.newSlot("darkTokens", null);
            slot.setSlotType("SvThemeTokens");
            slot.setFinalInitProto(SvThemeTokens);
            slot.setShouldStoreSlot(true);
        }
        /**
         * @member {Number} specVersion - version of the built-in spec this
         * theme was seeded from; 0 for a theme a user made. Lets the app
         * rebuild a built-in when its spec changes without touching user themes.
         * @category Versioning
         */
        {
            const slot = this.newSlot("specVersion", 0);
            slot.setSlotType("Number");
            slot.setShouldStoreSlot(true);
        }
    }

    initPrototype () {
        this.setShouldStore(true);
        this.setShouldStoreSubnodes(true);
        this.setNodeCanEditTitle(true);
        this.setTitle("Untitled " + this.thisClass().visibleClassName());
        this.setSubtitle("theme");
        this.setCanDelete(true);
        this.setNodeCanAddSubnode(true);
        this.setSubnodeClasses([SvThemeClass, SvThemeTokens]);
        this.setNodeCanReorderSubnodes(true);
    }

    /**
    * @description The token folders live in slots (so a theme always has
    * exactly three, found by name) AND appear as the first subnodes (so they
    * are browsed and edited beside the theme classes). Stored subnodes and an
    * isSubnode slot cannot be combined, so the adoption is explicit here and
    * idempotent across loads: a folder restored as a subnode is the same
    * object the slot restored.
    * @category Initialization
    */
    finalInit () {
        super.finalInit();
        this.adoptTokenFolder(this.tokens(), "tokens", 0);
        this.adoptTokenFolder(this.lightTokens(), "light", 1);
        this.adoptTokenFolder(this.darkTokens(), "dark", 2);
        return this;
    }

    adoptTokenFolder (folder, title, index) {
        folder.setTitle(title);
        if (!this.subnodes().includes(folder)) {
            this.addSubnodeAt(folder, index);
        }
        return this;
    }

    /**
    * @description Sets up the theme as the default theme.
    * @returns {SvTheme} The current instance.
    * @category Setup
    */
    setupAsDefault () {
        this.setTitle("DefaultTheme");
        const defaultThemeClass = SvThemeClass.clone().setupAsDefault();
        this.addSubnode(defaultThemeClass);
        return this;
    }

    // --- theme classes (per-state tile styles) ---

    /**
    * @description The SvThemeClass subnodes — the token folders are subnodes
    * too and are not theme classes.
    * @returns {SvThemeClass[]}
    * @category Retrieval
    */
    themeClasses () {
        return this.subnodes().filter(sn => sn.isKindOf(SvThemeClass));
    }

    removeThemeClasses () {
        this.themeClasses().forEach(tc => this.removeSubnode(tc));
        return this;
    }

    /**
    * @description Retrieves a theme class by its name.
    * @param {string} name - The name of the theme class to retrieve.
    * @returns {SvThemeClass|null} The theme class with the given name, or null if not found.
    * @category Retrieval
    */
    themeClassNamed (name) {
        return this.themeClasses().detect(themeClass => themeClass.title() === name) || null;
    }

    /**
    * @description Gets an array of all theme class names.
    * @returns {string[]} An array of theme class names.
    * @category Retrieval
    */
    themeClassNames () {
        return this.themeClasses().map(themeClass => themeClass.title());
    }

    /**
    * @description Creates new theme class options.
    * @returns {SvOptionsNode} The options node containing theme class options.
    * @category Creation
    */
    newThemeClassOptions () {
        const options = SvOptionsNode.clone();
        this.themeClassNames().forEach(name => {
            const option = SvOptionNode.clone().setLabel(name).setValue(name);
            options.addSubnode(option);
        });
        return options;
    }

    /**
    * @description Gets an array of all theme classes, including nested ones.
    * @returns {SvThemeClass[]} An array of all theme classes.
    * @category Retrieval
    */
    allThemeClasses () {
        return this.themeClasses().map(themeClass => themeClass.selfAndAllThemeChildren()).flat();
    }

    /**
    * @description Creates a map of all theme classes, with their titles as keys.
    * @returns {Map<string, SvThemeClass>} A map of all theme classes.
    * @category Creation
    */
    allThemeClassesMap () {
        const map = new Map();
        this.allThemeClasses().forEach(themeClass => map.set(themeClass.title(), themeClass));
        return map;
    }

    // --- tokens ---

    /**
    * @description The token folder for an appearance name.
    * @param {String} appearance - "light" or "dark"
    * @returns {SvThemeTokens}
    * @category Tokens
    */
    tokensForAppearance (appearance) {
        return appearance === "dark" ? this.darkTokens() : this.lightTokens();
    }

    /**
    * @description Whether the theme authored any value for this appearance.
    * @param {String} appearance
    * @returns {Boolean}
    * @category Tokens
    */
    hasAppearance (appearance) {
        return this.tokensForAppearance(appearance).subnodes().length > 0;
    }

    /**
    * @description The appearance actually shown for a request: the one asked
    * for if the theme authored it, else whichever it did author. A theme with
    * neither is appearance-neutral and the request stands.
    * @param {String} appearance
    * @returns {String}
    * @category Tokens
    */
    resolvedAppearance (appearance) {
        if (this.hasAppearance(appearance)) {
            return appearance;
        }
        const other = appearance === "dark" ? "light" : "dark";
        return this.hasAppearance(other) ? other : appearance;
    }

    /**
    * @description The full token set to publish for an appearance: shared
    * tokens with the appearance's values layered on top.
    * @param {String} appearance
    * @returns {Object} { "--sv-text": "#111", … }
    * @category Tokens
    */
    tokenDictForAppearance (appearance) {
        const shared = this.tokens().tokenDict();
        const layered = this.tokensForAppearance(this.resolvedAppearance(appearance)).tokenDict();
        return Object.assign({}, shared, layered);
    }

    // --- as data ---

    /**
    * @description The token folders as plain data.
    * @returns {Object} { tokens: {…}, light: {…}, dark: {…} }
    * @category Data
    */
    themeJson () {
        return {
            tokens: this.tokens().tokenDict(),
            light: this.lightTokens().tokenDict(),
            dark: this.darkTokens().tokenDict()
        };
    }

    /**
    * @description Replaces the token folders from plain data (missing keys clear).
    * @param {Object} json - as returned by themeJson()
    * @returns {SvTheme}
    * @category Data
    */
    setThemeJson (json) {
        this.tokens().setTokenDict(json.tokens);
        this.lightTokens().setTokenDict(json.light);
        this.darkTokens().setTokenDict(json.dark);
        this.postNoteNamed("onThemeDidChange"); // a rebuilt theme repaints if it is the one on screen
        return this;
    }

    /**
    * @description Copies another theme's tokens into this one — how a realm
    * adopts an inherited theme as its own (a copy, never a link).
    * @param {SvTheme} other
    * @returns {SvTheme}
    * @category Data
    */
    copyThemeFrom (other) {
        this.setThemeJson(other.themeJson());
        this.setTitle(other.title());
        return this;
    }

    // --- changes ---

    /**
    * @description An edit anywhere inside the theme (a token field, a state
    * style) announces itself so the UI can republish if this theme is the
    * one displayed. Returns false so the edit keeps bubbling.
    * @returns {Boolean}
    * @category Changes
    */
    onDidEdit (/*aView*/) {
        this.postNoteNamed("onThemeDidChange");
        return false;
    }

    /**
    * @description Retrieves a state by its name.
    * @param {string} name - The name of the state to retrieve.
    * @returns {SvState|undefined} The state with the given name, or undefined if not found.
    * @category Retrieval
    */
    stateWithName (name) {
        return this.states().stateWithName(name);
    }

}.initThisClass());
