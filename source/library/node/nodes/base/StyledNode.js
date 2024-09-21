/**
 * @module library.node.nodes.base
 * @class StyledNode
 * @extends ViewableNode
 * @classdesc StyledNode extends ViewableNode and is part of the inheritance chain:
 * BMNode -> TitledNode -> InspectableNode -> ViewableNode -> StyledNode -> BaseNode -> StorableNode
 * 
 * This class is responsible for state and behavior specific to styling of views.
 */

"use strict";

(class StyledNode extends ViewableNode {
    
    /**
     * Initializes the prototype slots for the StyledNode class.
     * @method initPrototypeSlots
     * @description Sets up the themeClassName slot with specific properties and behaviors.
     */
    initPrototypeSlots () {
        // view style overrides
        {
            /**
             * @property {String} themeClassName
             * @description The theme class name for styling the node.
             */
            const slot = this.newSlot("themeClassName", null)
            slot.setShouldStoreSlot(true)
            slot.setCanInspect(true)
            slot.setSlotType("String")
            slot.setLabel("Theme Class")
            slot.setInspectorPath("Node/Styled")
            slot.setSyncsToView(true)
            slot.setValidValuesClosure((instance) => { 
                return BMThemeResources.shared().activeTheme().themeClassNames()
            })   
        }
    }

    /**
     * Initializes the prototype of the StyledNode class.
     * @method initPrototype
     * @description This method is currently empty and can be used for future prototype initializations.
     */
    initPrototype () {
    }

}.initThisClass());