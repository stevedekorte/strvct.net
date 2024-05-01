"use strict";

/*
    SelectableDomView

    For subclasses to extend. Ancestors of this class are organizational parts of DomView.

*/

(class SelectableDomView extends ControlDomView {
    
    initPrototypeSlots () {
        {
            const slot = this.newSlot("storedSelectionRange", null);
        }
    }

    getSelectedText () {
        if (this.containsSelection()) { // this.isFocused() should be true
            const selection = window.getSelection();
            return selection.toString();
        } else {
            console.warn(this.type() + " attempt to get selection on unfocused text")
        }
        return ""
    }

    // --- save / restore selection ----

    storeSelectionRange () {
        const range = this.getSelectionRange();
        if (range) {
            console.log(this.typeId() + "--- storing selection ---")
            this.setStoredSelectionRange(range);
            return true;
        }
        return false;
    }

    restoreSelectionRange () {
        if (this.storedSelectionRange()) {
            console.log(this.typeId() + "--- restoring selection ---");
            this.setSelectionRange(this.storedSelectionRange()); // may be null
            assert(this.storedSelectionRange().isEqual(this.getWindowSelectionRange()));
            this.setStoredSelectionRange(null);
            return true;
        }
        return false;
    }

    // --- window selection range ----

    getWindowSelectionRange () {
        if (window.getSelection) {
            const selection = window.getSelection();
            //selection.collapse(<node>); // safe?
            if (selection.getRangeAt && selection.rangeCount) {
                return selection.getRangeAt(0);
            }
        } else if (document.selection && document.selection.createRange) {
            return document.selection.createRange();
        }
        return null;
    }

    setWindowSelectionRange (range) {
        if (range) {
            if (window.getSelection) {
                const sel = window.getSelection();
                sel.removeAllRanges();
                sel.addRange(range);
            } else if (document.selection && range.select) {
                range.select();
            }
        }
        return this;
    }

    // --- get / set selection range ----

    getSelectionRange () {
        if (!this.containsSelection()) {
            return null;
        }

        return this.getWindowSelectionRange();
    }
    
    setSelectionRange (range) {
        if (!this.isContainedBySelectionRange(range)) {
            return null;
        }

        this.setWindowSelectionRange(range);
        return this;
    }

    // --- set caret ----

    placeCaretAtEnd () {
        const el = this.element()
        el.focus();

        if (typeof window.getSelection !== "undefined" && typeof document.createRange !== "undefined") {
            var range = document.createRange();
            range.selectNodeContents(el);
            range.collapse(false);
            var sel = window.getSelection();
            sel.removeAllRanges();
            sel.addRange(range);
        } else if (typeof document.body.createTextRange !== "undefined") {
            var textRange = document.body.createTextRange();
            textRange.moveToElementText(el);
            textRange.collapse(false);
            textRange.select();
        }
        return this
    }

    
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

    clearSelection () { // only clear it if the selection is in this view
        if (!this.containsSelection()) {
            return this;
        }

        if (window.getSelection) {
            window.getSelection().removeAllRanges();
        } else if (document.selection) {
            document.selection.empty();
        }
        return this;
    }

    // --- selection ---

    isContainedBySelectionRange (range) {
        if (range) {
            const containsElement = range.intersectsNode(this.element(), true);
            return containsElement;
        }
        return false;
    }

    isInWindowSelection () {
        const selection = window.getSelection();
        const range = selection.getRangeAt(0);
        return this.isContainedBySelectionRange(range);
    }

    containsSelection () {
        const selection = window.getSelection();
        const range = selection.getRangeAt(0);
        const startContainer = range.startContainer;
        const endContainer = range.endContainer;
        const element = this.element();
        return element.contains(startContainer) && element.contains(endContainer);
    }

}.initThisClass());
