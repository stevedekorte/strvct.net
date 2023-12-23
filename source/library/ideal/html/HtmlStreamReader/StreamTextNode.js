

"use strict";

/*

    StreamTextNode


*/

(class StreamTextNode extends StreamNode {

    initPrototypeSlots () {
        {
            const slot = this.newSlot("text", ""); // string
        }
    }

    appendText (s) {
        assert(Type.isString(s));
        this.setText(this.text() + s);
        this.domNode().textContent = this.text();
        return this;
    }

    /*
    onClose () {
        super.onClose();
        return this;
    }
    */

    isTextNode () {
        return true;
    }

    asHtml () {
        return this.text();
    }

    textContent () {
        return this.text();
    }

    description () {
        return this.text().clipWithEllipsis(15);
    }

    show () {
        console.log(this.depthSpacer() + this.text());
    }

    asDomNode () {
        const domNode = document.createTextNode(this.textContent());
        return domNode;
    }
    
}.initThisClass());
