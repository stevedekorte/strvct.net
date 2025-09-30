class SourceInspector {
    constructor (elementId, bannerElementId) {
        this.element = document.getElementById(elementId);
        this.bannerElement = document.getElementById(bannerElementId);
        this.urlParams = new URLSearchParams(window.location.search);
    }

    async loadAndDisplaySource () {
        const path = this.urlParams.get('path');
        if (!path) {
            this.displayError('No path parameter provided');
            return;
        }

        try {
            let sourceCode;
            const fullPath = path.startsWith('/') ? new URL(path, window.location.origin).href : path;
            const response = await fetch(fullPath);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            sourceCode = await response.text();
            this.displaySource(sourceCode);
            this.displayFilename(path);
            this.scrollToHighlight();
        } catch (error) {
            this.displayError(`Failed to load source: ${error.message}`);
        }
    }

    displaySource (sourceCode) {
        const lines = sourceCode.split('\n');
        const beginLine = parseInt(this.urlParams.get('beginLine')) || 1;
        const endLine = parseInt(this.urlParams.get('endLine')) || lines.length;

        const formattedCode = lines.map((line, index) => {
            const lineNumber = index + 1;
            const highlightClass = (lineNumber >= beginLine && lineNumber <= endLine) ? 'highlight' : '';
            // Replace empty lines with a non-breaking space
            const lineContent = line.length === 0 ? '&nbsp;' : this.escapeHtml(line);
            return `<div class="line ${highlightClass}" data-line="${lineNumber}">${lineContent}</div>`;
        }).join('');

        this.element.innerHTML = formattedCode;
    }

    displayFilename (path) {
        const filename = path.split('/').pop();
        this.bannerElement.textContent = filename;
    }

    displayError (message) {
        this.element.innerHTML = `<span class="error">${this.escapeHtml(message)}</span>`;
        this.bannerElement.textContent = 'Error';
    }

    escapeHtml (unsafe) {
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    scrollToHighlight () {
        const beginLine = parseInt(this.urlParams.get('beginLine')) || 1;
        const highlightedElement = this.element.querySelector(`.line[data-line="${beginLine}"]`);
        if (highlightedElement) {
            setTimeout(() => {
                highlightedElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 100);
        }
    }
}