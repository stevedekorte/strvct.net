"use strict";

/*

    String_ideal

    Some extra methods for the Javascript String primitive.

*/

(class String_ideal extends String {
    
    shallowCopy () {
        return this
    }

    duplicate () {
        return this
    }
    
    isEmpty () {
        return this.length === 0;
    }

    size () {
        return this.length;
    }
    
    beginsWith (prefix) {
        if (!prefix || this.length < prefix.length) {
            return false;
        }
        for (let i = 0; i < prefix.length; i ++) {
            if (this.charAt(i) !== prefix.charAt(i)) {
                return false
            }
        } 
        return true
        //return this.substr(0, prefix.length) === prefix // faster that indexOf as it 
        //return this.indexOf(prefix) === 0;
    }

    endsWith (suffix) {
        if (!suffix || this.length < suffix.length) {
            return false;
        }
        for (let i = 0; i < suffix.length; i ++) {
            if (this.charAt(this.length - suffix.length + i) !== suffix.charAt(i)) {
                return false
            }
        } 
        return true
        //const index = this.lastIndexOf(suffix);
        //return (index !== -1) && (this.lastIndexOf(suffix) === this.length - suffix.length);
    }

    contains (aString) {
        return this.indexOf(aString) !== -1;
    }

    before (aString) {
        const index = this.indexOf(aString);
        
        if (index === -1) {
            return this;
        }

        return this.slice(0, index);
    }

    after (aString) {
        const index = this.indexOf(aString);

        if (index === -1) {
            return "";
        }
        
        return this.slice(index + aString.length);
    }

    between (prefix, suffix) {
        const after = this.after(prefix);
        if (after != null) {
            const before = after.before(suffix);
            if (before != null) {
                return before;
            }
            else {
                return null;
            }
        }
        else {
            return null;
        }
    }

    at (i) {
        return this.slice(i, i + 1);
    }

    first () {
        return this.slice(0, 1);
    }

    rest () {
        return this.slice(1);
    }

    repeated (times) {
        let result = "";
        const aString = this;
        times.repeat(function () { result += aString });
        return result
    }

    sansPrefixes (aStringList) {
        let result = this
        aStringList.forEach((s) => { result = result.sansPrefix(s) })
        return result
    }

    sansPrefix (prefix) {
        return this.substring(this.beginsWith(prefix) ? prefix.length : 0);
    }

    sansSuffixes (aStringList) {
        let result = this
        aStringList.forEach((s) => { result = result.sansSuffix(s) })
        return result
    }

    sansSuffix (suffix) {
        if (this.endsWith(suffix)) {
            return this.substr(0, this.length - suffix.length);
        }
        else {
            return this;
        }
    }

    stripped () {
        return this.replace(/^\s\s*/, "").replace(/\s\s*$/, "");
    }

    uncapitalized () {
        return this.replace(/\b[A-Z]/g, function (match) {
            return match.toLowerCase();
        });
    }

    asNumber () {
        return Number(this);
    }

    //move to libraries?
    humanized () //someMethodName -> Some Method Name
    {
        const words = [];
        let start = -1;
        const capitalized = this.capitalized();
        for (let i = 0; i < capitalized.length; i++) {
            if (capitalized.slice(i, i + 1).match(/[A-Z]/)) {
                let word = capitalized.slice(start, i);
                if (word) {
                    words.append(word);
                }
                start = i;
            }
        }
        words.append(capitalized.slice(start, i));
        return words.join(" ");
    }

    titleized () {
        return this.split(/\s+/).map(function (s) { return s.capitalized() }).join(" ");
    }

    base64Encoded () {
        //return new Buffer(String(this), "utf8").toString("base64");
        return window.btoa(this);
    }

    base64UrlEncoded () {
        return this.base64Encoded().replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, ",");
    }

    base64Decoded () {
        //return new Buffer(String(this), "base64").toString("utf8");
        return window.atob(this);
    }

    base64UrlDecoded () {
        return this.replace(/-/g, "+").replace(/_/g, "/").replace(/,/g, "=").base64Decoded();
    }

    stringCount (str) {
        return this.split(str).length - 1;
    }

    lineCount () {
        let count = 0
        for (let i = 0; i < this.length; i++) {
            const c = this.charAt(i)
            if (c === "\n") {
                count ++
            }
        }
        return count
    }

    forEachCharacter (fn) {
        for (let i = 0; i < this.length; i++) {
            const c = this.charAt(i)
            fn(c)
        }
    }

    forEachKV (fn) {
        for (let i = 0; i < this.length; i++) {
            const c = this.charAt(i)
            fn(i, c)
        }
    }

    splitArray (splitters) {
        let s = this
        const results = []
        splitters.forEach( (splitter) => {
            if (s.contains(splitter)) {
                const before = s.before(splitter)
                s = s.after(splitter)
                results.push(before)
            } else {
                results.push(null)
            }
        })
        return results
    }

    // --- paths ---

    pathComponents () {
        if (this === "/") {
            return [""];
        }
        else if (this === "") {
            return [];
        }
        else {
            return this.split("/");
        }
    }

    sansLastPathComponent () {
        const c = this.pathComponents()
        c.removeLast();
        return c.join("/");
    }

    lastPathComponent () {
        //return this.pathComponents().last()
        const components = this.pathComponents()
        if (components.length) {
            return this.pathComponents().last();
        }
        return ""
    }

    fileName () {
        return this.lastPathComponent().sansExtension()
    }

    sansExtension () {
        const parts = this.split(".")
        if (parts.length > 1) {
            parts.pop()
        }
        return parts.join(".")
    }

    pathExtension () {
        const extension = this.split(".").last();
        return extension;
    }

    // --- pad / strip -------

    padLeft (length, padding) {
        let str = this;
        while (str.length < length) {
            str = padString + str;
        }

        return str.substring(0, length);
    }

    padRight (length, padding) {
        let str = this;
        while (str.length < length) {
            str = str + padding;
        }

        return str.substring(0, length);
    }

    strip () {
        return String(this).replace(/^\s+|\s+$/g, "");
    }

    asObject () {
        return JSON.parse(this);
    }

    capitalized () {
        return this.replace(/\b[a-z]/g, function (match) {
            return match.toUpperCase();
        });
    }

    /// String

    asSetter () {
        return "set" + this.capitalized();
    }

    firstCharacter () {
        return this.slice(0);
    }

    lastCharacter () {
        return this.slice(-1);
    }

    capitalizeWords () {
        return this.replace(/(?:^|\s)\S/g, function (a) {
            return a.toUpperCase();
        });
    }

    replaceAll (target, replacement) {
        return this.split(target).join(replacement);
    }

    loremIpsum (minWordCount, maxWordCount) {
        if (!minWordCount) { minWordCount = 10; }
        if (!maxWordCount) { maxWordCount = 40; }

        const loremIpsumWordBank = new Array("lorem", "ipsum", "dolor", "sit", "amet,", "consectetur", "adipisicing", "elit,", "sed", "do", "eiusmod", "tempor", "incididunt", "ut", "labore", "et", "dolore", "magna", "aliqua.", "enim", "ad", "minim", "veniam,", "quis", "nostrud", "exercitation", "ullamco", "laboris", "nisi", "ut", "aliquip", "ex", "ea", "commodo", "consequat.", "duis", "aute", "irure", "dolor", "in", "reprehenderit", "in", "voluptate", "velit", "esse", "cillum", "dolore", "eu", "fugiat", "nulla", "pariatur.", "excepteur", "sint", "occaecat", "cupidatat", "non", "proident,", "sunt", "in", "culpa", "qui", "officia", "deserunt", "mollit", "anim", "id", "est", "laborum.", "sed", "ut", "perspiciatis,", "unde", "omnis", "iste", "natus", "error", "sit", "voluptatem", "accusantium", "doloremque", "laudantium,", "totam", "rem", "aperiam", "eaque", "ipsa,", "quae", "ab", "illo", "inventore", "veritatis", "et", "quasi", "architecto", "beatae", "vitae", "dicta", "sunt,", "explicabo.", "nemo", "enim", "ipsam", "voluptatem,", "quia", "voluptas", "sit,", "aspernatur", "aut", "odit", "aut", "fugit,", "sed", "quia", "consequuntur", "magni", "dolores", "eos,", "qui", "ratione", "voluptatem", "sequi", "nesciunt,", "neque", "porro", "quisquam", "est,", "qui", "dolorem", "ipsum,", "quia", "dolor", "sit,", "amet,", "consectetur,", "adipisci", "velit,", "sed", "quia", "non", "numquam", "eius", "modi", "tempora", "incidunt,", "ut", "labore", "et", "dolore", "magnam", "aliquam", "quaerat", "voluptatem.", "ut", "enim", "ad", "minima", "veniam,", "quis", "nostrum", "exercitationem", "ullam", "corporis", "suscipit", "laboriosam,", "nisi", "ut", "aliquid", "ex", "ea", "commodi", "consequatur?", "quis", "autem", "vel", "eum", "iure", "reprehenderit,", "qui", "in", "ea", "voluptate", "velit", "esse,", "quam", "nihil", "molestiae", "consequatur,", "vel", "illum,", "qui", "dolorem", "eum", "fugiat,", "quo", "voluptas", "nulla", "pariatur?", "at", "vero", "eos", "et", "accusamus", "et", "iusto", "odio", "dignissimos", "ducimus,", "qui", "blanditiis", "praesentium", "voluptatum", "deleniti", "atque", "corrupti,", "quos", "dolores", "et", "quas", "molestias", "excepturi", "sint,", "obcaecati", "cupiditate", "non", "provident,", "similique", "sunt", "in", "culpa,", "qui", "officia", "deserunt", "mollitia", "animi,", "id", "est", "laborum", "et", "dolorum", "fuga.", "harum", "quidem", "rerum", "facilis", "est", "et", "expedita", "distinctio.", "Nam", "libero", "tempore,", "cum", "soluta", "nobis", "est", "eligendi", "optio,", "cumque", "nihil", "impedit,", "quo", "minus", "id,", "quod", "maxime", "placeat,", "facere", "possimus,", "omnis", "voluptas", "assumenda", "est,", "omnis", "dolor", "repellendus.", "temporibus", "autem", "quibusdam", "aut", "officiis", "debitis", "aut", "rerum", "necessitatibus", "saepe", "eveniet,", "ut", "et", "voluptates", "repudiandae", "sint", "molestiae", "non", "recusandae.", "itaque", "earum", "rerum", "hic", "tenetur", "a", "sapiente", "delectus,", "aut", "reiciendis", "voluptatibus", "maiores", "alias", "consequatur", "aut", "perferendis", "doloribus", "asperiores", "repellat");

        const randy = Math.floor(Math.random() * (maxWordCount - minWordCount)) + minWordCount;
        let ret = "";
        let needsCap = true
        for (let i = 0; i < randy; i++) {
            let newTxt = loremIpsumWordBank[Math.floor(Math.random() * (loremIpsumWordBank.length - 1))];

            if (ret.substring(ret.length - 1, ret.length) === "." || ret.substring(ret.length - 1, ret.length) === "?") {
                newTxt = newTxt.substring(0, 1).toUpperCase() + newTxt.substring(1, newTxt.length);
            }

            if (needsCap) {
                newTxt = newTxt.capitalized()
                needsCap = false
            }

            ret += " " + newTxt;
        }

        return ret + "."
    }

    escapeHtml () {
        return this.replace(/[&<>"'\/]/g, function (s) {
            const entityMap = {
                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                "\"": "&quot;",
                "'": "&#39;",
                "/": "&#x2F;"
            };
            return entityMap[s];
        });
    }

    GUID () {
        function s4() {
            return Math.floor((1 + Math.random()) * 0x10000)
                .toString(16)
                .substring(1);
        }
        return s4() + s4() + "-" + s4() + "-" + s4() + "-" +
            s4() + "-" + s4() + s4() + s4();
    }

    byteSizeDescription () {
        return this.length.byteSizeDescription()
    }

    async asyncSha256Digest () {
        // example use let digestHex = await "hello".asyncSha256DigestHex()

        // encode as UTF-8
        const msgBuffer = new TextEncoder('utf-8').encode(this);                    
    
        // hash the message
        const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);

        return hashBuffer
        /*
        // convert ArrayBuffer to Array
        const hashArray = Array.from(new Uint8Array(hashBuffer));
    
        // convert bytes to hex string                  
        const hashHex = hashArray.map(b => ('00' + b.toString(16)).slice(-2)).join('');

        var base64String = btoa(String.fromCharCode.apply(null, new Uint8Array(hashBuffer)));

        return hashHex;
        */
    }

    stripHTML () {
        const doc = new DOMParser().parseFromString(this, 'text/html');
        return doc.body.textContent || "";
    }

}).initThisCategory();

/*
async function test() {
    let text = 'An obscure body in the S-K System, your majesty. The inhabitants refer to it as the planet Earth.';
    let digestHex = await text.sha256Hex()
    console.log(digestHex);
}

test()
*/



