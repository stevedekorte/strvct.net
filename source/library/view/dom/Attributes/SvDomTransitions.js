"use strict";

/**
 * @module library.view.dom.Attributes
 */

/**
 * @class SvDomTransitions
 * @extends ProtoClass
 * @classdesc
 * SvDomTransition
 *
 * Example use in a SvDomView:
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
(class SvDomTransitions extends ProtoClass {
    /**
     * @description Initializes the prototype slots for the SvDomTransitions class.
     */
    initPrototypeSlots () {
        /**
         * @member {Object} properties - JSON Object to store transition properties.
         * @category Data
         */
        {
            const slot = this.newSlot("properties", null);
            slot.setSlotType("Object");
        }
        /**
         * @member {SvDomView} domView - The associated SvDomView instance.
         * @category Association
         */
        {
            const slot = this.newSlot("domView", null);
            slot.setSlotType("SvDomView");
        }
    }

    /**
     * @description Initializes the SvDomTransitions instance.
     * @category Initialization
     */
    init () {
        super.init();
        this.setProperties({});
    }

    /**
     * @description Retrieves or creates a SvDomTransition for a given property name.
     * @param {string} aName - The name of the transition property.
     * @returns {SvDomTransition} The SvDomTransition instance for the given property.
     * @category Accessor
     */
    at (aName) {
        const d = this.properties();
        if (!Object.hasOwn(d, name)) {
            d[name] = SvDomTransition.clone().setProperty(aName).setTransitions(this);
        }
        return d[name];
    }

    /**
     * @description Returns an array of all SvDomTransition instances.
     * @returns {Array} An array of SvDomTransition instances.
     * @category Data
     */
    propertiesAsList () {
        return Object.values(this.properties());
    }

    /**
     * @description Returns a string representation of all transitions.
     * @returns {string} A comma-separated string of all transitions.
     * @category Conversion
     */
    asString () {
        return this.propertiesAsList().map(t => t.asString()).join(", ");
    }

    /**
     * @description Synchronizes the transitions to the associated SvDomView.
     * @returns {SvDomTransitions} The current SvDomTransitions instance.
     * @category Synchronization
     */
    syncToDomView () {
        this.domView().justSetTransition(this.asString());
        return this;
    }

    /**
     * @description Synchronizes the transitions from the associated SvDomView.
     * @returns {SvDomTransitions} The current SvDomTransitions instance.
     * @category Synchronization
     */
    syncFromDomView () {
        this.setProperties({});

        const s = this.domView().transition();

        if (s !== "") {
            const transitionStrings = s.split(",");

            transitionStrings.forEach((tString) => {
                const t = SvDomTransition.clone().setFromString(tString);
                this.properties()[t.property()] = t;
            });
        }

        return this;
    }
}.initThisClass());
