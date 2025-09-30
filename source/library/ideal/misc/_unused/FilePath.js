"use strict";

/*

    FilePath

    Abstraction of file system or URL path.
*/


SvGlobals.globals().ideal.FilePath = class FilePath extends ProtoClass {

    static with (pathString) {
        return FilePath.clone().setPathString(pathString);
    }

    static pathSeparator () {
        return "/";
    }

    initPrototypeSlots () {
        this.newSlot("pathString", null);
    }

    /*
    init () {
        super.init()
    }
    */

    pathComponents () {
        const s = this.pathString();

        if (s === "/") {
            return [""];
        }
        else if (s === "") {
            return [];
        }

        return s.split("/");
    }

    sansLastPathComponent () {
        const c = this.pathComponents();
        c.removeLast();
        return c.join("/");
    }

    lastPathComponent () {
        return this.pathComponents().last();
    }

    pathExtension () {
        const extension = this.pathString().split(".").last();
        return extension;
    }

}.initThisClass();

