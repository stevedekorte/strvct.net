"use strict";

/*
`
    Helper methods DOM nodes.
    Mostly for use inside DomView.
    Not for general consumption as elements typically shouldn't be interacted with directly. 

*/

if (getGlobalThis()["Node"]) { // DOM Node

    Object.defineSlots(Node.prototype, {

        // --- weakref to domView ---

        _domViewWeakRef: null,

        setDomView: function (aView) {
            this._domViewWeakRef = aView ? new WeakRef(aView) : null;
            return this
        },

        domView: function () { 
            const ref = this._domViewWeakRef;
            const v = ref ? ref.deref() : undefined;
            return v
        },

        // --- children ---

        moveChildrenTo (e) {
            while (this.firstChild) {
                e.appendChild(this.firstChild);
            }
        },

        atInsertElement: function (index, child) {
            const children = this.children
            
            if (index < children.length) {
                this.insertBefore(child, children[index])
                return
            }
            
            if (index === children.length) {
                this.appendChild(child)
                return
            }
            
            throw new Error("invalid dom child index")
        },

        // --- description ---

        description: function () {
            let s = false
        
            if (this === window) {
                s = "window"
            }
        
            if (!s) {
                s = this.getAttribute("id")
            }
        
            if (!s) {
                s = this.getAttribute("class")
            }
        
            if (!s) {
                s = this.tagName
            }
        
            return s
        },

        // --- forEach ---

        forEachChild (fn) {
            for(let i = 0; i < this.childNodes.length; i ++) {
                const child = this.childNodes[i]
                fn(child)
            }
        },
        
        forEachDecendant: function (fn) {
            this.forEachChild(child => {
                fn(child)
                child.forEachDecendant(fn)
            })
        },

        forEachAncestor: function (fn) {
            if (this.parentNode) {
                fn(this.parentNode)
                this.parentNode.forEachAncestor(fn)
            }
        },

        hasAncestor: function (anElement) {
            if (this.parentNode) {
                if (this.parentNode === anElement) {
                    return true
                }

                return this.parentNode.hasAncestor(fn)
            }

            return false
        }, 

        // --- style ---

        copyComputedStyleFrom: function (e) {
            debugger; // getComputedStyle can force a reflow
            const style = window.getComputedStyle(e, null).cssText;
            this.style.cssText = style;
            return this
        },

        copyStyleFrom: function (e) {
            const style = e.style.cssText;
            this.style.cssText = style;
            return this
        },

        // --- set / remove attributes ---

        copyAttributesFrom: function (e) {
            for (const attr of e.attributes) {
                if (attr.namespace) {
                    this.setAttributeNS(attr.namespace, attr.name, attr.value)
                } else {
                    this.setAttribute(attr.name, attr.value)
                }
            }

            return this
        },

        attributesMap: function () {
            const map = new Map()
            for (const attr of this.attributes) {
                map.set(attr.name, attr.value)
            }
            return map
        },

        setAttributesMap: function (map) {
            if (this.setAttribute) {
                map.forEachKV((k, v) => {
                    this.setAttribute(k, v)
                })
            }
        },

        removeAttributes: function (names) {
            if (this.removeAttribute) {
                names.forEach(k => this.removeAttribute(k))
            }
        },
        
        setAttributesAndRemoveFromDecendants: function (attributeMap) {
            this.setAttributesMap(attributeMap)
            const names = attributeMap.keysArray()
            this.forEachDecendant(e => {
                e.removeAttributes(names)
            })
        },

        // --- layers ---

        addSvgGroupLayer: function () {
            const xmlns = "http://www.w3.org/2000/svg";
            const symbol = document.createElementNS(xmlns, "g");
            //const symbol = document.createElement("g");
            this.moveChildrenTo(symbol)
            this.appendChild(symbol)
            return symbol
        },

        containsPointXY: function (x, y) {
            // this assumes ancestors geogrphically contain descendant elements
            // which isn't always the case, but document.elementFromPoint might typically clip 
            // subviews such that this is usually true
            const topElement = document.elementFromPoint(x, y)
            if (topElement === this) {
                return true
            }
            return topElement.hasAncestor(this)
        }

    })

}