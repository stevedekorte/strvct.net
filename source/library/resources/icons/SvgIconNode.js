"use strict";

/**
* @module library.resources.icons
*/

/**
* @class SvgIconNode
* @extends SvResource
* @classdesc Represents an SVG icon node resource.
*/
(class SvgIconNode extends SvResource {

    /**
    * @static
    * @description Returns the supported file extensions for SVG icons.
    * @returns {string[]} An array of supported file extensions.
    * @category File Handling
    */
    static supportedExtensions () {
        return ["svg"];
    }

    /**
    * @description Initializes the prototype slots for the SvgIconNode.
    * @category Initialization
    */
    initPrototypeSlots () {
    /**
        * @member {string} svgString - The SVG string content.
        * @category Data
        */
        {
            const slot = this.newSlot("svgString", null);
            slot.setCanInspect(true);
            slot.setSlotType("String");
            slot.setLabel("SVG string");
        }
    }

    /**
    * @description Initializes the prototype.
    * @category Initialization
    */
    initPrototype () {
    }

    /**
    * @description Handles the loading of the SVG content.
    * @returns {SvgIconNode} The current instance.
    * @category Data Loading
    */
    onDidLoad () {
        super.onDidLoad();
        //debugger
        this.setSvgString(this.urlResource().dataAsText());
        return this;
    }

    /**
    * @description Creates and returns an SvgIconView instance.
    * @returns {SvgIconView} The created SvgIconView instance.
    * @category View Creation
    */
    svgIconView () {
    // TODO: this view stuff probably shouldn't be in the model
        debugger;
        const icon = SvgIconView.clone().setSvgString(this.svgString());
        return icon;
    }

    /**
    * @description Returns the icon name.
    * @returns {string} The title of the icon.
    * @category Data Retrieval
    */
    noteIconName () {
        return this.title();
    }

}.initThisClass());
