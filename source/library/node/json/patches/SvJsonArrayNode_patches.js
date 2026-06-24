"use strict";

/** * @module library.node.fields.json
 */

/** * @class SvJsonArrayNode_patches
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
                throw new SvJsonPatchError(
                    `Target node type '${targetInfo.node.svType()}' does not support JSON patch operations. Only JSON collection nodes (JsonGroup, SvJsonArrayNode) with patch categories support direct operations.`,
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
            if (error instanceof SvJsonPatchError) {
                error.operation = operation;
                throw error;
            }

            throw new SvJsonPatchError(
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
        if (path === "/") {
            return [];
        }
        return path.split("/").slice(1); // Remove leading empty string from split
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
                throw new SvJsonPatchError(
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
                    throw new SvJsonPatchError(
                        `Cannot navigate further from '${nextSegment}' - node type '${childNode.svType()}' does not support path navigation`,
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
            if (error instanceof SvJsonPatchError) {
                throw error;
            }

            throw new SvJsonPatchError(
                `Error navigating to '${nextSegment}': ${error.message}`,
                null,
                fullPath,
                nextSegment,
                this
            );
        }
    }

    /**
     * @description Recursively navigates to a node at the given path, tracking parent information.
     * @param {Array} pathSegments - The path segments to navigate.
     * @param {Array} originalPath - The original full path for error reporting.
     * @param {Object} parentNode - The parent node (for tracking).
     * @param {string} slotName - The slot name in the parent (for tracking).
     * @returns {Object} Object with {node, parentNode, slotName} properties.
     * @category JSON Patch
     */
    nodeAtPathWithParent (pathSegments, originalPath = null, parentNode = null, slotName = null) {
        const fullPath = originalPath || pathSegments.slice();

        if (pathSegments.length === 0) {
            return { node: this, parentNode: parentNode, slotName: slotName };
        }

        const nextSegment = pathSegments[0];
        const remainingPath = pathSegments.slice(1);

        try {
            const childNode = this.childNodeForSegment(nextSegment);

            if (!childNode) {
                throw new SvJsonPatchError(
                    `No child found for array index '${nextSegment}'`,
                    null,
                    fullPath,
                    nextSegment,
                    this
                );
            }

            // Check if the child node supports nodeAtPathWithParent (i.e., is a JSON collection type)
            if (childNode.nodeAtPathWithParent) {
                // Continue navigation through the child
                return childNode.nodeAtPathWithParent(remainingPath, fullPath, this, nextSegment);
            } else if (childNode.nodeAtPath) {
                // Fallback to nodeAtPath for older implementations, but lose parent tracking
                if (remainingPath.length > 0) {
                    const finalNode = childNode.nodeAtPath(remainingPath, fullPath);
                    return { node: finalNode, parentNode: this, slotName: nextSegment };
                } else {
                    return { node: childNode, parentNode: this, slotName: nextSegment };
                }
            } else {
                // Child node is likely a primitive field or other non-collection type
                // If there's still path remaining, check if it's a plain object we can navigate into
                if (remainingPath.length > 0) {
                    // Special case for plain objects - we can navigate into them
                    if (typeof childNode === "object" && !Array.isArray(childNode)) {
                        // For plain objects, return them as the node for further navigation
                        return {
                            node: childNode,
                            parentNode: this,
                            slotName: nextSegment
                        };
                    }

                    const nodeType = childNode.svType ? childNode.svType() : typeof childNode;
                    throw new SvJsonPatchError(
                        `Cannot navigate further from array index '${nextSegment}' - node type '${nodeType}' does not support path navigation`,
                        null,
                        fullPath,
                        remainingPath[0],
                        childNode
                    );
                }
                // If no remaining path, this child is our target
                return { node: childNode, parentNode: this, slotName: nextSegment };
            }

        } catch (error) {
            if (error instanceof SvJsonPatchError) {
                throw error;
            }

            throw new SvJsonPatchError(
                `Error navigating to array index '${nextSegment}': ${error.message}`,
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
        if (segment === "-") {
            throw new SvJsonPatchError(
                "Cannot navigate to the append position '/-'.",
                null,
                [segment],
                segment,
                this
            );
        }

        const child = this.subnodeForJsonId(segment);
        if (!child) {
            throw new SvJsonPatchError(
                `No array item with jsonId '${segment}'. Array items are addressed by their stable jsonId (shown in getClientState), not by position.`,
                null,
                [segment],
                segment,
                this
            );
        }

        return child;
    }

    /**
     * @description Resolves an immediate array item by its stable jsonId.
     * @param {string} jsonId - The item's jsonId.
     * @returns {SvNode|undefined} The matching item node (pointer-unwrapped), or undefined.
     * @category JSON Patch
     */
    subnodeForJsonId (jsonId) {
        return this.subnodes().detectAndReturnValue(sn => {
            const node = (sn.isKindOf && sn.isKindOf(SvPointerField)) ? sn.nodeTileLink() : sn;
            return (node.jsonId && node.jsonId() === jsonId) ? node : undefined;
        });
    }

    /**
     * @description Returns the JSON value with any client-supplied jsonId removed,
     * so the server mints a fresh, unique id on add.
     * @param {*} value - The JSON value.
     * @returns {*} The value without a jsonId.
     * @category JSON Patch
     */
    jsonWithoutId (value) {
        if (value && typeof value === "object" && !Array.isArray(value) && "jsonId" in value) {
            const v = { ...value };
            delete v.jsonId;
            return v;
        }
        return value;
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
            case "add": return this.addDirectly(key, value, operation);
            case "remove": return this.removeDirectly(key, operation);
            case "replace": return this.replaceDirectly(key, value, operation);
            case "move": return this.moveDirectly(operation.from, key, rootNode, operation);
            case "copy": return this.copyDirectly(operation.from, key, rootNode, operation);
            case "test": return this.testDirectly(key, value, operation);
            default:
                throw new SvJsonPatchError(
                    `Unsupported JSON patch operation: ${op}`,
                    operation,
                    this.parsePathSegments(operation.path),
                    key,
                    this
                );
        }
    }

    /**
     * @description Adds a value directly to this array.
     * @param {string} key - The array index or "/-" for append.
     * @param {*} value - The value to add.
     * @returns {SvJsonArrayNode} This node.
     * @category JSON Patch
     */
    addDirectly (key, value, operation = null) {
        if (key !== "-") {
            throw new SvJsonPatchError(
                `Cannot add to an array at '${key}'. Append new items with '/-'; the server assigns each a stable jsonId. Existing items are addressed by jsonId for replace/remove.`,
                operation,
                operation ? this.parsePathSegments(operation.path) : [key],
                key,
                this
            );
        }
        // Strip any client-supplied jsonId so finalInit mints a fresh, unique one.
        const newNode = this.newSubnodeForJson(this.jsonWithoutId(value));
        this.addSubnode(newNode);
        return this;
    }

    /**
     * @description Removes a value directly from this array.
     * @param {string} key - The array index.
     * @returns {SvJsonArrayNode} This node.
     * @category JSON Patch
     */
    removeDirectly (key, operation = null) {
        const node = this.subnodeForJsonId(key);
        if (!node) {
            throw new SvJsonPatchError(
                `Cannot remove: no array item with jsonId '${key}'. Items are addressed by their stable jsonId.`,
                operation,
                operation ? this.parsePathSegments(operation.path) : null,
                key,
                this
            );
        }
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
    replaceDirectly (key, value, operation = null) {
        const oldNode = this.subnodeForJsonId(key);
        if (!oldNode) {
            throw new SvJsonPatchError(
                `Cannot replace: no array item with jsonId '${key}'. Items are addressed by their stable jsonId; append new items with '/-'.`,
                operation,
                operation ? this.parsePathSegments(operation.path) : null,
                key,
                this
            );
        }
        // Preserve the item's jsonId so its address stays stable across a replace.
        const json = this.jsonWithoutId(value);
        if (json && typeof json === "object" && !Array.isArray(json)) {
            json.jsonId = oldNode.jsonId();
        }
        const newNode = this.newSubnodeForJson(json);
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
    moveDirectly (fromPath, key, rootNode /*, operation = null*/) {
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
    copyDirectly (fromPath, key, rootNode /*, operation = null*/) {
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
    testDirectly (key, expectedValue, operation = null) {
        const node = this.subnodeForJsonId(key);
        if (!node) {
            throw new SvJsonPatchError(
                `Cannot test: no array item with jsonId '${key}'.`,
                operation,
                operation ? this.parsePathSegments(operation.path) : null,
                key,
                this
            );
        }

        const actualValue = node.asJson();
        if (JSON.stringify(actualValue) !== JSON.stringify(expectedValue)) {
            throw new SvJsonPatchError(
                `Test failed: expected ${JSON.stringify(expectedValue)} but got ${JSON.stringify(actualValue)}`,
                operation,
                operation ? this.parsePathSegments(operation.path) : null,
                key,
                this
            );
        }

        return this;
    }


}.initThisCategory());
