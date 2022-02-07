"use strict";

/*
    Rectangle

    Class to represent a rectangle.

    NOTES

    For top & bottom, we assume we are using screen coordinates so:

        top = x
    
    and:

        bottom = x + height

*/

(class Rectangle extends ProtoClass {
    initPrototype () {
        this.newSlot("origin", null)
        this.newSlot("size", null)
    }

    init () {
        super.init()
        this.setOrigin(Point.clone())
        this.setSize(Point.clone())
        return this
    }

    duplicate () {
        return this.thisClass().clone().copyFrom(this)
    }

    copyFrom (aRect) {
        this.origin().copyFrom(aRect.origin())
        this.size().copyFrom(aRect.size())
        return this
    }
    
    containsPoint (p) {
        const a = p.isGreaterThanOrEqualTo(this.origin()) 
        const b = p.isLessThanOrEqualTo(this.maxPoint())
        return a && b
    }

    containsRectangle (r) {
        return r.origin().isGreaterThanOrEqualTo(this.origin()) && r.maxPoint().isLessThanOrEqualTo(this.maxPoint())
    }

    unionWith (r) {
        const u = Rectangle.clone()
        const o1 = this.origin()
        const o2 = r.origin()
        const m1 = this.maxPoint()
        const m2 = r.maxPoint()
        const minX = Math.min(o1.x(), o2.x())
        const minY = Math.min(o1.y(), o2.y())
        u.origin().setX(minX)
        u.origin().setY(minY)
        const maxX = Math.max(m1.x(), m2.x())
        const maxY = Math.max(m1.y(), m2.y())
        u.setWidth(maxX - minX)
        u.setHeight(maxY - minY)
        return u
    }

    maxPoint () {
        return this.origin().add(this.size())
    }

    asString () {
        return this.type() + "(" + this.origin().asString() + ", " + this.size().asString() + ")"
    }

    // x, y

    x () {
        return this.origin().x();
    }

    y () {
        return this.origin().y();
    }

    minX () {
        return this.x()
    }

    minY () {
        return this.y()
    }

    maxX () {
        return this.x() + this.width()
    }

    maxY () {
        return this.y() + this.height()
    }
    
    setMaxX (mx) {
        const w = mx - this.x()
        this.setWidth(w)
        return this
    }

    setMaxY (my) {
        const h = my - this.y()
        this.setHeight(h)
        return this
    }

    // width 

    setWidth (w) {
        assert(w >= 0)
        this.size().setX(w)
        return this
    }

    width () {
        return this.size().x();
    }

    // height

    setHeight (h) {
        assert(h >= 0)
        this.size().setY(h)
        return this
    }

    height () {
        return this.size().y();
    }

    // top, bottom

    top () {
        return this.y() 
    }

    bottom () {
        return this.y() + this.height() 
    }

    // left, right

    left () {
        return this.x() 
    }

    right () {
        return this.x() + this.width() 
    }

    makeBoundsOfPoints (points) {
        let minX = points[0].x()
        let maxX = points[0].x()
        let minY = points[0].y()
        let maxY = points[0].y()
        points.forEach((p) => {
            const x = p.x()
            const y = p.y()

            if (x < minX) {
                minX = x
            } else if (x > maxX) {
                maxX = x 
            }

            if (y < minY) {
                minY = y 
            } else if (y > maxY) {
                maxY = y
            }
        })
        this.origin().setX(minX).setY(minY)
        this.setMaxX(maxX)
        this.setMaxY(maxY)
        return this
    }

}.initThisClass());
