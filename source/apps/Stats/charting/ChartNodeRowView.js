"use strict"

/*
    
    ChartNodeRowView


*/

window.ChartNodeRowView = class ChartNodeRowView extends BrowserRow {

    initPrototype() {
        this.newSlot("mapWidthPx", 960)
        this.newSlot("mapHeightPx", 200)
        this.newSlot("svg", null)
        this.newSlot("isSetup", false)
    }

    init() {
        super.init()

        return this
    }

    setupIfReadyAndNeeded() {
        if (!this.isSetup() && this.isReadyToSetup() && this.isInDocument()) {
            //let bounds = this.node().featureBounds()
            this.contentView().setMinHeightPx(this.mapHeightPx())
            this.contentView().setMinWidthPx(this.mapWidthPx())
            this.setup()
        }
    }

    isReadyToSetup() {
        return !Type.isNullOrUndefined(this.node()) && !Type.isNullOrUndefined(this.parentView()) && this.node().data()
    }

    setup() {
        this.setupSvg()
        this.setIsSetup(true)
    }

    isInDocument() {
        const id = this.contentView().element().id
        return !Type.isNullOrUndefined(document.getElementById(id))
    }

    syncFromNode() {
        super.syncFromNode()
        setTimeout(() => {
            this.setupIfReadyAndNeeded() // can get geoJson from node now
        }, 10)
    }

    setupSvg () {
        const w = this.mapWidthPx()
        const h = this.mapHeightPx()
        const margin = 35
        //var inFormat = d3.time.format("%Y-%m-%d");


        const id = this.contentView().escapedElementId()
        const svg = dimple.newSvg("#" + id, w, h);

        let data = this.node().data()
        data = dimple.filterData(data, "region_name", "Yuma County")

        console.log(JSON.stringify(data.first(), null, 2))
        console.log(JSON.stringify(data[100], null, 2))

        const myChart = new dimple.chart(svg, data);
        myChart.setBounds(margin*2, margin, w - margin*3, h - margin*2);

        myChart.defaultColors = [
            new dimple.color("yellow", "yellow", 3), // blue
            new dimple.color("#3498db", "#2980b9", 1), // blue
            new dimple.color("#e74c3c", "#c0392b", 1), // red
            new dimple.color("#2ecc71", "#27ae60", 1), // green
            new dimple.color("#9b59b6", "#8e44ad", 1), // purple
            new dimple.color("#e67e22", "#d35400", 1), // orange
            new dimple.color("#f1c40f", "#f39c12", 1), // yellow
            new dimple.color("#1abc9c", "#16a085", 1), // turquoise
            new dimple.color("#95a5a6", "#7f8c8d", 1)  // gray
        ];
        //myChart.addLegend(60, 10, 500, 20, "right");

        const xAxis = myChart.addTimeAxis("x", "date", "%Y-%m-%d", "%Y-%m");
        this.preDrawStyleOnAxis(xAxis)
        xAxis.addOrderRule("date");
        xAxis.title = ""
        //d3.timeFormat("%B %d, %Y");

        const yAxis = myChart.addMeasureAxis("y", this.node().yColumnNames().first());
        this.preDrawStyleOnAxis(yAxis)
        yAxis.ticks = 3
        yAxis.showGridlines = false; 
        let series = myChart.addSeries(null, dimple.plot.line);
        series.lineMarkers = false
        

        myChart.draw(); // -------------------------------------------------------------------------------------

        this.postDrawStyleOnAxis(xAxis)
        this.postDrawStyleOnAxis(yAxis)

        return this
    }

    preDrawStyleOnAxis (anAxis) {
        anAxis.fontSize = "9px" //this.getComputedCssAttribute("font-size")
        anAxis.fontFamily = this.getComputedCssAttribute("font-family")
        return this
    }

    postDrawStyleOnAxis (anAxis) {
        const opacity = 0.75

        anAxis.titleShape.attr("font-weight", "normal")
        anAxis.titleShape.attr("stroke", "none");
        anAxis.titleShape.attr("fill", "currentColor");
        anAxis.titleShape.style("opacity", opacity);

        anAxis.shapes.selectAll("text").attr("fill", "currentColor").style("opacity", opacity);
        anAxis.shapes.selectAll("path.dimple-custom-axis-line").style("stroke", "currentColor").style("opacity", opacity);
        anAxis.shapes.selectAll("line").style("stroke", "currentColor").style("opacity", opacity);
        return this
    }



}.initThisClass()


