/**
  * @module library.services.HomeAssistant.Areas
  */

/**
  * @class HomeAssistantArea
  * @extends HomeAssistantObject
  * @classdesc Represents an area in Home Assistant.
  */
(class HomeAssistantArea extends HomeAssistantObject {
    /**
      * @description Initializes prototype slots for the class.
      * @category Initialization
      */
    initPrototypeSlots () {

    }

    /**
      * @description Initializes the instance.
      * @category Initialization
      */
    init () {
        super.init();
    }

    /**
      * @description Performs final initialization steps.
      * @category Initialization
      */
    finalInit () {
        super.finalInit();
        this.setNodeCanEditTitle(true);
        //this.setNodeSubtitleIsChildrenSummary(true);
    }

    /**
      * @description Returns the ID of the area.
      * @returns {string} The area ID.
      * @category Data Retrieval
      */
    id () {
        return this.haJson().area_id;
    }

    /**
      * @description Updates the title of the area based on its ID.
      * @returns {HomeAssistantArea} The current instance.
      * @category UI Update
      */
    updateTitle () {
        if (this.id()) {
            const parts = this.id().split("_");
            const s = parts.map(part => part.capitalized()).join(" ");
            this.setTitle(s);
        } else {
            this.setTitle("null");
        }
        return this;
    }

    /**
      * @description Connects objects (currently does nothing as there are no parents to connect to).
      * @category Object Management
      */
    connectObjects () {
        // no parents to connect to
    }

    /**
      * @description Updates the titles and subtitle of the area.
      * @returns {HomeAssistantArea} The current instance.
      * @category UI Update
      */
    updateTitles () {
        this.updateTitle();
        //this.updateSubtitle();
        this.setSubtitle("area");
        return this;
    }

    /**
      * @description Finds the owner of the area (currently returns null).
      * @returns {null} Always returns null.
      * @category Data Retrieval
      */
    findOwner () {
        return null;
    }

    /*
    updateSubtitle () {
        const s = [
            this.subnodeCount() + " devices"
        ].join("\n");
        this.setSubtitle(s);
        return this;
    }

    addDevice (device) {
        device.removeFromParentNode();
        this.devicesNode().addSubnode(device);
        return this;
    }
    */

}).initThisClass();
