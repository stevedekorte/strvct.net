"use strict";

/*

    @class AiParsedResponseMessage_parsing
    @extends AiParsedResponseMessage
    @description A class for parsing AI response messages.

*/

(class AiParsedResponseMessage_parsing extends AiParsedResponseMessage {

    convertTagToCamelCase (str) {
        // have to lower case as dom node tag names are upper case
        let s = str.toLowerCase().split("-").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join("");
        s = s.charAt(0).toLowerCase() + s.slice(1);
        return s;
    }

    /*

    // --- finding embeded info tags -------------------------

    contentOfFirstElementOfTag (tagName) {
        const matches = this.contentOfElementsOfTag(tagName);
        return matches.first();
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
        el.innerHTML = this.content();
        let matches = el.elementsOfTag(tagName);
        const results = [];
        matches = matches.select(e => !Element_hasParentWithTag(e, "think"));
        matches.forEach((e) => results.push(e.innerHTML));
        return results;
    }

    parseAiJsonString (s, description) {
        try {
            const json = JSON.parse(s);
            return json;
        } catch (e) {
            this.addAiError("AI responded with invalid JSON in [" + description + "]: " + e.message);
            throw e;
        }
    }
    */

}).initThisCategory();

