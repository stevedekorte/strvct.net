"use strict";

/**
 * @module boot
 */

/**
 * @class StrvctFile
 * @extends Object
 * @classdesc Unified file loading abstraction that works in both browser and Node.js environments.
 * 
 * Usage:
 *   const file = new StrvctFile().setPath('source/boot/MyFile.js');
 *   const content = await file.load();
 *   await file.loadAndEval();
 * 
 * Class configuration:
 *   StrvctFile.setBaseUrl('https://example.com/strvct/');  // Browser mode
 *   StrvctFile.setWorkingPath('/path/to/project/');        // Node.js mode
 * 
 * Automatically detects the environment and routes to appropriate APIs:
 * - Browser: Uses fetch() with baseUrl for HTTP requests
 * - Node.js: Uses fs module with workingPath for file system access
 * 
 * Also handles IndexedDB polyfilling for Node.js environments.
 */

if (SvGlobals === undefined) {
    throw new Error("SvGlobals is not defined");
}

class StrvctFile extends Object {

    /**
     * @static
     * @private
     * @type {string}
     * @description Base URL for browser file loading
     */
    static _baseUrl = '';

    /**
     * @static
     * @private
     * @type {string}
     * @description Working directory path for Node.js file loading
     */
    static _workingPath = '';

    /**
     * @static
     * @private
     * @type {boolean}
     * @description Flag to track if environment has been set up
     */
    static _didSetupEnvironment = false;

    /**
     * @constructor
     * @description Initializes a new StrvctFile instance
     */
    constructor () {
        super();
        /**
         * @private
         * @type {string}
         * @description Path to the file
         */
        this._path = '';
    }

    /**
     * @static
     * @description Sets the base URL for browser file loading
     * @param {string} url - Base URL (e.g., 'https://example.com/strvct/')
     * @returns {typeof StrvctFile} The class for chaining
     * @category Class Configuration
     */
    static setBaseUrl(url) {
        this._baseUrl = url.replace(/\/$/, ''); // Remove trailing slash
        return this;
    }

    /**
     * @static
     * @description Gets the base URL for browser file loading
     * @returns {string} The base URL
     * @category Class Configuration
     */
    static baseUrl () {
        return this._baseUrl;
    }

    /**
     * @static
     * @description Sets the working directory path for Node.js file loading
     * @param {string} path - Working directory path
     * @returns {typeof StrvctFile} The class for chaining
     * @category Class Configuration
     */
    static setWorkingPath(path) {
        this._workingPath = path;
        return this;
    }

    /**
     * @static
     * @description Creates a new StrvctFile instance with the given path
     * @param {string} pathOrUrl - Path or URL to the file
     * @returns {StrvctFile} A new StrvctFile instance
     * @category Factory Methods
     */
    static with (pathOrUrl) {
        return new this().setPath(pathOrUrl);
    }

    /**
     * @static
     * @description Gets the working directory path for Node.js file loading
     * @returns {string} The working directory path
     * @category Class Configuration
     */
    static workingPath () {
        return this._workingPath;
    }

    /**
     * @description Sets the file path
     * @param {string} path - Path to the file
     * @returns {StrvctFile} This instance for chaining
     * @category Instance Configuration
     */
    setPath (path) {
        this._path = path;
        return this;
    }

    /**
     * @description Gets the file path
     * @returns {string} The file path
     * @category Instance Configuration
     */
    path() {
        return this._path;
    }

    /**
     * @static
     * @description Detects if running in Node.js environment
     * @returns {boolean} True if running in Node.js
     * @category Environment Detection
     */
    static isNodeEnvironment () {
        return (typeof process !== 'undefined' && 
                process.versions && 
                process.versions.node);
    }

    /**
     * @static
     * @description Detects if running in browser environment
     * @returns {boolean} True if running in browser
     * @category Environment Detection
     */
    static isBrowserEnvironment () {
        return (typeof window !== 'undefined' && 
                typeof document !== 'undefined');
    }

    /**
     * @static
     * @description Sets up environment-specific polyfills and globals
     * @category Environment Setup
     */
    static setupEnvironment () {
        if (this._didSetupEnvironment) {
            return;
        }
        this._didSetupEnvironment = true;
        
        if (this.isNodeEnvironment()) {
            // Call the synchronous parts immediately
            this.setupNodeEnvironmentSync();
        }
        // Browser environment doesn't need setup - native APIs available
    }

    /**
     * @static
     * @description Sets up Node.js environment synchronously with basic polyfills
     * @category Environment Setup
     */
    static setupNodeEnvironmentSync () {
        console.log("StrvctFile setupNodeEnvironmentSync");
        
        // Get global object using SvGlobals
        const globalObj = SvGlobals.globals();
        
        // Setup node-indexeddb for persistence
        if (typeof globalObj.indexedDB === 'undefined') {
            try {
                console.log('Initializing IndexedDB for Node.js...');
                
                // Load and initialize the database cache FIRST
                const dbManager = require('node-indexeddb/dbManager');
                
                // This must be done synchronously in Node.js - we'll use a sync helper
                this._initializeIndexedDBSync(dbManager, globalObj);
                
                console.log('IndexedDB and IDBKeyRange are now available');
            } catch (error) {
                console.warn('node-indexeddb not available, IndexedDB will not be available in Node.js:', error.message);
            }
        } else {
            console.log("IndexedDB already available");
        }

        // Setup basic performance API if not available
        if (!globalObj.performance) {
            globalObj.performance = {
                now: () => Date.now(),
                timing: {
                    navigationStart: Date.now()
                }
            };
        }
    }

    /**
     * @static
     * @description Helper to initialize IndexedDB synchronously by calling async loadCache
     * @category Environment Setup
     */
    static _initializeIndexedDBSync (dbManager, globalObj) {
        try {
            // First, we need to call loadCache synchronously 
            // This is a hack because node-indexeddb requires cache to be loaded first
            const util = require('util');
            const loadCacheSync = util.promisify(dbManager.loadCache.bind(dbManager));
            
            // Use a synchronous wrapper around the async operation
            const { execSync } = require('child_process');
            
            // Create a temp script that loads the cache and then requires indexeddb
            const tempScript = `
                const dbManager = require('node-indexeddb/dbManager');
                dbManager.loadCache().then(() => {
                    const { indexedDB, IDBKeyRange } = require('node-indexeddb');
                    console.log('SUCCESS: IndexedDB initialized');
                }).catch(err => {
                    console.log('ERROR: ' + err.message);
                });
            `;
            
            // For now, let's try a different approach - delay the IndexedDB setup
            console.log('Setting up delayed IndexedDB initialization...');
            
            // Store the dbManager for later initialization
            globalObj._needsIndexedDBInit = true;
            globalObj._indexedDBManager = dbManager;
            
            console.log('IndexedDB setup deferred until ensureIndexedDBReady() is called');
        } catch (error) {
            console.warn('Failed to set up IndexedDB initialization:', error.message);
            // Don't throw - just leave IndexedDB unavailable
        }
    }

    /**
     * @static
     * @description Sets up Node.js environment with necessary polyfills (async version for cache initialization)
     * @category Environment Setup
     */
    static async setupNodeEnvironment () {
        // First ensure synchronous setup is done
        this.setupNodeEnvironmentSync();
        
        // Then try to initialize the cache properly if IndexedDB was loaded
        await this.ensureIndexedDBCacheReady();
    }

    /**
     * @static
     * @description Ensures IndexedDB cache is properly loaded
     * @returns {Promise<void>}
     * @category Environment Setup
     */
    static async ensureIndexedDBCacheReady () {
        const globalObj = SvGlobals.globals();
        
        // Call ensureIndexedDBReady instead - it has the proper initialization logic
        await this.ensureIndexedDBReady();
    }

    /**
     * @static
     * @description Ensures IndexedDB is properly initialized before use
     * @returns {Promise<void>}
     * @category Environment Setup
     */
    static async ensureIndexedDBReady () {
        const globalObj = SvGlobals.globals();
        
        console.log('ensureIndexedDBReady: _needsIndexedDBInit =', globalObj._needsIndexedDBInit);
        console.log('ensureIndexedDBReady: _indexedDBManager =', !!globalObj._indexedDBManager);
        console.log('ensureIndexedDBReady: indexedDB =', !!globalObj.indexedDB);
        
        if (globalObj._needsIndexedDBInit && globalObj._indexedDBManager) {
            try {
                console.log('Initializing IndexedDB cache...');
                
                // Load the cache first
                await globalObj._indexedDBManager.loadCache();
                console.log('IndexedDB database cache initialized');
                
                // Now we can safely require and expose the main IndexedDB module
                const { indexedDB, IDBKeyRange } = require('node-indexeddb');
                
                // Set on global object
                globalObj.indexedDB = indexedDB;
                globalObj.IDBKeyRange = IDBKeyRange;
                
                // Also set as global variables for compatibility
                global.indexedDB = indexedDB;
                global.IDBKeyRange = IDBKeyRange;
                
                // Clear the init flag
                globalObj._needsIndexedDBInit = false;
                delete globalObj._indexedDBManager;
                
                console.log('IndexedDB and IDBKeyRange are now available and ready');
            } catch (error) {
                console.warn('Failed to initialize IndexedDB:', error.message);
                globalObj._needsIndexedDBInit = false;
            }
        } else if (globalObj._needsIndexedDBInit) {
            console.log('IndexedDB initialization was flagged but dbManager not available');
        } else {
            console.log('IndexedDB already available or not needed');
        }
    }

    /**
     * @static
     * @description Initializes the node-indexeddb database cache
     * @returns {Promise<void>}
     * @category Environment Setup
     */
    static async initializeNodeIndexedDB () {
        try {
            const dbManager = require('node-indexeddb/dbManager');
            await dbManager.loadCache();
            console.log('IndexedDB database cache initialized');
        } catch (error) {
            console.warn('Failed to initialize IndexedDB database cache:', error.message);
        }
    }

    /**
     * @description Loads the file content, automatically choosing the right method for the environment
     * @returns {Promise<string>} Promise that resolves with file content as text
     * @category File Loading
     */
    async load () {
        if (!this._path) {
            throw new Error('No file path set. Use setPath() first.');
        }

        if (StrvctFile.isNodeEnvironment()) {
            return this.loadNode();
        } else {
            return this.loadBrowser();
        }
    }

    /**
     * @description Loads the file content as an ArrayBuffer, automatically choosing the right method for the environment
     * @returns {Promise<ArrayBuffer>} Promise that resolves with file content as ArrayBuffer
     * @category File Loading
     */
    async loadArrayBuffer () {
        if (!this._path) {
            throw new Error('No file path set. Use setPath() first.');
        }

        if (StrvctFile.isNodeEnvironment()) {
            return this.loadArrayBufferNode();
        } else {
            return this.loadArrayBufferBrowser();
        }
    }

    /**
     * @description Loads the file using Node.js fs module
     * @returns {Promise<string>} Promise that resolves with file content as text
     * @category File Loading
     */
    async loadNode () {
        const fs = require('fs').promises;
        const path = require('path');
        
        try {
            // Use working path if set, otherwise resolve relative to current directory
            const basePath = StrvctFile.workingPath() || process.cwd();
            const fullPath = path.resolve(basePath, this._path);
            console.log("fs.readFile [" + fullPath.split("/").pop() + "]");
            const content = await fs.readFile(fullPath, 'utf8');
            return content;
        } catch (error) {
            throw new Error(`Failed to load file in Node.js: ${this._path} - ${error.message}`);
        }
    }

    /**
     * @description Loads the file using browser fetch API
     * @returns {Promise<string>} Promise that resolves with file content as text
     * @category File Loading
     */
    async loadBrowser () {
        const baseUrl = StrvctFile.baseUrl();
        const fullUrl = baseUrl ? 
            `${baseUrl}/${this._path.replace(/^\//, '')}` : 
            this._path;
        
        try {
            const response = await fetch(fullUrl);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            return await response.text();
        } catch (error) {
            throw new Error(`Failed to load file in browser: ${fullUrl} - ${error.message}`);
        }
    }

    /**
     * @description Loads the file as ArrayBuffer using Node.js fs module
     * @returns {Promise<ArrayBuffer>} Promise that resolves with file content as ArrayBuffer
     * @category File Loading
     */
    async loadArrayBufferNode () {
        const fs = require('fs').promises;
        const path = require('path');
        
        try {
            // Use working path if set, otherwise resolve relative to current directory
            const basePath = StrvctFile.workingPath() || process.cwd();
            const fullPath = path.resolve(basePath, this._path);
            const buffer = await fs.readFile(fullPath);
            
            // Convert Node.js Buffer to ArrayBuffer
            return buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
        } catch (error) {
            throw new Error(`Failed to load file as ArrayBuffer in Node.js: ${this._path} - ${error.message}`);
        }
    }

    /**
     * @description Loads the file as ArrayBuffer using browser fetch API
     * @returns {Promise<ArrayBuffer>} Promise that resolves with file content as ArrayBuffer
     * @category File Loading
     */
    async loadArrayBufferBrowser () {
        const baseUrl = StrvctFile.baseUrl();
        const fullUrl = baseUrl ? 
            `${baseUrl}/${this._path.replace(/^\//, '')}` : 
            this._path;
        
        try {
            const response = await fetch(fullUrl);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            return await response.arrayBuffer();
        } catch (error) {
            throw new Error(`Failed to load file as ArrayBuffer in browser: ${fullUrl} - ${error.message}`);
        }
    }

    /**
     * @description Synchronously loads the file (Node.js only)
     * @returns {string} File content as text
     * @category File Loading
     */
    loadSync () {
        if (!StrvctFile.isNodeEnvironment()) {
            throw new Error('Synchronous file loading is only available in Node.js');
        }

        if (!this._path) {
            throw new Error('No file path set. Use setPath() first.');
        }

        const fs = require('fs');
        const path = require('path');
        
        try {
            const basePath = StrvctFile.workingPath() || process.cwd();
            const fullPath = path.resolve(basePath, this._path);
            return fs.readFileSync(fullPath, 'utf8');
        } catch (error) {
            throw new Error(`Failed to load file synchronously: ${this._path} - ${error.message}`);
        }
    }

    /**
     * @description Evaluates JavaScript code with proper source URL for debugging
     * @param {string} code - JavaScript code to evaluate
     * @category Code Execution
     */
    evalWithSourceUrl(code) {
        if (StrvctFile.isNodeEnvironment()) {
            // Use absolute path for better Node.js debugging
            const path = require('path');
            const basePath = StrvctFile.workingPath() || process.cwd();
            const absolutePath = path.resolve(basePath, this._path);
            const sourceUrlComment = `\n//# sourceURL=${absolutePath}`;
            console.log("eval: " + absolutePath.split("/").pop());
            eval(code + sourceUrlComment);
        } else {
            // Browser: use relative path for VSCode compatibility (no leading slash)
            // URL encode the path to handle spaces and special characters
            const encodedPath = encodeURI(this._path);
            const sourceUrlComment = `\n//# sourceURL=${encodedPath}`;
            console.log("eval [" + encodedPath.split("/").pop() + "]");
            eval(code + sourceUrlComment);
            //const evalFunc = new Function(code + sourceUrlComment);
            //evalFunc.call(window);
        }
    }

    /**
     * @description Loads and evaluates the JavaScript file
     * @returns {Promise<void>} Promise that resolves when file is loaded and evaluated
     * @category File Loading
     */
    async loadAndEval () {
        const content = await this.load();
        this.evalWithSourceUrl(content);
    }

    /**
     * @description Loads and evaluates the JavaScript file synchronously (Node.js only)
     * @category File Loading
     */
    loadAndEvalSync () {
        if (!StrvctFile.isNodeEnvironment()) {
            throw new Error('Synchronous loading is only available in Node.js');
        }

        const content = this.loadSync();
        this.evalWithSourceUrl(content);
    }

    /**
     * @description Checks if the file exists
     * @returns {Promise<boolean>} Promise that resolves with true if file exists
     * @category File System
     */
    async exists () {
        if (!this._path) {
            throw new Error('No file path set. Use setPath() first.');
        }

        if (StrvctFile.isNodeEnvironment()) {
            const fs = require('fs').promises;
            const path = require('path');
            try {
                const basePath = StrvctFile.workingPath() || process.cwd();
                const fullPath = path.resolve(basePath, this._path);
                await fs.access(fullPath);
                return true;
            } catch {
                return false;
            }
        } else {
            // In browser, try to fetch and see if it succeeds
            try {
                const baseUrl = StrvctFile.baseUrl();
                const fullUrl = baseUrl ? 
                    `${baseUrl}/${this._path.replace(/^\//, '')}` : 
                    this._path;
                const response = await fetch(fullUrl, { method: 'HEAD' });
                return response.ok;
            } catch {
                return false;
            }
        }
    }

    /**
     * @static
     * @description Utility method to load multiple files in parallel and evaluate them sequentially
     * @param {string[]} filePaths - Array of file paths to load
     * @returns {Promise<void>} Promise that resolves when all files are loaded and evaluated
     * @category Utility Methods
     */
    static async loadAndEvalMultiple(filePaths) {
        // Load all files in parallel
        const loadPromises = filePaths.map(filePath => {
            const file = new StrvctFile().setPath(filePath);
            return file.load().then(content => ({ filePath, content, file }));
        });
        
        const fileContents = await Promise.all(loadPromises);
        
        // Evaluate files sequentially to maintain order
        for (const { content, file } of fileContents) {
            file.evalWithSourceUrl(content);
        }
    }

    /**
     * @static
     * @description Utility method to check if a file exists
     * @param {string} filePath - Path to check
     * @returns {Promise<boolean>} Promise that resolves with true if file exists
     * @category Utility Methods
     */
    static async fileExists(filePath) {
        const file = new StrvctFile().setPath(filePath);
        return await file.exists();
    }

    /**
     * @static
     * @description Utility method for quick file loading (backward compatibility)
     * @param {string} filePath - Path to the file to load
     * @returns {Promise<string>} Promise that resolves with file content as text
     * @category Utility Methods
     */
    static async loadFile(filePath) {
        const file = new StrvctFile().setPath(filePath);
        return await file.load();
    }

    /**
     * @static
     * @description Utility method for quick load and eval (backward compatibility)
     * @param {string} filePath - Path to the JavaScript file
     * @returns {Promise<void>} Promise that resolves when file is loaded and evaluated
     * @category Utility Methods
     */
    static async loadAndEval(filePath) {
        const file = new StrvctFile().setPath(filePath);
        return await file.loadAndEval();
    }

    /**
     * @description Determines if this file should be used in the current environment based on path conventions
     * @returns {boolean} True if the file should be loaded in the current environment
     * @category Environment Detection
     */
    canUseInCurrentEnv() {
        const path = this._path;
        if (!path) {
            return true; // No path set, assume it's usable
        }
        
        const pathComponents = path.split('/');
        const isNodeEnvironment = StrvctFile.isNodeEnvironment();
        
        // Check for browser-only resources
        const isBrowserOnly = pathComponents.some(component => 
            component === 'web-only'
        );
        
        // Check for Node.js-only resources
        const isNodeOnly = pathComponents.some(component => 
            component === 'server-only'
        );
        
        // Apply filtering logic
        if (isNodeEnvironment) {
            // In Node.js: exclude browser-only resources
            return !isBrowserOnly;
        } else {
            // In Browser: exclude Node.js-only resources
            return !isNodeOnly;
        }
    }
}

// Auto-setup environment when this file is loaded
StrvctFile.setupEnvironment();

SvGlobals.set("StrvctFile", StrvctFile);
