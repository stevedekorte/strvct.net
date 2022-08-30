"use strict";

/*

    DomTextTapeMeasure

    Used to measure rendered text dimensions given a string and a style.
    
    Example uses:

            const size1 = DomTextTapeMeasure.shared().sizeOfCssClassWithHtmlString(this.elementClassName(), text);
            const h = size1.height;

            const size2 = DomTextTapeMeasure.shared().sizeOfElementWithHtmlString(domElement, text);
            const w = size2.width;

*/

(class DomTextTapeMeasure extends ProtoClass {
    
    initPrototypeSlots () {
        this.newSlot("idName", "DomTextTapeMeasure")
        this.newSlot("stylesToCopy", [
            "fontSize",
            "fontStyle", 
            "fontWeight", 
            "fontFamily",
            "lineHeight", 
            "textTransform", 
            "letterSpacing"
        ])
        this.newSlot("cache", new Map())
        this.newSlot("cacheKeys", new Array())
        this.newSlot("maxCacheKeys", 100)
    }
	
    testElement () {
        if (!this._testElement) {
            this._testElement = this.createTestElement()
            /*
            if (!document.getElementById(this.idName())) {
                throw new Error("missing element '" + this.idName() + "'")
            }
            */
        }
        return this._testElement
    }
	
    createTestElement () {
        const e = document.createElement("div");
	    e.setAttribute("id", this.idName());
        e.style.display = "block";
        e.style.position = "absolute";
        e.style.width = "auto";
        e.style.left = -1000;
        e.style.top  = -1000;
        e.style.visibility = "hidden";
        document.body.appendChild(e);
        return e		
    }

    addToCache (k, v) {
        const keys = this.cacheKeys()
        
        if (keys.length > this.maxCacheKeys()) {
            const oldKey = keys.shift() // first in, first out
            this.cache().delete(oldKey)
        }

        this.cache().set(k, v)
        keys.push(k)
        console.log(this.type() + " caching: " + keys.length)
    }

    sizeOfElementWithHtmlString (element, text) {
        if (this.cache().has(text)) {
            return this.cache().get(text)
        }

        const e = this.testElement()
		
        this.stylesToCopy().forEach(function (styleName) {
            const v = element.style[styleName]
            if (v) {
                e.style[styleName] = v
            } else {
                delete e.style[styleName]
            }
        })
		
        e.innerHTML = element.innerHTML
		
        const width = (e.clientWidth + 1) 
        const height = (e.clientHeight + 1) 
        this.clean()

        const result = { width: width, height: height }
        this.addToCache(text, result)
        return result
    }
	
    sizeOfCssClassWithHtmlString (elementClassName, text) { 
        if (this.cache().has(text)) {
            return this.cache().get(text)
        }

        const e = this.testElement()
        this.clean()
        e.className = elementClassName
        e.innerHTML = text
		
        const width = (e.clientWidth + 1) 
        const height = (e.clientHeight + 1) 
        e.innerHTML = ""

        const result = { width: width, height: height }
        this.addToCache(text, result)
        return result
    }
	
    clean () {
        const e = this.testElement()
        e.innerHTML = ""
        e.className = ""
        this.stylesToCopy().forEach(styleName => delete e.style[styleName] )
        return this	
    }
	
}.initThisClass());
