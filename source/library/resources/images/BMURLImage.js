"use strict";

/*

    BMURLImage

*/

(class BMURLImage extends BMResource {
    
    static supportedExtensions () {
        return ["apng", "avif", "gif", "jpg", "jpeg", "jfif", "pjpeg", "pjp", "png", "webp", /* these aren't well supported -> */ "tif", "tiff", "ico", "cur", "bmp"]
    }

    initPrototypeSlots () {
        //this.newSlot("path", "")
        this.newSlot("dataURL", "")
    }

    init () {
        super.init()
        this.setIsDebugging(true)
        return this
    }

    title () {
        return this.path().fileName()
    }

    subtitle () {
        return this.path().pathExtension()
    }

    /*
    setPath (aPath) {
        if (this._path !== aPath) {
            this._path = aPath
            this.loadDataURL()
        }
        return this
    }
    */

    load () {
        this.loadDataURL()
        return this
    }

    loadDataURL () {
        if (this.isDebugging()) {
            this.debugLog(".loadDataURL() " + this.path())
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
            const dataURL = fileReader.result
            this.setDataURL(dataURL);

            if (this.isDebugging()) {
                this.debugLog(" setDataURL() ", dataURL)
            }

        };

        fileReader.readAsDataURL(request.response); 
        
        return this
    }

    didFetchDataUrl (dataURL) {
        this.setDataURL(dataURL);
        
        /*
        // now just to show that passing to a canvas doesn't hold the same results
        const canvas = document.createElement("canvas");
        canvas.width = myImage.naturalWidth;
        canvas.height = myImage.naturalHeight;
        canvas.getContext("2d").drawImage(myImage, 0, 0);
        */

        return this
    }

}.initThisClass());

//console.log("BMURLImage: ", BMURLImage)