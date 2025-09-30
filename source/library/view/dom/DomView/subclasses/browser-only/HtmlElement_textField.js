"use strict";

/**
 * @module library.view.dom.DomView.subclasses
 * @class HTMLElement_textField
 * @extends HTMLElement
 * @description Adds experimental DOM merge support.
    TODO: move to ideal if useful.

    NOTES:
    nodeTypes:

    {
    "1": "ELEMENT_NODE",
    "2": "ATTRIBUTE_NODE",
    "3": "TEXT_NODE",
    "4": "CDATA_SECTION_NODE",
    "5": "ENTITY_REFERENCE_NODE",
    "6": "ENTITY_NODE",
    "7": "PROCESSING_INSTRUCTION_NODE",
    "8": "COMMENT_NODE",
    "9": "DOCUMENT_NODE",
    "10": "DOCUMENT_TYPE_NODE",
    "11": "DOCUMENT_FRAGMENT_NODE",
    "12": "NOTATION_NODE"
    }

*/

assert(HTMLElement.prototype.clone === undefined);

const newClass = (class HTMLElement_textField extends HTMLElement {

    /**
 * @description Clone.
 * @returns {HTMLElement} The cloned element.
 * @category Element Manipulation
 */
    clone () {
        const newNode = document.createElement(this.tagName);
        Array.from(this.attributes).forEach(attr => {
            newNode.setAttribute(attr.name, attr.value);
        });
        newNode.innerHTML = this.innerHTML;
        return newNode;
    }

    /**
 * @description Merge from.
 * @param {HTMLElement} remoteElement - The remote element.
 * @returns {void}
 * @category Element Manipulation
 */
    mergeFrom (remoteElement) {
        if (this.innerHTML === remoteElement.innerHTML) {
            return;
        }

        if (!(remoteElement instanceof HTMLElement)) {
            throw new Error("remoteElement must be an instance of HTMLElement");
        }

        //console.log("         this.innerHTML: " + this.innerHTML);
        //console.log("remoteElement.innerHTML: " + remoteElement.innerHTML);

        const localChildNodes = Array.from(this.childNodes);
        const remoteChildNodes = Array.from(remoteElement.childNodes);

        // walk through the source
        if (localChildNodes.length <= remoteChildNodes.length) {
            // this can happen if last string ended on an incomplete tag e.g. "...<"
            // let it add it as a text node and then we'll replace it with the complete tag on the next merge?
        }

        for (let i = 0; i < remoteChildNodes.length; i++) {
            const remoteChildNode = remoteChildNodes[i];

            if (i < localChildNodes.length) {
                let localChildNode = localChildNodes[i];

                // special case for cut off tags
                if (i === localChildNodes.length - 1 && localChildNode.nodeType === Node.TEXT_NODE && remoteChildNode.nodeType !== Node.TEXT_NODE) {
                // this can happen if last string ended on an incomplete tag e.g. "...<" but the tag is now complete
                    this.removeChild(localChildNode);
                    assert(remoteChildNode.nodeType === Node.ELEMENT_NODE);
                    localChildNode = remoteChildNode.clone();
                    this.appendChild(localChildNode);
                }

                assert(localChildNode.nodeType === remoteChildNode.nodeType);

                // handle children already present
                switch (localChildNode.nodeType) {
                    case Node.ELEMENT_NODE:
                        assert(localChildNode.tagName === remoteChildNode.tagName);
                        assert(localChildNode.className === remoteChildNode.className);
                        localChildNode.mergeFrom(remoteChildNode);
                        break;
                    case Node.TEXT_NODE:
                        localChildNode.textContent = remoteChildNode.textContent;
                        break;
                    default:
                        throw new Error("unhandled node type " + localChildNode.nodeType);
                }

            } else {
                // handle new children
                switch (remoteChildNode.nodeType) {
                    case Node.ELEMENT_NODE:
                        this.appendChild(remoteChildNode.clone());
                        break;
                    case Node.TEXT_NODE:
                        this.appendChild(document.createTextNode(remoteChildNode.textContent));
                        break;
                    default:
                        throw new Error("unhandled node type " + localChildNode.nodeType);
                }
            }
        }
    }

    /**
 * @description Find element with text content.
 * @param {String} textContent - The text content.
 * @param {String} className - The class name.
 * @returns {HTMLElement} The element.
 * @category Element Search
 */
    findElementWithTextContent (textContent, className) {
        const children = Array.from(this.childNodes);

        for (let i = 0; i < children.length; i++) {
            const child = children[i];

            if (className && !child.classList.contains(className)) {
                continue;
            }

            if (child.textContent === textContent) {
                return child;
            }

            if (child.textContent.trim() === textContent) {
                console.warn("WARNING: findElementWithTextContent non exact match for [" + textContent.clipWithEllipsis(15) + "]");
                return child;
            }

            if (child.nodeType === Node.ELEMENT_NODE) {
                const match = child.findElementWithTextContent(textContent, className);
                if (match) {
                    return match;
                }
            }
        }

        return null;
    }

    //Element.prototype.getAllSubelements = function() { // Element includes HTML and SVG elements

    // --- find matching class names ---

    /**
 * @description Get all subelements with class.
 * @param {String} className - The class name.
 * @returns {Array} The subelements.
 * @category Element Search
 */
    getAllSubelementsWithClass (className) {
        return this.getAllSubelementsWithAnyOfClass([className]);
    };

    /**
 * @memberof HTMLElement
 * @instance
 * @description Get all subelements with any of class.
 * @param {Array} classNames - The class names.
 * @returns {Array} The subelements.
 * @category Element Search
 */
    getAllSubelementsWithAnyOfClass (classNames) {
        let allSubelements = [];
        function recurse (element) {
            Array.from(element.children).forEach(child => {
                // Check if the child element contains any of the class names provided
                if (classNames.some(className => child.classList.contains(className))) {
                    allSubelements.push(child);
                }
                recurse(child);
            });
        }
        recurse(this);
        return allSubelements;
    };

    // --- find matching tag names ---

    /**
 * @description Elements of tag.
 * @param {String} tagName - The tag name.
 * @returns {Array} The elements.
 * @category Element Search
 */
    elementsOfTag (tagName) {
        assert(Type.isString(tagName));
        return this.elementsOfTags([tagName]);
    }

    /**
 * @description Elements of tags.
 * @param {Array} tagNames - The tag names.
 * @returns {Array} The elements.
 * @category Element Search
 */
    elementsOfTags (tagNames) {
        assert(Type.isArray(tagNames));
        const lowerCaseTagNames = tagNames.map(tagName => tagName.toLowerCase());

        let allSubelements = [];

        function recurse (element) {
            Array.from(element.children).forEach(child => {
                // Check if the child element's tag name is in the provided list
                if (lowerCaseTagNames.includes(child.tagName.toLowerCase())) {
                    allSubelements.push(child);
                }
                recurse(child);
            });
        }

        recurse(this);
        return allSubelements;
    };


}); //.initThisCategory();

Object.initThisCategory.apply(newClass);


/*

// for testing

document.addEventListener('blur', function(event) {
    const focusedElement = event.target;
    console.log("'" + focusedElement.textContent.substring(0, 10) + "...' BLUR");
  }, true);

document.addEventListener('focus', function(event) {
    const focusedElement = event.target;
    console.log("'" + focusedElement.textContent.substring(0, 10) + "...' FOCUS");
  }, true);

*/
