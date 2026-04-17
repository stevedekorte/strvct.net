

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
        const score = this.subnodes().map(item => item.score()).sum() / this.subnodes().length;
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
