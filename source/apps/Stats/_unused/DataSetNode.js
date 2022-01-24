"use strict";

/*
    
    DataSetNode


*/

getGlobalThis().DataSetNode = class DataSetNode extends BMStorableNode {
    

    initPrototype () {
        //this.newSlot("stats", null)

    }

    init () {
        super.init()
        this.setTitle("DataSetNode")
        //this.setNodeCanReorderSubnodes(true)
        //this.addAction("add")
        return this
    } 

	csvToDictRows(table) {
		// columns and data arrays
		const columnNames = table.columns
		return table.data.map(r => {
			const dict = {}
			for (let i = 0; i < columnNames.length; i++) {
				const columnName = columnNames[i]
				dict[columnName] = r[i]
			}
			return dict
		})
    }
    
    setupDictRows () {
		const us = window.us_counties_20m
		//const data = getGlobalThis().data_csv
		//ready(null, getGlobalThis().us_json, getGlobalThis().data_csv)


		const selectedFeatures = us.features //.filter(f => f.properties.STATE === "06")

		const dictRows = this.csvToDictRows(kinsa_CA_data)
		const geoIdToValue = {}
		let maxValue = 0
		let minValue = 0
		dictRows.forEach(row => {
			const v = row.observed_ili
			const geoId = "0500000US" + row.region_id
			if (v) {
				if (row.date === "2020-02-16") {
					geoIdToValue[geoId] = v
					//console.log(geoId + ":" + v)
					maxValue = Math.max(maxValue, v)
					minValue = Math.min(minValue, v)
				}
			}
        })

		console.log("maxValue:", maxValue)
        console.log("minValue:", minValue)
        
        return this
    }
    
}.initThisClass()
