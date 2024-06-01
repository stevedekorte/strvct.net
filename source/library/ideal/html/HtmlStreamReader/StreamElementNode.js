
"use strict";

/*

  StreamElementNode

*/

(class StreamElementNode extends StreamNode {

    initPrototypeSlots () {
      {
          const slot = this.newSlot("name", ""); // string
      }
  
      {
          const slot = this.newSlot("attributes", null); // dictionary
      }
  
      {
          const slot = this.newSlot("text", ""); // string
      }

      {
        const slot = this.newSlot("children", null); // array of child tags and strings
      }
    }
  
    initPrototype () {
    }
  
    init () {
      super.init();
      this.setAttributes({});
      this.setChildren([]);
    }

    isTextNode () {
      return false;
    }

    setAttributes (dict) {
      this._attributes = dict;
      return this;
    }

    lastTextNode () {
      const last = this.children().last();
      if (last && last.isTextNode()) {
        return last;
      }
      return null;
    }
  
    addChild (aNode) { // node is String or SentenceTag
      aNode.setParent(this);
      this.children().push(aNode);
      this.domNode().appendChild(aNode.domNode());
      return this;
    }
  
    attributesString () {
      const parts = []
      for (const [key, value] of Object.entries(this.attributes())) {
        parts.push(key + '="' + value + '"');
      }
      return parts.join(" ")
    }
  
    openTagString () {
      const as = this.attributesString();
      return "<" + this.name() + (as ? " " + as : "") + ">";
    }

    closeTagString () {
      if (this.isClosed()) {
        return "</" + this.name() + ">";
      } 
      return "";
    }

    description () {
      return this.openTagString() + this.innerHtml().clipWithEllipsis(15) + this.closeTagString();
    }

    asHtml () {
      // NOTE: this is not normalized HTML, use asHtmlNormalized() on the returned value before comparing
      return this.openTagString() + this.innerHtml() + this.closeTagString();
    }
  
    innerHtml () {
    // NOTE: this is not normalized HTML, use asHtmlNormalized() on the returned value before comparing
      const strings = this.children().map(child => child.asHtml());
      return strings.join("");
    }

    textContent () {
      return this.children().map(c => c.textContent()).join("");
    }

    show () {
      console.log(this.depthSpacer() + this.openTagString());
      this.children().forEach(child => child.show());
      console.log(this.depthSpacer() + this.closeTagString());
      return this;
    }

    asDomNode() {
      const newNode = document.createElement(this.name());
      const attributes = this.attributes();

      if (attributes) {
        for (const [key, value] of Object.entries(attributes)) {
          newNode.setAttribute(key, value);
        }
      }
      return newNode
    }

    // --- helpers ---

    dataNote () {
      return this.attributes()["data-note"];
    }
  
  }.initThisClass());
  