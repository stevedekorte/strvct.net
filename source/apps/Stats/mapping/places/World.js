"use strict";

/*
    
    World


*/

(class World extends Place {
    
    initPrototype () {
        this.newSlot("countries", null)

    }

    init () {
        super.init()
        this.setTitle("World")
        this.setCountries(Countries.clone())
        this.addSubnodeAt(this.countries(), 0)
        //this.setFeatures(window.world_100m.features)
        this.setFeatures([])
        //this.setup()
        return this
    } 
    
    prepareForFirstAccess () {
        super.prepareForFirstAccess()
        this.setup()
    }

    setup () {
        const countries = []
        window.world_100m.features.forEach((feature) => {
            const name = feature.properties.name
            let aClass = Country
            const className = name.replaceAll(" ", "")
            if (window[className]) {
                aClass = window[className]
            }

            if (className === "UnitedStates") {
                const country = aClass.clone().setFeatures([feature]).setName(name)
                countries.push(country)
            }
        })

        countries.sortPerform("name")
        countries.forEach(country => this.countries().addSubnode(country))
        return this
    }

    allFeatures () {
        return this.features()
    }

}.initThisClass())
