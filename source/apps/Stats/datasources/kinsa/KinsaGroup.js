"use strict";

/*

    KinsaGroup

*/

(class KinsaGroup extends BMNode {
    
    static initThisClass () {
        super.initThisClass()
		return this
    }
    
    initPrototype () {
        this.newSlot("urlResource", null)
        this.newSlot("mapNode", null)
        this.newSlot("chartNode", null)
        this.newSlot("minValue", null)
        this.newSlot("maxValue", null)
    }

    init () {
        super.init()
        this.setNodeMinWidth(270)
        this.setNoteIsSubnodeCount(false)

        this.setUrlResource(BMUrlResource.clone())
        this.addSubnode(this.urlResource())

        this.urlResource().setUrlDelegate(this)

        //this.setTable(JTable.clone())
        //this.addSubnode(this.table())

        const mapNode = GeoMapNode.clone()
        mapNode.setValueDelegate(this)
        this.setMapNode(mapNode)
        this.addSubnode(mapNode)

        {
            const chartNode = ChartNode.clone().setXColumnName("date").setYColumnNames(["observed_ili", "forecast_expected"]) //"observed_ili", 
            this.setChartNode(chartNode)
            this.addSubnode(chartNode)
        }

        return this
    }

    prepareForFirstAccess () {
        super.prepareForFirstAccess()
        this.load()
        return this
    }

    onUrlResourceComplete () {
        this.setupChart()
    }

    setupChart () {
        if (!this.jsonTable()) {
            return this
        }
        this.chartNode().setData(this.jsonTable())
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
    
    jsonTable () {
        if (!this._jsonTable) {
            const json = this.urlResource().asJson()
            if (json) {
                this._jsonTable = this.csvToDictRows(json)
            }

            /*
            const values = this.allValues()
            this.setMaxValue(values.maxValue())
            this.setMinValue(values.minValue())
            */
        }
        return this._jsonTable
    }

    valueColumnName () {
        return "forecast_expected"
    }

    regionData () {
        if (!this._regionData) {
            const jsonTable = this.jsonTable()
            //Object {region_id: "01043", region_name: "Cullman County", state: "AL", …}
            if (jsonTable) {
                this._regionData = {}
                jsonTable.forEach((row) => {
                    this._regionData[row.region_id] = row
                })
            }
        }
        return this._regionData
    }

    allValues () {
        return this.jsonTable().map(row => row[this.valueColumnName()])
    }

    valueForFeature (aFeature) {
        const regionData = this.regionData()

        if (regionData) {
            //Object {GEO_ID: "0500000US01001", STATE: "01", COUNTY: "001", …}
            const geo_id = aFeature.properties.GEO_ID
            const fips = geo_id.after("0500000US")
            const subregion = regionData[fips]
            if (!subregion) {
                return undefined 
            }
            const v = subregion[this.valueColumnName()]
            assert(!Type.isNullOrUndefined(v))
            const diff = this.maxValue() - this.minValue()
            if (diff === 0) { 
                return 0
            }
            v = (v - this.minValue()) / diff
            return v
        }
        return 0
    }

    setTitle (s) {
        super.setTitle(s)
        this.mapNode().setSelectedState(s)
        return this
    }

    subtitle () {
        return this.urlResource().subtitle()
        //return this.urlResource().isLoaded() ? "loaded" : ""
    }

    setupSubnodes () {
        return this
    }

    load () {
        this.urlResource().load()
        return this
    }

    loadIfCached () {
        this.urlResource().load()
        return this
    }

    refresh () {
        this.urlResource().refresh()
        return this
    }

    clear () {
        this.urlResource().clear()
        return this
    }

}.initThisClass())


