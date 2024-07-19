

"use strict";

/*

    StreamNode

    Base class for StreamTextNode and StreamElementNode

*/

(class StreamNode extends ProtoClass {

    initPrototypeSlots () {

        {
            const slot = this.newSlot("parent", null); // parent tag
            slot.setSlotType("StreamNode");
            slot.setAllowsNullValue(true);
        }

        {
            const slot = this.newSlot("domNode", null); // HTMLElement or TextNode
            slot.setSlotType("HTMLElement");
        }

        {
            const slot = this.newSlot("isClosed", false); // true if the stream has read the closing of the node
            slot.setSlotType("Boolean");
        }
    }
  
    initPrototype () {
    }

    detectAncestor (func) {
        if (func(this)) {
            return this;
        }
        if (this.parent()) {
            return this.parent().detectAncestor(func);
        }
        return null;
    }

    onOpen () {
        const domNode = this.asDomNode();
        /*
        // parent responsible for calling appendChild
        if (this.parent()) {
            domNode.setParent(this.parent().domNode())
        }
        */
        this.setDomNode(domNode);
        return this;
    }

    onClose () {
        // called by HtmlStreamReader
        this.setIsClosed(true);
        return this;
    }

    rootNode () {
        if (this.parent()) {
            return this.parent().rootNode();
        }
        return this;
    }

    tagPath () {
        const path = this.parent() ? this.parent().tagPath() : [];
        path.push(this);
        return path;
    }

    numberPath () {
        return this.tagPath().map(tag => tag.childIndex());
    }

    depth () {
        return this.tagPath().length;
    }

    depthSpacer () {
        return "  ".repeat(this.depth());
    }

}.initThisClass());
