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
            const slot = this.newSlot("nodeColumnStyles", null)
        }

        {
            const slot = this.newSlot("nodeTileStyles", null)
        }
        
        {
            const slot = this.newSlot("themeClassName", "DefaultThemeClass")
            slot.setShouldStoreSlot(true)
            slot.setCanInspect(true)
            slot.setSlotType("String")
            slot.setLabel("Theme Class")
            slot.setSyncsToView(true)
            slot.setInspectorPath("Style")
        }

        //this.newSlot("nodeUsesColumnBackgroundColor", true).setDuplicateOp("copyValue")
    }

    init () {
        super.init()
        
        //this.setNodeColumnStyles(this.sharedNodeColumnStyles())
        //this.setNodeTileStyles(this.sharedNodeTileStyles())

        this.setNodeColumnStyles(BMViewStyles.clone())
        //this.setNodeTileStyles(BMViewStyles.clone())

        return this
    }

    customizeNodeTileStyles () {
        if (!this.getOwnProperty("_nodeTileStyles")) {
            //const styles = BMViewStyles.shared().sharedWhiteOnBlackStyle().setIsMutable(false)
            // NOTE: We can't use the shared style because column bg colors change

            const styles = BMViewStyles.clone()
            styles.selected().setColor("white")
            styles.unselected().setColor("#aaa")
            this._nodeTileStyles = styles
        }
        return this._nodeTileStyles
    }

    sharedNodeColumnStyles () {
        if (!BMNode.hasOwnProperty("_nodeColumnStyles")) {
            const styles = BMViewStyles.clone()
            //styles.selected().setColor("white")
            //styles.unselected().setColor("#aaa")
            BMNode._nodeColumnStyles = styles
        }
        return BMNode._nodeColumnStyles
    }

    sharedNodeTileStyles () {
        if (!BMNode._nodeTileStyles) {
            const styles = BMViewStyles.clone()
            BMNode._nodeTileStyles = styles
            styles.selected().setColor("white")
            styles.unselected().setColor("#aaa")
        }
        return BMNode._nodeTileStyles
    }

    // column view style
    
    /*
    setNodeColumnBackgroundColor (c) {
	    if (this.nodeColumnStyles()) {
            this.setNodeColumnStyles(BMViewStyles.clone())
	    }
	    
        this.nodeColumnStyles().selected().setBackgroundColor(c)
        this.nodeColumnStyles().unselected().setBackgroundColor(c)
        return this
    }

    nodeColumnBackgroundColor () {
	    if (this.nodeColumnStyles()) {
		    return this.nodeColumnStyles().selected().backgroundColor()
	    }
	    return null
    }
    */

}.initThisClass());




