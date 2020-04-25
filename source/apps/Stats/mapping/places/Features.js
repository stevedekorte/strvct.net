"use strict"

/*
    
    Features


*/

window.Features = class Features extends BMNode {

    initPrototype () {
        this.newSlot("features", null)
    }

    init () {
        super.init()

        return this
    } 
    
    allCoordinates () {
        const coords = [] // array of points like: [x, y]
        this.features().forEach((f) => {
            f.geometry.coordinates.forEach((coordSet) => {
                coordSet.forEach((coord) => coords.push(coord))
            })
        })
        return coords
    }

    featureBounds () {
        if (!this._featureBounds) {
            this._featureBounds = this.calcBounds()
        }
        return this._featureBounds
    }

    calcBounds () {
        const features = this.features()
        const coords = this.allCoordinates()
        const xs = coords.map(p => p[0])
        const ys = coords.map(p => p[1])
        const x1 = xs.minValue()
        const x2 = xs.maxValue()
        const y1 = ys.minValue()
        const y2 = ys.maxValue()
        const bounds = Rectangle.clone()
        bounds.origin().set(x1, y1)
        bounds.setWidth(x2 - x1, y2 - y1)
        return bounds
    }
    
}.initThisClass()
