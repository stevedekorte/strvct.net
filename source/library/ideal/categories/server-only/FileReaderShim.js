"use strict";

/**
 * @description FileReader polyfill for Node.js environments where FileReader API is not available.
 * This file is only executed when running in a Node.js environment.
 */
//console.log("evaluating FileReaderShim.js");

class FileReader extends Object {
    constructor () {
        super();
        this.readyState = 0; // EMPTY
        this.result = null;
        this.error = null;
        this.onload = null;
        this.onerror = null;
        this.onloadstart = null;
        this.onloadend = null;
        this.onprogress = null;
    }

    readAsText (blob /*, encoding*/) {
        setTimeout(() => {
            this.readyState = 2; // DONE
            this.result = blob.toString ? blob.toString() : String(blob);
            if (this.onload) this.onload({ target: this });
            if (this.onloadend) this.onloadend({ target: this });
        }, 0);
    }

    readAsDataURL (blob) {
        setTimeout(() => {
            this.readyState = 2; // DONE
            this.result = "data:text/plain;base64," + Buffer.from(String(blob)).toString("base64");
            if (this.onload) this.onload({ target: this });
            if (this.onloadend) this.onloadend({ target: this });
        }, 0);
    }

    readAsArrayBuffer (blob) {
        setTimeout(() => {
            this.readyState = 2; // DONE
            this.result = Buffer.from(String(blob)).buffer;
            if (this.onload) this.onload({ target: this });
            if (this.onloadend) this.onloadend({ target: this });
        }, 0);
    }

    abort () {
        this.readyState = 2; // DONE
        if (this.onloadend) this.onloadend({ target: this });
    }
};

SvGlobals.set("FileReader", FileReader);
//assert(global.FileReader, "FileReader should be available globally");
