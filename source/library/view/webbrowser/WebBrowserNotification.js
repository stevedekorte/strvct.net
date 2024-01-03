"use strict";

/*

    WebBrowserNotification

    Don't instantiate these directly. 
    See WebBrowserNotifications example code.


        Example actions:

            [{action: 'reply', title: 'Reply'}, ...]

*/

(class WebBrowserNotification extends ProtoClass {
    
    initPrototypeSlots () {
        this.newSlot("title", "");
        this.newSlot("body", null);
        this.newSlot("icon", null).setComment("a url to an image");
        this.newSlot("actions", null);

        this.newSlot("notificationRef", null);
        this.newSlot("error", null);
        this.newSlot("choice", null);
    }

    init () {
        super.init();
        this.setActions([]);
        this.setIsDebugging(true);
        return this
    }

    tryToPost () {
        WebBrowserNotifications.shared().postNote(this);
        return this;
    }

    justPost () { // private - only WebBrowserNotifications should call this
        const ref = new Notification(this.title(), { 
            body: this.body(), 
            icon: this.icon(),
            actions: this.actions()
        });

        ref.onshow = () => { this.onShow(); };
        ref.onclick = () => { this.onClick(); };
        ref.onclose = () => { this.onClose(); };
        ref.onerror = (error) => { this.onError(error); };
        ref.onaction = (event) => { this.onAction(event); };
        
        this.setNotificationRef(ref);
        //debugger;
        return this
    }

    onShow () {
        this.debugLog("onShow");
    }

    onClick () {
        this.debugLog("onClick");
    }

    onClose () {
        this.debugLog("onClose");
    }

    onError (error) {
        this.debugLog("onError " + error);
        this.setError(error);
    }

    onAction (event) {
        this.debugLog("onAction '" + event.action + "'");
        this.setChoice(event.action);
    }

}.initThisClass());
