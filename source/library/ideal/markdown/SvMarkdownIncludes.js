/**
 * @module library.ideal.markdown
 * @class SvMarkdownIncludes
 * @extends Object
 * @classdesc Resolves `{{file$name}}` includes in a markdown document, nesting
 * each included part's headings under the heading that encloses the include.
 *
 * A part is written as a standalone document: ordinary markdown whose own
 * hierarchy starts at `#`. At the include point, the part's `#` means "the
 * level of the nearest preceding heading in the INCLUDING file", `##` one
 * deeper, and so on. So a part that opens at `#` adds sibling sections beside
 * the enclosing heading; one that opens at `##` is contained by it. The
 * author of the part chooses which by how they start it, and reads it the
 * same way standalone.
 *
 * The anchor is the including file's OWN heading — never a heading inside a
 * previously included sibling. That is the whole point: with a running level
 * carried across siblings, each include started where the previous one ended
 * and depth compounded. The retired relative-marker notation (`>#>` / `=#=` /
 * `<#<`) did exactly that, silently: the production session prompt reached
 * ten heading levels, fifty-one headings past markdown's `######`.
 *
 * A heading whose title is only `---` is a LEVEL ANCHOR: it sets the level
 * for what follows and emits nothing. So a parent declares where each part
 * lands without inventing a title for it —
 *
 *     ### ---
 *     {{file$ClientStateToolPrompt.txt}}
 *
 * — and the part keeps its own `#` title, rendered at `###`.
 *
 * File lookup is injected (setContentsOfFileNamed), so this class has no
 * dependency on the resource system and runs headlessly in tests.
 */
class SvMarkdownIncludes extends Object {

    constructor () {
        super();
        this._contentsOfFileNamed = null;
        this._maxDepth = 32;
    }

    // --- file lookup ---

    setContentsOfFileNamed (fn) {
        this._contentsOfFileNamed = fn;
        return this;
    }

    contentsOfFileNamed () {
        return this._contentsOfFileNamed;
    }

    // --- depth guard ---

    setMaxDepth (n) {
        this._maxDepth = n;
        return this;
    }

    maxDepth () {
        return this._maxDepth;
    }

    // --- resolve ---

    /**
     * @description Resolves every include in `text`, recursively, with the
     * text's own `#` rendering at `level` (1 for a root document).
     * @param {String} text
     * @param {Number} level
     * @returns {String}
     */
    resolve (text, level = 1) {
        return this.resolveInChain(text, level, []);
    }

    resolveInChain (text, level, chain) {
        if (chain.length > this.maxDepth()) {
            throw new Error("include depth " + chain.length + " exceeded — cycle? " + chain.join(" -> "));
        }
        let current = level;
        const out = [];
        text.split("\n").forEach((line) => {
            const heading = this.headingOf(line);
            if (heading) {
                current = heading.level + level - 1;
                if (!this.isAnchor(heading)) {
                    out.push(this.headingLine(current, heading.title));
                }
            } else {
                out.push(this.replaceIncludesInLine(line, current, chain));
            }
        });
        return out.join("\n");
    }

    // --- headings ---

    headingOf (line) {
        const m = line.match(/^(#{1,6}) (.*)$/);
        return m ? { level: m[1].length, title: m[2] } : null;
    }

    isAnchor (heading) {
        return heading.title.trim() === "---";
    }

    headingLine (level, title) {
        return "#".repeat(level) + " " + title;
    }

    // --- includes ---

    replaceIncludesInLine (line, level, chain) {
        return line.replace(/\{\{file\$([^{}]+?)\}\}/g, (m, fileName) => this.resolvedInclude(fileName, level, chain));
    }

    resolvedInclude (fileName, level, chain) {
        const nextChain = chain.concat(fileName);
        if (chain.includes(fileName)) {
            throw new Error("include cycle: " + nextChain.join(" -> "));
        }
        let contents;
        try {
            contents = this.contentsOfFileNamed()(fileName);
        } catch (error) {
            throw new Error("Error including " + nextChain.join(" -> ") + ": " + error.message);
        }
        return this.resolveInChain(this.includeText(contents, fileName), level, nextChain);
    }

    /**
     * @description The text form of an include's contents. The resource
     * system hands back a `.json` file PARSED (an array or object), not its
     * source text — the old replaceAll coerced that to a comma-joined string
     * by accident. Serialize it as JSON instead, which is what a `<json>`
     * block around such an include always meant. (Prod regression
     * 2026-09-12: "line.match is not a function" on every new session, from
     * `{{file$SrdCreatureNames.json}}`.)
     * @param {*} contents
     * @param {String} fileName
     * @returns {String}
     */
    includeText (contents, fileName) {
        if (typeof contents === "string") {
            return contents;
        }
        if (contents === null || contents === undefined) {
            throw new Error("empty contents for include " + fileName);
        }
        return JSON.stringify(contents);
    }

}

SvGlobals.globals().SvMarkdownIncludes = SvMarkdownIncludes;
