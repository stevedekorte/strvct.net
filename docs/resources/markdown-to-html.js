async function loadAndRenderMarkdown() {
  try {
    const contentDiv = document.getElementById('content');
    const markdownSource = contentDiv.getAttribute('source') || 'README.md';
    
    const response = await fetch(markdownSource);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const markdown = await response.text();

    const referenceMap = new Map();
    const referenceList = [];
    const toc = [];

    // Extract title from markdown
    const titleMatch = markdown.match(/<head>\s*<title>([^<]+)<\/title>\s*<\/head>/);
    if (titleMatch) {
      document.title = titleMatch[1].trim();
    }

    // Remove the title section from the markdown
    const contentWithoutTitle = markdown.replace(/<head>[\s\S]*?<\/head>/, '');

    // First pass: extract references
    const lines = contentWithoutTitle.split('\n');
    const contentLines = lines.filter(line => {
      const match = line.match(/^\[(.+)\]:\s*(.+?)\s*(?:"(.+)")?$/);
      if (match) {
        const [, key, url, title] = match;
        referenceMap.set(key, { url, title: title || '' });
        referenceList.push({ key, url, title });
        return false;
      }
      return true;
    });

    // Custom renderer
    const renderer = new marked.Renderer();

    // Override heading renderer to add IDs and collect TOC items
    renderer.heading = function(text, level) {
      const slug = text.toLowerCase().replace(/[^\w]+/g, '-');
      toc.push({ text, level, slug });
      return `<h${level} id="${slug}">${text}</h${level}>`;
    };

    // Override the paragraph renderer to add links to citations
    renderer.paragraph = function(text) {
      const citationRegex = /\[(\d+)\]/g;
      const linkedText = text.replace(citationRegex, (match, p1) => {
        if (referenceMap.has(p1)) {
          return `<a href="#ref-${p1}" style="text-decoration: none;">${match}</a>`;
        }
        return match;
      });
      return `<p>${linkedText}</p>`;
    };

    marked.use({ renderer });

    // Add CSS to the page
    const style = document.createElement('style');
    style.textContent = `
      body {
        max-width: 800px;
        margin: 0 auto;
        padding: 20px;
      }
      table-of-contents {
        display: block;
        margin-bottom: 20px;
        opacity: 1;
        transition: opacity 0.3s ease-out;
      }
      table-of-contents.collapsed {
        opacity: 0.5;
      }
      table-of-contents ul {
        list-style-type: none;
        padding-left: 20px;
      }
      table-of-contents > ul {
        padding-left: 0;
      }
      .toc-toggle {
        cursor: pointer;
        user-select: none;
      }
      .toc-toggle:before {
        content: '▼';
        display: inline-block;
        transition: transform 0.3s;
        margin-right: 0.5em;
      }
      .toc-toggle.collapsed:before {
        transform: rotate(-90deg);
      }
      .toc-content {
        max-height: 1000px;
        overflow: hidden;
        transition: max-height 0.3s ease-out;
      }
      .toc-content.collapsed {
        max-height: 0;
      }
    `;
    document.head.appendChild(style);

    // Generate table of contents
    function generateTOC(items) {
      let currentLevel = 1;
      let html = '<ul>';
      items.forEach(item => {
        if (item.level > currentLevel) {
          html += '<ul>'.repeat(item.level - currentLevel);
        } else if (item.level < currentLevel) {
          html += '</ul>'.repeat(currentLevel - item.level);
        }
        html += `<li><a href="#${item.slug}">${item.text}</a></li>`;
        currentLevel = item.level;
      });
      // Add References to TOC
      html += `<li><a href="#references">References</a></li>`;
      html += '</ul>'.repeat(currentLevel);
      return html;
    }

    // Function to decode URL-encoded strings
    function decodeURL(url) {
      try {
        return decodeURIComponent(url.replace(/\+/g, ' '));
      } catch (e) {
        return url; // Return original URL if decoding fails
      }
    }

    // Replace [TOC] with a unique HTML comment placeholder
    const tocPlaceholder = '<!--TOC_PLACEHOLDER-->';
    const contentWithPlaceholder = contentLines.join('\n').replace('[TOC]', tocPlaceholder);

    // Parse the content
    let content = marked.parse(contentWithPlaceholder);

    // Generate table of contents
    const tocHtml = generateTOC(toc);

    // Replace the placeholder with the collapsible table of contents (collapsed by default)
    content = content.replace(tocPlaceholder, `
      <table-of-contents class="collapsed">
        <div class="toc-toggle collapsed">Table of Contents</div>
        <div class="toc-content collapsed">
          ${tocHtml}
        </div>
      </table-of-contents>
    `);

    // Add references section
    const referencesSection = referenceList.length > 0
      ? `<div class="reference-list">
           <h2 id="references">References</h2>
           ${referenceList.map(({ key, url, title }) => `
             <div class="reference-item" id="ref-${key}">
               ${key}. <a href="${url}" target="_blank">${title || decodeURL(url)}</a>
             </div>`).join('')}
         </div>`
      : '';

    document.getElementById('content').innerHTML = `
      ${content}
      ${referencesSection}
    `;

    // Add event listener for toggling table of contents
    setTimeout(() => {
      const tocElement = document.querySelector('table-of-contents');
      const tocToggle = document.querySelector('.toc-toggle');
      const tocContent = document.querySelector('.toc-content');
      if (tocToggle && tocContent && tocElement) {
        tocToggle.addEventListener('click', () => {
          tocToggle.classList.toggle('collapsed');
          tocContent.classList.toggle('collapsed');
          tocElement.classList.toggle('collapsed');
        });
      }
    }, 0);

  } catch (error) {
    console.error('Error loading Markdown:', error);
    document.getElementById('content').innerHTML = 'Error loading content. Please check the console for details.';
  }
}

window.onload = loadAndRenderMarkdown;