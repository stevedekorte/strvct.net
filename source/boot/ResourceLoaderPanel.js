"use strict";

/*

    ResourceLoaderPanel

    A simple full page panel that shows load progress and errors by
    watching for ResourceLoader and window events.
  
    While running, displays app name, progress bar, and current loading file name.
    On error, it displays an error description.

    Automatically sets up in the document when loading this file via:

        ResourceLoaderPanel.shared().open()

    When a ResourceLoader done event is received, the panel removes it's HTML element from the document.

*/


(class ResourceLoaderPanel extends Base {
    
    initPrototype () {
        this.newSlot("mainElement", null)
        this.newSlot("middleElement", null)
        this.newSlot("iconElement", null)
        this.newSlot("titleElement", null)
        this.newSlot("barContainerElement", null)
        this.newSlot("barElement", null)
        this.newSlot("itemElement", null)
        this.newSlot("errorElement", null)

        this.newSlot("error", null)
        this.newSlot("loadCount", 0)
    }

    init () {
        super.init()
        this.setupCallbacks()
        this.setupElements()
    }
    
    // --- open ------------------------------------------------

    open () {
        if (this.isInBrowser()) {
            this.addMainElement()
            this.initTitle()
            this.startListening()
        }
        return this
    }

    addMainElement () {
        document.body.appendChild(this.mainElement())
    }

    removeMainElement () {
        this.mainElement().parentNode.removeChild(this.mainElement())
    }

    setupElements () {
        let e = document.createElement("div");
        e.id = "mainElement";
        e.style.opacity = 0; 
        e.style.transition = "all 0.3s ease-out"; 
        e.style.position = "absolute"; 
        e.style.width = "100%"; 
        e.style.height = "100%"; 
        e.style.backgroundColor = "black"; 
        e.style.zIndex = 100000; 
        e.style.fontFamily = "AppRegular, Sans-Serif"; 
        e.style.letterSpacing = "3px"; 
        e.style.fontSize = "13px";
        this.setMainElement(e);

        e = document.createElement("div");
        e.id = "middleElement";
        e.style.position = "relative"; 
        e.style.top = "50%"; 
        e.style.transform = "translateY(-50%)"; 
        e.style.height = "auto"; 
        e.style.width = "100%"; 
        e.style.textAlign = "center";
        this.setMiddleElement(e);
        this.mainElement().appendChild(e);

        const iconSection = document.createElement("div");
        iconSection.id = "iconSection";
        this.middleElement().appendChild(iconSection);

        e = document.createElement("div");
        e.id = "iconElement";
        e.style.opacity = 0.7; 
        e.style.border = "0px dashed yellow"; 
        e.style.transition = "all .6s ease-out"; 
        e.style.backgroundPosition = "center"; 
        e.style.backgroundRepeat = "no-repeat"; 
        e.style.height = "60px"; 
        e.style.width = "100%"; 
        e.style.backgroundSize = "contain";
        e.style.marginBottom = "1em";
        this.setIconElement(e);
        iconSection.appendChild(e);


        e = document.createElement("div");
        e.id = "titleElement";
        e.style.marginTop = "12px"; 
        e.style.transition = "all .6s ease-out";
        e.style.paddingTop = "1em"
        e.style.paddingBottom = "1em"
        this.setTitleElement(e);
        this.middleElement().appendChild(e);

        const center = document.createElement("center");
        this.middleElement().appendChild(center);

        e = document.createElement("div");
        e.id = "barContainerElement";
        this.setBarContainerElement(e)
        e.style.width = "170px"; 
        e.style.height = "4px"; 
        e.style.borderRadius = "2px"; 
        e.style.backgroundColor = "#444"; 
        e.style.textAlign = "left";
        //e.style.border = "1px solid red"

        center.appendChild(e);

        e = document.createElement("div");
        e.id = "barElement";
        this.setBarElement(e)
        e.style.height = "4px"; 
        e.style.borderRadius = "2px"; 
        e.style.backgroundColor = "#bbb"; 
        e.style.transition = "all 0s ease-out"; 
        e.style.letterSpacing = "-2.5px";
        this.barContainerElement().appendChild(e);

        e = document.createElement("div");
        e.id = "itemElement";
        this.setItemElement(e);
        e.style.color = "transparent"; 
        e.style.transition = "all 0s ease-out";
        e.style.paddingTop = "1em"
        e.style.paddingBottom = "1em"
        this.middleElement().appendChild(e);


        e = document.createElement("div");
        e.id = "errorElement";
        this.setErrorElement(e);
        e.style.color = "red"; 
        e.style.transition = "all .6s ease-out"; 
        e.style.textAlign = "center"; 
        e.style.width = "100%"; 
        e.style.lineHeight = "1.7em";
        this.middleElement().appendChild(e);

        return this
    }

    initTitle () {
        const title = this.titleElement()
        title.style.color = "#aaa"
        
        if (false) {
            this.iconElement().style.backgroundImage = "url('resources/icons/appicon.svg')";
        } else {
            this.iconElement().style.display = "none"
            title.innerHTML = "LOADING"
        }

        if (window.ResourceLoaderIsEmbedded) {
            this.hide()
        }

        setTimeout(() => { this.mainElement().style.opacity = 1 } ,0)
        return this
    }

    hide() {
        this.mainElement().style.visibility = "hidden"
        //this.titleElement().style.visibility = "hidden"
    }

    show () {
        this.mainElement().style.visibility = "visible"
        //this.titleElement().style.visibility = "visible"
    }

    // --- event callback functions ------------------------------------

    setupCallbacks () {
        this._resourceLoaderLoadUrlFunc = (event) => { this.resourceLoaderLoadUrl(event) }
        this._resourceLoaderErrorFunc = (event) => { this.resourceLoaderError(event) }
        this._resourceLoaderDoneFunc = (event) => { this.resourceLoaderDone(event) }
        this._windowErrorFunc = (event) => { return this.handleError(event) }
    }

    // --- handle events ------------------------------------------------

    resourceLoaderLoadUrl (event) {
        //console.log(this.type() + " got resourceLoaderLoadUrl " + JSON.stringify(event.detail))
        this.didImportUrl(event.detail.url, event.detail.maxUrlCount)
    }

    resourceLoaderError (event) {
        //console.log(this.type() + " got resourceLoaderError " + event.detail)
        this.handleError(event.detail.error)
    }

    resourceLoaderDone(event) {
        //console.log(this.type() + " got resourceLoaderDone " + event.detail)
        this.stop()
    }

    // --- register / unregister for events ---------------------------------

    startListening () {
        window.addEventListener("resourceLoaderLoadUrl", this._resourceLoaderLoadUrlFunc)
        window.addEventListener("resourceLoaderError",   this._resourceLoaderErrorFunc)
        window.addEventListener("resourceLoaderDone",    this._resourceLoaderDoneFunc)
        window.addEventListener("error",    this._windowErrorFunc)
        return this
    }

    stopListening () {
        window.removeEventListener("resourceLoaderLoadUrl",   this._resourceLoaderLoadUrlFunc)
        window.removeEventListener("resourceLoaderError",    this._resourceLoaderErrorFunc)
        window.removeEventListener("resourceLoaderDone",    this._resourceLoaderDoneFunc)
        window.removeEventListener("error", this._windowErrorFunc)
        return this
    }

    didImportUrl (url, max) {
        if (!this.hasError()) {
            this.setCurrentItem(url.split("/").pop())
        }
        //console.log("didImportUrl " + url)
        this.incrementItemCount(max)
        return this
    }

    handleError (event) { 
        let s = "Error "

        if (event.filename) {
            s += " in source file " + event.filename.split("/").pop() + " on line " + event.lineno;  //+ " Column: "" + column;
        }
        s += "<br>"
        s += event.message.split(":").join(":<br>")
        this.setError(s)
        return false;
    }

    hasLocalStorage () {
        try {
            window.localStorage
            return true
        } catch (e) {
            return false
        }
    }

    // --- tracking file count -------------------------

    maxFileCount () {
        if (!this._maxFileCount) {
            let s = undefined 
            if (this.hasLocalStorage()) {
                s = localStorage.getItem(this.type() + ".maxFileCount");
            }

            if (s) {
                this._maxFileCount = Number(s)
            } else {
                this._maxFileCount = 1
            }
        }
        return this._maxFileCount
    }

    setMaxFileCount (count) {
        this._maxFileCount = count
        if (this.hasLocalStorage()) {
            localStorage.setItem(this.type() + ".maxFileCount", count);
        }
        return this
    }

    incrementItemCount (max) {
        this._loadCount ++
        if (this._loadCount > this.maxFileCount()) {
            this.setMaxFileCount(this._loadCount)
        }

        const e = this.barElement()
        if (e) {
            let p = Math.floor(100 * this._loadCount / this.maxFileCount())
            if (p >= 100) {
                p = 100
                e.style.transition = "all 0.3s"
                e.style.backgroundColor = this._loadCount % 2 ? "#777" : "#ccc"
                e.style.width = this._loadCount % 2 ? "100%" : "95%"
            } else {
                e.style.width = p + "%"
            }
        }
        return this
    }

    setCurrentItem (itemName) {
        const item = this.itemElement()
        this._currentItemName = itemName
        item.style.opacity = 1
        item.style.color = "#444"
        item.currentValue = itemName	
        item.innerHTML = itemName // commented out to make cleaner 
        /*
    	//setTimeout(() => { 
    	    if (item.currentValue === item.innerHTML) {
    	        item.style.opacity = 1
	        }
    	//}, 0)
        */
        return this
    }

    hasError () {
        return this.error() !== null
    }

    setError (error) {
        if (this.hasError()) {
            return
        }

        const msg = "ERROR: " + this._currentItemName + " : " + error
        console.log(msg)

        /*
        if (this.error()) {
            this.setError(this.error() + "<br>" + error)
        }
        */
        this._error = error
        //console.trace()
        this.errorElement().innerHTML = error
        this.show()
        //throw new Error(msg)
        return this
    }

    stop () {
        if (!this.error()) {
            this.fadeOut()
        }
        return this
    }

    fadeOut () {
        const e = this.mainElement()
        if (e) {
            e.style.opacity = 0
        }
        setTimeout(() => { this.close() }, 300)
    }

    close () {
        this.removeMainElement()
        this.stopListening()
    }

    registerForWindowLoad () {
        window.addEventListener("load", () => { this.open() });
        return this
    }

}.initThisClass());


if (!getGlobalThis().ResourceLoaderIsEmbedded) {
    if (ResourceLoaderPanel.isInBrowser()) {
        ResourceLoaderPanel.shared().registerForWindowLoad() // window.onload event has already occurred to stat boot UNLESS this file is built into index
    }
}
