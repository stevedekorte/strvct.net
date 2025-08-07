"use strict";

/**
 * @module library.ideal
 * @class String_ideal
 * @extends String
 * @description Extended String class with additional utility methods.
 */

(class String_ideal extends String {

    /**
     * @returns {string} The JSON type for a String which is "string".
     */
    static jsonType () {
        return "string";
    }

    /**
     * Returns the string itself
     * @returns {string} The string
     * @category Basic Operations
     */
    asString () {
        return this;
    }
    
    /**
     * Counts the occurrences of a substring in the string
     * @param {string} substring - The substring to count
     * @returns {number} The number of occurrences
     * @category Search
     */
    countOccurances (substring) {
        return this.split(substring).length - 1;
    }

    /**
     * Creates a shallow copy of the string (which is the string itself for primitives)
     * @returns {string} The string
     * @category Basic Operations
     */
    shallowCopy () {
        return this;
    }

    /**
     * Returns a duplicate of the string (which is the string itself for primitives)
     * @returns {string} The string
     * @category Basic Operations
     */
    duplicate () {
        return this;
    }

    /**
     * Checks if two strings are equal
     * @param {string} other - String to compare with
     * @returns {boolean} True if strings are equal
     * @category Comparison
     */
    isEqual (other) {
        return this === other;
    }
    
    /**
     * Checks if the string is empty
     * @returns {boolean} True if the string is empty, false otherwise
     * @category Information
     */
    isEmpty () {
        return this.length === 0;
    }

    /**
     * Returns the length of the string
     * @returns {number} The length of the string
     * @category Information
     */
    size () {
        return this.length;
    }
    
    /**
     * Checks if the string begins with the given prefix
     * @param {string} prefix - The prefix to check
     * @returns {boolean} True if the string begins with the prefix, false otherwise
     * @category Search
     */
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
    }

    /**
     * Checks if the string contains the given substring
     * @param {string} aString - The substring to search for
     * @returns {boolean} True if the string contains the substring, false otherwise
     */
    contains (aString) {
        return this.indexOf(aString) !== -1;
    }

    /**
     * Returns the substring before the first occurrence of the given string
     * @param {string} aString - The string to search for
     * @returns {string} The substring before aString, or the entire string if aString is not found
     */
    before (aString) {
        const index = this.indexOf(aString);
        
        if (index === -1) {
            return this;
        }

        return this.slice(0, index);
    }

    /**
     * Returns the substring after the first occurrence of the given string
     * @param {string} aString - The string to search for
     * @returns {string} The substring after aString, or an empty string if aString is not found
     */
    after (aString) {
        const index = this.indexOf(aString);

        if (index === -1) {
            return "";
        }
        
        return this.slice(index + aString.length);
    }

    /**
     * Returns the substring between two given strings
     * @param {string} prefix - The starting string
     * @param {string} suffix - The ending string
     * @returns {string|null} The substring between prefix and suffix, or null if either is not found
     */
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

    /**
     * Returns the first character of the string
     * @returns {string} The first character
     */
    first () {
        return this.slice(0, 1);
    }

    /**
     * Returns the string without its first character
     * @returns {string} The string without its first character
     */
    rest () {
        return this.slice(1);
    }

    /**
     * Repeats the string a specified number of times
     * @param {number} times - The number of times to repeat the string
     * @returns {string} The repeated string
     */
    repeated (times) {
        let result = "";
        const aString = this;
        times.repeat(function () { result += aString });
        return result
    }

    /**
     * Removes specified prefixes from the string
     * @param {string[]} aStringList - An array of prefixes to remove
     * @returns {string} The string with the prefixes removed
     */
    sansPrefixes (aStringList) {
        let result = this
        aStringList.forEach((s) => { result = result.sansPrefix(s) })
        return result
    }

    /**
     * Removes a specified prefix from the string
     * @param {string} prefix - The prefix to remove
     * @returns {string} The string with the prefix removed
     */
    sansPrefix (prefix) {
        return this.substring(this.startsWith(prefix) ? prefix.length : 0);
    }

    /**
     * Returns a new string with the prefix added
     * @param {string} prefix - The prefix to add
     * @returns {string} The new string
     */
    withPrefix (prefix) {
        return prefix + this;
    }

    /**
     * Removes specified suffixes from the string
     * @param {string[]} aStringList - An array of suffixes to remove
     * @returns {string} The string with the suffixes removed
     */
    sansSuffixes (aStringList) {
        let result = this
        aStringList.forEach((s) => { result = result.sansSuffix(s) })
        return result
    }

    /**
     * Removes a specified suffix from the string
     * @param {string} suffix - The suffix to remove
     * @returns {string} The string with the suffix removed
     */
    sansSuffix (suffix) {
        if (this.endsWith(suffix)) {
            return this.substr(0, this.length - suffix.length);
        }
        else {
            return this;
        }
    }

    /**
     * Returns a new string with the suffix added
     * @param {string} suffix - The suffix to add
     * @returns {string} The new string
     */
    withSuffix (suffix) {
        return this + suffix;
    }

    /**
     * Returns a new string with the suffix added if it is not already present
     * @param {string} suffix - The suffix to add
     * @returns {string} The new string
     */
    withSuffixIfNotPresent (suffix) {
        if (!this.endsWith(suffix)) {
            return this + suffix;
        }
        return this;
    }

    /**
     * Removes leading and trailing whitespace from the string
     * @returns {string} The trimmed string
     */
    stripped () {
        return this.replace(/^\s\s*/, "").replace(/\s\s*$/, "");
    }

    /**
     * Converts the first character of each word to lowercase
     * @returns {string} The string with uncapitalized words
     */
    uncapitalized () {
        return this.replace(/\b[A-Z]/g, function (match) {
            return match.toLowerCase();
        });
    }

    /**
     * Converts the string to a number
     * @returns {number} The numeric value of the string, or NaN if conversion is not possible
     */
    asNumber () {
        if (this === "" || this === null || this === undefined) {
            return NaN;
        }
        
        const number = Number(this);
        return isNaN(number) ? NaN : number;
    }

    /**
     * Converts camelCase to a human-readable string
     * @returns {string} The humanized string
     */
    humanized () {
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

    /**
     * Capitalizes the first letter of each word in the string
     * @returns {string} The titleized string
     */
    titleized () {
        return this.split(/\s+/).map(function (s) { return s.capitalized() }).join(" ");
    }

    /**
     * Encodes the string to base64
     * @returns {string} The base64 encoded string
     */
    base64Encoded () {
        return window.btoa(this);
    }

    /**
     * Encodes the string to URL-safe base64
     * @returns {string} The URL-safe base64 encoded string
     */
    base64UrlEncoded () {
        return this.base64Encoded().replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, ",");
    }

    /**
     * Decodes a base64 encoded string
     * @returns {string} The decoded string
     */
    base64Decoded () {
        return window.atob(this);
    }

    /**
     * Decodes a URL-safe base64 encoded string
     * @returns {string} The decoded string
     */
    base64UrlDecoded () {
        return this.replace(/-/g, "+").replace(/_/g, "/").replace(/,/g, "=").base64Decoded();
    }

    /**
     * Counts the occurrences of a substring in the string
     * @param {string} str - The substring to count
     * @returns {number} The number of occurrences
     */
    occurenceCount (str) {
        return this.split(str).length - 1;
    }

    /**
     * Counts the number of lines in the string
     * @returns {number} The number of lines
     */
    lineCount () {
        let count = 0
        for (let i = 0; i < this.length; i++) {
            const c = this.charAt(i);
            if (c === "\n") {
                count ++;
            }
        }
        return count;
    }

    /**
     * Returns an array of single character strings
     * @returns {string[]} An array of characters
     * @category Transformation
     */
    characters () {
        return Array.from(this);
    }

    /**
     * Returns an array of character codes
     * @returns {number[]} An array of character codes
     * @category Transformation
     */
    characterCodes () {
        return Array.from(this, char => char.charCodeAt(0));
    }

    /**
     * Iterates over each character in the string
     * @param {function(string): void} fn - Function to call for each character
     * @category Iteration
     */
    forEachCharacter (fn) {
        for (let i = 0; i < this.length; i++) {
            const c = this.charAt(i);
            fn(c);
        }
    }

    /**
     * Iterates over each character in the string with its index
     * @param {function(number, string): void} fn - Function to call for each character and its index
     * @category Iteration
     */
    forEachKV (fn) {
        for (let i = 0; i < this.length; i++) {
            const c = this.charAt(i);
            fn(i, c);
        }
    }

    /**
     * Splits the string by multiple delimiters
     * @param {string[]} splitters - Array of delimiter strings
     * @returns {(string|null)[]} Array of split substrings or null if a splitter wasn't found
     * @category Transformation
     */
    splitArray (splitters) {
        let s = this;
        const results = [];
        splitters.forEach( (splitter) => {
            if (s.contains(splitter)) {
                const before = s.before(splitter);
                s = s.after(splitter);
                results.push(before);
            } else {
                results.push(null);
            }
        })
        return results;
    }

    /**
     * Replaces substrings in the string based on a map
     * @param {Map<string, string>} map - Map of substrings to replace and their replacements
     * @returns {string} The string with replacements applied
     */
    replaceMap (map) {
        let s = this;
        map.forEach((value, key) => {
            s = s.replaceAll(key, value);
        });
        return s;
    }

    /**
     * Splits the string into path components
     * @returns {string[]} Array of path components
     * @category Path Operations
     */
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

    /**
     * Returns the string without its last path component
     * @returns {string} The string without the last path component
     * @category Path Operations
     */
    sansLastPathComponent () {
        const c = this.pathComponents();
        c.removeLast();
        return c.join("/");
    }

    /**
     * Returns the last path component of the string
     * @returns {string} The last path component
     * @category Path Operations
     */
    lastPathComponent () {
        const components = this.pathComponents();
        if (components.length) {
            return this.pathComponents().last();
        }
        return "";
    }

    /**
     * Returns the filename part of the path (last component without extension)
     * @returns {string} The filename
     * @category Path Operations
     */
    fileName () {
        return this.lastPathComponent().sansExtension();
    }

    /**
     * Returns the string without its file extension
     * @returns {string} The string without the file extension
     */
    sansExtension () {
        const parts = this.split(".");
        if (parts.length > 1) {
            parts.pop();
        }
        return parts.join(".");
    }

    /**
     * Returns the file extension of the path
     * @returns {string} The file extension
     */
    pathExtension () {
        const extension = this.split(".").last();
        return extension;
    }

    /**
     * Indents each line of the string
     * @param {number} n - Number of indentation units
     * @param {string} [spacer=" "] - The indentation character
     * @returns {string} The indented string
     * @category Formatting
     */
    indent (n, spacer = " ") {
        const indentation = spacer.repeat(n);
        return this.split('\n').map(line => indentation + line).join('\n');
    }

    /**
     * Pads the string on the left to a specified length
     * @param {number} length - The desired length
     * @param {string} padding - The padding character
     * @returns {string} The padded string
     * @category Formatting
     */
    padLeft (length, padding) {
        let str = this;
        while (str.length < length) {
            str = padding + str;
        }

        return str.substring(0, length);
    }

    /**
     * Pads the string on the right to a specified length
     * @param {number} length - The desired length
     * @param {string} padding - The padding character
     * @returns {string} The padded string
     */
    padRight (length, padding) {
        let str = this;
        while (str.length < length) {
            str = str + padding;
        }

        return str.substring(0, length);
    }

    /**
     * Removes leading and trailing whitespace from the string
     * @returns {string} The trimmed string
     */
    strip () {
        return String(this).replace(/^\s+|\s+$/g, "");
    }

    /**
     * Parses the string as JSON and returns the resulting object
     * @returns {Object} The parsed JSON object
     */
    asObject () {
        return JSON.parse(this);
    }

    /**
     * Returns the setter method name for this property name
     * @returns {string} The setter method name
     */
    asSetter () {
        const cache = this.thisPrototype()._setterCacheMap;
        let result = cache[this];
        if (!result) {
             result = "set" + this.capitalized();
             cache.set(this, result);
             // test for highwater mark
             if (cache.size > 50000) {
                console.warn("setter cache is getting big! clearing...");
                cache.clear();
             }
        }
        return result;
    }

    /**
     * Returns the first character of the string
     * @returns {string} The first character
     */
    firstCharacter () {
        return this.slice(0);
    }

    /**
     * Returns the last character of the string
     * @returns {string} The last character
     */
    lastCharacter () {
        return this.slice(-1);
    }

    sansLastCharacter () {
        return this.substring(0, this.length - 1);
    }

    sansFirstCharacter () {
        return this.substring(1);
    }

    /**
     * Capitalizes the first letter of each word in the string
     * @returns {string} The string with capitalized words
     */
    capitalizeWords () {
        return this.replace(/(?:^|\s)\S/g, function (a) {
            return a.toUpperCase();
        });
    }

    /**
     * Checks if the string is capitalized
     * @returns {boolean} True if the string is capitalized, false otherwise
     */
    isCapitalized () {
        // deal with empty string
        if (this.length === 0) {
            return false;
        }
        return this.charAt(0).match(/[A-Z]/);
    }

    /**
     * Clips the string to a specified length and adds an ellipsis if necessary
     * @param {number} length - The maximum length
     * @returns {string} The clipped string
     */
    clipWithEllipsis (length) {
        if (this.length <= length) {
            return this.toString();
        }
        return this.substring(0, length) + '...';
    }

    quoted () {
        return '"' + this + '"';
    }

    /**
     * Generates Lorem Ipsum text
     * @param {number} [minWordCount=10] - Minimum number of words
     * @param {number} [maxWordCount=40] - Maximum number of words
     * @returns {string} Generated Lorem Ipsum text
     * @category Utility
     */
    loremIpsum (minWordCount, maxWordCount) {
        // implement a lorem ipsum generator
        const words = ["lorem", "ipsum", "dolor", "sit", "amet", "consectetur", "adipiscing", "elit", "sed", "do", "eiusmod", "tempor", "incididunt", "ut", "labore", "et", "dolore", "magna", "aliqua"];
        const wordCount = Math.floor(Math.random() * (maxWordCount - minWordCount + 1)) + minWordCount;
        return words.slice(0, wordCount).join(" ");
    }

    /**
     * Escapes HTML special characters in the string
     * @returns {string} The HTML-escaped string
     * @category HTML Operations
     */
    escapeHtml () {
        return this.replace(/[&<>"'/]/g, function (s) {
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

    /**
     * Checks if the string contains HTML tags
     * @returns {boolean} True if the string contains HTML tags, false otherwise
     * @category HTML Operations
     */
    containsHtml () {
        return /<(\w+)[^>]*>/.test(this);
    }

    /**
     * Generates a GUID (Globally Unique Identifier)
     * @returns {string} A GUID
     * @category Utility
     */
    GUID () {
        function s4 () {
            return Math.floor((1 + Math.random()) * 0x10000)
                .toString(16)
                .substring(1);
        }
        return s4() + s4() + "-" + s4() + "-" + s4() + "-" +
            s4() + "-" + s4() + s4() + s4();
    }

    /**
     * Calculates the byte length of the UTF-8 encoded string
     * @returns {number} The byte length
     * @category Size & Length
     */
    byteLength () {
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

    /**
     * Returns a human-readable description of the string's byte size
     * @returns {string} A formatted string describing the byte size
     * @category Size & Length
     */
    byteSizeDescription () {
        return this.byteLength().byteSizeDescription();
    }

    /**
     * Computes a hash code for the string
     * @returns {number} The hash code
     * @category Hashing
     */
    hashCode () {
        return this.hashCode64();
    }

    /**
     * Computes a 32-bit hash code for the string
     * @returns {number} The 32-bit hash code
     * @category Hashing
     */
    hashCode32 () {
        let hash = 0;
        for (let i = 0; i < this.length; i++) {
        const chr = this.charCodeAt(i);
        hash = ((hash << 5) - hash) + chr;
        hash |= 0; // Convert to 32bit integer
        }
        return hash;
    }
    
    /**
     * Computes a 64-bit hash code for the string
     * @returns {number} The 64-bit hash code
     * @category Information
     */
    hashCode64 () {
        let h1 = 0xdeadbeef ^ 0;
        let h2 = 0x41c6ce57 ^ 0;
        for (let i = 0; i < this.length; i++) {
            const chr = this.charCodeAt(i);
            h1 = Math.imul(h1 ^ chr, 2654435761);
            h2 = Math.imul(h2 ^ chr, 1597334677);
        }
        h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
        h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
        return 4294967296 * (2097151 & h2) + (h1 >>> 0);
    }

    /**
     * Computes the SHA-256 digest of the string
     * @returns {Promise<ArrayBuffer>} A promise that resolves to the SHA-256 digest
     */
    promiseSha256Digest () {
        const uint8Array = new TextEncoder("utf-8").encode(this);    
        return crypto.subtle.digest("SHA-256", uint8Array.buffer);
    }

    /**
     * Strips HTML tags from the string
     * @returns {string} The string with HTML tags removed
     */
    stripHTML () {
        const doc = new DOMParser().parseFromString(this, 'text/html');
        return doc.body.textContent || "";
    }

    /**
     * Removes HTML elements with specified tag names
     * @param {string[]} tagNames - Array of tag names to remove
     * @returns {string} The HTML string with specified elements removed
     */
    stripHtmlElementsWithTagNames (tagNames) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(this, 'text/html');
    
        tagNames.forEach(tagName => {
            doc.querySelectorAll(tagName).forEach(el => el.remove());
        });
    
        return doc.body.innerHTML;
    }

    /**
     * Replaces the content of specified HTML tags
     * @param {Map<string, string>} tagNameToContentMap - Map of tag names to new content
     * @returns {string} The HTML string with replaced content
     */
    replaceContentOfHtmlTagMap (tagNameToContentMap) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(this, 'text/html');
    
        tagNameToContentMap.forEach((newContent, tagName) => {
            assert(this.verifyTagClosed(tagName), `Tag <${tagName}> is not properly closed`);
            doc.querySelectorAll(tagName).forEach(el => {
                el.innerHTML = newContent;
            });
        });
    
        return doc.body.innerHTML;
    }

    /**
     * Replaces the content of specified HTML tags with a function
     * @param {string} tagName - The name of the tag to replace
     * @param {function} replaceFunction - The function to replace the content. It takes the innerHTML of the tag as a parameter and returns the new innerHTML.
     * @returns {string} The HTML string with replaced content
     */
    mapContentOfTagsWithName (tagName, replaceFunction) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(this, 'text/html');
    
        doc.querySelectorAll(tagName).forEach(el => {
            el.innerHTML = replaceFunction(el.innerHTML);
        });
    
        return doc.body.innerHTML;
    }

    /**
     * Verifies that a tag is properly closed
     * @param {string} tagName - The name of the tag to verify
     * @throws {Error} If the tag is not properly closed
     */
    verifyTagClosed (tagName) {
        const openMatches = (this.match(new RegExp(`<${tagName}(\\s[^>]*?)?>`, 'gi')) || []).filter(m => !/\/\s*>$/.test(m.trim()));
        const closeMatches = this.match(new RegExp(`</${tagName}>`, 'gi')) || [];
        return openMatches.length === closeMatches.length;
    }
      

    /**
     * Computes the difference between this string and another string
     * @param {string} otherString - The string to compare with
     * @returns {Object[]} An array of difference objects
     */
    diff (otherString) {
        // implement a minimal diff algorithm
        const diff = [];
        const maxLength = Math.max(this.length, otherString.length);
        for (let i = 0; i < maxLength; i++) {
            if (this[i] !== otherString[i]) {
                diff.push({ index: i, char: this[i], otherChar: otherString[i] });
            }
        }
        return diff;
    }

    /**
     * Returns a normalized version of the HTML string
     * @returns {string} The normalized HTML string
     * @category HTML Operations
     */
    asNormalizedHtml () {
        const element = document.createElement("div");        
        element.innerHTML = this;        
        return element.innerHTML;
    }

    /**
     * Extracts the content of elements with a specific tag
     * @param {string} tagName - The tag name to search for
     * @returns {string[]} An array of content strings from matching elements
     * @category HTML Operations
     */
    contentOfElementsOfTag (tagName) {
        const el = document.createElement("div");
        el.innerHTML = this;
        let matches = el.elementsOfTag(tagName);    
        const results = [];
        matches.forEach((e) => results.push(e.innerHTML));
        return results;
    }

    /**
     * Checks if the string is valid JSON
     * @returns {boolean} True if the string is valid JSON, false otherwise
     */
    isValidJson () {
        try {
            JSON.parse(this);
            return true;
        } catch (e) {
            return false;
        }
    }

}).initThisCategory();

String.prototype._setterCacheMap = new Map();





