"use strict";

/*

    String_ideal

    Some extra methods for the Javascript String primitive.

*/

String.prototype._setterCacheMap = new Map();

(class String_ideal extends String {
    
    asString () {
        return this;
    }
    
    countOccurances (substring) {
        return this.split(substring).length - 1;
    }

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
    
    beginsWith (prefix) { // Javascript calls this "startsWith
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

    /*
    Javascript supports this method now
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
    */

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

    /*
    // JS implements this now
    at (i) {
        return this.slice(i, i + 1);
    }
    */

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
        return this.substring(this.startsWith(prefix) ? prefix.length : 0);
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
    if (value === "" || value === null || value === undefined) {
        return NaN;
        }
        
        const number = Number(value);
        
        return isNaN(number) ? NaN : number;
    }

    /*
    uncamelCase () {
        return this
            .replace(/([A-Z])/g, ' $1') // Prepend a space before each uppercase letter
            .trim(); // Remove potential leading space
    }
    */

    humanized () {
        // convert camel case to normal string e.g. someMethodName -> Some Method Name

        const words = [];
        let start = -1;
        const capitalized = this.capitalized();
        let i;
        for (i = 0; i < capitalized.length; i++) {
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

    // --- replace ---

    replaceMap (map) {
        let s = this;
        map.forEach((value, key) => {
            s = s.replaceAll(key, value);
        });
        return s;
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

    // --- indent ---

    indent (n, spacer = " ") {
        const indentation = spacer.repeat(n);
        return this.split('\n').map(line => indentation + line).join('\n');
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

    /* JS implements this now
    capitalized () {
        return this.replace(/\b[a-z]/g, function (match) {
            return match.toUpperCase();
        });
    }
    */

    /// String

    asSetter () {
        const cache = this.thisPrototype()._setterCacheMap 
        let result = cache[this]
        if (!result) {
             result = "set" + this.capitalized()
             cache.set(this, result)
             // test for highwater mark
             if (cache.size > 50000) {
                console.warn("setter cache is getting big! clearing...")
                cache.clear()
             }
        }
        return result
        //return "set" + this.capitalized();
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

    clipWithEllipsis (length) {
        // Check if the length of the string is less than or equal to the specified length
        if (this.length <= length) {
            return this.toString();
        }
        // Clip the string to the specified length and append "..."
        return this.substring(0, length) + '...';
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

    containsHtml () {
        return /<(\w+)[^>]*>/.test(this);
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

    byteLength () {
        // returns the byte length of an utf8 string
        // from: https://stackoverflow.com/questions/5515869/string-length-in-bytes-in-javascript
        let s = this.length;
        for (let i = this.length - 1; i >= 0; i--) {
            const code = this.charCodeAt(i);
            if (code > 0x7f && code <= 0x7ff) {
                s ++;
            } else if (code > 0x7ff && code <= 0xffff) { 
                s += 2;
            }
            if (code >= 0xDC00 && code <= 0xDFFF) {
                i--; //trail surrogate
            }
        }
        return s;
    }

    byteSizeDescription () {
        return this.byteLength().byteSizeDescription()
        //return this.length.byteSizeDescription()
    }

    hashCode () {
        return this.hashCode64();
    }

    // 32-bit version
    hashCode32() {
        let hash = 0;
        for (let i = 0; i < this.length; i++) {
        const chr = this.charCodeAt(i);
        hash = ((hash << 5) - hash) + chr;
        hash |= 0; // Convert to 32bit integer
        }
        return hash;
    }
    
    // 64-bit version
    hashCode64 () {
        let h1 = 0xdeadbeef ^ 0, h2 = 0x41c6ce57 ^ 0;
        for (let i = 0; i < this.length; i++) {
        const chr = this.charCodeAt(i);
        h1 = Math.imul(h1 ^ chr, 2654435761);
        h2 = Math.imul(h2 ^ chr, 1597334677);
        }
        h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
        h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
        return 4294967296 * (2097151 & h2) + (h1 >>> 0);
    }


    promiseSha256Digest () {
        // example use: const hashBuffer = await "hello".promiseSha256Digest();
        const uint8Array = new TextEncoder("utf-8").encode(this);    
        return crypto.subtle.digest("SHA-256", uint8Array.buffer)
    }

    stripHTML () {
        const doc = new DOMParser().parseFromString(this, 'text/html');
        return doc.body.textContent || "";
    }

    /*
    stripHtmlDivsWithClassNames (classNames) {
        // Parse the HTML string into a DOM object
        const parser = new DOMParser();
        const doc = parser.parseFromString(this, 'text/html');
    
        // Iterate over each class name and remove the corresponding divs
        classNames.forEach(className => {
            doc.querySelectorAll(`div.${className}`).forEach(el => el.remove());
        });
    
        // Serialize the document back to a string
        return doc.body.innerHTML;
    }
    */

    stripHtmlElementsWithTagNames (tagNames) {
        // Parse the HTML string into a DOM object
        const parser = new DOMParser();
        const doc = parser.parseFromString(this, 'text/html');
    
        // Iterate over each tag name and remove the corresponding elements
        tagNames.forEach(tagName => {
            doc.querySelectorAll(tagName).forEach(el => el.remove());
        });
    
        // Serialize the document back to a string
        return doc.body.innerHTML;
    }

    replaceContentOfHtmlTagMap (tagNameToContentMap) {
        // Parse the HTML string into a DOM object
        const parser = new DOMParser();
        const doc = parser.parseFromString(this, 'text/html');
    
        // Iterate over each tag name and remove the corresponding elements
        tagNames.forEach(tagName => {
            const newContent = tagNameToContentMap.get(tagName);
            doc.querySelectorAll(tagName).forEach(el => {
                el.innerHTML = newContent;
            });
        });
    
        // Serialize the document back to a string
        return doc.body.innerHTML;
    }

    diff (otherString) {
        const originalText = this;
        const modifiedText = otherString;
        let i = 0, j = 0;
        const diff = [];
        
        while (i < originalText.length || j < modifiedText.length) {
            if (originalText[i] === modifiedText[j]) {
            let matchStart = i;
            while (originalText[i] === modifiedText[j] && i < originalText.length && j < modifiedText.length) {
                i++;
                j++;
            }
            if (i > matchStart) {
                diff.push({ type: 'unchanged', text: originalText.substring(matchStart, i) });
            }
            } else {
            let originalStart = i;
            let modifiedStart = j;
            while (originalText[i] !== modifiedText[j] && (i < originalText.length || j < modifiedText.length)) {
                if (i < originalText.length) i++;
                if (j < modifiedText.length) j++;
            }
            if (originalStart < i || modifiedStart < j) {
                diff.push({ 
                type: 'modified', 
                original: originalText.substring(originalStart, i),
                modified: modifiedText.substring(modifiedStart, j)
                });
            }
            }
        }
        
        return diff;
    }

    asNormalizedHtml () {
        // Since what is returned by element.innerHTML is not always the same as the string used to set element.innerHTML 
        // (due to html normalization), this method returns a normalized version of the html string which is useful for comparison.
        const element = document.createElement("div");        
        element.innerHTML = this;        
        return element.innerHTML;
    }

    contentOfElementsOfTag (tagName) {
        function Element_hasParentWithTag (element, tagName) {
          tagName = tagName.toLowerCase();
          
          while (element) {
            if (element.tagName && element.tagName.toLowerCase() === tagName.toLowerCase()) {
              return true;
            }
            element = element.parentNode;
          }
          
          return false;
        }
    
        const el = document.createElement("div");
        el.innerHTML = this;
        let matches = el.elementsOfTag(tagName);    
        const results = [];
        //matches = matches.select(e => !Element_hasParentWithTag(e, "thinking"));
        matches.forEach((e) => results.push(e.innerHTML));
        return results;
      }
    
}).initThisCategory();



