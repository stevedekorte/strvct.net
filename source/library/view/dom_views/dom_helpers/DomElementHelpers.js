"use strict";

/*
`
    Helper functions for DOM elements / nodes.
    Mostly for use inside DomView.
    Not for general consumption as elements typically shouldn't be interacted with directly. 

*/

//Object.defineSlots(Element.prototype, {
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

/*
getGlobalThis().DomElement_atInsertElement = function (el, index, child) {
    const children = el.children
    
    if (index < children.length) {
        el.insertBefore(child, children[index])
        return
    }
    
    if (index === children.length) {
        el.appendChild(child)
        return
    }
    
    throw new Error("invalid dom child index")
}

getGlobalThis().DomElement_description = function (element) {
    let s = false

    if (element === window) {
        s = "window"
    }

    if (!s) {
        s = element.getAttribute("id")
    }

    if (!s) {
        s = element.getAttribute("class")
    }

    if (!s) {
        s = element.tagName
    }

    return s
}

getGlobalThis().Element_setStyleIncludingDecendants = function(e, k, v) {
    if (e.style) {
        e.style[k] = v
    }
    
    for(let i = 0; i < e.childNodes.length; i ++) {
        const child = e.childNodes[i]
        Element_setStyleIncludingDecendants(child, k, v)
    }
    
}
*/