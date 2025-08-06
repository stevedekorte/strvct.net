"use strict";

/**
 * @module library.node.fields.json
 * @class JsonGroup_patches
 * @extends JsonGroup
 * @classdesc Category class that adds native JSON patch support to JsonGroup.
 */
(class JsonGroup_patches extends JsonGroup {

  // --- Native JSON Patch Support ---

  /**
   * @description Applies an array of JSON patch operations to this node.
   * @param {Array} patches - Array of JSON patch operations.
   * @returns {JsonGroup} This node.
   * @category JSON Patch
   */
  applyJsonPatches (patches) {
    assert(Type.isArray(patches), "applyJsonPatches() patches must be an array");
    
    if (patches.length === 0) {
      return this;
    }
    
    try {
      for (const patch of patches) {
        this.applyPatch(patch, this); // Pass this as the root node
      }
      return this;
    } catch (error) {
      if (error instanceof JsonPatchError) {
        // Enhanced error handling for LLM consumption
        const errorDetails = error.toDetailedMessage();
        const enhancedError = new Error(`JSON Patch failed: ${JSON.stringify(errorDetails, null, 2)}`);
        enhancedError.patchError = errorDetails;
        throw enhancedError;
      }
      throw error;
    }
  }

  /**
   * @description Applies a single JSON patch operation to this node.
   * @param {Object} operation - The JSON patch operation.
   * @param {Object} rootNode - The root node for path resolution (optional, defaults to this).
   * @returns {JsonGroup} This node.
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
   * @description Gets the child node for a specific path segment (object key).
   * @param {string} segment - The path segment (object property name).
   * @returns {Object} The child node.
   * @category JSON Patch
   */
  childNodeForSegment (segment) {
    if (this.shouldStoreSubnodes()) {
      const subnode = this.subnodeWithTitle(segment);
      if (!subnode) {
        const pathString = this.nodePathString() + "/" + segment;
        const errorMessage = "JSON Patch Error: invalid path: " + pathString + " - missing subnode";
        console.error(errorMessage);
        throw new Error(errorMessage);
      }
      return subnode;
    } else {
      const slot = this.getSlot(segment);
      if (!slot) {
        const pathString = this.nodePathString() + "/" + segment;
        const errorMessage = "JSON Patch Error: invalid path: " + pathString + " - missing slot";
        console.error(errorMessage);
        throw new Error(errorMessage);
      }
      
      const value = slot.onInstanceGetValue(this);
      if (!value) {
        throw new Error(`Slot '${segment}' exists but has no value (null/undefined)`);
      }
      
      return value;
    }
  }

  /**
   * @description Executes a direct JSON patch operation on this node.
   * @param {string} op - The operation type.
   * @param {string} key - The target key.
   * @param {*} value - The operation value.
   * @param {Object} operation - The full operation object.
   * @param {Object} rootNode - The root node for path resolution.
   * @returns {JsonGroup} This node.
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
   * @description Adds a value directly to this object.
   * @param {string} key - The property name.
   * @param {*} value - The value to add.
   * @returns {JsonGroup} This node.
   * @category JSON Patch
   */
  addDirectly (key, value) {
    try {
      if (this.shouldStoreSubnodes()) {
        const newNode = this.createNodeForValue(value);
        newNode.setTitle(key);
        this.addSubnode(newNode);
        return this;
      } else {
        return this.setJsonKeyValue(key, value);
      }
    } catch (error) {
      throw new Error(`Add operation failed: ${error.message}`);
    }
  }

  /**
   * @description Removes a value directly from this object.
   * @param {string} key - The property name.
   * @returns {JsonGroup} This node.
   * @category JSON Patch
   */
  removeDirectly (key) {
    if (this.shouldStoreSubnodes()) {
      const subnode = this.subnodeWithTitle(key);
      if (!subnode) {
        const availableKeys = this.subnodes().map(sn => sn.title()).join(', ');
        throw new Error(`Cannot remove property '${key}': not found. Available properties: [${availableKeys}]`);
      }
      this.removeSubnode(subnode);
      return this;
    } else {
      const slot = this.getSlot(key);
      if (!slot) {
        const availableSlots = Array.from(this.thisPrototype().allSlotsNamesSet()).join(', ');
        throw new Error(`Cannot remove slot '${key}': not found. Available slots: [${availableSlots}]`);
      }
      
      if (slot.allowsNullValue()) {
        slot.onInstanceSetValue(this, null);
      } else {
        slot.onInstanceSetValue(this, slot.initValue());
      }
      return this;
    }
  }

  /**
   * @description Replaces a value directly in this object.
   * @param {string} key - The property name.
   * @param {*} value - The new value.
   * @returns {JsonGroup} This node.
   * @category JSON Patch
   */
  replaceDirectly (key, value) {
    if (this.shouldStoreSubnodes()) {
      const existingSubnode = this.subnodeWithTitle(key);
      if (!existingSubnode) {
        const availableKeys = this.subnodes().map(sn => sn.title()).join(', ');
        throw new Error(`Cannot replace property '${key}': not found. Available properties: [${availableKeys}]`);
      }
      
      const newNode = this.createNodeForValue(value);
      newNode.setTitle(key);
      this.replaceSubnodeWith(existingSubnode, newNode);
      return this;
    } else {
      const slot = this.getSlot(key);
      if (!slot) {
        const availableSlots = Array.from(this.thisPrototype().allSlotsNamesSet()).join(', ');
        throw new Error(`Cannot replace slot '${key}': not found. Available slots: [${availableSlots}]`);
      }
      
      const currentValue = slot.onInstanceGetValue(this);
      if (currentValue === null || currentValue === undefined) {
        throw new Error(`Cannot replace slot '${key}': current value is null/undefined`);
      }
      
      return this.setJsonKeyValue(key, value);
    }
  }

  /**
   * @description Moves a value within or to this object.
   * @param {string} fromPath - The source path.
   * @param {string} key - The target property name.
   * @param {Object} rootNode - The root node for path resolution.
   * @returns {JsonGroup} This node.
   * @category JSON Patch
   */
  moveDirectly (fromPath, key, rootNode) {
    const sourceValue = rootNode.getValueAtPath(fromPath);
    this.addDirectly(key, sourceValue);
    rootNode.removeValueAtPath(fromPath);
    return this;
  }

  /**
   * @description Copies a value to this object.
   * @param {string} fromPath - The source path.
   * @param {string} key - The target property name.
   * @param {Object} rootNode - The root node for path resolution.
   * @returns {JsonGroup} This node.
   * @category JSON Patch
   */
  copyDirectly (fromPath, key, rootNode) {
    const sourceValue = rootNode.getValueAtPath(fromPath);
    this.addDirectly(key, sourceValue);
    return this;
  }

  /**
   * @description Tests if a value matches the expected value.
   * @param {string} key - The property name.
   * @param {*} expectedValue - The expected value.
   * @returns {JsonGroup} This node.
   * @category JSON Patch
   */
  testDirectly (key, expectedValue) {
    let actualValue;
    
    if (this.shouldStoreSubnodes()) {
      const subnode = this.subnodeWithTitle(key);
      if (!subnode) {
        throw new Error(`Test failed: property '${key}' not found`);
      }
      actualValue = subnode.asJson();
    } else {
      const slot = this.getSlot(key);
      if (!slot) {
        throw new Error(`Test failed: slot '${key}' not found`);
      }
      
      const value = slot.onInstanceGetValue(this);
      if (value && value.asJson) {
        actualValue = value.asJson();
      } else {
        actualValue = value;
      }
    }
    
    if (JSON.stringify(actualValue) !== JSON.stringify(expectedValue)) {
      throw new Error(`Test failed: expected ${JSON.stringify(expectedValue)} but got ${JSON.stringify(actualValue)}`);
    }
    
    return this;
  }

  /**
   * @description Sets a value for a JSON key with proper type handling.
   * @param {string} key - The slot name.
   * @param {*} value - The value to set.
   * @returns {JsonGroup} This node.
   * @category JSON Patch
   */
  setJsonKeyValue (key, value) {
    const slot = this.getSlot(key);
    if (!slot) {
      throw new Error(`Slot '${key}' not found`);
    }
    
    if (slot.finalInitProto()) {
      const currentNode = slot.onInstanceGetValue(this);
      
      if (currentNode && currentNode.setJson) {
        currentNode.setJson(value);
      } else {
        const newNode = slot.finalInitProto().clone().setJson(value);
        slot.onInstanceSetValue(this, newNode);
      }
    } else {
      if (Type.isNull(value)) {
        if (slot.allowsNullValue()) {
          slot.onInstanceSetValue(this, value);
        } else {
          const initValue = slot.initValue();
          slot.onInstanceSetValue(this, initValue);
        }
      } else if (slot.slotType() && slot.slotType() !== Type.typeName(value)) {
        if (slot.slotType() === "Number" && value && value.asNumber) {
          slot.onInstanceSetValue(this, value.asNumber());
        } else {
          throw new Error(`Type mismatch: slot '${key}' expects ${slot.slotType()} but got ${Type.typeName(value)}`);
        }
      } else {
        slot.onInstanceSetValue(this, value);
      }
    }
    
    return this;
  }

  /**
   * @description Creates a new node for a JSON value.
   * @param {*} value - The JSON value.
   * @returns {Object} The new node.
   * @category JSON Patch
   */
  createNodeForValue (value) {
    // This will need to be implemented based on the value type
    // For now, use the existing JSON node creation logic
    if (Type.isArray(value)) {
      const arrayNode = SvJsonArrayNode.clone();
      arrayNode.setJson(value);
      return arrayNode;
    } else if (Type.isObject(value)) {
      const objectNode = JsonGroup.clone();
      objectNode.setJson(value);
      return objectNode;
    } else {
      // Primitive value - create appropriate field node
      return SvJsonNode.nodeForJson(value);
    }
  }

  /**
   * @description Gets a value at the specified path (helper for move/copy operations).
   * @param {string} path - The JSON pointer path.
   * @returns {*} The value at the path.
   * @category JSON Patch
   */
  getValueAtPath (path) {
    const pathSegments = this.parsePathSegments(path);
    
    if (pathSegments.length === 1) {
      // Direct access on this node
      const key = pathSegments[0];
      if (this.shouldStoreSubnodes()) {
        const subnode = this.subnodeWithTitle(key);
        return subnode ? subnode.asJson() : null;
      } else {
        const slot = this.getSlot(key);
        if (slot) {
          const value = slot.onInstanceGetValue(this);
          return value && value.asJson ? value.asJson() : value;
        }
        return null;
      }
    }
    
    const targetNode = this.nodeAtPath(pathSegments.slice(0, -1));
    const key = pathSegments[pathSegments.length - 1];
    
    if (targetNode.subnodes && targetNode.subnodes().at) {
      // Array node
      const index = parseInt(key);
      return targetNode.subnodes().at(index).asJson();
    } else {
      // Object node
      if (targetNode.shouldStoreSubnodes()) {
        const subnode = targetNode.subnodeWithTitle(key);
        return subnode ? subnode.asJson() : null;
      } else {
        const slot = targetNode.getSlot(key);
        if (slot) {
          const value = slot.onInstanceGetValue(targetNode);
          return value && value.asJson ? value.asJson() : value;
        }
        return null;
      }
    }
  }

  /**
   * @description Removes a value at the specified path (helper for move operations).
   * @param {string} path - The JSON pointer path.
   * @category JSON Patch
   */
  removeValueAtPath (path) {
    const pathSegments = this.parsePathSegments(path);
    const targetNode = this.nodeAtPath(pathSegments.slice(0, -1));
    const key = pathSegments[pathSegments.length - 1];
    
    targetNode.removeDirectly(key);
  }

}.initThisCategory());