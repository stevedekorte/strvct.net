/** * @module library.node.fields.subclasses.time
 */

/** * @class SvMeridiemNode
 * @extends SvBaseNode
 * @classdesc SvMeridiemNode represents a meridiem (AM/PM) node in a time-related structure.
 
 
 */

"use strict";

(class SvMeridiemNode extends SvBaseNode {

    /**
     * Initializes the prototype slots for the SvMeridiemNode.
     * @category Initialization
     */
    initPrototypeSlots () {
        /**
         * @member {Number} value - The value of the meridiem (1 for AM, 2 for PM).
         * @category Time
         */
        {
            const slot = this.newSlot("value", 1);
            slot.setSlotType("Number");
        }
    }

}.initThisClass());
