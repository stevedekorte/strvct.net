"use strict";

/**
 * @module library.view.dom.SvDomView
 */

/**
 * @class SvDomView
 * @extends SvEditableDomView
 * @classdesc SvDomView class for subclasses to extend. Ancestors of this class are organizational parts of SvDomView.
 */
(class SvDomView extends SvEditableDomView {

    /**
     * @description Initializes the prototype slots for the SvDomView class.
     * IMPORTANT: This method should NEVER call super as each class is responsible for
     * initializing only its own slots. The framework handles slot inheritance automatically.
     * @returns {void}
     * @category Initialization
     */
    initPrototypeSlots () {
    }

}.initThisClass());

//throw new Error("TEST!");
