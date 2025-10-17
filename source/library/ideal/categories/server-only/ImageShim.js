"use strict";

/**
 * @description Image and Canvas polyfill for Node.js environments using the canvas library.
 * This file is only executed when running in a Node.js environment.
 */
console.log("evaluating ImageShim.js");

try {
    const { createCanvas, loadImage, Image: NodeImage } = require("canvas");

    // Define Image class for Node.js
    class Image extends NodeImage {
        constructor (width, height) {
            super(width, height);
            // Don't initialize onload/onerror - let node-canvas handle them
        }

        // Don't override src setter - node-canvas handles async loading properly
        // The parent NodeImage class will fire onload/onerror when the image actually loads
    }

    // Define HTMLCanvasElement polyfill
    class HTMLCanvasElement {
        constructor (width = 300, height = 150) {
            this._canvas = createCanvas(width, height);
            this.width = width;
            this.height = height;
        }

        getContext (contextType, contextAttributes) {
            return this._canvas.getContext(contextType, contextAttributes);
        }

        toDataURL (type, encoderOptions) {
            return this._canvas.toDataURL(type, encoderOptions);
        }

        toBuffer (mimeType, config) {
            return this._canvas.toBuffer(mimeType, config);
        }

        set width (value) {
            this._canvas.width = value;
        }

        get width () {
            return this._canvas.width;
        }

        set height (value) {
            this._canvas.height = value;
        }

        get height () {
            return this._canvas.height;
        }
    }

    // Define document.createElement for canvas
    if (typeof document === "undefined") {
        global.document = {
            createElement: function (tagName) {
                if (tagName === "canvas") {
                    return new HTMLCanvasElement();
                }
                throw new Error(`createElement not implemented for ${tagName}`);
            }
        };
    }

    // fix the Image's super class (NodeImage) to inherit from Object  to get Image initThisCategory to work
    //NodeImage.__proto__ = Object;
    Image.__proto__.__proto__ = Object; // need to set our parent's parent!

    // Set global references
    SvGlobals.set("Image", Image);
    SvGlobals.set("HTMLCanvasElement", HTMLCanvasElement);
    SvGlobals.set("createCanvas", createCanvas);
    SvGlobals.set("loadImage", loadImage);

    console.log("defined Image, HTMLCanvasElement, and canvas utilities");
    assert(global.Image, "Image should be available globally");
    assert(global.HTMLCanvasElement, "HTMLCanvasElement should be available globally");

} catch (error) {
    console.warn("Canvas library not available - Image and Canvas shims not loaded:", error.message);
}
