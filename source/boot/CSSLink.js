"use strict";

(class CssLink extends Base {
    initPrototype() {
        this.newSlot("fullPath", null);
        // subclasses should override to initialize
    }

    run () {
        if (!this.isInBrowser()) {
            return
        }

        const styles = document.createElement("link")
        styles.rel = "stylesheet"
        styles.type = "text/css"
        styles.media = "screen"
        styles.href = this.fullPath()
        document.getElementsByTagName("head")[0].appendChild(styles)
    }
}.initThisClass())
