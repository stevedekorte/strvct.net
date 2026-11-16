"use strict";

/**

    @class SvAiParsedResponseMessage_parsing
    @extends SvAiParsedResponseMessage
    @description A class for parsing AI response messages.

*/

(class SvAiParsedResponseMessage_parsing extends SvAiParsedResponseMessage {

    convertTagToCamelCase (str) {
        // have to lower case as dom node tag names are upper case
        let s = str.toLowerCase().split("-").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join("");
        s = s.charAt(0).toLowerCase() + s.slice(1);
        return s;
    }

}).initThisCategory();

