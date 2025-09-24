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
        // Build comprehensive error message with all debugging info
        let fullMessage = message;
        
        // Store the original properties
        const fullPath = pathSegments ? '/' + pathSegments.join('/') : '';
        let partialPath = fullPath;
        
        if (currentSegment && pathSegments) {
            const currentIndex = pathSegments.indexOf(currentSegment);
            partialPath = currentIndex >= 0 ? '/' + pathSegments.slice(0, currentIndex + 1).join('/') : fullPath;
        }
        
        // Add operation details
        if (operation) {
            fullMessage += `\n  Operation: ${operation.op}`;
            if (operation.path) fullMessage += ` at path "${operation.path}"`;
            if (operation.value !== undefined) {
                const valueStr = JSON.stringify(operation.value);
                if (valueStr.length > 100) {
                    fullMessage += `\n  Value: ${valueStr.substring(0, 100)}...`;
                } else {
                    fullMessage += `\n  Value: ${valueStr}`;
                }
            }
            if (operation.from) fullMessage += `\n  From: "${operation.from}"`;
        }
        
        // Add path information
        if (fullPath) {
            fullMessage += `\n  Full path: "${fullPath}"`;
            if (partialPath && partialPath !== fullPath) {
                fullMessage += `\n  Failed at: "${partialPath}"`;
            }
        }
        
        // Add current segment info
        if (currentSegment) {
            fullMessage += `\n  Failed segment: "${currentSegment}"`;
        }
        
        // Add target node information
        if (targetNode) {
            if (targetNode.svType) {
                fullMessage += `\n  Target node type: ${targetNode.svType()}`;
            } else if (typeof targetNode === 'object') {
                if (Array.isArray(targetNode)) {
                    fullMessage += `\n  Target type: Array (length: ${targetNode.length})`;
                } else {
                    fullMessage += `\n  Target type: Object`;
                    const keys = Object.keys(targetNode);
                    if (keys.length <= 5) {
                        fullMessage += ` (keys: ${keys.join(', ')})`;
                    } else {
                        fullMessage += ` (${keys.length} keys)`;
                    }
                }
            } else {
                fullMessage += `\n  Target type: ${typeof targetNode}`;
            }
            
            // Add node path if available
            if (targetNode.nodePathString) {
                fullMessage += `\n  Node path: "${targetNode.nodePathString()}"`;
            }
        }
        
        // Add full operation JSON for complex debugging
        if (operation) {
            fullMessage += `\n  Full operation: ${JSON.stringify(operation)}`;
        }
        
        super(fullMessage);
        this.name = 'JsonPatchError';
        this.operation = operation;
        this.pathSegments = pathSegments;
        this.currentSegment = currentSegment;
        this.targetNode = targetNode;
        this.fullPath = fullPath;
        this.partialPath = partialPath;
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