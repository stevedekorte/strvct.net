"use strict";

/*
    EditableDomView

    For subclasses to extend. Ancestors of this class are organizational parts of DomView.

*/

(class EditableDomView extends ControlDomView {
    
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

    getSelectedText() {
        if (this.isFocused()) {
            const selection = window.getSelection();
            return selection.toString();
        } else {
            console.warn(this.type() + " attempt to get selection on unfocused text")
        }
        return ""
    }

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
    
    insertTextAtCursor (text) {
        const savedSelection = this.saveSelection()

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
        this.restoreSelection(savedSelection)
        return this
    }

    saveSelection () {
        if (window.getSelection) {
            const sel = window.getSelection();
            if (sel.getRangeAt && sel.rangeCount) {
                return sel.getRangeAt(0);
            }
        } else if (document.selection && document.selection.createRange) {
            return document.selection.createRange();
        }
        return null;
    }
    
    restoreSelection (range) {
        if (range) {
            if (window.getSelection) {
                const sel = window.getSelection();
                sel.removeAllRanges();
                sel.addRange(range);
            } else if (document.selection && range.select) {
                range.select();
            }
        }
    }

    // --- set caret ----

    moveCaretToEnd () {
        const contentEditableElement = this.element()
        let range, selection;

        if (document.createRange) {
            //Firefox, Chrome, Opera, Safari, IE 9+
            range = document.createRange(); //Create a range (a range is a like the selection but invisible)
            range.selectNodeContents(contentEditableElement); //Select the entire contents of the element with the range
            range.collapse(false); //collapse the range to the end point. false means collapse to end rather than the start
            selection = window.getSelection(); //get the selection object (allows you to change selection)
            selection.removeAllRanges(); //remove any selections already made
            selection.addRange(range); //make the range you have just created the visible selection
        }
        else if (document.selection) {
            //IE 8 and lower
            range = document.body.createTextRange(); //Create a range (a range is a like the selection but invisible)
            range.moveToElementText(contentEditableElement); //Select the entire contents of the element with the range
            range.collapse(false); //collapse the range to the end point. false means collapse to end rather than the start
            range.select();//Select the range (make it the visible selection
        }
        return this
    }

    // --- text selection ------------------

    selectAll () {
        if (document.selection) {
            const range = document.body.createTextRange();
            range.moveToElementText(this.element());
            range.select();
        } else if (window.getSelection) {
            const selection = window.getSelection(); 
            const range = document.createRange();
            range.selectNodeContents(this.element());
            selection.removeAllRanges();
            selection.addRange(range);  
        }
    }

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

    // ------------

    replaceSelectedText (replacementText) {
        let range;
        if (window.getSelection) {
            const sel = window.getSelection();
            if (sel.rangeCount) {
                range = sel.getRangeAt(0);
                range.deleteContents();
                range.insertNode(document.createTextNode(replacementText));
            }

            console.log("inserted node")
        } else if (document.selection && document.selection.createRange) {
            range = document.selection.createRange();
            range.text = replacementText;
            console.log("set range.text")
        }

        if (range) {
            // now move the selection to just the end of the range
            range.setStart(range.endContainer, range.endOffset);
        }

        return this
    }

    // untested

    getCaretPosition () {
        const editableElement = this.element()
        let caretPos = 0
        if (window.getSelection) {
            const sel = window.getSelection();
            if (sel.rangeCount) {
                const range = sel.getRangeAt(0);
                if (range.commonAncestorContainer.parentNode == editableElement) {
                    caretPos = range.endOffset;
                }
            }
        } else if (document.selection && document.selection.createRange) {
            const range = document.selection.createRange();
            if (range.parentElement() == editableElement) {
                const tempEl = document.createElement("span");
                editableElement.insertBefore(tempEl, editableElement.firstChild);
                const tempRange = range.duplicate();
                tempRange.moveToElementText(tempEl);
                tempRange.setEndPoint("EndToEnd", range);
                caretPos = tempRange.text.length;
            }
        }
        return caretPos;
    }

    setCaretPosition (caretPos) {
        const e = this.element();

        if (e != null) {
            if (e.createTextRange) {
                const range = e.createTextRange();
                range.move("character", caretPos);
                range.select();
            }
            else {
                if (e.selectionStart) {
                    e.focus();
                    e.setSelectionRange(caretPos, caretPos);
                } else {
                    e.focus();
                }
            }
        }
    }

    // ---------------

    clearSelection () {
        if (window.getSelection) {
            window.getSelection().removeAllRanges();
        } else if (document.selection) {
            document.selection.empty();
        }
        return this
    }

}.initThisClass());
