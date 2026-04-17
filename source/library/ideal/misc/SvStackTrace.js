"use strict";

/**
 * @module library.ideal.misc
 */

/*
    SvStackTrace
    Class that can parse a JS stack trace, into SvStackFrame objects.
*/

/**
 * @class
 * @extends ProtoClass
 * @classdesc Represents a single stack frame from a JavaScript stack trace.
 */
(class SvStackFrame extends ProtoClass {
    /**
     * Initializes the prototype slots for the SvStackFrame class.
     */
    initPrototypeSlots () {
        {
            const slot = this.newSlot("functionName", null);
            slot.setSlotType("String");
            /**
             * @member {string} functionName - The name of the function in the stack frame.
             * @category Stack Information
             */
        }
        {
            const slot = this.newSlot("url", null);
            slot.setSlotType("String");
            /**
             * @member {string} url - The URL or file path of the script containing the function.
             * @category Stack Information
             */
        }
        {
            const slot = this.newSlot("lineNumber", null);
            slot.setSlotType("Number");
            /**
             * @member {number} lineNumber - The line number in the script where the function was called.
             * @category Stack Information
             */
        }
        {
            const slot = this.newSlot("characterNumber", null);
            slot.setSlotType("Number");
            /**
             * @member {number} characterNumber - The character position on the line where the function was called.
             * @category Stack Information
             */
        }
    }

    initPrototype () {
    }

    /**
     * @description Parses a single line from a stack trace and sets the properties of the SvStackFrame object accordingly.
     * @param {string} line - A single line from a JavaScript stack trace.
     * @returns {SvStackFrame} The current SvStackFrame instance.
     * @category Parsing
     */
    fromLine (line) {
        line = line.after("at ");

        if (line.contains("(")) {
            const functionName = line.before("(").strip();
            this.setFunctionName(functionName);
            line = line.between("(", ")").strip();
        }

        const parts = line.split(":");
        if (parts.length !== 4) {
            console.log("unexpected stacktrace line format: '" + line + "'");
            return this;
        }
        const lineNumber = parts.removeLast();
        this.setLineNumber(Number(lineNumber));

        const characterNumber = parts.removeLast();
        this.setCharacterNumber(Number(characterNumber));

        const url = parts.join(":");
        this.setUrl(url);

        return this;
    }

    /**
     * @description Returns a string representation of the SvStackFrame object.
     * @returns {string} A string describing the stack frame.
     * @category Utility
     */
    description () {
        return "  " + this.functionName() + "() line " + this.lineNumber();
    }

    /**
     * @description Logs the string representation of the SvStackFrame object to the console.
     * @category Utility
     */
    show () {
        console.log(this.description());
    }
}.initThisClass());;


// -----------------------------------------------------------------

/**
 * @class
 * @extends ProtoClass
 * @classdesc Represents a JavaScript stack trace, containing an array of SvStackFrame objects.
 */
(class SvStackTrace extends ProtoClass {
    /**
     * Initializes the prototype slots for the SvStackTrace class.
     */
    initPrototypeSlots () {
        {
            const slot = this.newSlot("error", null);
            slot.setSlotType("Error");
            /**
             * @member {Error} error - The Error object associated with the stack trace.
             * @category Stack Information
             */
        }
        {
            const slot = this.newSlot("stackFrames", []);
            slot.setSlotType("Array");
            /**
             * @member {SvStackFrame[]} stackFrames - An array of SvStackFrame objects representing the stack trace.
             * @category Stack Information
             */
        }
    }

    /**
     * @description Initializes the SvStackTrace instance.
     * @category Initialization
     */
    init () {
        super.init();
    }

    /**
     * @description Sets the Error object associated with the stack trace and parses the stack trace into an array of SvStackFrame objects.
     * @param {Error} error - The Error object to associate with the stack trace.
     * @returns {SvStackTrace} The current SvStackTrace instance.
     * @category Parsing
     */
    setError (error) {
        this._error = error;

        const lines = error.stack.split("\n");
        const firstLine = lines.removeFirst();

        const frames = lines.map((line) => {
            return SvStackFrame.clone().fromLine(line);
        });
        this.setStackFrames(frames);

        return this;
    }

    /**
     * @description Logs a string representation of the stack trace to the console.
     * @category Utility
     */
    show () {
        console.log(this.svType() + ": '" + this.error().message + "'");
        this.stackFrames().forEach(frame => frame.show());
    }

    /**
     * @description Tests the functionality of the SvStackTrace class by generating an Error and logging its stack trace.
     * @category Testing
     */
    test () {
        const f1 = function () {
            try {
                throw (new Error("test error"));
            } catch (e) {
                SvStackTrace.clone().setError(e).show();
            }
        };

        const f2 = function () { f1(); };
        const f3 = function () { f2(); };
        f3();
    }

}.initThisClass());

//SvStackTrace.clone().test()
//console.log("Currently running script:", Error.callingScriptURL())
