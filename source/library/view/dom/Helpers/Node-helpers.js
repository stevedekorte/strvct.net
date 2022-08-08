"use strict";

/*
`
    Helper methods DOM nodes.
    Mostly for use inside DomView.
    Not for general consumption as elements typically shouldn't be interacted with directly. 

*/

if (getGlobalThis()["Node"]) {

    Object.defineSlots(Node.prototype, {

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

        // --------------

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
        
        setStyleIncludingDecendants: function(k, v) {
            if (this.style) {
                this.style[k] = v
            }
            
            for(let i = 0; i < this.childNodes.length; i ++) {
                const child = this.childNodes[i]
                child.setStyleIncludingDecendants(k, v)
            }
        }

    })

}