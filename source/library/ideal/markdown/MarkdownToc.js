/*
 * @module 
 * @class MarkdownToc
 * @extends Object
 * @classdesc A class for generating a table of contents (TOC) from a markdown string.

    // Example usage:
    const markdown = `# Main Title
    ## Section 1
    ### Subsection 1.1
    ### Subsection 1.2
    ## Section 2
    ### Subsection 2.1
    #### Deep nested section
    ## Section 3`;

    const toc = new MarkdownToc();
    toc.setMarkdown(markdown);

    console.log('TOC JSON:', JSON.stringify(toc.jsonToc(), null, 2));
    console.log('\nGenerated TOC:');
    console.log(toc.getTextToc());

*/

class MarkdownToc extends Object {
    constructor() {
        super();
        this._markdownString = '';
        this._jsonToc = []; // Will now store array of [level, title] tuples
        this._indentString = '...-...';
    }
    
    setIndentString (indentString) {
        this._indentString = indentString;
        return this;
    }

    indentString () {
        return this._indentString;
    }

    /**
     * @method setMarkdown
     * @param {string} markdownString - The markdown string to generate a TOC for.
     * @returns {MarkdownToc} The MarkdownToc instance, allowing for method chaining.
     */
    setMarkdown (markdownString) {
        this._markdownString = markdownString;
        return this;
    }

    markdownString () {
        return this._markdownString;
    }

    extractTitleLines () {
        // Split into lines and filter out empty ones
        const trimmedLines = this.markdownString().split('\n').map(line => line.trim());
        
        // Reset the TOC
        this._jsonToc = [];
        
        const titleLines = trimmedLines.filter(line => line.startsWith('#'));

        for (const line of titleLines) {
            // Check if line is a header
            // Count the number of # to determine level
            let level = 0;
            while (line[level] === '#' && level < line.length) {
                level++;
            }
            
            // Extract the header text
            const title = line.slice(level).trim();
            
            // Store as tuple of [level, title]
            this._jsonToc.push([level, title]);
        }
        
        return this; // Allow for method chaining
    }
    
    /**
     * @method getTextToc
     * @returns {string} The generated TOC as a string.
     */
    getTextToc () {
        this.extractTitleLines();

        let usableItems = this._jsonToc.filter(([level, title]) => {
                // Exclude level 1 headings and any "Table of Contents" sections
                return level > 1 && !title.toLowerCase().includes('table of contents');
        });

        const lines = usableItems.map(([level, title]) => {
            // Adjust indent to start from 0 since we're excluding level 1
            const indent = this.indentString().repeat(level - 2);
            return `${indent}- ${title}`;
        });
        
        const text = lines.join('\n') + '\n';
        return text;
    }
    
    /**
     * @method jsonToc
     * @returns {Array} The JSON TOC structure.
     */
    jsonToc () {
        return this._jsonToc;
    }

}

SvGlobals.globals().MarkdownToc = MarkdownToc;

