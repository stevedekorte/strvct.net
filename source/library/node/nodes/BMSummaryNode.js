"use strict"

/*
    
    BMSummaryNode
    
    A node that contains Text, stores it's:
        content, color, font, padding, margin
    and has an inspector for these attributes
    
    support for links?

*/

window.BMSummaryNode = class BMSummaryNode extends BMStorableNode {
    
    initPrototype () {
        const joinerSlot = this.newSlot("nodeSummarySuffix", " ").setShouldStoreSlot(true).setDuplicateOp("copyValue")
        joinerSlot.setCanInspect(true).setSlotType("String").setLabel("suffix")
        joinerSlot.setInspectorPath("Summary")

        const childSummarySlot = this.newSlot("nodeSubtitleIsChildrenSummary", false).setShouldStoreSlot(true).setDuplicateOp("copyValue")
        childSummarySlot.setCanInspect(true).setSlotType("Boolean").setLabel("Is children summary")
        childSummarySlot.setInspectorPath("Subtitle")

        const newLineSlot = this.newSlot("hasNewlineAferSummary", false).setShouldStoreSlot(true).setDuplicateOp("copyValue")
        newLineSlot.setCanInspect(true).setSlotType("Boolean").setLabel("Has new line ending")
        newLineSlot.setInspectorPath("Summary")

        const formatSlot = this.newSlot("summaryFormat", "value").setShouldStoreSlot(true).setDuplicateOp("copyValue")
        formatSlot.setCanInspect(true).setSlotType("String").setLabel("format")
        formatSlot.setValidValues(["none", "key", "value", "key value", "value key"])
        formatSlot.setInspectorPath("Summary")

        const subCount = this.overrideSlot("subtitleIsSubnodeCount", false).setDuplicateOp("copyValue").setShouldStoreSlot(true)
        subCount.setCanInspect(true).setSlotType("Boolean").setLabel("is subnode count")
        subCount.setInspectorPath("Subtitle")

        const noteCount = this.overrideSlot("noteIsSubnodeCount", false).setDuplicateOp("copyValue").setShouldStoreSlot(true)
        noteCount.setCanInspect(true).setSlotType("Boolean").setLabel("is subnode count")
        noteCount.setInspectorPath("Note")

        this.setShouldStore(true)
        this.setShouldStoreSubnodes(true)

        this.setTitle("title")
        this.protoAddStoredSlot("title")
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
        const f = this.summaryFormat()
        let end = this.nodeSummarySuffixOut()
        let j = " "

        if (this.hasNewlineAferSummary()) {
            end = "<br>"
        }

        if (Type.isNull(v)) {
            v = ""
        }

        if (f === "key") { 
            return k + end
        }
    
        if (f === "value") { 
            return v + end
        }

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
    
}.initThisClass()

