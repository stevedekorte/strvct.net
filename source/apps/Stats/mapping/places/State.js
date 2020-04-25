"use strict"

/*
    
    State


*/

window.State = class State extends Place {

    initPrototype () {
        this.newSlot("dict", null)
        this.newSlot("abbreviation", null)
		this.newSlot("fips", null)
		
        this.newSlot("counties", null)
    }

    init () {
        super.init()
		this.setCounties(Counties.clone())
		this.addSubnodeAt(this.counties(), 0)
		this.setSubplacesNode(this.counties())
        return this
	} 

	setDict (aDict) {
		this._dict = aDict
		this.setName(aDict.name)
		this.setAbbreviation(aDict.abbreviation)
		this.setFips(aDict.fips)
		return this
	}

	/*
	subtitle () {
		return this.abbreviation()
	}
	*/
    
}.initThisClass()
