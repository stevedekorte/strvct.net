/**
 * @module library.services.ImaginePro
 */

/**
 * @class EvalChecklistItem
 * @extends SvSummaryNode
 * @classdesc A single item in an evaluation checklist.
 */
"use strict";

(class EvalChecklistItem extends SvSummaryNode {

    /**
   * @description Initializes the prototype slots for the class.
   * @category Initialization
   */
    initPrototypeSlots () {


        /**
     * @member {string} imageGenPrompt
     * @description The prompt that was used to generate the image.
     * @category Configuration
     */
        {
            const slot = this.newSlot("itemName", "");
            slot.setSlotType("String");
            slot.setLabel("Item Name");
            slot.setIsSubnodeField(true);
            slot.setShouldStoreSlot(true);
            slot.setSyncsToView(true);
            slot.setCanEditInspection(true);
            slot.setDescription("The name of the feature to evaluate");
        }

        // score
        {
            const slot = this.newSlot("score", 0);
            slot.setSlotType("Number");
            slot.setLabel("Score");
            slot.setIsSubnodeField(true);
            slot.setShouldStoreSlot(true);
            slot.setSyncsToView(true);
            slot.setShouldStoreSlot(true);
            slot.setDescription("The score of the item");
        }

        // reasoning
        {
            const slot = this.newSlot("reasoning", "");
            slot.setSlotType("String");
            slot.setLabel("Reasoning");
            slot.setIsSubnodeField(true);
            slot.setShouldStoreSlot(true);
            slot.setSyncsToView(true);
            slot.setShouldStoreSlot(true);
            slot.setDescription("The reasoning for the score");
        }

    }

    /**
   * @description Initializes the prototype.
   * @category Initialization
   */
    initPrototype () {
        this.setTitle("Eval Checklist Item");
        this.setShouldStore(true);
        this.setShouldStoreSubnodes(false);
    }

    title () {
        return this.itemName();
    }

    subtitle () {
        return this.score().toFixed(2);
    }

    asJson () {
        return {
            itemName: this.itemName(),
            score: this.score(),
            reasoning: this.reasoning()
        };
    }

    setJson (dict) {
        assert(Type.isString(dict.itemName), "itemName must be a string");
        assert(Type.isNumber(dict.score), "score must be a number");
        assert(Type.isString(dict.reasoning), "reasoning must be a string");

        this.setItemName(dict.itemName);
        this.setScore(dict.score);
        this.setReasoning(dict.reasoning);
        return this;
    }


}).initThisClass();
