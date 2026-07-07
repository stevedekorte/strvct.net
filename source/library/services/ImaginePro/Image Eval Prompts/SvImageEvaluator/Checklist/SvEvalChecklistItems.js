

/**
 * @class SvEvalChecklistItems
 * @extends SvSummaryNode
 * @classdesc A collection of SvEvalChecklistItems.
 */

"use strict";

(class SvEvalChecklistItems extends SvSummaryNode {

    /**
   * @description Initializes the prototype.
   * @category Initialization
   */
    initPrototype () {
        this.setShouldStore(true);
        this.setShouldStoreSubnodes(false);
        this.setCanDelete(false);

        this.setSubnodeClasses([SvEvalChecklistItem]);
        this.setNodeCanAddSubnode(true);
        this.setNodeCanReorderSubnodes(false);
        this.setTitle("Eval Checklist");
    }

    setJson (jsonItems) {
        this.removeAllSubnodes();
        jsonItems.forEach(item => {
            const checklistItem = SvEvalChecklistItem.clone();
            checklistItem.setJson(item);
            this.addSubnode(checklistItem);
        });
        return this;
    }

    asJson () {
        return this.subnodes().map(item => item.asJson());
    }

    score () {
        // Importance-weighted average, so essential items (importance 1.0)
        // move the score more than minor details (importance near 0.0)
        const totalWeight = this.subnodes().map(item => item.importance()).sum();
        if (totalWeight === 0) {
            return 0;
        }
        const score = this.subnodes().map(item => item.score() * item.importance()).sum() / totalWeight;
        return score.toFixed(2).asNumber();
    }

    doesContainAllItems () {
        return this.subnodes().every(item => item.score() > 0);
    }

    missingItemCount () {
        return this.subnodes().filter(item => item.score() === 0).length;
    }

    missingItemNames () {
        return this.subnodes().filter(item => item.score() === 0).map(item => item.itemName());
    }


}.initThisClass());
