"use strict";

/**
 * @module boot
 * @description Range polyfill for Node.js environments where Range DOM API is not available
 */

// Only define Range if it's missing
if (typeof Range === 'undefined') {
    // Minimal Range polyfill for DOM range functionality
    const RangeShim = class Range {
        constructor() {
            this.startContainer = null;
            this.startOffset = 0;
            this.endContainer = null;
            this.endOffset = 0;
            this.collapsed = true;
        }
        
        setStart(node, offset) {
            this.startContainer = node;
            this.startOffset = offset;
        }
        
        setEnd(node, offset) {
            this.endContainer = node;
            this.endOffset = offset;
        }
        
        selectNode(node) {
            this.startContainer = node;
            this.startOffset = 0;
            this.endContainer = node;
            this.endOffset = 1;
        }
        
        toString() {
            return "";
        }
    };
    
    // Make Range inherit from Object to get category support methods
    RangeShim.__proto__ = Object;
    
    // Register with both global object and SvGlobals system
    const globalObj = SvGlobals.globals();
    globalObj.Range = RangeShim;
    SvGlobals.set("Range", RangeShim);
}