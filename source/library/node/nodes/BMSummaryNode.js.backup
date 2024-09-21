"use strict";

/*
    
    BMSummaryNode
    
    A node that contains Text, stores it's:
    - content
    - color
    - font
    - padding
    - margin
    and has an inspector for these attributes
    
    support for links?

*/

(class BMSummaryNode extends BMStorableNode {
    
    initPrototypeSlots () {

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

    initPrototype () {
        this.setShouldStore(true);
        this.setShouldStoreSubnodes(true);
        this.setTitle("title");
    }

    init () {
        super.init();
    }

    didUpdateSlotSummaryFormat () {
        this.didUpdateNodeIfInitialized();
    }

    summaryKey () {
        return this.title();
    }

    summaryValue () {
        return this.subtitle();
    }

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

    didUpdateSlotNodeSubtitleIsChildrenSummary (oldValue, newValue) {
        if (oldValue === true) {
            this.setSubtitle(null);
        }
    }

    // --- summary ---
    		
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

        // make this optional? 
        /*
        if (v === "") {
            return "";
        }
        */

        const f = this.summaryFormat();
        let end = this.nodeSummarySuffixOut();
        const begin = this.hasNewlineBeforeSummary() ? "\n" : "";

        if (this.hasNewlineAfterSummary()) {
            //end = "<br>";
            end = "\n";
        }

        if (f === "key") { 
            if (!k) {
                return "";
            }
            return begin + k + end;
        }

        if (v === "ally") {
            debugger;
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
        
    childrenSummary () {
        return this.subnodes().map(subnode => subnode.summary()).filter(s => s.length).join("");
    }

    nodeSummarySuffixOut () {
        let s = this._nodeSummarySuffix;
        
        if (s === "newline") {
            return "<br>";
        } else {
            s = s.replaceAll("<br>", "");
        }
        
        return s;
    }

    didUpdateNode () {
        super.didUpdateNode();
    
        // TODO: FIX HACK, how can we generalize this without creating unnecessary update notifications?

        /*
        this.parentChainNodes().forEach(node => {
            //node.didUpdateNode();
            //node.scheduleMethod("didUpdateNode");
        })
        */
    }
    
}.initThisClass());

