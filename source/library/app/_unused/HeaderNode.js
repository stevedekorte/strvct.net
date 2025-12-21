"use strict";

/** * @module library.app
 */

/** * @class HeaderNode
 * @extends SvFolderNode
 * @classdesc This singleton sets up:
 *   - themes (inspectable) slot
 *   - blobs (inspectable) slot
 *   - breadcrumb subnode
 *   (if not already set up after loading from store)
 
 
 */

/**

 */


(class HeaderNode extends SvFolderNode {

    initPrototypeSlots () {

        {
            const slot = this.newSlot("blobs", null);
            slot.setFinalInitProto(SvBlobs);
            slot.setShouldStoreSlot(true);
            slot.setCanInspect(true);
        }

        {
            const slot = this.newSlot("themes", null);
            slot.setFinalInitProto(SvThemeResources);
            slot.setShouldStoreSlot(true);
            slot.setCanInspect(true);
        }

        {
            const slot = this.newSlot("prototypes", null);
            slot.setFinalInitProto(SvPrototypesNode);
            slot.setShouldStoreSlot(true);
            slot.setCanInspect(true);
        }

        {
            const slot = this.newSlot("breadCrumbsNode", null);
            slot.setFinalInitProto(BreadCrumbsNode);
            slot.setShouldStoreSlot(true);
            slot.setCanInspect(true);
            slot.setIsSubnode(true);
        }
    }

    /**
     * @description Initializes the prototype properties for the HeaderNode.
     * @category Initialization
     */
    initPrototype () {
        this.setNodeCanReorderSubnodes(false);
        this.setNodeTileClassName("HeaderTile");
        this.setNodeMinTileHeight(100);
        this.setTitle("Header");
        this.setNodeCanEditTitle(true);
        this.setNodeIsVertical(false);
        this.setCanDelete(false);
        this.setNodeCanAddSubnode(false);
        this.setShouldStoreSubnodes(false);
    }

    /**
     * @description Handles the tap event on the node by focusing and expanding the breadcrumb subnode.
     * @category Event Handling
     */
    onTapOfNode () {
        super.onTapOfNode();
        setTimeout(() => this.postShouldFocusAndExpandSubnode(this.breadCrumbsNode()), 0);
    }

}.initThisClass());
