"use strict";

/**
 * @module library.view.dom.DomView
 */

/**
 * @class DomView
 * @extends EditableDomView
 * @classdesc DomView class for subclasses to extend. Ancestors of this class are organizational parts of DomView.
 */
(class DomView extends EditableDomView {
    
    /**
     * @description Initializes the prototype slots for the DomView class.
     * IMPORTANT: This method should NEVER call super as each class is responsible for
     * initializing only its own slots. The framework handles slot inheritance automatically.
     * @returns {void}
     * @category Initialization
     */
    initPrototypeSlots () {
    }

    /*
    init () {
        super.init()
        return this
    }
    */

}.initThisClass());