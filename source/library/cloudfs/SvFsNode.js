"use strict";

/**
 * @module library.cloudfs
 */

/**
 * @class SvFsNode
 * @extends ProtoClass
 * @classdesc
 * Client-side representation of one node in the cloud-filesystem.
 *
 * Carries the common-fields schema documented in the Cloud Nodes
 * plan — id, parentId, sortKey, scopeRootId, title, lastModified, plus
 * a `subtype` envelope. Concrete shapes (folder, document, blob) are
 * subclasses that add fields and behavior to this base.
 *
 * Listener wiring is delegated to the parent `SvFsClient` (which holds
 * the backend + listener pool). An `SvFsNode` is a thin data carrier;
 * it does not own a listener until a subclass attaches one.
 */

(class SvFsNode extends ProtoClass {

    static initClass () {
        this.setIsSingleton(false);
    }

    initPrototypeSlots () {
        {
            const slot = this.newSlot("client", null);
            slot.setSlotType("SvFsClient");
            slot.setComment("the parent SvFsClient (backend + listener pool)");
        }
        {
            const slot = this.newSlot("id", null);
            slot.setSlotType("String");
        }
        {
            const slot = this.newSlot("parentId", null);
            slot.setSlotType("String");
        }
        {
            const slot = this.newSlot("sortKey", null);
            slot.setSlotType("String");
        }
        {
            const slot = this.newSlot("scopeRootId", null);
            slot.setSlotType("String");
        }
        {
            const slot = this.newSlot("title", null);
            slot.setSlotType("String");
        }
        {
            const slot = this.newSlot("subtitle", null);
            slot.setSlotType("String");
        }
        {
            const slot = this.newSlot("thumbHash", null);
            slot.setSlotType("String");
        }
        {
            const slot = this.newSlot("visibility", "private");
            slot.setSlotType("String");
        }
        {
            const slot = this.newSlot("subtype", null);
            slot.setSlotType("Object");
        }
        {
            const slot = this.newSlot("lastModified", null);
            slot.setSlotType("Object"); // backend timestamp shape varies
        }
        {
            const slot = this.newSlot("rawData", null);
            slot.setSlotType("Object");
            slot.setComment("the original backend payload, for debugging / forward-compat fields");
        }
    }

    initPrototype () {
    }

    /**
     * Class-level factory: builds the right SvFsNode subclass for the
     * given backend payload, based on `data.subtype.type`.
     * @param {SvFsClient} client
     * @param {Object} data
     * @returns {SvFsNode}
     */
    static fromData (client, data) {
        const t = data && data.subtype && data.subtype.type;
        let cls = SvFsNode;
        if (t === "folder") cls = SvFsFolder;
        else if (t === "document") cls = SvFsDocument;
        else if (t === "blob") cls = SvFsBlob;
        const node = cls.clone();
        node.setClient(client);
        node.applyData(data);
        return node;
    }

    /**
     * Update the node's slot values from a backend payload. Idempotent.
     * @param {Object} data
     * @returns {SvFsNode} this
     */
    applyData (data) {
        if (!data) return this;
        this.setRawData(data);
        if ("id" in data) this.setId(data.id);
        if ("parentId" in data) this.setParentId(data.parentId);
        if ("sortKey" in data) this.setSortKey(data.sortKey);
        if ("scopeRootId" in data) this.setScopeRootId(data.scopeRootId);
        if ("title" in data) this.setTitle(data.title);
        if ("subtitle" in data) this.setSubtitle(data.subtitle);
        if ("thumbHash" in data) this.setThumbHash(data.thumbHash);
        if ("visibility" in data) this.setVisibility(data.visibility);
        if ("subtype" in data) this.setSubtype(data.subtype);
        if ("lastModified" in data) this.setLastModified(data.lastModified);
        return this;
    }

    /**
     * @returns {Promise<SvFsNode|null>}
     */
    async asyncParent () {
        if (!this.parentId()) return null;
        return this.client().asyncReadNode(this.parentId());
    }

    /**
     * @returns {Promise<Array<SvFsNode>>}
     */
    async asyncAncestorChain () {
        const chain = [];
        let cur = await this.asyncParent();
        while (cur) {
            chain.push(cur);
            cur = await cur.asyncParent();
        }
        return chain;
    }

    /** True when this node is a scope-root (id === scopeRootId). */
    isScopeRoot () {
        return this.id() && this.id() === this.scopeRootId();
    }

}.initThisClass());
