"use strict";

/*
    
    GeoMapNodeRowView


*/

(class GeoMapNodeRowView extends BrowserRow {
    
    initPrototype () {
        this.newSlot("mapWidthPx", 960)
        this.newSlot("mapHeightPx", 600)
        this.newSlot("svg", null)
        this.newSlot("toolTip", null)
        this.newSlot("isSetup", false)
        this.newSlot("zoomView", null)
        this.newSlot("zoomViewContent", null)
    }

    init () {
        super.init()
        this.setZoomView(BMZoomView.clone())
        this.contentView().addSubview(this.zoomView())

        const zc = DomView.clone()
        this.setZoomViewContent(zc)
        zc.setWidthPx(this.mapWidthPx())
        zc.setHeightPx(this.mapHeightPx())
        this.zoomView().addSubview(zc)
        return this
    } 

    setupIfReadyAndNeeded () {
        if (!this.isSetup() && this.isReadyToSetup() && this.isInDocument()) {
            //let bounds = this.node().featureBounds()
            this.contentView().setMinHeightPx(this.mapHeightPx())
            this.contentView().setMinWidthPx(this.mapWidthPx())
            this.setup()
        }
    }

    isReadyToSetup () {
        return !Type.isNullOrUndefined(this.node()) && !Type.isNullOrUndefined(this.parentView())
    }

    setup () {
        this.setupToolTip()
        this.setupParentsSvg()
        this.setupSvg()
        this.setIsSetup(true)
    }
    
    isInDocument () {
        const id = this.contentView().element().id
        return !Type.isNullOrUndefined(document.getElementById(id))
    }

    dsSelectedElement() {
        const id = this.zoomViewContent().escapedElementId()
        assert(id)
        const e = d3.select("#" + id)
        assert(e)
        return e
    }

    setupToolTip () {
        const e = this.dsSelectedElement()
        const tt = e.append("div")
			.attr("class", "tooltip")
            .style("opacity", 0);
        this.setToolTip(tt)
        return this
    }

    syncFromNode () {
        super.syncFromNode()
        setTimeout(() => {
            this.setupIfReadyAndNeeded() // can get geoJson from node now
        }, 10)
    }

    setupSvg () {

        const e = this.dsSelectedElement()
		const svg = e.append("svg")
			.attr("width", this.mapWidthPx())
			.attr("height", this.mapHeightPx())
            .style("position", "absolute");

        let geoJson = this.node().features()// needs this from node

        const self = this
        if (false) {
            svg.append("path")
                .datum({type: "FeatureCollection", features: geoJson})
                .attr("d", d3.geoPath().projection(d3.geoAlbers()))
                .style("stroke", "#ff0")
                .style("opacity", 0.95)
                .style("z-index", 2);
        } else {
            svg.append("g")
                .attr("class", "place")
                .selectAll("path")
                .data(geoJson)
                .enter().append("path")
                .attr("d", d3.geoPath().projection(d3.geoAlbers()))
                .style("stroke", "#ff0")
                .style("opacity", 0.95)
                .style("z-index", 2)
                .style("fill",   function (aFeature) { return self.fillColorForFeature(aFeature)}) // the fill function
                .on("mouseover", function (aFeature) { self.onMouseOverSvgElement(this, aFeature) })
                .on("mouseout",  function (aFeature) { self.onMouseOutSvgElement(this, aFeature) })
        }   
    }

    setupParentsSvg () {
        const e = this.dsSelectedElement()
		const svg = e.append("svg")
			.attr("width", this.mapWidthPx())
			.attr("height", this.mapHeightPx())
            .style("position", "absolute");

        let geoJson = this.node().allParentsFeatures()

        const self = this
        if (false) {
            svg.append("path")
                .datum({type: "FeatureCollection", features: geoJson})
                .attr("d", d3.geoPath().projection(d3.geoAlbers()))
                .style("stroke", "#aaa")
                .style("opacity", 0.5)
                .style("z-index", 1);
        } else {
            svg.append("g")
                .attr("class", "place")
                .selectAll("path")
                .data(geoJson)
                .enter().append("path")
                .attr("d", d3.geoPath().projection(d3.geoAlbers()))
                .style("stroke", "#ff0")
                .style("opacity", 0.95)
                .style("z-index", 2)
                .style("fill",   function (aFeature) { return self.fillColorForFeature(aFeature)}) // the fill function
                .on("mouseover", function (aFeature) { self.onMouseOverSvgElement(this, aFeature) })
                .on("mouseout",  function (aFeature) { self.onMouseOutSvgElement(this, aFeature) })
        }   
    }

    // --- mouse over features ---

    onMouseOverSvgElement (svgElement, aFeature) {
        this.highlightSvgElement(svgElement)
        //this.showToolTipOnFeature(aFeature)
    }

    onMouseOutSvgElement (svgElement, aFeature) {
        this.unhighlightSvgElement(svgElement)
        //this.hideToolTip()
    }

    // --- highlight ---

    highlightSvgElement (svgElement) {
        const sel = d3.select(svgElement);
        sel.moveToFront();
        svgElement._oldStyle = {
            "opacity": sel.style("opacity"),
            "stroke": sel.style("stroke"),
            "stroke-width": sel.style("stroke-width")
        }

        var t = d3.transition()
            .duration(0)
            .ease(d3.easeLinear);

        sel.transition(t)
            .style('opacity', 1)
            .style('stroke', 'blue')
            .style('stroke-width', 1.5);
    }

    unhighlightSvgElement (svgElement) {
        const sel = d3.select(svgElement);
        sel.moveToBack();

        
        const t = sel.transition().duration(0) //.style(svgElement._oldStyle);
        svgElement._oldStyle.ownForEachKV((k, v) => {
            t.style(k, v)
        })
    }

    // --- tool tip ---

    showToolTipOnFeature (aFeature) {
        let x = 100
        let y = 100
        const toolTip = this.toolTip()
        toolTip.transition().duration(0)
            .style("opacity", 1)
        toolTip.text(aFeature._info.name + ": " + aFeature._info.value)
            .style("left", (x + 30) + "px")
            .style("top", (y - 30) + "px");
    }

    hideToolTip () {
        this.toolTip().transition().duration(0).style("opacity", 0);
    }

    // ----------------

    fillColorForFeature (aFeature) {
        //const minValue = 0        
        //const maxValue = 1
        const r = this.node().valueForFeature(aFeature)
        if (Type.isUndefined(r)) {
            return "#222"
        }
        //const r = (v - minValue) / (maxValue - minValue)
        const skewedR = r*r*r
        const c = Math.floor(255 * skewedR)
        return "rgb(" + [c,c,c].join(",") + ")"
    }

}.initThisClass())


