/**
 * @module library.view.dom.Helpers
 */

/**
 * Helper methods for DOM nodes.
 * Mostly for use inside DomView.
 * Not for general consumption as elements typically shouldn't be interacted with directly.
 * @class
 */
"use strict";

if (getGlobalThis()["Node"]) { // DOM Node

    Object.defineSlots(Node.prototype, {

        /**
         * @private
         */
        _domViewWeakRef: null,

        /**
         * Sets the DOM view for the node.
         * @param {Object} aView - The view to set.
         * @returns {Node} The node instance.
         */
        setDomView: function (aView) {
            this._domViewWeakRef = aView ? new WeakRef(aView) : null;
            return this
        },

        /**
         * Gets the DOM view for the node.
         * @returns {Object|undefined} The DOM view or undefined if not set.
         */
        domView: function () { 
            const ref = this._domViewWeakRef;
            const v = ref ? ref.deref() : undefined;
            return v
        },

        /**
         * Removes all child nodes from the current node.
         * @returns {Node} The node instance.
         */
        removeAllChildren: function () {
            while (this.firstChild) {
                this.removeChild(this.lastChild);
            }
            return this
        },

        /**
         * Moves all child nodes to another element.
         * @param {Node} e - The target element to move children to.
         */
        moveChildrenTo: function (e) {
            while (this.firstChild) {
                e.appendChild(this.firstChild);
            }
        },

        /**
         * Inserts a child element at a specific index.
         * @param {number} index - The index at which to insert the child.
         * @param {Node} child - The child element to insert.
         * @throws {Error} If the index is invalid.
         */
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

        /**
         * Returns a description of the node.
         * @returns {string} A description of the node.
         */
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

        /**
         * Executes a function for each child node.
         * @param {Function} fn - The function to execute for each child.
         */
        forEachChild (fn) {
            for(let i = 0; i < this.childNodes.length; i ++) {
                const child = this.childNodes[i]
                fn(child)
            }
        },
        
        /**
         * Executes a function for each descendant node.
         * @param {Function} fn - The function to execute for each descendant.
         */
        forEachDecendant: function (fn) {
            this.forEachChild(child => {
                fn(child)
                child.forEachDecendant(fn)
            })
        },

        /**
         * Executes a function for each ancestor node.
         * @param {Function} fn - The function to execute for each ancestor.
         */
        forEachAncestor: function (fn) {
            const pn = this.parentNode()
            if (pn) {
                fn(pn)
                pn.forEachAncestor(fn)
            }
        },

        /**
         * Checks if the node has a specific ancestor.
         * @param {Node} anElement - The potential ancestor to check.
         * @returns {boolean} True if the element is an ancestor, false otherwise.
         */
        hasAncestor: function (anElement) {
            const pn = this.parentNode()
            if (pn) {
                if (pn === anElement) {
                    return true
                }

                return pn.hasAncestor(anElement)
            }

            return false
        }, 

        /**
         * Copies the computed style from another element.
         * @param {Node} e - The element to copy the style from.
         * @returns {Node} The node instance.
         */
        copyComputedStyleFrom: function (e) {
            debugger; // getComputedStyle can force a reflow
            const style = window.getComputedStyle(e, null).cssText;
            this.style.cssText = style;
            return this
        },

        /**
         * Copies the style from another element.
         * @param {Node} e - The element to copy the style from.
         * @returns {Node} The node instance.
         */
        copyStyleFrom: function (e) {
            const style = e.style.cssText;
            this.style.cssText = style;
            return this
        },

        /**
         * Copies attributes from another element.
         * @param {Node} e - The element to copy attributes from.
         * @returns {Node} The node instance.
         */
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

        /**
         * Returns a map of the node's attributes.
         * @returns {Map} A map of attribute names to values.
         */
        attributesMap: function () {
            const map = new Map()
            for (const attr of this.attributes) {
                map.set(attr.name, attr.value)
            }
            return map
        },

        /**
         * Sets attributes from a map.
         * @param {Map} map - A map of attribute names to values.
         */
        setAttributesMap: function (map) {
            if (this.setAttribute) {
                map.forEachKV((k, v) => {
                    this.setAttribute(k, v)
                })
            }
        },

        /**
         * Removes specified attributes from the node.
         * @param {string[]} names - An array of attribute names to remove.
         */
        removeAttributes: function (names) {
            if (this.removeAttribute) {
                names.forEach(k => this.removeAttribute(k))
            }
        },
        
        /**
         * Sets attributes on this node and removes them from descendants.
         * @param {Map} attributeMap - A map of attribute names to values.
         */
        setAttributesAndRemoveFromDecendants: function (attributeMap) {
            this.setAttributesMap(attributeMap)
            const names = attributeMap.keysArray()
            this.forEachDecendant(e => {
                e.removeAttributes(names)
            })
        },

        /**
         * Adds an SVG group layer to the node.
         * @returns {Node} The newly created SVG group element.
         */
        addSvgGroupLayer: function () {
            const xmlns = "http://www.w3.org/2000/svg";
            const symbol = document.createElementNS(xmlns, "g");
            //const symbol = document.createElement("g");
            this.moveChildrenTo(symbol)
            this.appendChild(symbol)
            return symbol
        },

        /**
         * Checks if the node contains a specific point.
         * @param {number} x - The x-coordinate of the point.
         * @param {number} y - The y-coordinate of the point.
         * @returns {boolean} True if the node contains the point, false otherwise.
         */
        containsPointXY: function (x, y) {
            // this assumes ancestors geographically contain descendant elements
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