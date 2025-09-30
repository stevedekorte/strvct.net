/*
 * @module
 * @class MarkdownRelative
 * @extends Object
 * @classdesc A class for converting between relative and absolute markdown headings.
 * This uses the format:
 *
 * #> Heading // increase the level of the heading
 * <# Heading // decrease the level of the heading
 * =#= Heading // use the same level as the previous heading
 *
 * If an absolute heading is found, it resets the heading level to it's declared level.
 *
 * Using >#> or <#< with an empty heading will change the heading level without adding a heading.
 *
*/

class MarkdownRelative extends Object {

    constructor () {
        super();
        this._inputString = null;
        this._outputString = null;
    }

    // --- input string ---

    setInputString (inputString) {
        this._inputString = inputString;
        return this;
    }

    inputString () {
        return this._inputString;
    }

    // --- output string ---

    setOutputString (outputString) {
        this._outputString = outputString;
        return this;
    }

    outputString () {
        return this._outputString;
    }

    // --- relative to absolute ---

    convertRelativeToAbsolute () {
        this.setOutputString(this.convertRelativeToAbsoluteMarkdown(this.inputString()));
        return this;
    }

    convertRelativeToAbsoluteMarkdown (input) {
        const lines = input.split("\n");
        let level = 0;
        return lines.map(line => {
            const trimmed = line.trim();

            if (/^#+ /.test(trimmed)) {
                level = trimmed.match(/^#+/)[0].length;
                return trimmed;

            } else if (/^(>+)\#>(?:\s*)(.*)/.test(trimmed)) {
                const [, arrows, title] = trimmed.match(/^(>+)\#>(?:\s*)(.*)/);
                level += arrows.length;
                return title ? "#".repeat(level) + " " + title : "";

            } else if (/^(<+)\#<(?:\s*)(.*)/.test(trimmed)) {
                const [, arrows, title] = trimmed.match(/^(<+)\#<(?:\s*)(.*)/);
                level = Math.max(1, level - arrows.length);
                return title ? "#".repeat(level) + " " + title : "";

            } else if (/^(=+)\#+=(?:\s+)(.*)/.test(trimmed)) {
                const [, , title] = trimmed.match(/^(=+)\#+=(?:\s+)(.*)/);
                return "#".repeat(level || 1) + " " + title;

            } else {
                return line;
            }
        }).join("\n");
    }

    // --- absolute to relative ---

    convertAbsoluteToRelative () {
        this.setOutputString(this.convertAbsoluteToRelativeMarkdown(this.inputString()));
        return this;
    }

    convertAbsoluteToRelativeMarkdown (input) {
        const lines = input.split("\n");
        let lastLevel = 0;
        return lines.map(line => {
            const match = line.match(/^(#{1,6})\s+(.*)/);
            if (!match) return line;
            const currentLevel = match[1].length;
            const title = match[2];
            const delta = currentLevel - lastLevel;
            lastLevel = currentLevel;
            if (delta > 0) return `${">".repeat(delta)}#>${title}`;
            if (delta < 0) return `${"<".repeat(-delta)}#<${title}`;
            return `=#=${title}`;
        }).join("\n");
    }

    // --- detect relative markdown ---

    hasRelativeMarkdown (input) {
        const relHeadingPattern = /^\s*(>#+> |<#+< )/m;
        return relHeadingPattern.test(input);
    }

    // --- detect absolute markdown ---

    hasAbsoluteMarkdown (input) {
        const absHeadingPattern = /^\s*=#=/m;
        return absHeadingPattern.test(input);
    }

}

SvGlobals.globals().MarkdownRelative = MarkdownRelative;
