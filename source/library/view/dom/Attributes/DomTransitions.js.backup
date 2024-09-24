"use strict";

/*

    DomTransition
         
    Example use in a DomView:

            aDomView.transitions().at("opacity").updateDuration("0.3s")

        updates the opacity time without changing other transition settings
        

    NOTES:

        CSS transition value example:
        
            transition: width 2s linear 1s, height 2s ease 1s; 
        
        1st time value is the duration, 
        2nd time value is the delay


*/


(class DomTransitions extends ProtoClass {
    initPrototypeSlots () {
        {
            const slot = this.newSlot("properties", null);
            slot.setSlotType("Object"); // JSON Object
        }
        {
            const slot = this.newSlot("domView", null);
            slot.setSlotType("DomView");
        }
    }

    init () {
        super.init();
        this.setProperties({});
    }

    at (aName) {
        const d = this.properties();
        if (!d.hasOwnProperty(name)) {
            d[name] = DomTransition.clone().setProperty(aName).setTransitions(this);
        }
        return d[name];
    }

    propertiesAsList () {
        return Object.values(this.properties());
    }

    asString () {
        return this.propertiesAsList().map(t => t.asString()).join(", ");
    }

    syncToDomView () {
        //console.log(".setTransition('" + this.asString() + "')");
        this.domView().justSetTransition(this.asString());
        return this;
    }

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


