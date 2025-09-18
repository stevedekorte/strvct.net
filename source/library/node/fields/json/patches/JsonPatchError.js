"use strict";

/**
 * @module library.node.fields.json
 * @class JsonPatchError
 * @extends Error
 * @classdesc Custom error class for JSON patch operations with detailed context information.
 */
(class JsonPatchError extends Error {
    
    /**
     * @description Creates a new JsonPatchError with detailed context.
     * @param {string} message - The error message.
     * @param {Object} operation - The JSON patch operation that failed.
     * @param {Array} pathSegments - The path segments being processed.
     * @param {string} currentSegment - The segment where the error occurred.
     * @param {Object} targetNode - The node where the error occurred.
     */
    constructor (message, operation, pathSegments, currentSegment, targetNode) {
        super(message);
        this.name = 'JsonPatchError';
        this.operation = operation;
        this.pathSegments = pathSegments;
        this.currentSegment = currentSegment;
        this.targetNode = targetNode;
        this.fullPath = pathSegments ? '/' + pathSegments.join('/') : '';
        
        if (currentSegment && pathSegments) {
            const currentIndex = pathSegments.indexOf(currentSegment);
            this.partialPath = currentIndex >= 0 ? '/' + pathSegments.slice(0, currentIndex + 1).join('/') : this.fullPath;
        } else {
            this.partialPath = this.fullPath;
        }
    }

    /**
     * @description Converts the error to a detailed message object for LLM consumption.
     * @returns {Object} Detailed error information.
     */
    toDetailedMessage () {
        return {
            error: this.message,
            operation: this.operation,
            fullPath: this.fullPath,
            failedAt: this.partialPath,
            failedSegment: this.currentSegment,
            nodeType: this.targetNode ? this.targetNode.svType() : 'unknown',
            suggestions: this.getSuggestions()
        };
    }

    /**
     * @description Provides context-specific suggestions for fixing the error.
     * @returns {Array} Array of suggestion strings.
     */
    getSuggestions () {
        const suggestions = [];
        
        if (this.message.includes('No child found') || this.message.includes('not found')) {
            suggestions.push("Check that the path exists in the current JSON structure");
            suggestions.push("Use getClientState tool to inspect the current structure");
        }
        
        if (this.message.includes('Array index') && this.message.includes('out of bounds')) {
            suggestions.push("Check the array length before accessing indices");
            suggestions.push("Use '/-' to append to the end of an array");
        }
        
        if (this.message.includes("'/-'")) {
            suggestions.push("Use '/-' only with 'add' operations to append to arrays");
            suggestions.push("For other operations, use specific numeric indices (0, 1, 2, etc.)");
        }
        
        if (this.message.includes('negative')) {
            suggestions.push("Array indices must be non-negative integers");
            suggestions.push("Use positive indices starting from 0");
        }
        
        return suggestions;
    }
    
}.initThisClass());