"use strict";

/**
 * @module library.view.dom.Attributes
 */

/**
 * @class DomTransitions
 * @extends ProtoClass
 * @classdesc
 * DomTransition
 *         
 * Example use in a DomView:
 *
 *         aDomView.transitions().at("opacity").updateDuration("0.3s")
 *
 * updates the opacity time without changing other transition settings
 *        
 *
 * NOTES:
 *
 *     CSS transition value example:
 *     
 *         transition: width 2s linear 1s, height 2s ease 1s; 
 *     
 *     1st time value is the duration, 
 *     2nd time value is the delay
 */
(class DomTransitions extends ProtoClass {
    /**
     * @description Initializes the prototype slots for the DomTransitions class.
     */
    initPrototypeSlots () {
        /**
         * @property {Object} properties - JSON Object to store transition properties.
         */
        {
            const slot = this.newSlot("properties", null);
            slot.setSlotType("Object");
        }
        /**
         * @property {DomView} domView - The associated DomView instance.
         */
        {
            const slot = this.newSlot("domView", null);
            slot.setSlotType("DomView");
        }
    }

    /**
     * @description Initializes the DomTransitions instance.
     */
    init () {
        super.init();
        this.setProperties({});
    }

    /**
     * @description Retrieves or creates a DomTransition for a given property name.
     * @param {string} aName - The name of the transition property.
     * @returns {DomTransition} The DomTransition instance for the given property.
     */
    at (aName) {
        const d = this.properties();
        if (!d.hasOwnProperty(name)) {
            d[name] = DomTransition.clone().setProperty(aName).setTransitions(this);
        }
        return d[name];
    }

    /**
     * @description Returns an array of all DomTransition instances.
     * @returns {Array} An array of DomTransition instances.
     */
    propertiesAsList () {
        return Object.values(this.properties());
    }

    /**
     * @description Returns a string representation of all transitions.
     * @returns {string} A comma-separated string of all transitions.
     */
    asString () {
        return this.propertiesAsList().map(t => t.asString()).join(", ");
    }

    /**
     * @description Synchronizes the transitions to the associated DomView.
     * @returns {DomTransitions} The current DomTransitions instance.
     */
    syncToDomView () {
        this.domView().justSetTransition(this.asString());
        return this;
    }

    /**
     * @description Synchronizes the transitions from the associated DomView.
     * @returns {DomTransitions} The current DomTransitions instance.
     */
    syncFromDomView () {
        this.setProperties({})

        const s = this.domView().transition()

        if (s !== "") {
            const transitionStrings = s.split(",")

            transitionStrings.forEach((tString) => {
                const t = DomTransition.clone().setFromString(tString)
                this.properties()[t.property()] = t
            })
        }

        return this
    }
}.initThisClass());