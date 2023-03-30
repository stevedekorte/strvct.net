"use strict";

/*

    StyledNode
 
    BMNode -> TitledNode -> ActionableNode -> InspectableNode -> ViewableNode -> StyledNode -> BaseNode -> StorableNode

    For state and behavior specific to styling of views.

*/

(class StyledNode extends ViewableNode {
    
    initPrototypeSlots () {
        // view style overrides
        {
            //const slot = this.newSlot("themeClassName", "DefaultThemeClass")
            const slot = this.newSlot("themeClassName", null)
            slot.setShouldStoreSlot(true)
            slot.setCanInspect(true)
            slot.setSlotType("String")
            slot.setLabel("Theme Class")
            slot.setSyncsToView(true)
            slot.setValidValuesClosure(() => { 
                return BMThemeResources.shared().activeTheme().themeClassNames()
            })   
            //slot.setInspectorPath("Style")
        }
    }

    /*
    init () {
        super.init()
        return this
    }
    */

}.initThisClass());




