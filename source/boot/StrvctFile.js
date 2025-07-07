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
 *   const file = StrvctFile.with('source/boot/MyFile.js');
 *   const content = await file.asyncLoad();
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
        /**
         * @private
         * @type {string|null}
         * @description Cached file content after loading
         */
        this._content = null;
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
     * @description Loads the file content, automatically choosing the right method for the environment
     * @returns {Promise<string>} Promise that resolves with file content as text
     * @category File Loading
     */
    async asyncLoad () {
        if (!this._path) {
            throw new Error('No file path set. Use setPath() first.');
        }

        let content;
        if (SvPlatform.isNodePlatform()) {
            content = await this.asyncLoadNode();
        } else {
            content = await this.asyncLoadBrowser();
        }
        
        this._content = content;
        return content;
    }

    /**
     * @description Loads the file content as an ArrayBuffer, automatically choosing the right method for the environment
     * @returns {Promise<ArrayBuffer>} Promise that resolves with file content as ArrayBuffer
     * @category File Loading
     */
    async asyncLoadArrayBuffer () {
        if (!this._path) {
            throw new Error('No file path set. Use setPath() first.');
        }

        if (SvPlatform.isNodePlatform()) {
            return this.asyncLoadArrayBufferNode();
        } else {
            return this.asyncLoadArrayBufferBrowser();
        }
    }

    /**
     * @description Loads the file using Node.js fs module
     * @returns {Promise<string>} Promise that resolves with file content as text
     * @category File Loading
     */
    async asyncLoadNode () {
        const fs = require('fs').promises;
        const path = require('path');
        
        try {
            // Use working path if set, otherwise resolve relative to current directory
            const basePath = StrvctFile.workingPath() || process.cwd();
            const fullPath = path.resolve(basePath, this._path);
            //console.log("fs.readFile [" + fullPath.split("/").pop() + "]");
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
    async asyncLoadBrowser () {
        const baseUrl = StrvctFile.baseUrl();
        const fullUrl = baseUrl ? 
            `${baseUrl}/${this._path.replace(/^\//, '')}` : 
            this._path;
        
        try {
            const response = await fetch(fullUrl);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            this._content = await response.text();
            return this._content;
        } catch (error) {
            throw new Error(`Failed to load file in browser: ${fullUrl} - ${error.message}`);
        }
    }

    /**
     * @description Loads the file as ArrayBuffer using Node.js fs module
     * @returns {Promise<ArrayBuffer>} Promise that resolves with file content as ArrayBuffer
     * @category File Loading
     */
    async asyncLoadArrayBufferNode () {
        const fs = require('fs').promises;
        const path = require('path');
        
        try {
            // Use working path if set, otherwise resolve relative to current directory
            const basePath = StrvctFile.workingPath() || process.cwd();
            const fullPath = path.resolve(basePath, this._path);
            const buffer = await fs.readFile(fullPath);
            
            // Convert Node.js Buffer to ArrayBuffer
            this._content = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
            return this._content;
        } catch (error) {
            throw new Error(`Failed to load file as ArrayBuffer in Node.js: ${this._path} - ${error.message}`);
        }
    }

    /**
     * @description Loads the file as ArrayBuffer using browser fetch API
     * @returns {Promise<ArrayBuffer>} Promise that resolves with file content as ArrayBuffer
     * @category File Loading
     */
    async asyncLoadArrayBufferBrowser () {
        const baseUrl = StrvctFile.baseUrl();
        const fullUrl = baseUrl ? 
            `${baseUrl}/${this._path.replace(/^\//, '')}` : 
            this._path;
        
        try {
            const response = await fetch(fullUrl);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            this._content = await response.arrayBuffer();
            return this._content;
        } catch (error) {
            throw new Error(`Failed to load file as ArrayBuffer in browser: ${fullUrl} - ${error.message}`);
        }
    }

    /**
     * @description Evaluates the loaded JavaScript content with proper source URL for debugging
     * @category Code Execution
     */
    eval () {
        if (this._content === null) {
            throw new Error('No content loaded. Use load() first.');
        }
        
        if (SvPlatform.isNodePlatform()) {
            // Use absolute path for better Node.js debugging
            const path = require('path');
            const basePath = StrvctFile.workingPath() || process.cwd();
            const absolutePath = path.resolve(basePath, this._path);
            const sourceUrlComment = `\n//# sourceURL=${absolutePath}`;
            console.log("eval: " + absolutePath.split("/").pop());
            eval(this._content + sourceUrlComment);
        } else {
            // Browser: use relative path for VSCode compatibility (no leading slash)
            // URL encode the path to handle spaces and special characters
            const encodedPath = encodeURI(this._path);
            const sourceUrlComment = `\n//# sourceURL=${encodedPath}`;
            console.log("eval [" + encodedPath.split("/").pop() + "]");
            eval(this._content + sourceUrlComment);
            //const evalFunc = new Function(this._content + sourceUrlComment);
            //evalFunc.call(window);
        }
    }

    /**
     * @description Loads and evaluates the JavaScript file
     * @returns {Promise<void>} Promise that resolves when file is loaded and evaluated
     * @category File Loading
     */
    async asyncLoadAndEval () {
        await this.asyncLoad();
        this.eval();
    }

    /**
     * @description Checks if the file exists
     * @returns {Promise<boolean>} Promise that resolves with true if file exists
     * @category File System
     */
    async asyncExists () {
        if (!this._path) {
            throw new Error('No file path set. Use setPath() first.');
        }

        if (SvPlatform.isNodePlatform()) {
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
    static async asyncLoadAndSequentiallyEvalPaths (filePaths) {
        const files = filePaths.map(filePath => StrvctFile.with(filePath));
        const loadPromises = files.map(file => {
            return file.asyncLoad();
        });
        
        const fileContents = await Promise.all(loadPromises);
        
        // Evaluate files sequentially to maintain order
        files.forEach(file => {
            file.eval();
        });
    }

    /**
     * @static
     * @description Utility method for quick file loading
     * @param {string} filePath - Path to the file to load
     * @returns {Promise<string>} Promise that resolves with file content as text
     * @category Utility Methods
     */
    static async asyncLoadFile (filePath) {
        const file = StrvctFile.with(filePath);
        return await file.asyncLoad();
    }


    /**
     * @description Determines if this file should be used in the current environment based on path conventions
     * @returns {boolean} True if the file should be loaded in the current environment
     * @category Environment Detection
     */
    canUseInCurrentEnv () {
        const path = this._path;
        if (!path) {
            return true; // No path set, assume it's usable
        }
        
        const pathComponents = path.split('/');
        const isNodePlatform = SvPlatform.isNodePlatform();
        
        if (isNodePlatform) {
            const isBrowserOnly = pathComponents.includes('browser-only');
            return !isBrowserOnly;
        } else {
            const isNodeOnly = pathComponents.includes('server-only');
            return !isNodeOnly;
        }
    }

}

SvGlobals.set("StrvctFile", StrvctFile);
