"use strict"

/*

    JsonTable

*/

window.JTable = class JTable extends BMNode {
    
    static initThisClass () {
        super.initThisClass()
		return this
    }
    
    initPrototype () {
        this.newSlot("json", null)
    }

    init () {
        super.init()
        this.setTitle("Table")
        this.setNodeMinWidth(600)
        this.setNoteIsSubnodeCount(true)

        
        return this
    }


    setupSubnodes () {
        const json = this.json()

        const columnNames = json.columns
        const rowData = json.data 
        rowData.forEach(rd => {
            const newRow = JsonRow
        })

        return this
    }

}.initThisClass()


