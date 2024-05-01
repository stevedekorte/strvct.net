"use strict";

/*
    EditableDomView

    For subclasses to extend. Ancestors of this class are organizational parts of DomView.

*/

(class EditableDomView extends SelectableDomView {
    
    initPrototypeSlots () {
        //this.newSlot("unfocusOnEnterKey", false)
        //this.newSlot("showsHaloWhenEditable", false)
    }

    /*
    init () {
        super.init()
        return this
    }
    */

    /*
    onEnterKeyDown (event) {
        this.debugLog(" onEnterKeyDown")
        if (this.unfocusOnEnterKey() && this.isFocused()) {
            this.debugLog(" releasing focus")
            // this.releaseFocus() // TODO: implement something to pass focus up view chain to whoever wants it
            //this.element().parentElement.focus()
            if (this.parentView()) {
                this.parentView().focus()
            }
        }
        return this
    }
    */

    // --- set caret ----

    consolidateTextNodesAndPreserveSelection () {
        const div = this.element()

        const selection = window.getSelection();
        if (!selection.rangeCount) return;
    
        const range = selection.getRangeAt(0);
        
        // Helper function to calculate offset within the parent
        function getOffsetWithinParent(node, offset) {
            if (node === div) return offset;
            
            let length = 0;
            while (node.previousSibling) {
                node = node.previousSibling;
                length += node.textContent.length;
            }
            return length + offset;
        }

        // Get current selection's start and end positions relative to the entire text content of the div
        const startOffset = getOffsetWithinParent(range.startContainer, range.startOffset);
        const endOffset = getOffsetWithinParent(range.endContainer, range.endOffset);
    
        // Merge all text nodes into a single text node
        const combinedText = Array.from(div.childNodes)
            .map(node => node.textContent)
            .join('');
        while (div.firstChild) {
            div.removeChild(div.firstChild);
        }
        div.appendChild(document.createTextNode(combinedText));
    
        // Restore the selection or cursor position
        const newRange = document.createRange();
        newRange.setStart(div.firstChild, startOffset);
        newRange.setEnd(div.firstChild, endOffset);
        selection.removeAllRanges();
        selection.addRange(newRange);

        return this
    }

    insertTextAtCursorAndConsolidate (text) {
        const el = this.element();
        var sel, range, textNode, insertedTextLength = text.length;

        if (window.getSelection) {
            sel = window.getSelection();
    
            if (sel.getRangeAt && sel.rangeCount) {
                range = sel.getRangeAt(0);
    
                // Remember the position before insertion
                var positionBeforeInsertion = range.startOffset;
    
                // Create a new text node containing the text to insert
                textNode = document.createTextNode(text);
                range.insertNode(textNode);
    
                // Adjust the selection to be at the end of the new text node
                range.setStartAfter(textNode);
                range.setEndAfter(textNode);
                sel.removeAllRanges();
                sel.addRange(range);
    
                // Calculate new position after consolidation
                var positionAfterConsolidation = positionBeforeInsertion + insertedTextLength;
    
                // Now, consolidate all text nodes in the div
                el.textContent = el.textContent;
    
                // Restore the position
                var newRange = document.createRange();
                var newSel = window.getSelection();
                newRange.setStart(el.childNodes[0], positionAfterConsolidation);
                newRange.collapse(true);
                newSel.removeAllRanges();
                newSel.addRange(newRange);
            }
        } else if (document.selection && document.selection.createRange) {
            // For older versions of IE
            document.selection.createRange().text = text;
        }
    }
    
    insertTextAtCursorSimple (text) { // assumes content *ONLY* has text
        this.consolidateTextNodesAndPreserveSelection()

        const selection = window.getSelection();
        const range = selection.getRangeAt(0);
    
        // Extract text content before and after the cursor/selection
        const startText = range.startContainer.textContent.substring(0, range.startOffset);
        const endText = range.startContainer.textContent.substring(range.endOffset);
    
        // Reconstruct the full text content with the inserted text
        range.startContainer.textContent = startText + text + endText;
    
        // Position the cursor after the inserted text
        range.setStart(range.startContainer, startText.length + text.length);
        range.setEnd(range.startContainer, startText.length + text.length);
        selection.removeAllRanges();
        selection.addRange(range);
        return this
    }
    
    /*
    insertTextAtCursorSimple (text) {
        const el = this.element();
        // First, ensure that all text is consolidated into a single node
        el.textContent = el.textContent;
    
        var sel, range;
        if (window.getSelection) {
            sel = window.getSelection();
            if (sel.getRangeAt && sel.rangeCount) {
                range = sel.getRangeAt(0);
                
                range.deleteContents();
                
                var textNode = document.createTextNode(text);
                range.insertNode(textNode);
    
                // Move the caret to the end of the newly inserted text node
                range = document.createRange();
                range.selectNodeContents(textNode);
                range.collapse(false);
                sel.removeAllRanges();
                sel.addRange(range);
            }
        } else if (document.selection && document.selection.createRange) {
            // For older versions of IE
            document.selection.createRange().text = text;
        }
    }
    */
    

    /*
    insertTextAtCursor (text) {
        const savedSelection = this.getSelectionRange()

        if (window.getSelection) {
            const sel = window.getSelection();
            if (sel.getRangeAt && sel.rangeCount) {
                const range = sel.getRangeAt(0);
                range.deleteContents();
                range.insertNode( document.createTextNode(text) );
            }
        } else if (document.selection && document.selection.createRange) {
            document.selection.createRange().text = text;
        }
        savedSelection.collapse()
        this.setSelectionRange(savedSelection)
        return this
    }
    */


    // --- paste from clipboardListener ---

    onPaste (event) {
        //debugger;
        // prevent pasting text by default after event
        event.preventDefault();

        const clip = event.clipboardData;
        const html = clip.getData("text/html");
        const text = clip.getData("text/plain");

        const htmlToPlainTextFunc = function (html) {
            const e = document.createElement("DIV");
            e.innerHTML = html;
            return e.textContent || e.innerText || "";
        }

        if (html && html.trim().length !== 0) {
            const s = htmlToPlainTextFunc(html)
            this.replaceSelectedText(s)
            return false; // prevent returning text in clipboard
        }

        if (text && text.trim().length !== 0) {
            const s = htmlToPlainTextFunc(text)
            this.replaceSelectedText(s)
            return false; // prevent returning text in clipboard
        }

        return true
    }

   

}.initThisClass());
