"use strict";

/*

    WebBrowserNotifications

    Simple interface to browser notifications. Takes care of:
    - only checking for permissions once
    - sending any waiting notifications after permission is gained
    - notification timeouts

    Todo: 
    - support for multiple waiting notes? waiting note limit
    - add any abstractions specific to special Chrome/Android notifications

    example use:

    WebBrowserNotifications.shared().newNote().setTitle("hello").setBody("...").tryToPost()

*/


(class WebBrowserNotifications extends ProtoClass {
    
    static initClass () {
        this.setIsSingleton(true);
        return this;
      }

    initPrototypeSlots () {
        this.newSlot("permissionRequestResult", null);
    }

    init () {
        super.init();
        this.setIsDebugging(true);
        this.requestPermissionIfNeeded();
        return this
    }

    // --- getting permission ---

    hasPermission () {
        return this.permissionRequestResult() === "granted";
    }

    wasDenied () {
        return this.permissionRequestResult() === "denied";
    }

    hasAskedForPermission () {
        return this.permissionRequestResult() !== null;
    }

    async requestPermissionIfNeeded () {
        if (!this.hasAskedForPermission()) {
            await this.requestPermission();
        }
    }

    async requestPermission () {
        const result = await Notification.requestPermission();
        this.setPermissionRequestResult(result);
        if (this.wasDenied()) {
            console.warn(this.type() + " permission denied");
        }
        this.debugLog("requestPermission:", result);
    }

    isSupported () {
        return window.hasOwnProperty("Notification");
    }

    // --- posting ---

    async postNote (aNote) {
        if (!this.isSupported()) {
            console.warn(this.type() + " sending browser notifications is not supported");
            return;
        }

        if (!this.hasAskedForPermission()) {
            await this.requestPermissionIfNeeded(); // will call this.postWaitingNotes()
        }

        if (this.hasPermission()) {
            aNote.justPost();
        }
    }

    newNote () {
        return WebBrowserNotification.clone();
    }
    
}.initThisClass());

WebBrowserNotifications.shared();

WebBrowserNotifications.shared().newNote().setTitle("hello").setBody("world!").tryToPost();
