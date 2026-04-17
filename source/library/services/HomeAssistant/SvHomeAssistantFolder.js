"use strict";

/**
 * @module library.services.SvHomeAssistant
 */

/**
 * @class SvHomeAssistantFolder
 * @extends SvSummaryNode
 * @classdesc Represents a folder in the Home Assistant structure.
 */
(class SvHomeAssistantFolder extends SvSummaryNode {
    /**
   * @description Initializes the prototype slots for the SvHomeAssistantFolder.
   * @category Initialization
   */
    initPrototypeSlots () {
        this.setTitle("folder");
        this.setShouldStore(true);
        this.setShouldStoreSubnodes(true);
        this.setNodeCanReorderSubnodes(true);
        this.setSubnodeClasses([SvHomeAssistantFolder]);
        this.setNoteIsSubnodeCount(true);
        this.setNodeCanEditTitle(true);
        this.setNodeCanEditSubtitle(true);
        this.setNodeCanAddSubnode(true);
    }

    /**
   * @description Performs final initialization tasks for the SvHomeAssistantFolder.
   * @category Initialization
   */
    finalInit () {
        super.finalInit();
        this.makeSortSubnodesByTitle();
    }

    /*
  setupSubnodeClasses () {
    const classes = [];
    //SvHomeAssistantObject.subclasses().shallowCopy();
    classes.push(SvHomeAssistantFolder);
    this.setSubnodeClasses(classes);
  }
  */

}.initThisClass());
