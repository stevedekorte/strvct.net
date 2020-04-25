"use strict"

/*
    
    UnitedStates


*/



const statesArray = [
	{
	  "name": "Delaware",
	  "abbreviation": "DE",
	  "fips": "10"
	},
	{
	  "name": "District of Columbia",
	  "abbreviation": "DC",
	  "fips": "11"
	},
	{
	  "name": "Florida",
	  "abbreviation": "FL",
	  "fips": "12"
	},
	{
	  "name": "Georgia",
	  "abbreviation": "GA",
	  "fips": "13"
	},
	{
	  "name": "Hawaii",
	  "abbreviation": "HI",
	  "fips": "15"
	},
	{
	  "name": "Idaho",
	  "abbreviation": "ID",
	  "fips": "16"
	},
	{
	  "name": "Illinois",
	  "abbreviation": "IL",
	  "fips": "17"
	},
	{
	  "name": "Indiana",
	  "abbreviation": "IN",
	  "fips": "18"
	},
	{
	  "name": "Iowa",
	  "abbreviation": "IA",
	  "fips": "19"
	},
	{
	  "name": "Kansas",
	  "abbreviation": "KS",
	  "fips": "20"
	},
	{
	  "name": "Kentucky",
	  "abbreviation": "KY",
	  "fips": "21"
	},
	{
	  "name": "Louisiana",
	  "abbreviation": "LA",
	  "fips": "22"
	},
	{
	  "name": "Maine",
	  "abbreviation": "ME",
	  "fips": "23"
	},
	{
	  "name": "Maryland",
	  "abbreviation": "MD",
	  "fips": "24"
	},
	{
	  "name": "Massachusetts",
	  "abbreviation": "MA",
	  "fips": "25"
	},
	{
	  "name": "Michigan",
	  "abbreviation": "MI",
	  "fips": "26"
	},
	{
	  "name": "Minnesota",
	  "abbreviation": "MN",
	  "fips": "27"
	},
	{
	  "name": "Mississippi",
	  "abbreviation": "MS",
	  "fips": "28"
	},
	{
	  "name": "Missouri",
	  "abbreviation": "MO",
	  "fips": "29"
	},
	{
	  "name": "Montana",
	  "abbreviation": "MT",
	  "fips": "30"
	},
	{
	  "name": "Nebraska",
	  "abbreviation": "NE",
	  "fips": "31"
	},
	{
	  "name": "Nevada",
	  "abbreviation": "NV",
	  "fips": "32"
	},
	{
	  "name": "New Hampshire",
	  "abbreviation": "NH",
	  "fips": "33"
	},
	{
	  "name": "New Jersey",
	  "abbreviation": "NJ",
	  "fips": "34"
	},
	{
	  "name": "New Mexico",
	  "abbreviation": "NM",
	  "fips": "35"
	},
	{
	  "name": "New York",
	  "abbreviation": "NY",
	  "fips": "36"
	},
	{
	  "name": "North Carolina",
	  "abbreviation": "NC",
	  "fips": "37"
	},
	{
	  "name": "North Dakota",
	  "abbreviation": "ND",
	  "fips": "38"
	},
	{
	  "name": "Ohio",
	  "abbreviation": "OH",
	  "fips": "39"
	},
	{
	  "name": "Oklahoma",
	  "abbreviation": "OK",
	  "fips": "40"
	},
	{
	  "name": "Oregon",
	  "abbreviation": "OR",
	  "fips": "41"
	},
	{
	  "name": "Pennsylvania",
	  "abbreviation": "PA",
	  "fips": "42"
	},
	{
	  "name": "Rhode Island",
	  "abbreviation": "RI",
	  "fips": "44"
	},
	{
	  "name": "South Carolina",
	  "abbreviation": "SC",
	  "fips": "45"
	},
	{
	  "name": "South Dakota",
	  "abbreviation": "SD",
	  "fips": "46"
	},
	{
	  "name": "Tennessee",
	  "abbreviation": "TN",
	  "fips": "47"
	},
	{
	  "name": "Texas",
	  "abbreviation": "TX",
	  "fips": "48"
	},
	{
	  "name": "Utah",
	  "abbreviation": "UT",
	  "fips": "49"
	},
	{
	  "name": "Vermont",
	  "abbreviation": "VT",
	  "fips": "50"
	},
	{
	  "name": "Virginia",
	  "abbreviation": "VA",
	  "fips": "51"
	},
	{
	  "name": "Washington",
	  "abbreviation": "WA",
	  "fips": "53"
	},
	{
	  "name": "West Virginia",
	  "abbreviation": "WV",
	  "fips": "54"
	},
	{
	  "name": "Wisconsin",
	  "abbreviation": "WI",
	  "fips": "55"
	},
	{
	  "name": "Wyoming",
	  "abbreviation": "WY",
	  "fips": "56"
	},
	{
	  "name": "American Samoa",
	  "abbreviation": "AS",
	  "fips": "60"
	},
	{
	  "name": "Guam",
	  "abbreviation": "GU",
	  "fips": "66"
	},
	{
	  "name": "Puerto Rico",
	  "abbreviation": "PR",
	  "fips": "72"
	},
	{
	  "name": "Virgin Islands",
	  "abbreviation": "VI",
	  "fips": "78"
	},
	{
	  "name": "Alabama",
	  "abbreviation": "AL",
	  "fips": "01"
	},
	{
	  "name": "Alaska",
	  "abbreviation": "AK",
	  "fips": "02"
	},
	{
	  "name": "Arizona",
	  "abbreviation": "AZ",
	  "fips": "04"
	},
	{
	  "name": "Arkansas",
	  "abbreviation": "AR",
	  "fips": "05"
	},
	{
	  "name": "California",
	  "abbreviation": "CA",
	  "fips": "06"
	},
	{
	  "name": "Colorado",
	  "abbreviation": "CO",
	  "fips": "08"
	},
	{
	  "name": "Connecticut",
	  "abbreviation": "CT",
	  "fips": "09"
	}
  ]


window.UnitedStates = class UnitedStates extends Country {
	
	static initThisClass () {
        super.initThisClass()
        this.setIsSingleton(true)
		return this
	}
	
    initPrototype () {
        this.newSlot("states", null)
    }

    init () {
		super.init()
		this.setStates(States.clone())
		this.addSubnodeAt(this.states(), 0)
		this.setSubplacesNode(this.states())
		this.setFeatureCollection(window.us_outline_20m)
        this.setup()
		return this
	} 

	/*
	prepareForFirstAccess () {
        super.prepareForFirstAccess()
        this.setup()
	}
	*/

	stateWithName (name) {
		return this.states().firstSubnodeWithTitle(name)
	}

	fipsToStateDict () {
		const dict = {}
		this.states().subnodes().forEach(state => dict[state.fips()] = state)
		return dict
	}

	stateWithFips (fips) {
		return this.states().subnodes().detect(state => state.fips() === fips)
	}

	setup () {

		// add states and features
        window.us_states_20m.features.forEach((feature) => {
            const name = feature.properties.NAME
            const country = State.clone().setFeatures([feature]).setName(name)
            this.states().addSubnode(country)
		})
		
		// setup state abbreviation and fips codes
		statesArray.forEach(stateDict => {
			const subnode = this.states().firstSubnodeWithTitle(stateDict.name)
			if (subnode) {
				subnode.setDict(stateDict)
			}
		})

		const fipsToStateDict = this.fipsToStateDict()

		// add counties to states

		const t1 = new Date().getTime()
		//console.log("size: ", window.us_counties_20m.features.length)
		const newSubnodes = []
		window.us_counties_20m.features.forEach((feature) => {
			const stateFips = feature.properties.STATE
			const state = fipsToStateDict[stateFips]
			assert(state)
			
			if (state) {
				const countyName = feature.properties.NAME
				//const test = BMNode.clone()
				const county = County.clone().setFeatures([feature]).setName(countyName)
				const counties = state.counties()
				counties.addSubnode(county)
			}
		})

		const t2 = new Date().getTime()
		const dt = (t2 - t1)/1000
		console.log(this.type() + " setup counties dt: " + dt + "s")

		this.states().subnodes().forEach(state => state.counties().makeSortSubnodesByTitle() )

        return this
    }
	
	
    
}.initThisClass()
