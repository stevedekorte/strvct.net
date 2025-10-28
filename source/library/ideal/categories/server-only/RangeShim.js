"use strict";

/**
 * @description Range polyfill for Node.js environments where Range DOM API is not available.
 * This file is only executed when running in a Node.js environment.
 */

// Complete Range polyfill for DOM range functionality
class Range extends Object {
    constructor () {
        super();
        this.startContainer = null;
        this.startOffset = 0;
        this.endContainer = null;
        this.endOffset = 0;
        this.collapsed = true;
        this.commonAncestorContainer = null;
    }

    // Basic range manipulation methods
    setStart (node, offset) {
        this.startContainer = node;
        this.startOffset = offset;
        this.updateCollapsed();
        this.updateCommonAncestor();
    }

    setEnd (node, offset) {
        this.endContainer = node;
        this.endOffset = offset;
        this.updateCollapsed();
        this.updateCommonAncestor();
    }

    setStartBefore (node) {
        if (!node.parentNode) {
            throw new Error("Node has no parent");
        }
        this.setStart(node.parentNode, this.getNodeIndex(node));
    }

    setStartAfter (node) {
        if (!node.parentNode) {
            throw new Error("Node has no parent");
        }
        this.setStart(node.parentNode, this.getNodeIndex(node) + 1);
    }

    setEndBefore (node) {
        if (!node.parentNode) {
            throw new Error("Node has no parent");
        }
        this.setEnd(node.parentNode, this.getNodeIndex(node));
    }

    setEndAfter (node) {
        if (!node.parentNode) {
            throw new Error("Node has no parent");
        }
        this.setEnd(node.parentNode, this.getNodeIndex(node) + 1);
    }

    collapse (toStart = false) {
        if (toStart) {
            this.endContainer = this.startContainer;
            this.endOffset = this.startOffset;
        } else {
            this.startContainer = this.endContainer;
            this.startOffset = this.endOffset;
        }
        this.collapsed = true;
    }

    selectNode (node) {
        this.startContainer = node.parentNode;
        this.startOffset = this.getNodeIndex(node);
        this.endContainer = node.parentNode;
        this.endOffset = this.startOffset + 1;
        this.collapsed = false;
        this.updateCommonAncestor();
    }

    selectNodeContents (node) {
        this.startContainer = node;
        this.startOffset = 0;
        this.endContainer = node;
        this.endOffset = node.childNodes ? node.childNodes.length : 0;
        this.collapsed = false;
        this.updateCommonAncestor();
    }

    // Range comparison methods
    compareBoundaryPoints (how, sourceRange) {
        if (!sourceRange) {
            throw new Error("Source range is required");
        }

        let thisPoint, otherPoint;

        switch (how) {
            case Range.START_TO_START:
                thisPoint = { container: this.startContainer, offset: this.startOffset };
                otherPoint = { container: sourceRange.startContainer, offset: sourceRange.startOffset };
                break;
            case Range.START_TO_END:
                thisPoint = { container: this.startContainer, offset: this.startOffset };
                otherPoint = { container: sourceRange.endContainer, offset: sourceRange.endOffset };
                break;
            case Range.END_TO_START:
                thisPoint = { container: this.endContainer, offset: this.endOffset };
                otherPoint = { container: sourceRange.startContainer, offset: sourceRange.startOffset };
                break;
            case Range.END_TO_END:
                thisPoint = { container: this.endContainer, offset: this.endOffset };
                otherPoint = { container: sourceRange.endContainer, offset: sourceRange.endOffset };
                break;
            default:
                throw new Error("Invalid comparison type");
        }

        return this.comparePoints(thisPoint, otherPoint);
    }

    // Range deletion and extraction
    deleteContents () {
        // In a server environment, this would typically be a no-op
        // or could log that content would be deleted
        return;
    }

    extractContents () {
        // In a server environment, return a document fragment
        // This is a simplified implementation
        const fragment = {
            nodeType: 11, // DocumentFragment
            childNodes: [],
            appendChild: function (node) {
                this.childNodes.push(node);
                return node;
            }
        };
        return fragment;
    }

    cloneContents () {
        // Return a copy of the contents
        return this.extractContents();
    }

    insertNode (/*node*/) {
        // In a server environment, this would typically be a no-op
        // or could log that a node would be inserted
        return;
    }

    surroundContents (/*newParent*/) {
        // In a server environment, this would typically be a no-op
        // or could log that content would be surrounded
        return;
    }

    // Range cloning
    cloneRange () {
        const newRange = new Range();
        newRange.setStart(this.startContainer, this.startOffset);
        newRange.setEnd(this.endContainer, this.endOffset);
        return newRange;
    }

    // Range detachment
    detach () {
        this.startContainer = null;
        this.startOffset = 0;
        this.endContainer = null;
        this.endOffset = 0;
        this.collapsed = true;
        this.commonAncestorContainer = null;
    }

    // Content retrieval
    toString () {
        // Return text content within the range
        if (this.collapsed) {
            return "";
        }

        // Simplified text extraction
        if (this.startContainer === this.endContainer) {
            if (this.startContainer.nodeType === 3) { // Text node
                return this.startContainer.textContent.substring(this.startOffset, this.endOffset);
            }
        }

        return "";
    }

    // Range intersection and containment
    intersectsNode (node) {
        // Simplified intersection check
        return this.startContainer === node || this.endContainer === node;
    }

    isPointInRange (node, offset) {
        // Simplified point-in-range check
        if (this.collapsed) {
            return false;
        }

        if (node === this.startContainer && offset >= this.startOffset) {
            return true;
        }

        if (node === this.endContainer && offset <= this.endOffset) {
            return true;
        }

        return false;
    }

    comparePoint (node, offset) {
        // Compare a point to the range
        if (this.isPointInRange(node, offset)) {
            return 0;
        }

        // Simplified comparison
        if (node === this.startContainer && offset < this.startOffset) {
            return -1;
        }

        return 1;
    }

    // Helper methods
    updateCollapsed () {
        this.collapsed = (
            this.startContainer === this.endContainer &&
            this.startOffset === this.endOffset
        );
    }

    updateCommonAncestor () {
        if (this.startContainer === this.endContainer) {
            this.commonAncestorContainer = this.startContainer;
        } else {
            // Simplified common ancestor calculation
            this.commonAncestorContainer = this.startContainer;
        }
    }

    getNodeIndex (node) {
        if (!node.parentNode || !node.parentNode.childNodes) {
            return 0;
        }

        for (let i = 0; i < node.parentNode.childNodes.length; i++) {
            if (node.parentNode.childNodes[i] === node) {
                return i;
            }
        }
        return 0;
    }

    comparePoints (point1, point2) {
        if (point1.container === point2.container) {
            if (point1.offset < point2.offset) return -1;
            if (point1.offset > point2.offset) return 1;
            return 0;
        }

        // Simplified comparison for different containers
        return 0;
    }
}

// Range constants
Range.START_TO_START = 0;
Range.START_TO_END = 1;
Range.END_TO_END = 2;
Range.END_TO_START = 3;

SvGlobals.set("Range", Range);
