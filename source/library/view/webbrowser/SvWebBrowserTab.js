/*
    @class SvWebBrowserTab
    @extends ProtoClass
    @classdesc A class whose instances represent a web browser tab.

    Useful for checking if other tabs are open and running the same application.

    @example

    const tab = SvWebBrowserTab.clone();
    tab.setAppName("my-app");
    if (await tab.hasOtherTabsOpen()) {
        throw new Error("Another tab running this application is already open.");
        // we could corrupt IndexedDB if we continue
        // check this *before* opening IndexedDB
    }
*/


(class SvWebBrowserTab extends ProtoClass {

    initPrototypeSlots () {
        {
            const slot = this.newSlot("appName", null);
            slot.setSlotType("String");
        }

        {
            const slot = this.newSlot("channel", null);
            slot.setSlotType("BroadcastChannel");
        }

        {
            const slot = this.newSlot("responderSetup", false);
            slot.setSlotType("Boolean");
        }

        {
            const slot = this.newSlot("timeoutMs", 100);
            slot.setSlotType("Number");
        }
    }

    initPrototype () {
    }

    getChannelName () {
    // IndexedDB, sessionStorage, and localStorage are tied to the exact origin of the page.
    // So we'll use the exact origin in our channel name as the purpose is to avoid
    // storage synchronization issues.
    // Note: cookies are tied to the domain, not the origin.

        const origin = SvPlatform.getWindowLocationURL().explicitOrigin();
        return `${origin}-${this.appName()}-tab`;
    }

    getChannel () {
        if (!this.appName()) {
            throw new Error("setAppName must be called before using the channel.");
        }
        if (!this._channel) {
            this.setChannel(new BroadcastChannel(this.getChannelName()));
        }
        this.setupResponderIfNeeded();
        return this._channel;
    }

    setupResponderIfNeeded () {
        if (!this.responderSetup()) {
            this.setupResponder();
            this.responderSetup(true);
        }
    }

    // private
    setupResponder () {
        const channel = this.channel();
        assert(channel, "channel is not set");
        channel.onmessage = (event) => {
            if (event.data?.type === "hello" && event.data.appName === this.appName()) {
                channel.postMessage({ type: "ack", appName: this.appName() });
            }
        };
    }

    async hasOtherTabsOpen () {
        assert(SvPlatform.isBrowserPlatform(), "hasOtherTabsOpen is only supported in the browser");

        const channel = this.getChannel();
        return new Promise((resolve) => {
            let seenOther = false;

            const onMessage = (event) => {
                if (event.data?.type === "ack" && event.data.appName === this._appName) {
                    seenOther = true;
                    cleanup();
                    resolve(true);
                }
            };

            const cleanup = () => {
                channel.removeEventListener("message", onMessage);
            };

            channel.addEventListener("message", onMessage);
            channel.postMessage({ type: "hello", appName: this._appName });

            this.addTimeout(() => {
                cleanup();
                resolve(seenOther);
            }, this._timeoutMs);
        });
    }

    shutdown () {
        this.shutdownChannel();
        this.shutdownResponder();
    }

    shutdownChannel () {
        if (this.channel()) {
            this.channel().close();
            this.setChannel(null);
        }
    }

    shutdownResponder () {
        if (this.responderSetup()) {
            this.setResponderSetup(false);
        }
    }

}.initThisClass());
