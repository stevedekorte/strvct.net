"use strict";

/**
 * @module library.node.json.lens
 *
 * Lens emission walk — `serializeWithLens` — for the JSON node classes.
 * This is a SEPARATE walk from `serializeToJson`: plain (no-lens) dumps go
 * through the untouched serializeToJson path and stay byte-identical; the
 * lens walk delegates to serializeToJson for unbounded `full` subtrees, so
 * custom per-class serializers (UoLocation, UoImageMessage, ...) are honored
 * at full detail. At `summary`/`handle` the walk projects from the JSON
 * schema slots directly, bypassing custom serializers — a summary is a
 * projection, not the class's authored full form.
 *
 * LOD semantics (see SvClientStateLens):
 * - full:    normal serializeToJson output; if depth-bounded, containers
 *            beyond the bound emit as handles.
 * - summary: own scalar/leaf slots (+ _type/_lod markers), container
 *            children as handles.
 * - handle:  { jsonId, _lod: "handle", title, subtitle?, count? }.
 * - omit:    undefined (absent) — unless the node is an ancestor of a
 *            selected target, in which case it emits as a path-carrier:
 *            its handle fields plus only the on-path children.
 */

/**
 * @class SvJsonIdNode_lens
 * @extends SvJsonIdNode
 * @classdesc Base lens behavior: leaves ignore summary/handle granularity —
 * they're cheap — and emit their normal serialization unless omitted.
 */
(class SvJsonIdNode_lens extends SvJsonIdNode {

    /**
     * @description The abridged single-dict form of this node: enough for the
     * AI to recognize it and expand it by id. The `_lod` marker is the
     * "this is abridged, you can expand it" affordance.
     * @returns {Object}
     * @category Lens
     */
    lensHandleJson () {
        const dict = {
            "jsonId": this.jsonId(),
            "_lod": "handle",
            "_type": this.thisClass().svType()
        };
        const title = this.title ? this.title() : null;
        if (title !== null && title !== undefined && title !== "") {
            dict.title = String(title);
        }
        return dict;
    }

    /**
     * @description Serializes this node under a lens. Base implementation for
     * leaf-ish nodes (fields, dictionaries, custom-serializer classes reached
     * directly): omit → absent; handle → handle dict; summary/full → normal
     * serialization.
     * @param {SvClientStateLens} lens
     * @param {string} inheritedLod - LOD imposed by the enclosing context.
     * @param {number} depthRemaining - container levels left before handles.
     * @param {Array} pathComponents
     * @param {WeakSet} visitedSet
     * @returns {*} JSON value or undefined (omitted)
     * @category Lens
     */
    serializeWithLens (lens, inheritedLod, depthRemaining, pathComponents = [], visitedSet = null) {
        if (visitedSet === null) {
            visitedSet = new WeakSet();
        }
        const lod = lens.effectiveLodFor(this, inheritedLod);
        if (lod === "omit") {
            return undefined;
        }
        if (lod === "handle") {
            return this.lensHandleJson();
        }
        return this.serializeToJson(null, pathComponents, visitedSet);
    }

}.initThisCategory());

/**
 * @class SvJsonGroup_lens
 * @extends SvJsonGroup
 * @classdesc Group (dict-shaped) lens emission: slot-walks the JSON schema
 * slots, projecting containers per LOD.
 */
(class SvJsonGroup_lens extends SvJsonGroup {

    serializeWithLens (lens, inheritedLod, depthRemaining, pathComponents = [], visitedSet = null) {
        if (visitedSet === null) {
            visitedSet = new WeakSet();
        }
        if (visitedSet.has(this)) {
            throw new Error("serializeWithLens: circular reference at " + pathComponents.join("/"));
        }

        // Fields are leaves regardless of LOD — they ARE the scalars a
        // summary is made of.
        if (this.isKindOf(SvField)) {
            const lod = lens.effectiveLodFor(this, inheritedLod);
            return (lod === "omit") ? undefined : this.serializeToJson(null, pathComponents, visitedSet);
        }

        // Explicit directives (targets / expand-by-id scopes) reset the depth budget.
        const depthBudget = lens.depthBudgetFor(this);
        if (depthBudget !== undefined) {
            depthRemaining = Math.max(depthRemaining, depthBudget);
        }

        const lod = lens.effectiveLodFor(this, inheritedLod);

        if (lod === "omit") {
            return lens.isAncestor(this) ? this.lensCarrierJson(lens, depthRemaining, pathComponents, visitedSet) : undefined;
        }
        if (lod === "handle") {
            return lens.isAncestor(this) ? this.lensCarrierJson(lens, depthRemaining, pathComponents, visitedSet) : this.lensHandleJson();
        }
        if (lod === "full" && depthRemaining === Infinity) {
            // Unbounded full subtree — delegate to the normal serializer so
            // custom per-class serializeToJson overrides are honored.
            return this.serializeToJson(null, pathComponents, visitedSet);
        }

        // summary, or depth-bounded full: project from the schema slots.
        visitedSet.add(this);
        const childLod = (lod === "full" && depthRemaining > 0) ? "full" : "handle";
        const childDepth = (lod === "full") ? depthRemaining - 1 : 0;

        const dict = {};
        this.lensChildEntries().forEach(([key, value]) => {
            const result = this.lensSerializeChild(value, lens, childLod, childDepth, pathComponents.concat(key), visitedSet);
            if (result !== undefined) {
                dict[key] = result;
            }
        });
        dict._type = this.thisClass().svType();
        if (lod === "summary") {
            dict._lod = "summary";
            if (this.jsonId && dict.jsonId === undefined) {
                dict.jsonId = this.jsonId();
            }
        }
        return dict;
    }

    /**
     * @description [key, value] pairs of this group's JSON-visible children —
     * schema slots, or titled subnodes for shouldStoreSubnodes groups
     * (mirrors serializeToJson's two modes).
     * @category Lens
     */
    lensChildEntries () {
        if (this.shouldStoreSubnodes()) {
            return this.subnodes()
                .filter(sn => sn.title() !== "jsonString")
                .map(sn => [sn.title(), sn]);
        }
        return this.thisClass().jsonSchemaSlots().map(slot => [slot.name(), slot.onInstanceGetValue(this)]);
    }

    /**
     * @description Serializes one child value: containers go through the lens
     * walk (so targets inside can still raise via MAX-LOD); leaves serialize
     * normally.
     * @category Lens
     */
    lensSerializeChild (value, lens, childLod, childDepth, childPath, visitedSet) {
        if (value === undefined) {
            return undefined;
        }
        if (value === null || typeof value !== "object") {
            return value;
        }
        if (value.serializeWithLens && value.isKindOf && (value.isKindOf(SvJsonGroup) || value.isKindOf(SvJsonArrayNode) || value.isKindOf(SvJsonDictionaryNode))) {
            return value.serializeWithLens(lens, childLod, childDepth, childPath, visitedSet);
        }
        if (value.serializeToJson) {
            return value.serializeToJson(null, childPath, visitedSet);
        }
        if (Array.isArray(value)) {
            return value.map(item => (item && item.serializeToJson) ? item.serializeToJson(null, childPath, visitedSet) : item)
                .filter(item => item !== undefined);
        }
        if (Type.isDeepJsonType(value)) {
            return JSON.parse(JSON.stringify(value));
        }
        return undefined;
    }

    /**
     * @description Path-carrier emission for ancestors of selected targets:
     * the handle fields plus ONLY the children that lead to (or are) targets.
     * Keeps the result self-locating without expanding unrelated siblings.
     * @category Lens
     */
    lensCarrierJson (lens, depthRemaining, pathComponents, visitedSet) {
        visitedSet.add(this);
        const dict = this.lensHandleJson();
        this.lensChildEntries().forEach(([key, value]) => {
            if (value && typeof value === "object" && value.isKindOf &&
                (lens.isAncestor(value) || lens.isTarget(value))) {
                const result = value.serializeWithLens
                    ? value.serializeWithLens(lens, "omit", depthRemaining, pathComponents.concat(key), visitedSet)
                    : undefined;
                if (result !== undefined) {
                    dict[key] = result;
                }
            }
        });
        return dict;
    }

}.initThisCategory());

/**
 * @class SvJsonArrayNode_lens
 * @extends SvJsonArrayNode
 * @classdesc Array lens emission. Handles carry a count; summaries list child
 * handles; carriers emit only on-path children plus a "+N more" marker so
 * pruned siblings are counted, never silent.
 */
(class SvJsonArrayNode_lens extends SvJsonArrayNode {

    lensHandleJson () {
        const dict = {
            "jsonId": this.jsonId(),
            "_lod": "handle",
            "_type": this.thisClass().svType(),
            "count": this.subnodes().length
        };
        const title = this.title ? this.title() : null;
        if (title !== null && title !== undefined && title !== "") {
            dict.title = String(title);
        }
        return dict;
    }

    serializeWithLens (lens, inheritedLod, depthRemaining, pathComponents = [], visitedSet = null) {
        if (visitedSet === null) {
            visitedSet = new WeakSet();
        }
        if (visitedSet.has(this)) {
            throw new Error("serializeWithLens: circular reference at " + pathComponents.join("/"));
        }

        const depthBudget = lens.depthBudgetFor(this);
        if (depthBudget !== undefined) {
            depthRemaining = Math.max(depthRemaining, depthBudget);
        }

        const lod = lens.effectiveLodFor(this, inheritedLod);

        if (lod === "omit" || lod === "handle") {
            if (lens.isAncestor(this)) {
                return this.lensCarrierJson(lens, depthRemaining, pathComponents, visitedSet);
            }
            return (lod === "omit") ? undefined : this.lensHandleJson();
        }
        if (lod === "full" && depthRemaining === Infinity) {
            return this.serializeToJson(null, pathComponents, visitedSet);
        }

        visitedSet.add(this);
        const childLod = (lod === "full" && depthRemaining > 0) ? "full" : "handle";
        const childDepth = (lod === "full") ? depthRemaining - 1 : 0;

        const results = [];
        this.subnodes().forEach((sn, index) => {
            const result = sn.serializeWithLens
                ? sn.serializeWithLens(lens, childLod, childDepth, pathComponents.concat(index), visitedSet)
                : sn.serializeToJson(null, pathComponents.concat(index), visitedSet);
            if (result !== undefined) {
                results.push(result);
            }
        });
        return results;
    }

    lensCarrierJson (lens, depthRemaining, pathComponents, visitedSet) {
        visitedSet.add(this);
        const results = [];
        let prunedCount = 0;
        this.subnodes().forEach((sn, index) => {
            if (lens.isAncestor(sn) || lens.isTarget(sn)) {
                const result = sn.serializeWithLens
                    ? sn.serializeWithLens(lens, "omit", depthRemaining, pathComponents.concat(index), visitedSet)
                    : undefined;
                if (result !== undefined) {
                    results.push(result);
                    return;
                }
            }
            prunedCount++;
        });
        if (prunedCount > 0) {
            results.push("+" + prunedCount + " more (expand " + this.jsonId() + " to see all)");
        }
        return results;
    }

}.initThisCategory());
