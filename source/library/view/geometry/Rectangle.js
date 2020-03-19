"use strict"

/*
    Rectangle

    Class to represent a rectangle.

    NOTES

    For top & bottom, we assume we are using screen coordinates so:

        top = x
    
    and:

        bottom = x + height

*/

window.Rectangle = class Rectangle extends ProtoClass {
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
        u.origin().setX(Math.min(o1.x(), o2.x()))
        u.origin().setY(Math.min(o1.y(), o2.y()))
        const mx = Math.min(m1.x(), m2.x())
        const my = Math.min(m1.y(), m2.y())
        u.setWidth(mx - u.origin().x())
        u.setHeight(my - u.origin().y())
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

    // width 

    setWidth (w) {
        this.size().setX(w)
        return this
    }

    width () {
        return this.size().x();
    }

    // height

    setHeight (h) {
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

}.initThisClass()
