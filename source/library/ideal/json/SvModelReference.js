"use strict";

/*

    SvModelReference
    
    A reference to a model object instance that is owned by another part of the model tree.
    Used when we need to refer to objects without duplicating them or transferring ownership.

*/

(class SvModelReference extends JsonGroup {
    
    static jsonSchemaDescription () {
        return "A reference to a model object instance";
    }

    initPrototypeSlots () {
        {
            const slot = this.newSlot("referenceId", null);
            slot.setLabelToCapitalizedSlotName();
            slot.setIsInJsonSchema(true);
            slot.setShouldJsonArchive(true);
            slot.setDescription("Reference ID to the target object");
            slot.setShouldStoreSlot(true);
            slot.setDuplicateOp("duplicate");
            slot.setSlotType("String");
            slot.setIsSubnodeField(true);
            slot.setCanEditInspection(true);
            slot.setSyncsToView(true);
            slot.setSummaryFormat("key: value");
        }

        {
            const slot = this.newSlot("targetType", null);
            slot.setLabelToCapitalizedSlotName();
            slot.setIsInJsonSchema(true);
            slot.setShouldJsonArchive(true);
            slot.setDescription("Type of the referenced object");
            slot.setShouldStoreSlot(true);
            slot.setDuplicateOp("duplicate");
            slot.setSlotType("String");
            slot.setIsSubnodeField(true);
            slot.setCanEditInspection(true);
            slot.setSyncsToView(true);
            slot.setSummaryFormat("key: value");
        }
    }

    initPrototype () {
        this.setCanDelete(true);
        this.setShouldStoreSubnodes(true);
        this.setNodeCanEditTitle(false);
        this.setSummaryFormat("key value");
        this.setTitle("Model Reference");
    }

    summary () {
        const parts = [];
        
        if (this.referenceId()) {
            parts.push(this.referenceId());
        } else {
            parts.push("Unlinked Reference");
        }

        if (this.targetType()) {
            parts.push("(" + this.targetType() + ")");
        }

        return parts.join(" ");
    }

    title () {
        return this.summary();
    }

}.initThisClass());