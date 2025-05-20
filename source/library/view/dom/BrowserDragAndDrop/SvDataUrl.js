/**
 * @module library.view.dom.BrowserDragAndDrop
 */

"use strict";

/**
 * @class SvDataUrl
 * @extends ProtoClass
 * @classdesc
 * BMDataUrl class for handling data URLs in drag and drop operations.
 * 
 * Examples of setting up a dataTransfer for a drag out of browser event:
 * 
 * event.dataTransfer.setData("DownloadURL", "application/json:hello.json:data:application/json;base64," + btoa("[1,2,3]"));
 * event.dataTransfer.setData("DownloadURL", "text/plain:hello.txt:data:text/plain;base64,SGVsbG8sIFdvcmxkIQ%3D%3D");
 */
(class SvDataUrl extends ProtoClass {
    
    /**
     * @description Initializes the prototype slots for the SvDataUrl class.
     */
    initPrototypeSlots () {
        /**
         * @member {String} dataUrl - The data URL for drop operations.
         * @category Data
         */
        {
            const slot = this.newSlot("dataUrl", null);
            slot.setSlotType("String");
        }
        /**
         * @member {String} transferMimeType - The MIME type for drag operations.
         * @category Data
         */
        {
            const slot = this.newSlot("transferMimeType", "DownloadURL");
            slot.setSlotType("String");
        }
        /**
         * @member {String} fileName - The file name for drag operations.
         * @category Data
         */
        {
            const slot = this.newSlot("fileName", "file.txt");
            slot.setSlotType("String");
        }
        /**
         * @member {String} mimeType - The MIME type of the data.
         * @category Data
         */
        {
            const slot = this.newSlot("mimeType", null);
            slot.setSlotType("String");
        }
        /**
         * @member {String} decodedData - The non-base64 version of the data.
         * @category Data
         */
        {
            const slot = this.newSlot("decodedData", "");
            slot.setSlotType("String");
        }
    }

    /**
     * @description Gets the description of the MIME type.
     * @returns {String|null} The description of the MIME type or null if not found.
     * @category Data
     */
    mimeTypeDescription () {
        const mimeType = this.mimeType()
        if (mimeType) {
            const name = this.mimeTypeToFileSuffixDict()[mimeType]
            if (name) {
                return name
            }
            return mimeType
        }
        return null
    }

    /**
     * @description Checks if the MIME type is XML.
     * @returns {Boolean} True if the MIME type is XML, false otherwise.
     * @category Data
     */
    isXml () {
        return this.mimeType() === "application/xml"
    }

    /**
     * @description Checks if the MIME type is JSON.
     * @returns {Boolean} True if the MIME type is JSON, false otherwise.
     * @category Data
     */
    isJson () {
        return this.mimeType() === "application/json"
    }

    /**
     * @description Checks if the MIME type is plain text.
     * @returns {Boolean} True if the MIME type is plain text, false otherwise.
     * @category Data
     */
    isText () {
        return this.mimeType() === "text/plain"
    }

    /**
     * @description Checks if the MIME type is HTML.
     * @returns {Boolean} True if the MIME type is HTML, false otherwise.
     * @category Data
     */
    isHtml () {
        return this.mimeType() === "text/html"
    }

    /**
     * @description Returns a dictionary mapping MIME types to file suffixes.
     * @returns {Object} A dictionary of MIME types and their corresponding file suffixes.
     * @category Data
     */
    mimeTypeToFileSuffixDict () {
        return {
            "application/json" : "json",
            "application/xml" : "xml",
            "text/javascript" : "js",
            "text/plain" : "txt", 
            "text/html" : "html", 
            //"text/uri-list" 
        }
    }

    /**
     * @description Generates a data URL string.
     * @returns {String} The generated data URL string.
     * @category Data
     */
    dataUrlString () {
        // e.g.: "application/json:hello.json:data:application/json;base64," + btoa("[1,2,3]"));
        const header = this.mimeType() + ":" + this.fileName() + ":data:" + this.mimeType() + ";base64,"  
        const content = btoa(this.decodedData())
        const s = header + content
        return s
    }

    /**
     * @description Sets the data URL string and parses its components.
     * @param {String} dataUrl - The data URL string to set and parse.
     * @returns {SvDataUrl} The current instance for method chaining.
     * @category Data
     */
    setDataUrlString (dataUrl) {
        const type = dataUrl.before(":")
        assert(type === "data")
        const afterData = dataUrl.after("data:")
        const mimeType = afterData.before(";")
        const encodedData = afterData.after("base64,")
        const decodedData = encodedData.base64Decoded()
        
        this.setDataUrl(dataUrl)
        this.setMimeType(mimeType)
        this.setDecodedData(decodedData)
        return this
    }

}.initThisClass());