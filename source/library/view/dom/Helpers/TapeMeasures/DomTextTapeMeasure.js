/**
 * @module library.view.dom.Helpers.TapeMeasures
 */

/**
 * @class DomTextTapeMeasure
 * @extends ProtoClass
 * @classdesc Used to measure rendered text dimensions given a string and a style.
 *
 * Example uses:
 *
 *     const size1 = DomTextTapeMeasure.shared().sizeOfCssClassWithHtmlString(this.elementClassName(), text);
 *     const h = size1.height;
 *
 *     const size2 = DomTextTapeMeasure.shared().sizeOfElementWithHtmlString(domElement, text);
 *     const w = size2.width;
 *
 * TODO: move to using separate document
 */
(class DomTextTapeMeasure extends ProtoClass {

    /**
     * @description Initializes the prototype slots for the DomTextTapeMeasure class.
     */
    initPrototypeSlots () {
        {
            /**
             * @member {Document} document - The document object.
             * @category Document
             */
            const slot = this.newSlot("document", null);
            slot.setSlotType("Document");
        }
        {
            /**
             * @member {Element} testElement - The test element used for measurements.
             * @category Measurement
             */
            const slot = this.newSlot("testElement", null);
            slot.setSlotType("Element");
        }

        {
            /**
             * @member {Array} stylesToCopy - Array of style properties to copy.
             * @category Styling
             */
            const slot = this.newSlot("stylesToCopy", [
                "fontSize",
                "fontStyle",
                "fontWeight",
                "fontFamily",
                "lineHeight",
                "textTransform",
                "letterSpacing"
            ]);
            slot.setSlotType("Array");
        }

        {
            /**
             * @member {Map} cache - Cache for storing measurement results.
             * @category Caching
             */
            const slot = this.newSlot("cache", new Map());
            slot.setSlotType("Map");
        }
        {
            /**
             * @member {Array} cacheKeys - Array to store cache keys.
             * @category Caching
             */
            const slot = this.newSlot("cacheKeys", new Array());
            slot.setSlotType("Array");
        }
        {
            /**
             * @member {Number} maxCacheKeys - Maximum number of cache keys to store.
             * @category Caching
             */
            const slot = this.newSlot("maxCacheKeys", 100);
            slot.setSlotType("Number");
        }
    }

    /**
     * @description Gets or creates the document object.
     * @returns {Document} The document object.
     * @category Document
     */
    document () {
        // return document
        if (!this._document) {
            this.setDocument(new Document());
        }
        return this._document;
    }

    /**
     * @description Gets or creates the test element.
     * @returns {Element} The test element.
     * @category Measurement
     */
    testElement () {
        if (!this._testElement) {
            this._testElement = this.createTestElement();
        }
        return this._testElement;
    }

    /**
     * @description Creates and sets up the test element.
     * @returns {Element} The created test element.
     * @category Measurement
     */
    createTestElement () {
        const e = document.createElement("div");
	    e.setAttribute("id", this.svTypeId());
        e.style.display = "block";
        e.style.position = "absolute";
        e.style.width = "auto";
        e.style.left = -1000;
        e.style.top  = -1000;
        e.style.visibility = "hidden";
        this.document().body.appendChild(e);
        return e;
    }

    /**
     * @description Adds a key-value pair to the cache.
     * @param {*} k - The key to add.
     * @param {*} v - The value to add.
     * @category Caching
     */
    addToCache (k, v) {
        const keys = this.cacheKeys();

        if (keys.length > this.maxCacheKeys()) {
            const oldKey = keys.shift(); // first in, first out
            this.cache().delete(oldKey);
        }

        this.cache().set(k, v);
        keys.push(k);
        console.log(this.svType() + " caching: " + keys.length);
    }

    /**
     * @description Measures the size of an element with the given HTML string.
     * @param {Element} element - The element to measure.
     * @param {string} text - The HTML string to measure.
     * @returns {Object} An object containing width and height measurements.
     * @category Measurement
     */
    sizeOfElementWithHtmlString (element, text) {
        if (this.cache().has(text)) {
            return this.cache().get(text);
        }

        const e = this.testElement();
        //e.cssText = element.cssText // this would force reflow?

        this.stylesToCopy().forEach(function (styleName) {
            const v = element.style[styleName];
            if (v) {
                e.style[styleName] = v;
            } else {
                delete e.style[styleName];
            }
        });

        e.innerHTML = element.innerHTML;

        const width = (e.clientWidth + 1);
        const height = (e.clientHeight + 1);
        this.clean();

        const result = { width: width, height: height };
        this.addToCache(text, result);
        return result;
    }

    /**
     * @description Cleans the test element by resetting its properties.
     * @returns {DomTextTapeMeasure} The current instance.
     * @category Measurement
     */
    clean () {
        const e = this.testElement();
        e.innerHTML = "";
        e.className = "";
        this.stylesToCopy().forEach(styleName => delete e.style[styleName]);
        return this;
    }

}.initThisClass());
