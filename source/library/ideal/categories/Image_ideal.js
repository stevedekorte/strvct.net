"use strict";

/*

    Image-ideal

    Some extra methods for the Javascript Image primitive.

    Delegate protocol:

        didFetchDataUrl(data) // sent after load

*/

if (!getGlobalThis().Image) {
    console.log("WARNING: no Image object found - maybe we are not in browser?")
} else {

    (class Image_ideal extends Image {

        setDelegate (anObject) {
            Object.defineSlot(this, "_delegate", anObject)
            return this
        }

        delegate () {
            return this._delegate
        }

        loadUrl (url) {
            this.crossOrigin = "Anonymous";
            this.onload = () => { 
                this.onDidLoad() 
            }
            this.onerror = () => { 
                console.warn("error loading image " + url)
            }

            this.src = url;
            return this
        }

        onDidLoad () {
            // create a canvas the size of the image
            const canvas = document.createElement("CANVAS");
            canvas.height = this.height;
            canvas.width = this.width;

            // draw image to the canvas
            const ctx = canvas.getContext("2d");
            ctx.drawImage(this, 0, 0);

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
        }

    }).initThisCategory();

}
