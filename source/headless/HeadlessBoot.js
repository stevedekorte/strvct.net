"use strict";

/**
 * @module headless
 */

// Load getGlobalThis function
const fs = require('fs');
const path = require('path');
const getGlobalThisPath = path.resolve('source/boot/getGlobalThis.js');
if (fs.existsSync(getGlobalThisPath)) {
    const getGlobalThisContent = fs.readFileSync(getGlobalThisPath, 'utf8');
    eval(getGlobalThisContent);
}

/**
 * @class HeadlessBoot
 * @extends Object
 * @classdesc Simple headless loader that walks _imports.json files and evaluates JS in Node.js.
 * 
 * Responsibilities:
 * - Recursively follows _imports.json files
 * - Loads and evaluates JavaScript files in dependency order
 * - Tracks loaded files to avoid duplicates
 * - Provides minimal setup for Node.js execution
 */
const HeadlessBoot = class HeadlessBoot extends Object {


    /**
     * @static
     * @description Returns the shared instance
     * @returns {HeadlessBoot} The shared instance
     * @category Instance Management
     */
    static shared () {
        if (!Object.hasOwn(this, "_shared")) {
            const obj = new this();
            this._shared = obj;
            obj.init();
        }
        return this._shared;
    }

    /**
     * @description Returns the type of the boot manager
     * @returns {string} The type "HeadlessBoot"
     * @category Metadata
     */
    type () {
        return "HeadlessBoot";
    }

    /**
     * @description Initializes the HeadlessBoot instance
     * @returns {HeadlessBoot} The initialized instance
     * @category Lifecycle
     */
    init () {
        this._loadedFiles = new Set(); // Track loaded files to avoid duplicates
        return this;
    }



    /**
     * @description Loads resources starting from an _imports.json file, recursively following all imports
     * @param {string} importsPath - Path to an _imports.json file
     * @returns {Promise<HeadlessBoot>} The boot instance
     * @category Resource Loading
     */
    async loadFromPath (importsPath) {
        const fs = require('fs');
        const path = require('path');

        console.log(`Loading from imports file: ${importsPath}`);

        // Resolve the imports file path
        const fullImportsPath = path.resolve(importsPath);
        const baseDir = path.dirname(fullImportsPath);

        // Read the _imports.json file
        let imports;
        try {
            const importsContent = fs.readFileSync(fullImportsPath, 'utf8');
            imports = JSON.parse(importsContent);
        } catch (error) {
            throw new Error(`Failed to read imports file ${importsPath}: ${error.message}`);
        }

        if (!Array.isArray(imports)) {
            throw new Error(`Imports file ${importsPath} must contain a JSON array`);
        }

        // Process each import in order
        for (const importPath of imports) {
            await this.loadResource(importPath, baseDir);
        }

        return this;
    }

    /**
     * @description Loads a single resource, handling different file types appropriately
     * @param {string} resourcePath - Relative path to the resource
     * @param {string} baseDir - Base directory for resolving relative paths
     * @returns {Promise<void>}
     * @category Resource Loading
     */
    async loadResource (resourcePath, baseDir) {
        const fs = require('fs');
        const path = require('path');

        // Resolve the full path
        const fullPath = path.resolve(baseDir, resourcePath);
        const normalizedPath = path.normalize(fullPath);

        // Skip if already loaded
        if (this._loadedFiles.has(normalizedPath)) {
            return;
        }

        // Check if file exists
        if (!fs.existsSync(fullPath)) {
            console.warn(`Resource not found: ${resourcePath} (resolved to: ${fullPath})`);
            return;
        }

        const ext = path.extname(resourcePath).toLowerCase();

        try {
            if (resourcePath.endsWith('_imports.json')) {
                // Recursively load another imports file
                console.log(`  Following imports: ${resourcePath}`);
                await this.loadFromPath(fullPath);
            } else if (ext === '.js') {
                // Load and evaluate JavaScript file
                console.log(`  Loading JS: ${resourcePath}`);
                const content = fs.readFileSync(fullPath, 'utf8');
                const sourceURL = `//# sourceURL=${resourcePath}`;
                eval(content + '\n' + sourceURL);
                this._loadedFiles.add(normalizedPath);
            } else {
                // Skip non-JS files in headless mode
                console.log(`  Skipping non-JS file: ${resourcePath}`);
                this._loadedFiles.add(normalizedPath);
            }
        } catch (error) {
            console.error(`Failed to load resource ${resourcePath}:`, error.message);
            throw error;
        }
    }

    /**
     * @description Gets the set of all loaded file paths
     * @returns {Set<string>} Set of normalized file paths that have been loaded
     * @category State Management
     */
    getLoadedFiles () {
        return new Set(this._loadedFiles);
    }

    /**
     * @description Checks if a specific file has been loaded
     * @param {string} filePath - Path to check
     * @returns {boolean} True if the file has been loaded
     * @category State Management
     */
    hasLoadedFile (filePath) {
        const path = require('path');
        const normalizedPath = path.normalize(path.resolve(filePath));
        return this._loadedFiles.has(normalizedPath);
    }

    /**
     * @description Clears the loaded files tracking (useful for testing)
     * @returns {HeadlessBoot} The boot instance
     * @category State Management
     */
    clearLoadedFiles () {
        this._loadedFiles.clear();
        return this;
    }

    /**
     * @static
     * @description Convenience method to load from imports
     * @param {string} importsPath - Path to root _imports.json file
     * @returns {Promise<HeadlessBoot>} The boot instance with loaded files
     * @category Factory Methods
     */
    static async loadFromPath (importsPath) {
        const boot = this.shared();
        await boot.loadFromPath(importsPath);
        return boot;
    }

};

// Make HeadlessBoot globally available
getGlobalThis().HeadlessBoot = HeadlessBoot;