"use strict";

(class AsyncFuture extends Base {

    initPrototype () {
        this.newSlot("connection", null);
        this.newSlot("message", null);
        this.newSlot("response", null);
        this.newSlot("responseTarget", null);
        this.newSlot("result", undefined);
        this.newSlot("error", null);
        this.newSlot("isDone", false);
        this.newSlot("timeoutId", null);
        this.newSlot("timeout", 30000);
        //this.newSlot("resultProxy", null)
        this.newSlot("doesIgnoreResponse", false);
    }

    init () {
        super.init();
        this.startTimeout();
        this.setIsDebugging(false);
    }

    // --- timeout ---

    setTimeout (ms) {
        if (this.hasTimer()) {
            this.stopTimeout();
            this.startTimeout();
        }
    }

    hasTimer () {
        return this.timeoutId() !== null;
    }

    startTimeout () {
        if (this.timeout()) {
            const tid = setTimeout(() => this.onTimeout(), this.timeout());
            this.setTimeoutId(tid);
        }
    }

    stopTimeout () {
        const tid = this.timeoutId();
        if (tid) {
            clearTimeout(tid);
            this.setTimeoutId(null);
        }
    }

    onTimeout () {
        this.onDone();
        this.setTimeoutId(null);
        this.debugLog(" " + this.message().messageId() + " TIMEOUT");
        this.informResponseTarget("onTimeout");
    }

    // --- callbacks ---

    onComplete () {
        this.onDone();
        this.informResponseTarget("onComplete");
    }

    onError () {
        this.onDone();
        this.informResponseTarget("onError");
    }

    // --- response target ---

    ignoreResponse () {
        this.setDoesIgnoreResponse(true);
        return this;
    }

    informResponseTarget (prefix) {
        if (this.doesIgnoreResponse()) {
            return;
        }

        const target = this.responseTarget();
        const m = prefix + "_" + this.message().methodName();
        if (this.message().expectsResponse()) {
            if (target) {
                const f = target[m];
                if (f) {
                    f.call(target, this);
                } else {
                    console.warn(this.svType() + " LOCAL WARNING: " + target.svType() + " missing method " + m + "()");
                }
            } else {
                console.warn(this.svType() + " LOCAL WARNING: no responseTarget for " + m);
            }
        }
    }

    // --- done ---

    onDone () {
        this.stopTimeout();
        this.setIsDone(true);
        this.connection().removeFuture(this);
        //this.cleanUp()
    }

    /*
    cleanUp () {
        this.setConnection(null)
        this.setMessage(null)
    }
    */

    // --- response ---

    handleResponse (aResponse) {
        this.setResponse(aResponse);
        if (aResponse.result) {
            this.setResult(aResponse.result());
        } else {
            this.setError(aResponse.error());
        }

        if (this.error()) {
            this.onError();
        } else {
            this.onComplete();
        }
        return this;
    }

    // --- result proxy ---

    /*
    resultProxy () {
        if (!this._resultProxy) {
            this._resultProxy = this.newProxy()
        }
        return this._resultProxy
    }

    newProxy () {
        const handler = {
            get (target, methodName) {
                return (...args) => {
                    if (methodName === "futureForResultProxy") {
                        return this
                    }

                    if (!this.isDone()) {
                        throw new Error(this.svType() + " resultProxy accessed before result has been received")
                    }

                    const v = target.result()

                    if (methodName === Symbol.toPrimitive) {
                        return v // to handle non-object result types e.g. numbers
                    }

                    v[methodName].apply(v, args)
                };
            }
        }

        return new Proxy(this, handler)
    }
    */

}.initThisClass());
