"use strict";

/**
 * @module library.app
 * @class RootContentNode
 * @extends SvFolderNode
 * @classdesc Root node to use for app persistent store.
 * The app is responsible for loading this from the store or creating it if it doesn't exist.
 *
 * The BrowserView node should be this node.
 * The app header node is a subnode of this one, and the breadcrumbs node would be a subnode of the header.
 *
 * This singleton sets up:
 *
 * - themes (inspectable) slot
 * - blobs (inspectable) slot
 * - breadcrumb subnode
 *
 * (if not already set up after loading from store)
 */


(class RootContentNode extends SvFolderNode {
    /**
     * @description Initializes prototype slots for the RootContentNode class.
     * @category Initialization
     */
    initPrototypeSlots () {
        {
            const slot = this.newSlot("browserHeaderNode", null);
            slot.setShouldStoreSlot(true);
            slot.setFinalInitProto(HeaderNode);
            slot.setIsSubnode(true);
        }
    }

    /**
     * @description Initializes the prototype for the RootContentNode class.
     * @category Initialization
     */
    initPrototype () {
        this.setTitle("Root Content Node");
        this.setNodeCanReorderSubnodes(true);
        this.setNodeMinTileHeight(75);
        this.setNodeIsVertical(false); // not setting BrowserView to down direction - why?
        this.setNodeCanReorderSubnodes(false);
        this.setShouldStoreSubnodes(false);
        this.setNodeCanAddSubnode(false);
    }

}.initThisClass());