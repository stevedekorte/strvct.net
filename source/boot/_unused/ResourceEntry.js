"use strict";

/*
    ResourceEntry

    Holds info related to a file import.

    relativePath, absolutePath:
    We need these to get the URL to load the file from, and to organize the ResourceFile hierarchy.

    fileSize:
    We need this to enable features like auto-loading of small files.

    hash, hashType:
    We need this to enable client side caching of resources. 
    hashType allows hash algorithm to change over time.

*/

(class ResourceEntry extends Base {

    initPrototype () {
        this.newSlot("relativePath", null);
        this.newSlot("absolutePath", null);
        this.newSlot("fileSize", 0);
        this.newSlot("hash", null);
        this.newSlot("hashType", null);
    }

}.initThisClass());

