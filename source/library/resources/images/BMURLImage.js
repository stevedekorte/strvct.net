"use strict";

/*

    BMURLImage

*/

(class BMURLImage extends BMResource {
    
    static supportedExtensions () {
        return ["apng", "avif", "gif", "jpg", "jpeg", "jfif", "pjpeg", "pjp", "png", "webp", /* these aren't well supported -> */ "tif", "tiff", "ico", "cur", "bmp"];
    }

    initPrototypeSlots () {
        this.newSlot("dataURL", "");
    }

    init () {
        super.init();
        this.setIsDebugging(false);
        return this
    }

    title () {
        return this.path().fileName();
    }

    subtitle () {
        return this.path().pathExtension();
    }

    load () {
        this.loadDataURL();
        return this;
    }

    async loadDataURL () {
        if (this.isDebugging()) {
            this.debugLog(".loadDataURL() " + this.path());
        }

        try {
            const response = await fetch(this.path());
            const blob = await response.blob();
            const dataUrl = await blob.asyncToDataUrl();
            this.setDataURL(dataUrl);
        } catch (error) {
            this.setError(error);
            error.rethrow();
        }

        /*
        const request = new XMLHttpRequest();
        request.open("get", this.path());
        request.responseType = "blob";
        request.onload = () => { this.loadedRequest(request) };
        request.send();
        */
        return this;
    }

    didFetchDataUrl (dataURL) {
        debugger;
        this.setDataURL(dataURL);
        return this
    }

}.initThisClass());

//console.log("BMURLImage: ", BMURLImage)