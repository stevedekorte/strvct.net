"use strict";

/**
 * @module library.ideal
 * @class Error_ideal
 * @extends Error
 * @description Extended Error class with additional utility methods.
 */
(class Error_ideal extends Error {

    /**
     * Rethrows the error, setting the cause if it's undefined.
     * @throws {Error} This error
     * @category Error Handling
     */
    rethrow () {
        if (this.cause === undefined && typeof(Error.cause) === "function") {
            this.cause = this;
        }
        throw this;
    }

    /**
     * Logs console.warn message if aBool is true.
     * @category Error Handling
     */
    static warn (aBool, errorMessage) {
        if (aBool) {
            console.warn("WARNING: ", errorMessage);
        }
    }

    /**
     * Asserts that a value is truthy, throwing an error if it's not.
     * @param {*} v - The value to assert
     * @param {string|function} [errorMessage] - The error message or a function that returns it
     * @param {string} [errorName] - The name of the error
     * @returns {*} The asserted value
     * @throws {Error} If the assertion fails
     * @category Assertion
     */
    static assert (v, errorMessage, errorName) {
        if (!v) {
            if (typeof(errorMessage) === "function") {
                errorMessage = errorMessage();
            }
            const m = errorMessage ? errorMessage : "assert failed - false value";

            const e = new Error(m);
            if (errorName) {
                e.name = errorName;
            }
            if (errorMessage) {
                console.warn("assert failed: " + errorMessage);
            }
            throw e;
        }
        return v;
    }

    /**
     * Asserts that a value is not undefined.
     * @param {*} v - The value to check
     * @returns {*} The asserted value
     * @throws {Error} If the value is undefined
     * @category Assertion
     */
    static assertDefined (v) {
        if (v === undefined) {
            throw new Error("assert failed - undefined value");
        }
        return v;
    }

    /**
     * Logs the current stack trace to the console.
     * @category Debugging
     */
    static showCurrentStack () {
        const e = new Error();
        e.name = "STACK TRACE";
        e.message = "";
        console.log(e.stack);
    }

    /**
     * Asserts that a function throws an error when called.
     * @param {Function} func - The function to test
     * @throws {Error} If the function doesn't throw
     * @category Assertion
     */
    static assertThrows (func) {
        assert(Type.isFunction(func));

        let didThrow = false;
        try {
            func();
        } catch (e) {
            console.warn("assertThrows(" + func.toString() + ") failed: " + e.message);
            didThrow = true;
        }

        assert(didThrow, "assertThrows(" + func.toString() + ") failed");
    }

    /**
     * Executes a function and shows any error that occurs.
     * @param {Function} func - The function to execute
     * @category Error Handling
     */
    static try (func) {
        try {
            func();
        } catch (error) {
            this.showError(error);
        }
    }

    /**
     * Gets the URL of the calling script.
     * @returns {string} The URL of the calling script
     * @category Debugging
     */
    static callingScriptURL () {
        const urls = new Error().stackURLs();
        return urls[1];
    }

    /**
     * Normalizes an error (String, Error, Event) to an Error object.
     * @param {*} error - The error to normalize
     * @returns {Error} The normalized error
     * @category Error Handling
     */
    static normalizeError (error) {
        if (error instanceof Error) {
            return error;
        }

        if (error instanceof String) {
            return new Error(error);
        }

        if (error instanceof Event) {
            let message = error.message;
            const note = "Event type: '" + error.type + "' target: '" + error.target + "'";
            if (message) {
                message += "\n" + note;
            } else {
                message = note;
            }
            return new Error(message);
        }

        console.error("Unknown type of error:", error);
        throw new Error("Unknown error type: " + typeof error);
    }

    /**
     * Gets the short message of the error.
     * @returns {string} The short message of the error
     * @category Error Handling
     */
    shortMessage () {
        const s = this.message;
        if (s.length <= 100) {
            return s;
        }
        return s.substring(0, 100) + "...";
    }

    /**
     * @category Debugging
     */
    stackURLs () {
        let urls = this.stack.split("at");
        urls.removeFirst();
        urls = urls.map(url => {

            if (url.contains("(")) {
                url = url.after("(");
            }

            url = url.strip();

            const parts = url.split(":");
            parts.removeLast();
            parts.removeLast();
            return parts.join(":");
        });
        return urls;
    }

    /**
     * Generates a formatted description of the error.
     * @returns {string} A formatted description of the error
     * @category Error Handling
     */
    description () {
        const error = this;
        const lines = error.stack.split("\n");
        const firstLine = lines.removeFirst();
        const out = [];
        const indent = "    ";

        lines.forEach(function (line) {
            if (line.contains("at file")) {
                out.push(["....", line.after("at ").split("/").pop()]);
            } else {
                line = line.after("at ");
                if (line === "") {
                    return;
                }
                //const obj = line.before(".");
                const method = line.after(".").before(" (");
                const path = line.after("(").before(")");
                const filePart = path.split("/").pop();
                let file = filePart.before(":");
                if (file === "") {
                    file = "???.js:??:?";
                }
                const className = file.before(".js");
                const location = filePart.after(":");
                out.push([className + " " + method + "()      ", file + ":" + location]);
            }
        });

        let s = firstLine + "\n";
        const m = out.maxValue(function (entry) { return entry[0].length; });
        out.forEach(function (entry) {
            s += indent + entry[0] + " ".repeat(m + 1 - entry[0].length) + entry[1] + "\n";
        });

        //s = error.message + "\n" + s;
        s = s.replaceAll("<br>", "\n");
        return s;
    }

    /**
     * Logs the error description to the console.
     * @category Error Handling
     */
    show () {
        console.warn(this.description());
    }

}).initThisCategory();

// --- helper functions ---

/**
 * Global assert function.
 * @param {*} v - The value to assert
 * @param {string|function} [errorMessage] - The error message or a function that returns it
 * @returns {*} The asserted value
 * @throws {Error} If the assertion fails
 * @category Assertion
 */
SvGlobals.globals().assert = function assert (v, errorMessage) {
    return Error.assert(v, errorMessage);
};

/**
 * Global assertDefined function.
 * @param {*} v - The value to check
 * @param {string|function} [errorMessage] - The error message or a function that returns it
 * @returns {*} The asserted value
 * @throws {Error} If the value is undefined
 * @category Assertion
 */
SvGlobals.globals().assertDefined = function assertDefined (v, errorMessage) {
    return Error.assertDefined(v, errorMessage);
};

/**
 * Global assertThrows function.
 * @param {Function} func - The function to test
 * @throws {Error} If the function doesn't throw
 * @category Assertion
 */
SvGlobals.globals().assertThrows = function assertThrows (func) {
    Error.assertThrows(func);
};
