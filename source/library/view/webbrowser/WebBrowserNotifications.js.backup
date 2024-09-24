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
    }

    initPrototypeSlots () {
        {
            const slot = this.newSlot("permissionPromise", null);
            slot.setSlotType("Promise");
        }
        this.setIsDebugging(true);
    }

    // --- getting permission ---

    async requestPermission () {
        if (!this.permissionPromise()) {
            const promise = Promise.clone();
            this.setPermissionPromise(promise);
            
            if (!this.isSupported()) {
                const msg = this.type() + " sending browser notifications is not supported";
                console.warn(msg);
                promise.callResolveFunc(false);
            } else {
                const result = await Notification.requestPermission();
                this.debugLog("requestPermission:", result);
                const gotPermission = result === "granted";
                if (!gotPermission) {
                    console.warn(this.type() + " permission denied");
                }
                promise.callResolveFunc(gotPermission);
            }
        }
        return this.permissionPromise();
    }

    isSupported () {
        return window.hasOwnProperty("Notification");
    }

    // --- posting ---

    async postNote (aNote) {
        if (await this.requestPermission()) {
            aNote.justPost();
        }
    }

    newNote () {
        return WebBrowserNotification.clone();
    }
    
}.initThisClass());

//WebBrowserNotifications.shared();

//WebBrowserNotifications.shared().newNote().setTitle("hello").setBody("world!").tryToPost();
