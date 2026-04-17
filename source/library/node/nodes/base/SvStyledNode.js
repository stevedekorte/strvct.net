/** * @module library.node.nodes.base
 */

/** * @class SvStyledNode
 * @extends SvViewableNode
 * @classdesc SvStyledNode extends SvViewableNode and is part of the inheritance chain:
 * SvNode -> SvTitledNode -> SvInspectableNode -> SvViewableNode -> SvStyledNode -> SvBaseNode -> StorableNode
 *
 * This class is responsible for state and behavior specific to styling of views.
 */

/**

 */

"use strict";

(class SvStyledNode extends SvViewableNode {

    /**
     * Initializes the prototype slots for the SvStyledNode class.
     * @description Sets up the themeClassName slot with specific properties and behaviors.
     * @category Initialization
     */
    initPrototypeSlots () {
        // view style overrides
        {
            /**
             * @member {String} themeClassName
             * @description The theme class name for styling the node.
             * @category Styling
             */
            const slot = this.newSlot("themeClassName", null);
            slot.setShouldStoreSlot(true);
            slot.setCanInspect(true);
            slot.setSlotType("String");
            slot.setLabel("Theme Class");
            slot.setInspectorPath("Node/Styled");
            slot.setSyncsToView(true);
            slot.setValidValuesClosure((/*instance*/) => {
                return SvThemeResources.shared().activeTheme().themeClassNames();
            });
        }
    }

    /**
     * Initializes the prototype of the SvStyledNode class.
     * @description This method is currently empty and can be used for future prototype initializations.
     * @category Initialization
     */
    initPrototype () {
    }

}.initThisClass());
