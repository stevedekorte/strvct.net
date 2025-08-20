"use strict";

/**
 * @module library.node.fields.json
 * @class SvJsonArrayNode_patches
 * @extends SvJsonArrayNode
 * @classdesc Category class that adds native JSON patch support to SvJsonArrayNode.
 */
(class SvJsonArrayNode_patches extends SvJsonArrayNode {

    // --- Native JSON Patch Support ---

    /**
     * @description Applies a single JSON patch operation to this node.
     * @param {Object} operation - The JSON patch operation.
     * @param {Object} rootNode - The root node for path resolution (optional, defaults to this).
     * @returns {SvJsonArrayNode} This node.
     * @category JSON Patch
     */
    applyPatch (operation, rootNode = null) {
        try {
            const pathSegments = this.parsePathSegments(operation.path);
            const targetInfo = this.findTargetForPath(pathSegments);
            
            // Check if the target node supports JSON patch operations
            if (!targetInfo.node.executeDirectOperation) {
                throw new JsonPatchError(
                    `Target node type '${targetInfo.node.type()}' does not support JSON patch operations. Only JSON collection nodes (JsonGroup, SvJsonArrayNode) with patch categories support direct operations.`,
                    operation,
                    pathSegments,
                    targetInfo.key,
                    targetInfo.node
                );
            }
            
            // Pass the root node (or this if no root provided) for copy/move operations
            const patchRoot = rootNode || this;
            return targetInfo.node.executeDirectOperation(operation.op, targetInfo.key, operation.value, operation, patchRoot);
        } catch (error) {
            if (error instanceof JsonPatchError) {
                error.operation = operation;
                throw error;
            }
            
            throw new JsonPatchError(
                `Failed to apply patch: ${error.message}`,
                operation,
                this.parsePathSegments(operation.path),
                null,
                this
            );
        }
    }

    /**
     * @description Parses a JSON pointer path into segments.
     * @param {string} path - The JSON pointer path (e.g., "/campaign/locations/0").
     * @returns {Array} Array of path segments.
     * @category JSON Patch
     */
    parsePathSegments (path) {
        if (path === '/') {
            return [];
        }
        return path.split('/').slice(1); // Remove leading empty string from split
    }

    /**
     * @description Finds the target node and key for a JSON patch operation.
     * @param {Array} pathSegments - The path segments.
     * @returns {Object} Object with {node, key} properties.
     * @category JSON Patch
     */
    findTargetForPath (pathSegments) {
        if (pathSegments.length === 1) {
            return { node: this, key: pathSegments[0] };
        }
        
        const navigationSegments = pathSegments.slice(0, -1);
        const targetKey = pathSegments[pathSegments.length - 1];
        const targetNode = this.nodeAtPath(navigationSegments);
        
        return { node: targetNode, key: targetKey };
    }

    /**
     * @description Recursively navigates to a node at the given path.
     * @param {Array} pathSegments - The path segments to navigate.
     * @param {Array} originalPath - The original full path for error reporting.
     * @returns {Object} The target node.
     * @category JSON Patch
     */
    nodeAtPath (pathSegments, originalPath = null) {
        const fullPath = originalPath || pathSegments.slice();
        
        if (pathSegments.length === 0) {
            return this;
        }
        
        const nextSegment = pathSegments[0];
        const remainingPath = pathSegments.slice(1);
        
        try {
            const childNode = this.childNodeForSegment(nextSegment);
            
            if (!childNode) {
                throw new JsonPatchError(
                    `No child found for segment '${nextSegment}'`,
                    null,
                    fullPath,
                    nextSegment,
                    this
                );
            }
            
            // Check if the child node supports nodeAtPath (i.e., is a JSON collection type)
            if (childNode.nodeAtPath) {
                return childNode.nodeAtPath(remainingPath, fullPath);
            } else {
                // Child node is likely a primitive field or other non-collection type
                // If there's still path remaining, this is an error
                if (remainingPath.length > 0) {
                    throw new JsonPatchError(
                        `Cannot navigate further from '${nextSegment}' - node type '${childNode.type()}' does not support path navigation`,
                        null,
                        fullPath,
                        remainingPath[0],
                        childNode
                    );
                }
                // If no remaining path, this child is our target
                return childNode;
            }
            
        } catch (error) {
            if (error instanceof JsonPatchError) {
                throw error;
            }
            
            throw new JsonPatchError(
                `Error navigating to '${nextSegment}': ${error.message}`,
                null,
                fullPath,
                nextSegment,
                this
            );
        }
    }

    /**
     * @description Gets the child node for a specific path segment (array index).
     * @param {string} segment - The path segment (array index).
     * @returns {Object} The child node.
     * @category JSON Patch
     */
    childNodeForSegment (segment) {
        const index = this.validateArrayIndex(segment, "navigate");
        
        if (index === -1) {
            throw new Error("Cannot navigate to append position '/-'");
        }
        
        const arrayLength = this.subnodes().length;
        if (index >= arrayLength) {
            throw new Error(`Array index ${index} is out of bounds. Array has ${arrayLength} elements (valid indices: 0-${arrayLength - 1})`);
        }
        
        return this.subnodes().at(index);
    }

    /**
     * @description Validates an array index string and returns the numeric index.
     * @param {string} indexString - The index as a string.
     * @param {string} operation - The operation being performed (for error messages).
     * @returns {number} The validated index (-1 for "/-" append).
     * @category JSON Patch
     */
    validateArrayIndex (indexString, operation = "access") {
        if (indexString === '-') {
            if (operation !== 'add') {
                throw new Error(`Cannot ${operation} using '/-' path. Use '/-' only with 'add' operations.`);
            }
            return -1; // Special return value for append
        }
        
        const index = parseInt(indexString);
        
        if (isNaN(index)) {
            throw new Error(`Array index '${indexString}' is not a valid number`);
        }
        
        if (index < 0) {
            throw new Error(`Array index ${index} is negative. Array indices must be >= 0`);
        }
        
        return index;
    }

    /**
     * @description Executes a direct JSON patch operation on this node.
     * @param {string} op - The operation type.
     * @param {string} key - The target key/index.
     * @param {*} value - The operation value.
     * @param {Object} operation - The full operation object.
     * @param {Object} rootNode - The root node for path resolution.
     * @returns {SvJsonArrayNode} This node.
     * @category JSON Patch
     */
    executeDirectOperation (op, key, value, operation, rootNode) {
        switch (op) {
            case 'add': return this.addDirectly(key, value);
            case 'remove': return this.removeDirectly(key);
            case 'replace': return this.replaceDirectly(key, value);
            case 'move': return this.moveDirectly(operation.from, key, rootNode);
            case 'copy': return this.copyDirectly(operation.from, key, rootNode);
            case 'test': return this.testDirectly(key, value);
            default:
                throw new Error(`Unsupported JSON patch operation: ${op}`);
        }
    }

    /**
     * @description Adds a value directly to this array.
     * @param {string} key - The array index or "/-" for append.
     * @param {*} value - The value to add.
     * @returns {SvJsonArrayNode} This node.
     * @category JSON Patch
     */
    addDirectly (key, value) {
        try {
            const index = this.validateArrayIndex(key, "add");
            const newNode = this.newSubnodeForJson(value);
            
            if (index === -1) {
                this.addSubnode(newNode);
                return this;
            }
            
            if (index > this.subnodes().length) {
                throw new Error(`Cannot add to array: index ${index} is beyond array end (length: ${this.subnodes().length}). Use index ${this.subnodes().length} or '/-' to append`);
            }
            
            this.addSubnodeAt(newNode, index);
            return this;
        } catch (error) {
            throw new Error(`Add operation failed: ${error.message}`);
        }
    }

    /**
     * @description Removes a value directly from this array.
     * @param {string} key - The array index.
     * @returns {SvJsonArrayNode} This node.
     * @category JSON Patch
     */
    removeDirectly (key) {
        const index = this.validateArrayIndex(key, "remove");
        
        if (index === -1) {
            throw new Error("Cannot remove using '/-' path. Specify a valid array index (0, 1, 2, etc.)");
        }
        
        if (index >= this.subnodes().length) {
            throw new Error(`Cannot remove from array: index ${index} is out of bounds (valid range: 0-${this.subnodes().length - 1})`);
        }
        
        const node = this.subnodes().at(index);
        this.removeSubnode(node);
        return this;
    }

    /**
     * @description Replaces a value directly in this array.
     * @param {string} key - The array index.
     * @param {*} value - The new value.
     * @returns {SvJsonArrayNode} This node.
     * @category JSON Patch
     */
    replaceDirectly (key, value) {
        const index = this.validateArrayIndex(key, "replace");
        
        if (index === -1) {
            throw new Error("Cannot replace using '/-' path. Specify a valid array index (0, 1, 2, etc.)");
        }
        
        if (index >= this.subnodes().length) {
            throw new Error(`Cannot replace in array: index ${index} is out of bounds (valid range: 0-${this.subnodes().length - 1})`);
        }
        
        const newNode = this.newSubnodeForJson(value);
        const oldNode = this.subnodes().at(index);
        this.replaceSubnodeWith(oldNode, newNode);
        return this;
    }

    /**
     * @description Moves a value within or to this array.
     * @param {string} fromPath - The source path.
     * @param {string} key - The target array index.
     * @param {Object} rootNode - The root node for path resolution.
     * @returns {SvJsonArrayNode} This node.
     * @category JSON Patch
     */
    moveDirectly (fromPath, key, rootNode) {
        const sourceValue = rootNode.getValueAtPath(fromPath);
        // Deep clone the value to avoid reference sharing
        const clonedValue = JSON.parse(JSON.stringify(sourceValue));
        this.addDirectly(key, clonedValue);
        rootNode.removeValueAtPath(fromPath);
        return this;
    }

    /**
     * @description Copies a value to this array.
     * @param {string} fromPath - The source path.
     * @param {string} key - The target array index.
     * @param {Object} rootNode - The root node for path resolution.
     * @returns {SvJsonArrayNode} This node.
     * @category JSON Patch
     */
    copyDirectly (fromPath, key, rootNode) {
        const sourceValue = rootNode.getValueAtPath(fromPath);
        // Deep clone the value to avoid reference sharing
        const clonedValue = JSON.parse(JSON.stringify(sourceValue));
        this.addDirectly(key, clonedValue);
        return this;
    }

    /**
     * @description Tests if a value matches the expected value.
     * @param {string} key - The array index.
     * @param {*} expectedValue - The expected value.
     * @returns {SvJsonArrayNode} This node.
     * @category JSON Patch
     */
    testDirectly (key, expectedValue) {
        const index = this.validateArrayIndex(key, "test");
        
        if (index === -1) {
            throw new Error("Cannot test using '/-' path. Specify a valid array index (0, 1, 2, etc.)");
        }
        
        if (index >= this.subnodes().length) {
            throw new Error(`Cannot test array: index ${index} is out of bounds (valid range: 0-${this.subnodes().length - 1})`);
        }
        
        const node = this.subnodes().at(index);
        const actualValue = node.asJson();
        
        if (JSON.stringify(actualValue) !== JSON.stringify(expectedValue)) {
            throw new Error(`Test failed: expected ${JSON.stringify(expectedValue)} but got ${JSON.stringify(actualValue)}`);
        }
        
        return this;
    }


}.initThisCategory());