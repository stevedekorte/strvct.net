"use strict";

/** * @module library.node.fields.json
 */

/**
 * @module library.node.fields.json.patches
 * @class SvJsonGroup_patches
 * @extends JsonGroup
 * @classdesc Category class that adds native JSON patch support to JsonGroup.
 */

(class SvJsonGroup_patches extends SvJsonGroup {

    // --- Native JSON Patch Support ---

    /**
     * @description Navigates the rest of a path inside a plain JSON value (a "JSON Object"
     * slot): objects by key, arrays by index. The result names the slot holding the
     * value and the segments from it to the target container, so a write can rebuild
     * the slot value along that path (see executeOperationOnObjectSlot).
     * @param {Object|Array} value - The slot's plain value.
     * @param {Array} segments - The remaining path segments.
     * @param {Array} fullPath - The original path, for error reporting.
     * @param {string} slotName - The slot holding the value.
     * @returns {Object} { node, parentNode, slotName, plainPath }
     * @category JSON Patch
     */
    plainValueAtPath (value, segments, fullPath, slotName) {
        let node = value;
        segments.forEach((segment) => {
            const next = this.plainChildForSegment(node, segment);
            if (next === undefined) {
                throw new SvJsonPatchError(`No key '${segment}' inside the plain value of '${slotName}'`, null, fullPath, segment, this);
            }
            node = next;
        });
        return { node: node, parentNode: this, slotName: slotName, plainPath: segments };
    }

    plainChildForSegment (node, segment) {
        if (Type.isArray(node)) {
            return node[parseInt(segment, 10)];
        }
        if (Type.isDictionary(node)) {
            return node[segment];
        }
        return undefined;
    }

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

        // Stage-1 preflight (Plans/Client Transactions § Sequencing, step 0):
        // refuse a batch with a definite error BEFORE applying anything —
        // nothing is applied, so nothing needs undoing.
        this.preflightJsonPatches(patches);
        const pool = SvObjectPool.poolOfObject(this);
        if (pool && SvTransactionContext.patchesUseTransactions()) {
            // Client Transactions: the batch applies whole or not at all
            return pool.transaction(() => this.applyJsonPatchesNow(patches));
        }
        return this.applyJsonPatchesNow(patches);
    }

    applyJsonPatchesNow (patches) {
        let failedIndex = 0;
        try {
            for (let i = 0; i < patches.length; i++) {
                failedIndex = i;
                this.applyPatch(patches[i], this); // Pass this as the root node
            }
            return this;
        } catch (error) {
            if (error instanceof SvJsonPatchError) {
                // Enhanced error handling for LLM consumption
                const errorDetails = error.toDetailedMessage();
                // Application is NOT atomic (no rollback) — the LLM must know
                // which ops stuck, or an RFC-minded model assuming
                // all-or-nothing re-sends the whole batch and duplicates the
                // effects of earlier add/copy ops (seen live: a failed
                // mid-batch op after an NPC-instantiating copy).
                errorDetails.failedOpIndex = failedIndex;
                errorDetails.stateNote = SvTransactionContext.current()
                    ? "ROLLED BACK: this batch applied nothing (every earlier operation was undone). Fix the failing operation and re-send the WHOLE batch."
                    : "NOT atomic: the " + failedIndex + " operation(s) BEFORE the failing one were applied and remain in effect; the failing operation and all AFTER it were NOT applied. When correcting, re-send ONLY the fixed failing operation and the ones after it — re-sending an earlier add/copy would duplicate its effect.";
                const enhancedError = new Error(`JSON Patch failed: ${JSON.stringify(errorDetails, null, 2)}`);
                enhancedError.patchError = errorDetails;
                throw enhancedError;
            }
            throw error;
        }
    }

    // --- stage-1 preflight ---------------------------------------------------
    // Walks every operation against the CURRENT tree before any is applied and
    // refuses the whole batch on a definite error: a malformed operation, an
    // unknown slot, a path through a missing or null container that no earlier
    // operation in the batch creates, a non-numeric array index, an index past
    // the end of an array no earlier operation touched, a value whose shape
    // cannot fit the slot. What depends on earlier operations (indices in an
    // array the batch already changed, targets the batch creates, values the
    // deserializer must judge) is left to apply time. A refused batch applied
    // NOTHING, and the error says so; until Client Transactions exist this is
    // the stopgap that keeps most bad batches from half-applying.

    preflightJsonPatches (patches) {
        const created = new Set();       // "/a/b" paths an earlier operation adds
        const touchedArrays = new Set(); // "/a/b" array paths an earlier operation inserted into or removed from
        for (let i = 0; i < patches.length; i++) {
            const operation = patches[i];
            const failure = this.preflightOperation(operation, created, touchedArrays);
            if (failure) {
                throw this.newPreflightError(i, operation, failure);
            }
            this.notePreflightEffects(operation, created, touchedArrays);
        }
        return this;
    }

    preflightOperation (operation, created, touchedArrays) {
        const shape = this.preflightShape(operation);
        if (shape) {
            return shape;
        }
        const segments = this.parsePathSegments(operation.path);
        if (segments.length === 0) {
            return "the path must name a slot or element, not the root";
        }
        if (operation.op === "move" || operation.op === "copy") {
            const fromSegments = this.parsePathSegments(operation.from);
            const from = this.preflightNavigate(fromSegments, created, touchedArrays);
            if (from.failure) {
                return "'from' " + from.failure;
            }
        }
        const container = this.preflightNavigate(segments.slice(0, -1), created, touchedArrays);
        if (container.failure) {
            return container.failure;
        }
        return this.preflightKey(operation, container, segments[segments.length - 1]);
    }

    preflightShape (operation) {
        const ops = ["add", "replace", "remove", "move", "copy"];
        if (!Type.isDictionary(operation)) {
            return "operation must be an object like { op, path, value }";
        }
        if (!ops.includes(operation.op)) {
            return "unsupported op '" + operation.op + "' (use add, replace, remove, move or copy)";
        }
        if (!Type.isString(operation.path) || !operation.path.startsWith("/")) {
            return "path must be a JSON pointer string starting with '/'";
        }
        if ((operation.op === "add" || operation.op === "replace") && operation.value === undefined) {
            return operation.op + " requires a value";
        }
        if ((operation.op === "move" || operation.op === "copy") && (!Type.isString(operation.from) || !operation.from.startsWith("/"))) {
            return operation.op + " requires a 'from' JSON pointer";
        }
        if (operation.op === "move") {
            try {
                SvJsonPatchError.assertMoveNotIntoOwnSubtree(operation);
            } catch (e) {
                return e.message; // "Illegal move … (RFC 6902 …)"
            }
        }
        return null;
    }

    /**
     * @description Non-throwing navigation for the preflight. Returns
     * { kind: "group" | "subnodes" | "array" | "object" | "created" | "unknown", node }
     * or { failure } when the path definitely cannot resolve.
     */
    preflightNavigate (segments, created, touchedArrays) {
        let current = this;
        let joined = "";
        for (let i = 0; i < segments.length; i++) {
            const segment = segments[i];
            joined += "/" + segment;
            if (created.has(joined)) {
                return { kind: "created", node: null };
            }
            if (current === null || current === undefined) {
                return { failure: "path passes through '" + joined + "' which has no value" };
            }
            if (this.preflightIsArray(current)) {
                if (current.subnodesArePools && current.subnodesArePools()) {
                    return { failure: "JSON patch paths do not cross pool boundaries: '" + joined + "' enters a document that is its own pool (Record Store §6) — address it through its own assistant or tool" };
                }
                const index = parseInt(segment, 10);
                if (segment === "-" || !Number.isInteger(index) || String(index) !== segment || index < 0) {
                    return { failure: "'" + segment + "' is not a valid array index at '" + joined + "' (arrays need 0, 1, 2 …; '-' only as the last segment of an add)" };
                }
                const parentPath = joined.slice(0, joined.length - segment.length - 1);
                if (touchedArrays.has(parentPath)) {
                    return { kind: "unknown", node: null }; // an earlier operation changed this array; ranges are checked at apply time
                }
                if (index >= current.subnodes().length) {
                    return { failure: "index " + index + " is out of bounds at '" + joined + "' (" + current.elementsSummaryString() + ")" };
                }
                current = current.subnodes().at(index);
            } else if (this.preflightIsSubnodeGroup(current)) {
                const child = current.firstSubnodeWithTitle(segment);
                if (!child) {
                    return { failure: "no subnode '" + segment + "' at '" + joined + "' (available: [" + current.subnodes().map(sn => sn.title()).join(", ") + "])" };
                }
                current = child;
            } else if (this.preflightIsSlotGroup(current)) {
                const slot = current.getSlot(segment);
                if (!slot) {
                    return { failure: "unknown slot '" + segment + "' on " + current.svType() + " at '" + joined + "' (available: [" + current.thisClass().jsonSchemaSlots().map(sl => sl.name()).join(", ") + "])" };
                }
                current = slot.onInstanceGetValue(current);
                if (current === null || current === undefined) {
                    return { failure: "slot '" + segment + "' at '" + joined + "' has no value; add it first (in an earlier operation of this batch) before writing inside it" };
                }
            } else if (Type.isDictionary(current)) {
                return { kind: "object", node: current }; // a plain JSON object slot: navigable, not validated deeper
            } else {
                return { failure: "cannot navigate into '" + joined + "' (a " + (typeof current) + " value)" };
            }
        }
        if (this.preflightIsArray(current)) { return { kind: "array", node: current }; }
        if (this.preflightIsSubnodeGroup(current)) { return { kind: "subnodes", node: current }; }
        if (this.preflightIsSlotGroup(current)) { return { kind: "group", node: current }; }
        if (Type.isDictionary(current)) { return { kind: "object", node: current }; }
        return { failure: "target is a " + (typeof current) + " value, not a container" };
    }

    preflightIsArray (node) {
        return !!(node && node.validateArrayIndex && node.subnodes);
    }

    preflightIsSubnodeGroup (node) {
        return !!(node && node.firstSubnodeWithTitle && node.shouldStoreSubnodes && node.shouldStoreSubnodes() && !node.validateArrayIndex);
    }

    preflightIsSlotGroup (node) {
        return !!(node && node.getSlot && node.thisClass && node.thisClass().jsonSchemaSlots);
    }

    preflightKey (operation, container, key) {
        const op = operation.op;
        if (container.kind === "created" || container.kind === "unknown" || container.kind === "object" || container.kind === "subnodes") {
            return null;
        }
        if (container.kind === "array") {
            const inserts = op === "add" || op === "move" || op === "copy"; // the destination of a move/copy is an add (RFC 6902)
            if (key === "-") {
                return inserts ? null : "'/-' can only be used with add, move or copy (use a numeric index for " + op + ")";
            }
            const index = parseInt(key, 10);
            if (!Number.isInteger(index) || String(index) !== key || index < 0) {
                return "'" + key + "' is not a valid array index (arrays need 0, 1, 2 …, or '-' to append with add)";
            }
            const length = container.node.subnodes().length;
            if (inserts && index > length) {
                return op + " index " + index + " is beyond the end of the array (length " + length + "; use " + length + " or '-' to append)";
            }
            if (!inserts && index >= length) {
                return op + " index " + index + " is out of bounds (" + container.node.elementsSummaryString() + ")";
            }
            return null;
        }
        // slot-backed group
        const slot = container.node.getSlot(key);
        if (!slot) {
            return "unknown slot '" + key + "' on " + container.node.svType() + " (available: [" + container.node.thisClass().jsonSchemaSlots().map(sl => sl.name()).join(", ") + "]) — never invent field names";
        }
        if (op === "add" || op === "replace") {
            return this.preflightValueFitsSlot(operation.value, slot);
        }
        return null;
    }

    preflightValueFitsSlot (value, slot) {
        const type = slot.slotType();
        const isContainer = Type.isDictionary(value) || Type.isArray(value);
        if (["String", "Number", "Boolean"].includes(type) && isContainer) {
            return "slot '" + slot.name() + "' holds a " + type + "; an object or array value cannot go there";
        }
        if (slot.finalInitProtoClass && slot.finalInitProtoClass() && value !== null && !isContainer) {
            return "slot '" + slot.name() + "' holds a " + type + " object; a bare " + (typeof value) + " cannot go there";
        }
        return null;
    }

    notePreflightEffects (operation, created, touchedArrays) {
        const path = "/" + this.parsePathSegments(operation.path).join("/");
        const parentPath = path.slice(0, path.lastIndexOf("/")) || "/";
        if (operation.op === "add" || operation.op === "copy" || operation.op === "move") {
            created.add(path);
            touchedArrays.add(parentPath);
        }
        if (operation.op === "remove" || operation.op === "move") {
            const removed = operation.op === "move" ? "/" + this.parsePathSegments(operation.from).join("/") : path;
            touchedArrays.add(removed.slice(0, removed.lastIndexOf("/")) || "/");
        }
    }

    newPreflightError (index, operation, failure) {
        const details = {
            error: "operation " + index + ": " + failure,
            failedOpIndex: index,
            operation: operation,
            refusedBeforeApply: true,
            stateNote: "REFUSED before applying anything: NO operation in this batch was applied. Fix the failing operation and re-send the WHOLE batch."
        };
        const error = new Error("JSON Patch refused: " + JSON.stringify(details, null, 2));
        error.patchError = details;
        return error;
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
            SvJsonPatchError.assertMoveNotIntoOwnSubtree(operation);
            const pathSegments = this.parsePathSegments(operation.path);
            const targetInfo = this.findTargetForPath(pathSegments);

            // Check if the target node supports JSON patch operations
            if (!targetInfo.node.executeDirectOperation) {
                // Special handling for plain Object slots
                if (targetInfo.parentNode && targetInfo.slotName && (Type.isDictionary(targetInfo.node) || Type.isArray(targetInfo.node))) {
                    return this.executeOperationOnObjectSlot(operation, targetInfo);
                }

                const nodeType = targetInfo.node.svType ? targetInfo.node.svType() : typeof targetInfo.node;
                throw new SvJsonPatchError(
                    `Target node type '${nodeType}' does not support JSON patch operations. Only JSON collection nodes (JsonGroup, SvJsonArrayNode) with patch categories or plain Object slots support direct operations.`,
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
            return { node: this, key: pathSegments[0], parentNode: null, slotName: null };
        }

        const navigationSegments = pathSegments.slice(0, -1);
        const targetKey = pathSegments[pathSegments.length - 1];
        const result = this.nodeAtPathWithParent(navigationSegments);

        return {
            node: result.node,
            key: targetKey,
            parentNode: result.parentNode,
            slotName: result.slotName,
            plainPath: result.plainPath
        };
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
                    `No child found for segment '${nextSegment}'`,
                    null,
                    fullPath,
                    nextSegment,
                    this
                );
            }

            // Check if the child node supports nodeAtPathWithParent (i.e., is a JSON collection type)
            if (childNode.nodeAtPathWithParent) {
                return childNode.nodeAtPathWithParent(remainingPath, fullPath, this, nextSegment);
            } else {
                // Child node is likely a primitive field or other non-collection type
                // If there's still path remaining, this is an error for non-object types
                if (remainingPath.length > 0) {
                    // Special case for plain objects - we can navigate into them
                    if (Type.isDictionary(childNode) || Type.isArray(childNode)) {
                        return this.plainValueAtPath(childNode, remainingPath, fullPath, nextSegment);
                    }

                    const nodeType = childNode.svType ? childNode.svType() : typeof childNode;
                    throw new SvJsonPatchError(
                        `Cannot navigate further from '${nextSegment}' - node type '${nodeType}' does not support path navigation`,
                        null,
                        fullPath,
                        nextSegment,
                        this
                    );
                }

                // No more path segments, return the child
                return { node: childNode, parentNode: this, slotName: nextSegment };
            }
        } catch (error) {
            if (error instanceof SvJsonPatchError) {
                throw error;
            }

            throw new SvJsonPatchError(
                `Failed to navigate to '${nextSegment}': ${error.message}`,
                null,
                fullPath,
                nextSegment,
                this
            );
        }
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
   * @description Gets the child node for a specific path segment (object key).
   * @param {string} segment - The path segment (object property name).
   * @returns {Object} The child node.
   * @category JSON Patch
   */
    childNodeForSegment (segment) {
        if (this.shouldStoreSubnodes()) {
            const subnode = this.firstSubnodeWithTitle(segment);
            if (!subnode) {
                const pathString = this.nodePathString() + "/" + segment;
                const availableKeys = this.subnodes().map(sn => sn.title()).join(", ");
                const errorMessage = "JSON Patch Error: invalid path: " + pathString + " - missing subnode. Available keys: [" + availableKeys + "]";
                console.error(errorMessage);
                throw new Error(errorMessage);
            }
            return subnode;
        } else {
            const slot = this.getSlot(segment);
            if (!slot) {
                const pathString = this.nodePathString() + "/" + segment;
                const availableSlots = this.thisClass().jsonSchemaSlots().map(slot => slot.name()).join(", ");
                const errorMessage = "JSON Patch Error: invalid path: " + pathString + " - missing slot. Available keys: [" + availableSlots + "]";
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
   * @description Executes a JSON patch operation inside a plain "JSON Object" slot. The
   * slot value is never mutated in place: it is copied along the path to the target
   * container, the operation is applied to the copy, and the slot is set to the new
   * value so the change is observed like any other slot write.
   * @param {Object} operation - The patch operation.
   * @param {Object} targetInfo - { node, parentNode, slotName, plainPath, key }.
   * @returns {JsonGroup} The parent node.
   * @category JSON Patch
   */
    executeOperationOnObjectSlot (operation, targetInfo) {
        const { parentNode, slotName, key } = targetInfo;
        const slot = parentNode.getSlot(slotName);
        if (!slot) {
            throw new SvJsonPatchError(`Cannot find slot '${slotName}' to update`, operation, null, slotName, parentNode);
        }
        const { root, target } = this.copyPlainValueAlongPath(slot.onInstanceGetValue(parentNode), targetInfo.plainPath || []);
        if (operation.op === "test") {
            this.testPlainValue(operation, target, key);
            return parentNode;
        }
        this.mutatePlainValue(operation, target, key);
        slot.onInstanceSetValue(parentNode, root);
        return parentNode;
    }

    copyPlainValueAlongPath (root, segments) {
        const copy = (v) => (Type.isArray(v) ? v.slice() : Object.assign({}, v));
        const newRoot = copy(root);
        let target = newRoot;
        segments.forEach((segment) => {
            const k = Type.isArray(target) ? parseInt(segment, 10) : segment;
            target[k] = copy(target[k]);
            target = target[k];
        });
        return { root: newRoot, target: target };
    }

    mutatePlainValue (operation, target, key) {
        if (Type.isArray(target)) {
            return this.mutatePlainArray(operation, target, key);
        }
        switch (operation.op) {
            case "add":
            case "replace":
                target[key] = operation.value;
                return;
            case "remove":
                delete target[key];
                return;
            default:
                throw new SvJsonPatchError(`Unsupported operation '${operation.op}' inside a plain Object slot`, operation, null, key, target);
        }
    }

    mutatePlainArray (operation, target, key) {
        const index = key === "-" ? target.length : parseInt(key, 10);
        const limit = operation.op === "add" ? target.length : target.length - 1;
        if (!Number.isInteger(index) || index < 0 || index > limit) {
            throw new SvJsonPatchError(`Index '${key}' is out of bounds for a plain array of length ${target.length}`, operation, null, key, target);
        }
        switch (operation.op) {
            case "add":
                target.splice(index, 0, operation.value);
                return;
            case "replace":
                target[index] = operation.value;
                return;
            case "remove":
                target.splice(index, 1);
                return;
            default:
                throw new SvJsonPatchError(`Unsupported operation '${operation.op}' inside a plain array`, operation, null, key, target);
        }
    }

    testPlainValue (operation, target, key) {
        const actual = Type.isArray(target) ? target[parseInt(key, 10)] : target[key];
        if (JSON.stringify(actual) !== JSON.stringify(operation.value)) {
            throw new SvJsonPatchError(`Test operation failed: expected ${JSON.stringify(operation.value)}, got ${JSON.stringify(actual)}`, operation, null, key, target);
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
            case "add": return this.addDirectly(key, value);
            case "remove": return this.removeDirectly(key);
            case "replace": return this.replaceDirectly(key, value);
            case "move": return this.moveDirectly(operation.from, key, rootNode);
            case "copy": return this.copyDirectly(operation.from, key, rootNode);
            case "test": return this.testDirectly(key, value);
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
            const subnode = this.firstSubnodeWithTitle(key);
            if (!subnode) {
                const availableKeys = this.subnodes().map(sn => sn.title()).join(", ");
                throw new Error(`Cannot remove property '${key}': not found. Available properties: [${availableKeys}]`);
            }
            this.removeSubnode(subnode);
            return this;
        } else {
            const slot = this.getSlot(key);
            if (!slot) {
                const availableSlots = Array.from(this.thisPrototype().allSlotsNamesSet()).join(", ");
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
            const existingSubnode = this.firstSubnodeWithTitle(key);
            if (!existingSubnode) {
                const availableKeys = this.subnodes().map(sn => sn.title()).join(", ");
                throw new Error(`Cannot replace property '${key}': not found. Available properties: [${availableKeys}]`);
            }

            // Prefer an IN-PLACE update when the class is unchanged: deserialize
            // the new value INTO the existing subnode instead of swapping a fresh
            // one in. Preserves object identity (bound views / SvModelReferences
            // stay valid), merges nested subnodes by jsonId, and doesn't orphan
            // the old node — mirrors SvJsonArrayNode_patches.replaceDirectly.
            // (createNodeForValue determines the class for an untyped value, so we
            // build it to compare, then reuse it only on a real class change.)
            const newNode = this.createNodeForValue(value);
            if (existingSubnode.thisClass && newNode.thisClass
                && existingSubnode.thisClass() === newNode.thisClass()
                && typeof existingSubnode.deserializeFromJson === "function") {
                existingSubnode.deserializeFromJson(value, undefined, []);
                existingSubnode.setTitle(key); // title is the key, not part of the value — re-assert it
                return this;
            }

            // Class actually changed — swap.
            newNode.setTitle(key);
            this.replaceSubnodeWith(existingSubnode, newNode);
            return this;
        } else {
            const slot = this.getSlot(key);
            if (!slot) {
                const availableSlots = Array.from(this.thisPrototype().allSlotsNamesSet()).join(", ");
                throw new Error(`Cannot replace slot '${key}': not found. Available slots: [${availableSlots}]`);
            }

            // Note: We don't check if current value is null/undefined.
            // A slot can exist with a null value, and replacing it is valid.
            // The slot existing (checked above) is sufficient for a "replace" operation.

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
        // A move MOVES the live node when the source is a container element
        // (an array item or a titled subnode): same object, same puuid, every
        // stored slot — schema-visible or not — and every live reference kept.
        // The old serialize-clone-remove implementation silently dropped every
        // stored-but-not-in-schema slot (a character's pinned map cell, its
        // portrait, its arrival direction) and gave holders of the object a
        // dead reference. Slot-valued sources keep the JSON path.
        const live = rootNode.detachNodeAtPath ? rootNode.detachNodeAtPath(fromPath) : null;
        if (live) {
            this.addNodeDirectly(key, live);
            return this;
        }
        const sourceValue = rootNode.getValueAtPath(fromPath);
        const clonedValue = JSON.parse(JSON.stringify(sourceValue)); // deep clone: no reference sharing
        this.addDirectly(key, clonedValue);
        rootNode.removeValueAtPath(fromPath);
        return this;
    }

    /**
   * @description Attaches an already-live node under this object (the move
   * target half of moveDirectly): as a titled subnode, or as the value of the
   * named slot.
   * @param {string} key - The property name.
   * @param {Object} node - The live node.
   * @returns {JsonGroup} This node.
   * @category JSON Patch
   */
    addNodeDirectly (key, node) {
        if (this.shouldStoreSubnodes()) {
            node.setTitle(key);
            this.addSubnode(node);
            return this;
        }
        const slot = this.getSlot(key);
        if (!slot) {
            throw new Error(`Cannot move into slot '${key}': not found on ${this.svType()}`);
        }
        slot.onInstanceSetValue(this, node);
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
        // Deep clone the value to avoid reference sharing
        const clonedValue = JSON.parse(JSON.stringify(sourceValue));
        this.addDirectly(key, clonedValue);
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
            const subnode = this.firstSubnodeWithTitle(key);
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
        // `_type` is JSON METADATA, not a slot. asJson() writes it from
        // thisClass().svType() so a mixed-type array can rebuild its elements as the
        // right classes; nothing stores it, so getSlot("_type") is always empty and a
        // patch touching it could only ever throw "Slot '_type' not found".
        //
        // A host legitimately emits `add /.../_type` whenever its serialization
        // includes the discriminator and the client's copy does not, which is a
        // difference in what was written, not in what the object IS. When the value
        // agrees with this node's class the operation is a no-op, and failing it
        // aborts the whole patch — every operation after it is dropped, so one
        // cosmetic disagreement desynchronises the client's entire state.
        if (key === "_type") {
            const declared = SvJsonIdNode.classForJsonType(value); // follows ClassRenames
            if (!declared || declared === this.thisClass()) {
                return this; // agrees (or names a class we cannot resolve) — nothing to do
            }
            throw new Error(`Cannot change _type from '${this.thisClass().svType()}' to '${value}'`
                + " by patching a property: an element's class is chosen when it is created,"
                + " so this needs a replace of the element itself, not of its _type");
        }

        const slot = this.getSlot(key);
        if (!slot) {
            throw new Error(`Slot '${key}' not found`);
        }

        const nodeClass = this.jsonNodeClassForSlot(slot, value);
        if (nodeClass) {
            this.setJsonNodeSlotValue(slot, nodeClass, value);
        } else {
            if (Type.isNull(value)) {
                if (slot.allowsNullValue()) {
                    slot.onInstanceSetValue(this, value);
                } else {
                    const initValue = slot.initValue();
                    slot.onInstanceSetValue(this, initValue);
                }
            } else if (slot.slotType() && !slot.validateValueTypeOnly(value)) {
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
     * @description The node class a JSON value for this slot is materialized as: the
     * slot's finalInitProto when it has one; otherwise, for an object or array value,
     * the slot's declared type when that is a JSON node class (a nullable typed slot
     * that starts empty and is created by an add); otherwise null — a primitive or
     * plain "JSON Object" slot, which takes the value as is.
     * @param {Slot} slot
     * @param {*} value - The JSON value being written.
     * @returns {Function|null}
     * @category JSON Patch
     */
    jsonNodeClassForSlot (slot, value) {
        if (slot.finalInitProto()) {
            return slot.finalInitProto();
        }
        if (!Type.isDictionary(value) && !Type.isArray(value)) {
            return null;
        }
        const typeClass = slot.slotTypeClass();
        return (typeClass && typeClass.prototype && typeClass.prototype.setJson) ? typeClass : null;
    }

    /**
     * @description Writes a JSON value into a node-valued slot: into the existing node
     * when there is one, otherwise into a new instance of nodeClass.
     * @param {Slot} slot
     * @param {Function} nodeClass
     * @param {*} value
     * @category JSON Patch
     */
    setJsonNodeSlotValue (slot, nodeClass, value) {
        const currentNode = slot.onInstanceGetValue(this);
        if (currentNode && currentNode.setJson) {
            currentNode.setJson(value);
        } else {
            slot.onInstanceSetValue(this, nodeClass.clone().setJson(value));
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
        if (Type.isArray(value)) {
            const arrayNode = SvJsonArrayNode.clone();
            arrayNode.setJson(value);
            return arrayNode;
        } else if (Type.isObject(value)) {
            // Honor the value's declared _type so a typed object keeps its concrete
            // class (needed for the same-class in-place check in replaceDirectly and
            // so an added object isn't silently downgraded to a generic group).
            const typeClass = (value && value._type) ? SvJsonIdNode.classForJsonType(value._type) : null; // follows ClassRenames
            const objectNode = (typeClass || SvJsonGroup).clone();
            if (typeof objectNode.deserializeFromJson === "function") {
                objectNode.deserializeFromJson(value, undefined, []);
            } else {
                objectNode.setJson(value);
            }
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
                const subnode = this.firstSubnodeWithTitle(key);
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
                const subnode = targetNode.firstSubnodeWithTitle(key);
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

    /**
   * @description The move-source half of moveDirectly: when the value at the
   * path is a container element — an array item, or a titled subnode of a
   * shouldStoreSubnodes group — removes it from its container and returns the
   * LIVE node, untouched, for re-attachment elsewhere. Returns null when the
   * path names a slot value (or nothing), in which case the caller falls back
   * to the JSON clone-and-remove path.
   * @param {string} path - The JSON pointer path.
   * @returns {Object|null}
   * @category JSON Patch
   */
    detachNodeAtPath (path) {
        const pathSegments = this.parsePathSegments(path);
        if (pathSegments.length === 0) {
            return null;
        }
        const container = this.nodeAtPath(pathSegments.slice(0, -1));
        const key = pathSegments[pathSegments.length - 1];
        if (!container) {
            return null;
        }
        if (container.subnodes && container.subnodes().at && !(container.shouldStoreSubnodes && container.getSlot && container.getSlot(key))) {
            const index = parseInt(key, 10);
            const node = Number.isInteger(index) ? container.subnodes().at(index) : null;
            if (!node || !node.asJson) {
                return null;
            }
            if (container.shouldStoreSubnodes && container.shouldStoreSubnodes() && !container.validateArrayIndex) {
                // a titled-subnodes group addressed by index — not a supported source
                return null;
            }
            container.removeSubnode(node);
            return node;
        }
        if (container.shouldStoreSubnodes && container.shouldStoreSubnodes() && container.firstSubnodeWithTitle) {
            const node = container.firstSubnodeWithTitle(key);
            if (!node) {
                return null;
            }
            container.removeSubnode(node);
            return node;
        }
        return null;
    }

}.initThisCategory());
