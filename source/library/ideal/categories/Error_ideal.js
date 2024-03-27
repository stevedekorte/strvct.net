"use strict";

/*

    Error_ideal

    Some extra methods for the Javascript Error primitive.

*/

(class Error_ideal extends Error {

    /*
    JS seems to have this slot
    static stackTraceLimit () {
        return 100 // looks like default on Chrome is 10?
    }
    */

    static assert (v, errorMessage, errorName) {
        if (!Boolean(v)) {
            const m = errorMessage ? errorMessage : "assert failed - false value";
            debugger;
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

    static assertDefined (v) {
        if (v === undefined) {
            throw new Error("assert failed - undefined value");
        }
        return v;
    }

    static showCurrentStack () {
        const e = new Error();
        e.name = "STACK TRACE";
        e.message = "";
        console.log( e.stack );
    }

    static assertThrows (func) {
        assert(Type.isFunction(func));

        let didThrow = false;
        try {
            func();
        } catch(e) {
            didThrow = true;
        }

        if (!didThrow) {
            console.log("assertThrows(" + func.toString() + ") failed");
        } else {
            //console.log("assertThrows(" + func.toString() + ") passed");
        }

        assert(didThrow);
    }

    static try (func) {
        try {
            func();
        } catch (error) {
            this.showError(error);
        }
    }

    static callingScriptURL () {
        const urls = new Error().stackURLs();
        return urls[1];
    }

    
    stackURLs (v) {
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
        })
        return urls;
    }

    // ------------------------

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
                const obj = line.before(".");
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
        })
		
        let s = firstLine + "\n";
        const m = out.maxValue(function (entry) { return entry[0].length });
        out.forEach(function (entry) {
            s += indent + entry[0] + " ".repeat(m + 1 - entry[0].length) + entry[1] + "\n";
        })
		
        //s = error.message + "\n" + s;
        s = s.replaceAll("<br>", "\n");
        return s;
    }
	
    show () {
        console.warn(this.description());
    }

}).initThisCategory();

// --- helper functions ---

getGlobalThis().assert = function assert(v, errorMessage) {
    return Error.assert(v, errorMessage);
}

getGlobalThis().assertDefined = function assertDefined(v, errorMessage) {
    return Error.assertDefined(v, errorMessage);
}

getGlobalThis().assertThrows = function assertThrows(func) {
    Error.assertThrows(func);
}
