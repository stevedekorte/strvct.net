/** * @module library.node.nodes
 */

/** * @class SvSummaryNode
 * @extends SvStorableNode
 * @classdesc A node that contains Text, stores its:
 * - content
 * - color
 * - font
 * - padding
 * - margin
 * and has an inspector for these attributes
 *
 * support for links?
 */

/**

 */
"use strict";

(class SvSummaryNode extends SvStorableNode {

    /**
     * @description Initializes the prototype slots for the SvSummaryNode.
     * @category Initialization
     */
    initPrototypeSlots () {

        /**
         * @member {string} nodeSummarySuffix
         * @description The suffix to be added to the node summary.
         * @category Summary
         */
        {
            const slot = this.newSlot("nodeSummarySuffix", " ");
            slot.setShouldStoreSlot(true);
            slot.setDuplicateOp("copyValue");
            slot.setCanInspect(true);
            slot.setSlotType("String");
            slot.setLabel("suffix");
            slot.setInspectorPath("Node/Summary");
            slot.setSyncsToView(true);
        }

        /**
         * @member {boolean} nodeSubtitleIsChildrenSummary
         * @description Determines if the node subtitle is the children summary.
         * @category Summary
         */
        {
            const slot = this.newSlot("nodeSubtitleIsChildrenSummary", false);
            slot.setShouldStoreSlot(true);
            slot.setDuplicateOp("copyValue");
            slot.setCanInspect(true);
            slot.setSlotType("Boolean");
            slot.setLabel("is children summary");
            slot.setInspectorPath("Node/Summary/Subtitle");
            slot.setSyncsToView(true);
        }

        /**
         * @member {boolean} hasNewlineBeforeSummary
         * @description Determines if there should be a newline before the summary.
         * @category Summary
         */
        {
            const slot = this.newSlot("hasNewlineBeforeSummary", false);
            slot.setShouldStoreSlot(true);
            slot.setDuplicateOp("copyValue");
            slot.setCanInspect(true);
            slot.setSlotType("Boolean");
            slot.setLabel("begins with new line");
            slot.setInspectorPath("Node/Summary");
            slot.setSyncsToView(true);
        }

        /**
         * @member {boolean} hasNewlineAfterSummary
         * @description Determines if there should be a newline after the summary.
         * @category Summary
         */
        {
            const slot = this.newSlot("hasNewlineAfterSummary", false);
            slot.setShouldStoreSlot(true);
            slot.setDuplicateOp("copyValue");
            slot.setCanInspect(true);
            slot.setSlotType("Boolean");
            slot.setLabel("ends with new line");
            slot.setInspectorPath("Node/Summary");
            slot.setSyncsToView(true);
        }

        /**
         * @member {boolean} hasNewLineSeparator
         * @description Determines if there should be a newline separator between key and value.
         * @category Summary
         */
        {
            const slot = this.newSlot("hasNewLineSeparator", false);
            slot.setShouldStoreSlot(true);
            slot.setDuplicateOp("copyValue");
            slot.setCanInspect(true);
            slot.setSlotType("Boolean");
            slot.setLabel("new line separates key/value");
            slot.setInspectorPath("Node/Summary");
            slot.setSyncsToView(true);
        }

        /**
         * @member {string} summaryFormat
         * @description The format of the summary.
         * @category Summary
         */
        {
            const slot = this.newSlot("summaryFormat", "value");
            slot.setShouldStoreSlot(true);
            slot.setDuplicateOp("copyValue");
            slot.setCanInspect(true);
            slot.setSlotType("String");
            slot.setLabel("format");
            slot.setValidValues(["none", "key", "value", "key value", "value key", "key: value"]);
            slot.setSyncsToView(true);
            slot.setInspectorPath("Node/Summary");
        }

        /**
         * @member {string} hidePolicy
         * @description The policy for hiding the summary.
         * @category Summary
         */
        {
            const slot = this.newSlot("hidePolicy", "none");
            slot.setShouldStoreSlot(true);
            slot.setDuplicateOp("copyValue");
            slot.setCanInspect(true);
            slot.setSlotType("String");
            slot.setLabel("hide policy");
            slot.setValidValues(["none", "hide if value is true", "hide if value is false"]);
            slot.setSyncsToView(true);
            slot.setInspectorPath("Node/Summary");
        }

        /**
         * @member {boolean} subtitleIsSubnodeCount
         * @description Determines if the subtitle is the subnode count.
         * @category Summary
         */
        {
            const slot = this.overrideSlot("subtitleIsSubnodeCount", false);
            slot.setDuplicateOp("copyValue");
            slot.setShouldStoreSlot(true);
            slot.setCanInspect(true);
            slot.setSlotType("Boolean");
            slot.setLabel("is subnode count");
            slot.setInspectorPath("Node/Summary/Subtitle");
            slot.setSyncsToView(true);
        }

        /**
         * @member {boolean} noteIsSubnodeCount
         * @description Determines if the note is the subnode count.
         * @category Summary
         */
        {
            const slot = this.overrideSlot("noteIsSubnodeCount", false);
            slot.setDuplicateOp("copyValue");
            slot.setShouldStoreSlot(true);
            slot.setCanInspect(true);
            slot.setSlotType("Boolean");
            slot.setLabel("is subnode count");
            slot.setInspectorPath("Node/Summary/Note");
            slot.setSyncsToView(true);
        }
    }

    /**
     * @description Initializes the prototype of the SvSummaryNode.
     * @category Initialization
     */
    initPrototype () {
        this.setShouldStore(true);
        this.setShouldStoreSubnodes(true);
        this.setTitle("title");
    }

    /**
     * @description Initializes the SvSummaryNode.
     * @category Initialization
     */
    init () {
        super.init();
    }

    /**
     * @description Called when the summaryFormat slot is updated.
     * @category Update
     */
    didUpdateSlotSummaryFormat () {
        this.didUpdateNodeIfInitialized();
    }

    /**
     * @description Returns the summary key.
     * @returns {string} The summary key.
     * @category Summary
     */
    summaryKey () {
        return this.title();
    }

    /**
     * @description Returns the summary value.
     * @returns {string} The summary value.
     * @category Summary
     */
    summaryValue () {
        return this.subtitle();
    }

    /**
     * @description Returns the subtitle of the node.
     * @returns {string} The subtitle.
     * @category Summary
     */
    subtitle () {
        if (this.nodeSubtitleIsChildrenSummary()) {
            const s = this.childrenSummary();
            if (Type.isString(s)) {
                return s.indent(2);
            }
            return s;
        }

        return super.subtitle();
    }

    /**
     * @description Called when the nodeSubtitleIsChildrenSummary slot is updated.
     * @param {boolean} oldValue - The old value.
     * @param {boolean} newValue - The new value.
     * @category Update
     */
    didUpdateSlotNodeSubtitleIsChildrenSummary (oldValue/*, newValue*/) {
        if (oldValue === true) {
            this.setSubtitle(null);
        }
    }

    /**
     * @description Returns the summary of the node.
     * @returns {string} The summary.
     * @category Summary
     */
    summary () {
        const k = this.summaryKey();
        let v = this.summaryValue();

        const hidePolicy = this.hidePolicy();
        if (hidePolicy !== "none") {
            const isTrue = (v === true || (typeof(v) === "string" && v !== ""));
            const isFalse = (v === false || (typeof(v) === "string" && v === "") || v === null);
            if (isTrue && hidePolicy === "hide if value is true") {
                return "";
            } else if (isFalse && hidePolicy === "hide if value is false") {
                return "";
            }
        }

        if (Type.isNull(v)) {
            v = "";
        }

        const f = this.summaryFormat();
        let end = this.nodeSummarySuffixOut();
        const begin = this.hasNewlineBeforeSummary() ? "\n" : "";

        if (this.hasNewlineAfterSummary()) {
            end = "\n";
        }

        if (f === "key") {
            if (!k) {
                return "";
            }
            return begin + k + end;
        }

        if (f === "value") {
            if (!v) {
                return "";
            }
            return begin + v + end;
        }

        const kvSeparator = this.hasNewLineSeparator() ? "\n" : " ";

        if (f === "key value") {
            if (!k) {
                return "";
            }
            return begin + k + kvSeparator + v + end;
        }

        if (f === "key: value") {
            if (!k) {
                return "";
            }
            return begin + k + ":" + kvSeparator + v + end;
        }

        if (f === "value key") {
            if (!v) {
                return "";
            }
            return begin + v + kvSeparator + k + end;
        }

        return "";
    }

    /**
     * @description Returns the summary of all child nodes.
     * @returns {string} The children summary.
     * @category Summary
     */
    childrenSummary () {
        return this.subnodes().map(subnode => subnode.summary()).filter(s => s.length).join("");
    }

    /**
     * @description Returns the formatted node summary suffix.
     * @returns {string} The formatted suffix.
     * @category Summary
     */
    nodeSummarySuffixOut () {
        let s = this._nodeSummarySuffix;

        if (s === "newline") {
            return "<br>";
        } else {
            s = s.replaceAll("<br>", "");
        }

        return s;
    }

    /**
     * @description Called when the node is updated.
     * @category Update
     */
    didUpdateNode () {
        super.didUpdateNode();
    }

}.initThisClass());
