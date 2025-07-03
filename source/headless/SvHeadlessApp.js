"use strict";

/**
 * @module headless
 */

/**
 * @class SvHeadlessApp
 * @extends SvApp
 * @classdesc A headless version of SvApp that runs in Node.js without DOM/browser dependencies.
 * 
 * Replaces browser-specific functionality:
 * - HTTP resource loading with filesystem reads via StrvctFile
 * - DOM manipulation with no-ops
 * - IndexedDB with node-indexeddb
 * - Document/window references with mocks
 * 
 * To use:
 * 1. Run the build system to generate _index.json and _cam.json files
 * 2. Create an instance of SvHeadlessApp 
 * 3. Call setupAndRun() to load and initialize the framework
 */
(class SvHeadlessApp extends SvApp {

    /**
     * @static
     * @description Initializes the headless app class
     * @category Initialization
     */
    static initClass () {
        this.setIsSingleton(true);
    }

    /**
     * @description Initializes the prototype slots for headless mode
     * @category Initialization
     */
    initPrototypeSlots () {
        super.initPrototypeSlots();

        /**
         * @member {string} rootPath - The root path for file system reads
         * @category Configuration
         */
        {
            const slot = this.newSlot("rootPath", process.cwd());
            slot.setSlotType("String");
        }

        /**
         * @member {Object} mockDocument - Mock document object for headless mode
         * @category Mocks
         */
        {
            const slot = this.newSlot("mockDocument", null);
            slot.setSlotType("Object");
        }

        /**
         * @member {Object} mockWindow - Mock window object for headless mode
         * @category Mocks
         */
        {
            const slot = this.newSlot("mockWindow", null);
            slot.setSlotType("Object");
        }
    }

    /**
     * @description Initializes the instance for headless mode
     * @category Initialization
     */
    init () {
        super.init();
        // Don't setup environment here - let HeadlessBoot handle it
        return this;
    }

    /**
     * @description Sets up the UI in headless mode (no-op)
     * @category Lifecycle
     */
    async setupUi () {
        // Override parent setupUi to avoid DOM operations
        // In headless mode, we don't need UI setup
        return this;
    }

    /**
     * @description Called when app initialization is complete (headless version)
     * @category Lifecycle
     */
    async appDidInit () {
        this.setHasDoneAppInit(true);
        this.postNoteNamed("appDidInit");

        if (this.runTests) {
            this.runTests();
        }

        // Skip DOM operations that the parent class does
        this.afterAppUiDidInit();
        return this;
    }

    /**
     * @description Called after app UI initialization (headless version)
     * @category Lifecycle
     */
    afterAppUiDidInit () {
        // Skip search params handling since there's no URL
        this.didInitPromise().callResolveFunc(this);
        return this;
    }

    /**
     * @description Called after first render (headless version)
     * @category Lifecycle
     */
    afterFirstRender () {
        if (ResourceManager && ResourceManager.shared) {
            ResourceManager.shared().markPageLoadTime();
        }
        console.log(`${this.name()} headless app started successfully`);
        return this;
    }

    /**
     * @description Returns a mock main window
     * @returns {Object} Mock window object
     * @category UI
     */
    mainWindow () {
        return this.mockWindow();
    }

    /**
     * @description Returns a mock document body view
     * @returns {Object} Mock document body
     * @category UI
     */
    documentBodyView () {
        return this.mockDocument().body;
    }

    /**
     * @description Posts error reports in headless mode (logs to console)
     * @param {Error|Object} error - Error object or error data
     * @param {Object} [json=null] - Additional JSON data
     * @returns {Promise<Object>} Mock response
     * @category Error Handling
     */
    async asyncPostErrorReport (error, json = null) {
        const errorData = {
            timestamp: new Date().toISOString(),
            userAgent: "Node.js SvHeadlessApp",
            app: this.name(),
            version: this.versionsString(),
            isHeadless: true
        };

        if (error instanceof Error) {
            errorData.message = error.message;
            errorData.name = error.name;
            errorData.stack = error.stack;
        } else if (typeof error === "object") {
            Object.assign(errorData, error);
        } else if (typeof error === "string") {
            errorData.message = error;
        }

        if (json && typeof json === "object") {
            errorData.additionalData = json;
        }

        console.error("Headless App Error Report:", JSON.stringify(errorData, null, 2));
        return { success: true, headless: true };
    }

    /**
     * @static
     * @description Creates and runs a headless app instance
     * @param {string} [importsPath] - Optional path to root _imports.json file for loading framework
     * @param {string} [rootPath] - Optional root path for file system access
     * @returns {Promise<SvHeadlessApp>} The running app instance
     * @category Factory Methods
     */
    static async createAndRun (importsPath = null, rootPath = null) {
        const app = this.shared();
        
        if (rootPath) {
            app.setRootPath(rootPath);
        }

        app.setStore(this.defaultStore());
        app.store().setName(this.type());
        
        // Setup headless environment and load framework
        await app.setupAndRun(importsPath);
        
        // Load persistent data
        await app.loadFromStore();
        
        return app;
    }

    /**
     * @description Sets up and runs the headless app using the regular boot system
     * @param {string} [importsPath] - Optional path to root _imports.json file for loading framework
     * @returns {Promise<SvHeadlessApp>} The initialized app
     * @category Lifecycle
     */
    async setupAndRun (importsPath = null) {
        try {
            // Configure StrvctFile for headless environment
            if (this.rootPath()) {
                StrvctFile.setWorkingPath(this.rootPath());
            }
            
            if (importsPath) {
                // Load framework from _imports.json file using StrvctFile
                await this.loadFrameworkFrom(importsPath);
            }
            
            // Then run the app setup
            await this.setup();
            
            console.log(`${this.name()} headless setup completed`);
            return this;
        } catch (error) {
            console.error("Headless app setup failed:", error);
            throw error;
        }
    }

    /**
     * @description Loads additional framework resources from an _imports.json file
     * @param {string} importsPath - Path to _imports.json file
     * @returns {Promise<SvHeadlessApp>} The app instance
     * @category Lifecycle
     */
    async loadFrameworkFrom (importsPath) {
        // Use a simple recursive loader that follows _imports.json files
        await this.loadImportsRecursively(importsPath);
        return this;
    }

    /**
     * @description Recursively loads JavaScript files from _imports.json files
     * @param {string} importsPath - Path to _imports.json file
     * @returns {Promise<void>}
     * @category Helper Methods
     */
    async loadImportsRecursively (importsPath) {
        const fs = require('fs').promises;
        const path = require('path');

        // Read the _imports.json file
        const fullImportsPath = path.resolve(importsPath);
        const baseDir = path.dirname(fullImportsPath);
        
        let imports;
        try {
            const importsContent = await fs.readFile(fullImportsPath, 'utf8');
            imports = JSON.parse(importsContent);
        } catch (error) {
            throw new Error(`Failed to read imports file ${importsPath}: ${error.message}`);
        }

        if (!Array.isArray(imports)) {
            throw new Error(`Imports file ${importsPath} must contain a JSON array`);
        }

        // Process each import
        for (const importPath of imports) {
            const fullPath = path.resolve(baseDir, importPath);
            
            if (importPath.endsWith('_imports.json')) {
                // Recursively load another imports file
                await this.loadImportsRecursively(fullPath);
            } else if (importPath.endsWith('.js')) {
                // Load and evaluate JavaScript file
                const relativePath = path.relative(this.rootPath() || process.cwd(), fullPath);
                const file = new StrvctFile().setPath(relativePath);
                await file.loadAndEval();
            }
            // Skip non-JS files in headless mode
        }
    }

}.initThisClass());