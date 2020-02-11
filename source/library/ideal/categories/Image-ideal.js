"use strict"

/*

    Image-ideal

    Some extra methods for the Javascript Image primitive.

    Delegate protocol:

        didFetchDataUrl(data) // sent after load

*/

Object.defineSlots(Image.prototype, {

    setDelegate: function(anObject) {
        Object.defineSlot(this, "_delegate", anObject)
        return this
    },

    delegate: function() {
        return this._delegate
    },

    loadUrl: function(url) {
        this.crossOrigin = "Anonymous";
        this.onload = () => { this.didLoad() }
        this.src = url;
        return this
    },

    didLoad: function () {
        
        // create a canvas the size of the image
        const canvas = document.createElement("CANVAS");
        canvas.height = this.height;
        canvas.width = this.width;

        // draw image to the canvas
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0);

        // get the image data from the canvas
        const data = canvas.toDataURL("image/jpeg");

        // tell the delegate about the loaded data
        if (this._delegate) {
            this._delegate.didFetchDataUrl(data)
        }

        /*
            // test data

            if (img.complete || img.complete === undefined) {
                img.src = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==";
                img.src = src;
            }
        */
       
        return this
    },

});






