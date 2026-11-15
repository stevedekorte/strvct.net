"use strict";

/**
 * @description A FileReader for browsers that have none: Safari in Lockdown
 * Mode removes it (measured 2026-11-14). Built on Blob's own promise methods
 * (arrayBuffer, text), which Lockdown Mode keeps. Installed only when the
 * global is missing, before FileReader_ideal adds its promise helpers.
 *
 * Covers what this code base uses: readAsArrayBuffer, readAsDataURL,
 * readAsText, readAsBinaryString, with onload / onerror / onloadend and
 * addEventListener for "load" and "error". No progress events.
 */

if (typeof FileReader === "undefined") {

    class FileReader {

        static get EMPTY () { return 0; }
        static get LOADING () { return 1; }
        static get DONE () { return 2; }

        constructor () {
            this.readyState = 0;
            this.result = null;
            this.error = null;
            this.onload = null;
            this.onerror = null;
            this.onloadend = null;
            this.onloadstart = null;
            this.onprogress = null;
            this.onabort = null;
            this.listenerMap = new Map(); // event name -> Array of listeners
            this.isAborted = false;
        }

        addEventListener (name, listener) {
            if (!this.listenerMap.has(name)) {
                this.listenerMap.set(name, []);
            }
            this.listenerMap.get(name).push(listener);
        }

        removeEventListener (name, listener) {
            const listeners = this.listenerMap.get(name) || [];
            this.listenerMap.set(name, listeners.filter((l) => l !== listener));
        }

        dispatch (name) {
            const event = { type: name, target: this, currentTarget: this };
            const handler = this["on" + name];
            if (handler) {
                handler.call(this, event);
            }
            (this.listenerMap.get(name) || []).forEach((l) => l.call(this, event));
        }

        /**
         * Reads `blob` with `convert` (Blob → Promise of the result), then reports.
         */
        read (blob, convert) {
            this.readyState = 1;
            this.isAborted = false;
            this.dispatch("loadstart");
            Promise.resolve().then(() => convert(blob)).then((result) => {
                if (this.isAborted) { return; }
                this.result = result;
                this.readyState = 2;
                this.dispatch("load");
                this.dispatch("loadend");
            }, (error) => {
                if (this.isAborted) { return; }
                this.error = error;
                this.readyState = 2;
                this.dispatch("error");
                this.dispatch("loadend");
            });
        }

        readAsArrayBuffer (blob) {
            this.read(blob, (b) => b.arrayBuffer());
        }

        readAsText (blob /*, encoding: UTF-8 only */) {
            this.read(blob, (b) => b.text());
        }

        readAsBinaryString (blob) {
            this.read(blob, async (b) => FileReader.binaryStringFromBuffer(await b.arrayBuffer()));
        }

        readAsDataURL (blob) {
            this.read(blob, async (b) => {
                const type = b.type || "application/octet-stream";
                return "data:" + type + ";base64," + btoa(FileReader.binaryStringFromBuffer(await b.arrayBuffer()));
            });
        }

        abort () {
            this.isAborted = true;
            this.readyState = 2;
            this.result = null;
            this.dispatch("abort");
            this.dispatch("loadend");
        }

        /**
         * One character per byte, built in chunks so large blobs don't overflow the call stack.
         * @param {ArrayBuffer} buffer
         * @returns {string}
         */
        static binaryStringFromBuffer (buffer) {
            const bytes = new Uint8Array(buffer);
            const chunkSize = 0x8000;
            let s = "";
            for (let i = 0; i < bytes.length; i += chunkSize) {
                s += String.fromCharCode.apply(null, bytes.subarray(i, i + chunkSize));
            }
            return s;
        }
    }

    console.warn("[FileReaderShim] this browser has no FileReader; using one built on Blob");
    SvGlobals.set("FileReader", FileReader);
}
