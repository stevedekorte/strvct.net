"use strict";

/*
    
    BMSummaryNode
    
    A node that contains Text, stores it's:
        content, color, font, padding, margin
    and has an inspector for these attributes
    
    support for links?

*/

(class BMSummaryNode extends BMStorableNode {
    
    initPrototypeSlots () {

        {
            const slot = this.newSlot("nodeSummarySuffix", " ")
            slot.setShouldStoreSlot(true)
            slot.setDuplicateOp("copyValue")
            slot.setCanInspect(true)
            slot.setSlotType("String")
            slot.setLabel("suffix")
            slot.setInspectorPath("Summary")
            slot.setSyncsToView(true)
        }

        {
            const slot = this.newSlot("nodeSubtitleIsChildrenSummary", false)
            slot.setShouldStoreSlot(true)
            slot.setDuplicateOp("copyValue")
            slot.setCanInspect(true)
            slot.setSlotType("Boolean")
            slot.setLabel("is children summary")
            slot.setInspectorPath("Subtitle")
            slot.setSyncsToView(true)
        }

        {
            const slot = this.newSlot("hasNewlineAferSummary", false)
            slot.setShouldStoreSlot(true)
            slot.setDuplicateOp("copyValue")
            slot.setCanInspect(true)
            slot.setSlotType("Boolean")
            slot.setLabel("has new line ending")
            slot.setInspectorPath("Summary")
            slot.setSyncsToView(true)
        }

        {
            const slot = this.newSlot("summaryFormat", "value")
            slot.setShouldStoreSlot(true)
            slot.setDuplicateOp("copyValue")
            slot.setCanInspect(true)
            slot.setSlotType("String")
            slot.setLabel("format")
            slot.setValidValues(["none", "key", "value", "key value", "value key"])
            slot.setSyncsToView(true)
            slot.setInspectorPath("Summary")
        }

        {
            const slot = this.overrideSlot("subtitleIsSubnodeCount", false)
            slot.setDuplicateOp("copyValue")
            slot.setShouldStoreSlot(true)
            slot.setCanInspect(true)
            slot.setSlotType("Boolean")
            slot.setLabel("is subnode count")
            slot.setInspectorPath("Subtitle")
            slot.setSyncsToView(true)
        }

        {
            const slot = this.overrideSlot("noteIsSubnodeCount", false)
            slot.setDuplicateOp("copyValue")
            slot.setShouldStoreSlot(true)
            slot.setCanInspect(true)
            slot.setSlotType("Boolean")
            slot.setLabel("is subnode count")
            slot.setInspectorPath("Note")
            slot.setSyncsToView(true)
        }
    }

    initPrototype () {
        this.setShouldStore(true)
        this.setShouldStoreSubnodes(true)

        this.setTitle("title")
    }

    init () {
        super.init()
    }

    didUpdateSlotSummaryFormat () {
        this.didUpdateNode()
    }

    summaryKey () {
        return this.title()
    }

    summaryValue () {
        return this.subtitle()
    }

    subtitle () {
        if (this.nodeSubtitleIsChildrenSummary()) {
            return this.childrenSummary()
        }

        return super.subtitle()
    }

    didUpdateSlotNodeSubtitleIsChildrenSummary (oldValue, newValue) {
        if (oldValue === true) {
            this.setSubtitle(null)
        }
    }

    // --- summary ---
    		
    summary () {
        const k = this.summaryKey()
        let v = this.summaryValue()

        if (Type.isNull(v)) {
            v = ""
        }

        const f = this.summaryFormat()
        let end = this.nodeSummarySuffixOut()

        if (this.hasNewlineAferSummary()) {
            //end = "<br>"
            end = "\n"
        }

        if (f === "key") { 
            return k + end
        }
    
        if (f === "value") { 
            return v + end
        }

        const j = " "

        if (f === "key value") { 
            return k + j + v + end
        }

        if (f === "value key") { 
            return v + j + k + end
        }

        return ""
    }
        
    childrenSummary () {
        return this.subnodes().map(subnode => subnode.summary()).filter(s => s.length).join("")
    }

    nodeSummarySuffixOut () {
        let s = this._nodeSummarySuffix
        
        if (s === "newline") {
            return "<br>"
        } else {
            s = s.replaceAll("<br>", "")
        }
        
        return s
    }
    
}.initThisClass());

