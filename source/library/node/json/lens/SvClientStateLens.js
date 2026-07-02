"use strict";

/**
 * @module library.node.json.lens
 */

/**
 * @class SvClientStateLens
 * @extends ProtoClass
 * @classdesc
 * A declarative level-of-detail projection over a JSON node tree — the read
 * interface the AI uses to scope `getClientState` instead of dumping the
 * whole session. See docs/Plans "ClientState Query and Patches".
 *
 * A lens is a set of directives, each a selector at a LOD:
 *
 *   {
 *     "select": [
 *       { "nodes": ["/party", "npc-grok"], "lod": "full" },
 *       { "under": "loc-dungeon", "lod": "summary", "depth": 3 }
 *     ],
 *     "default": "handle"
 *   }
 *
 * - A node reference is a root-relative JSON-pointer path ("/campaign/locations/0")
 *   or a jsonId ("loc-7f3a2b").
 * - LODs, lowest to highest: "omit" < "handle" < "summary" < "full".
 *   Overlapping directives resolve to the MAX (directives can only raise,
 *   never lower — the MAX-LOD law).
 * - Ancestors of every selected node are auto-included as handles carrying
 *   the on-path children, so the result is always a self-locating tree.
 * - "default" applies to everything else; when omitted it falls back to
 *   "handle" (skeleton visible, nothing silently absent).
 *
 * Resolution happens once, up front (`resolve()`): selectors become
 * node-identity keyed maps the emission walk consults in O(1). The walk
 * itself lives in the SvJson*_lens categories (`serializeWithLens`).
 *
 * What each LOD emits per node:
 * - full: the node's normal serializeToJson output (whole subtree), unless
 *   depth-bounded, in which case children beyond the bound become handles.
 * - summary: the node's scalar/leaf slots + each container child as a handle.
 * - handle: { jsonId, _lod: "handle", title, subtitle?, count? } — no recursion.
 * - omit: absent from the output entirely.
 */

(class SvClientStateLens extends ProtoClass {

    static lodRank (lod) {
        const ranks = { "omit": 0, "handle": 1, "summary": 2, "full": 3 };
        const rank = ranks[lod];
        assert(rank !== undefined, "invalid lod '" + lod + "' — must be one of: omit, handle, summary, full");
        return rank;
    }

    static maxLod (a, b) {
        return this.lodRank(a) >= this.lodRank(b) ? a : b;
    }

    initPrototypeSlots () {
        {
            const slot = this.newSlot("root", null);
            slot.setSlotType("SvJsonIdNode");
        }
        {
            const slot = this.newSlot("defaultLod", "handle");
            slot.setSlotType("String");
        }
        {
            // Map<node, lod> — explicit targets (from "nodes" selectors and
            // subtree-scope roots), MAX-LOD merged on collision.
            const slot = this.newSlot("targetLodMap", null);
            slot.setSlotType("Map");
        }
        {
            // Map<node, number> — depth bound for subtree-scope roots
            // (Infinity when unbounded).
            const slot = this.newSlot("scopeDepthMap", null);
            slot.setSlotType("Map");
        }
        {
            // Set<node> — strict ancestors of every target, rendered as
            // path-carrying handles.
            const slot = this.newSlot("ancestorSet", null);
            slot.setSlotType("Set");
        }
    }

    init () {
        super.init();
        this.setTargetLodMap(new Map());
        this.setScopeDepthMap(new Map());
        this.setAncestorSet(new Set());
        return this;
    }

    /**
     * @description Builds and resolves a lens from its JSON form against a root node.
     * @param {Object} lensJson - { select: [...], default?: lod }
     * @param {SvJsonIdNode} root - the assistant's root node
     * @returns {SvClientStateLens}
     * @category Construction
     */
    static fromJson (lensJson, root) {
        assert(Type.isDictionary(lensJson), "lens must be an object like { select: [...], default: \"handle\" }");
        const lens = this.clone();
        lens.setRoot(root);
        if (lensJson.default !== undefined) {
            this.lodRank(lensJson.default); // validates
            lens.setDefaultLod(lensJson.default);
        }
        const select = lensJson.select;
        assert(Type.isArray(select) && select.length > 0, "lens.select must be a non-empty array of directives");
        select.forEach(directive => lens.resolveDirective(directive));
        return lens;
    }

    /**
     * @description Resolves one directive's selector to concrete nodes and
     * records them in the identity-keyed maps.
     * @param {Object} directive - { nodes: [ref...], lod } or { under: ref, lod, depth? }
     * @category Resolution
     */
    resolveDirective (directive) {
        const lod = directive.lod;
        this.thisClass().lodRank(lod); // validates

        if (directive.nodes !== undefined) {
            assert(Type.isArray(directive.nodes), "directive.nodes must be an array of node references");
            directive.nodes.forEach(ref => {
                const node = this.nodeForRef(ref);
                this.addTarget(node, lod);
            });
        } else if (directive.under !== undefined) {
            const node = this.nodeForRef(directive.under);
            this.addTarget(node, lod);
            const depth = (directive.depth === undefined) ? Infinity : directive.depth;
            assert(depth === Infinity || (Type.isNumber(depth) && depth >= 0), "directive.depth must be a non-negative number");
            const existing = this.scopeDepthMap().get(node);
            this.scopeDepthMap().set(node, existing === undefined ? depth : Math.max(existing, depth));
        } else {
            throw new Error("lens directive needs a 'nodes' (array of refs) or 'under' (single ref) selector; got: " + JSON.stringify(directive));
        }
    }

    /**
     * @description Resolves a node reference — a root-relative path ("/party" or "/")
     * or a jsonId — to a node. Throws with the available options on failure so the
     * AI can self-correct.
     * @param {string} ref
     * @returns {SvJsonIdNode}
     * @category Resolution
     */
    nodeForRef (ref) {
        assert(Type.isString(ref), "node reference must be a string (root-relative path or jsonId)");
        const root = this.root();
        if (ref === "/" || ref === "") {
            return root;
        }
        if (ref.startsWith("/")) {
            const segments = ref.split("/").filter(s => s.length > 0);
            // nodeAtPath (patches category) throws self-describing errors
            // listing the container's actual keys/elements.
            return root.nodeAtPath(segments, segments);
        }
        const node = root.descendantWithJsonId(ref);
        if (!node) {
            throw new Error("lens: no node with jsonId '" + ref + "' under this root. Use a jsonId from the latest getClientState result, or a root-relative path like \"/party\".");
        }
        return node;
    }

    /**
     * @description Records a target at a LOD (MAX-LOD merged) and adds its
     * strict ancestors to the ancestor set.
     * @category Resolution
     */
    addTarget (node, lod) {
        const map = this.targetLodMap();
        const existing = map.get(node);
        map.set(node, existing === undefined ? lod : this.thisClass().maxLod(existing, lod));

        let parent = node.parentNode ? node.parentNode() : null;
        const root = this.root();
        while (parent) {
            this.ancestorSet().add(parent);
            if (parent === root) {
                break;
            }
            parent = parent.parentNode ? parent.parentNode() : null;
        }
    }

    // --- emission-walk queries (O(1), consulted per node) ---

    /**
     * @description The LOD this lens assigns a node before composition with
     * the inherited LOD: an explicit target LOD, else "handle" for ancestors
     * (the path-carrier floor), else the default.
     * @category Emission
     */
    ownLodFor (node) {
        const target = this.targetLodMap().get(node);
        if (target !== undefined) {
            return target;
        }
        if (this.ancestorSet().has(node)) {
            return "handle";
        }
        return this.defaultLod();
    }

    /**
     * @description Effective LOD = MAX(own, inherited) — the MAX-LOD law.
     * @category Emission
     */
    effectiveLodFor (node, inheritedLod) {
        return this.thisClass().maxLod(this.ownLodFor(node), inheritedLod);
    }

    /** @category Emission */
    isAncestor (node) {
        return this.ancestorSet().has(node);
    }

    /** @category Emission */
    isTarget (node) {
        return this.targetLodMap().has(node);
    }

    /**
     * @description Depth bound if this node is a subtree-scope root
     * (undefined otherwise).
     * @category Emission
     */
    scopeDepthFor (node) {
        return this.scopeDepthMap().get(node);
    }

    /**
     * @description The depth budget an explicit directive grants this node,
     * or undefined if none applies. A "full" target resets the budget — its
     * fullness comes from a directive, so it is unbounded unless that
     * directive carried a depth. (Without this, a full target reached inside
     * a summary region would inherit the summary's zero budget and emit its
     * children as handles.)
     * @category Emission
     */
    depthBudgetFor (node) {
        const scopeDepth = this.scopeDepthMap().get(node);
        if (this.targetLodMap().get(node) === "full") {
            return (scopeDepth !== undefined) ? scopeDepth : Infinity;
        }
        return scopeDepth;
    }

}.initThisClass());
