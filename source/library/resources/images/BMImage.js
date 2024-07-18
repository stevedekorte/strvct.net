"use strict";

/*

    BMImage

*/

(class BMImage extends BMResource {
    
    static supportedExtensions () {
        return ["apng", "avif", "gif", "jpg", "jpeg", "jfif", "pjpeg", "pjp", "png", "webp", /* these aren't well supported -> */ "tif", "tiff", "ico", "cur", "bmp"]
    }

    initPrototypeSlots () {
        /*
        {
            const slot = this.newSlot("path", "");
            slot.setSlotType("String");
        }
        */
        {
            const slot = this.newSlot("dataURL", "");
            slot.setSlotType("String");
        }
    }

    initPrototype () {
    }

    title () {
        return this.path().fileName()
    }

    subtitle () {
        return this.path().pathExtension()
    }

    onDidLoad () {
        super.onDidLoad()
        debugger;
        this.setDataUrl(this.data())
        return this
    }

    /*
    // this code should be on UI side

    canvasForImage () {
        // now just to show that passing to a canvas doesn't hold the same results
        const canvas = document.createElement("canvas");
        canvas.width = myImage.naturalWidth;
        canvas.height = myImage.naturalHeight;
        canvas.getContext("2d").drawImage(myImage, 0, 0);
    }
    */

}.initThisClass());

