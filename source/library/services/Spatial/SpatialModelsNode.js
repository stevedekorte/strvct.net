"use strict";

/*

    SpatialModelNode
    
*/

(class SpatialModelNode extends BMStorableNode {
    
    initPrototypeSlots () {
        {
            const slot = this.newSlot("dataURL", null)
            slot.setShouldStoreSlot(true)
        }
    }

    initPrototype () {
        this.setNodeCanEditTitle(true)
        this.setNodeCanEditSubtitle(false)
        this.setTitle("Untitled 3d Model")
        this.setSubtitle(null)
        this.setCanDelete(true)

        this.setNodeTileClassName(SceneViewWellFieldTile);
    }

    init () {
        super.init()
    }
    
    onDidEditNode () {
        this.debugLog(" onDidEditNode")
    }

    jsonArchive () {
        debugger;
        return undefined;
    }
    
}.initThisClass());
