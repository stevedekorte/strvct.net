"use strict"

/*

    StatsResource

*/

window.StatsResource = class StatsResource extends BMNode {
    
    initPrototype () {
        this.newSlot("path", "")
        this.newSlot("data", "")
    }

    init () {
        super.init()
        this.setNodeMinWidth(600)
        return this
    }

    title () {
        return this.path().fileName()
    }

    subtitle () {
        return this.path().pathExtension()
    }

    prepareForFirstAccess () {
        this.loadData()
    }

    loadData () {
        if (this.isDebugging()) {
            this.debugLog(".loadData() " + this.path())
        }

        const request = new XMLHttpRequest();
        request.open("get", this.path());
        request.responseType = "blob";
        request.onload = () => { this.loadedRequest(request) };
        request.send();
        return this
    }

    loadedRequest (request) {
        if (this.isDebugging()) {
            this.debugLog(".loadedRequest() ", request)
        }

        const fileReader = new FileReader();

        fileReader.onload = () => {
            const dataUrl = fileReader.result
            this.didLoadDataUrl(dataUrl)
        };

        fileReader.readAsDataURL(request.response); 
        
        return this
    }

    didLoadDataUrl (dataUrl) {
        const jsonString = BMDataUrl.clone().setDataUrlString(dataUrl).decodedData()
        const json = JSON.parse(jsonString)
        this.setData(json)
        this.didLoad()
    }

    dataString () {
        return JSON.stringify(this.data(), null, 2)
    }

    didLoad () {
        const field = BMTextAreaField.clone().setKey("recordString")
        field.setValueMethod("dataString").setValueIsEditable(false).setIsMono(true)
        field.setTarget(this) 
        field.getValueFromTarget()
        this.addSubnode(field)
    }


}.initThisClass()
