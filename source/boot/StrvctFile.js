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
    constructor() {
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
    static baseUrl() {
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
    static with(pathOrUrl) {
        return new this().setPath(pathOrUrl);
    }

    /**
     * @static
     * @description Gets the working directory path for Node.js file loading
     * @returns {string} The working directory path
     * @category Class Configuration
     */
    static workingPath() {
        return this._workingPath;
    }

    /**
     * @description Sets the file path
     * @param {string} path - Path to the file
     * @returns {StrvctFile} This instance for chaining
     * @category Instance Configuration
     */
    setPath(path) {
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
    static isNodeEnvironment() {
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
    static isBrowserEnvironment() {
        return (typeof window !== 'undefined' && 
                typeof document !== 'undefined');
    }

    /**
     * @static
     * @description Sets up environment-specific polyfills and globals
     * @category Environment Setup
     */
    static setupEnvironment() {
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
    static setupNodeEnvironmentSync() {
        console.log("StrvctFile setupNodeEnvironmentSync");
        
        // Get global object using SvGlobals
        const globalObj = SvGlobals.globals();
        
        // Setup node-indexeddb for persistence (synchronous parts)
        if (typeof globalObj.indexedDB === 'undefined') {
            try {
                // Require node-indexeddb main module synchronously
                const { indexedDB, IDBKeyRange } = require('node-indexeddb');
                
                // Set on global object
                globalObj.indexedDB = indexedDB;
                globalObj.IDBKeyRange = IDBKeyRange;
                
                // Also set as global variables for compatibility
                global.indexedDB = indexedDB;
                global.IDBKeyRange = IDBKeyRange;

                console.log('indexedDB type:', typeof globalObj.indexedDB);
                console.log('indexedDB available:', !!globalObj.indexedDB);
                console.log("IndexedDB and IDBKeyRange are now available");
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
     * @description Sets up Node.js environment with necessary polyfills (async version for cache initialization)
     * @category Environment Setup
     */
    static async setupNodeEnvironment() {
        // First ensure synchronous setup is done
        this.setupNodeEnvironmentSync();
        
        // Then initialize the database cache if IndexedDB is available
        const globalObj = SvGlobals.globals();
        if (globalObj.indexedDB) {
            try {
                const dbManager = require('node-indexeddb/dbManager');
                await dbManager.loadCache();
                console.log('IndexedDB database cache initialized');
            } catch (error) {
                console.warn('Failed to initialize IndexedDB cache:', error.message);
            }
        }
    }

    /**
     * @static
     * @description Initializes the node-indexeddb database cache
     * @returns {Promise<void>}
     * @category Environment Setup
     */
    static async initializeNodeIndexedDB() {
        try {
            const dbManager = require('node-indexeddb/dbManager');
            await dbManager.loadCache();
            console.log('IndexedDB database cache initialized');
        } catch (error) {
            console.warn('Failed to initialize IndexedDB database cache:', error.message);
        }
    }

    /**
     * @static
     * @description Ensures IndexedDB is fully initialized before use
     * @returns {Promise<void>}
     * @category Environment Setup
     */
    static async ensureIndexedDBReady() {
        if (this._dbInitPromise) {
            await this._dbInitPromise;
        }
    }

    /**
     * @description Loads the file content, automatically choosing the right method for the environment
     * @returns {Promise<string>} Promise that resolves with file content as text
     * @category File Loading
     */
    async load() {
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
    async loadArrayBuffer() {
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
    async loadNode() {
        const fs = require('fs').promises;
        const path = require('path');
        
        try {
            // Use working path if set, otherwise resolve relative to current directory
            const basePath = StrvctFile.workingPath() || process.cwd();
            const fullPath = path.resolve(basePath, this._path);
            console.log("fs.readFile loading fullPath [" + fullPath + "]");
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
    async loadBrowser() {
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
    async loadArrayBufferNode() {
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
    async loadArrayBufferBrowser() {
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
    loadSync() {
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
            console.log("eval sourceURL: " + absolutePath);
            eval(code + sourceUrlComment);
        } else {
            // Browser: use relative path for VSCode compatibility (no leading slash)
            // URL encode the path to handle spaces and special characters
            const encodedPath = encodeURI(this._path);
            const sourceUrlComment = `\n//# sourceURL=${encodedPath}`;
            console.log("eval sourceURL: " + encodedPath);
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
    async loadAndEval() {
        const content = await this.load();
        this.evalWithSourceUrl(content);
    }

    /**
     * @description Loads and evaluates the JavaScript file synchronously (Node.js only)
     * @category File Loading
     */
    loadAndEvalSync() {
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
    async exists() {
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
}

// Auto-setup environment when this file is loaded
StrvctFile.setupEnvironment();

// Make StrvctFile globally available
if (typeof global !== 'undefined') {
    global.StrvctFile = StrvctFile;
} else if (typeof window !== 'undefined') {
    window.StrvctFile = StrvctFile;
}