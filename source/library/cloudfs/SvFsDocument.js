"use strict";

/**
 * @module library.cloudfs
 */

/**
 * @class SvFsDocument
 * @extends SvFsNode
 * @classdesc
 * A document node: it lists a document in its folder and names where the
 * document's content lives — a records pool (`subtype.recordPoolId`, Plans/
 * Record Store), read and committed through the record store, never through
 * the node. The node carries the document's class and schema version.
 */

(class SvFsDocument extends SvFsNode {

    static initClass () {
        this.setIsSingleton(false);
    }

    initPrototypeSlots () {
    }

    initPrototype () {
    }

    documentClass () {
        const st = this.subtype() || {};
        return st.documentClass || null;
    }

    schemaVersion () {
        const st = this.subtype() || {};
        return typeof st.schemaVersion === "number" ? st.schemaVersion : null;
    }

    /**
     * @description The records pool holding this document's content, or null.
     * @returns {String|null}
     */
    recordPoolId () {
        const st = this.subtype() || {};
        return typeof st.recordPoolId === "string" ? st.recordPoolId : null;
    }

}.initThisClass());
