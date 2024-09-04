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

    // Extract H1 title from markdown and remove HTML formatting
    const h1Match = markdown.match(/^#\s+(.+)$/m);
    if (h1Match) {
      const h1Content = h1Match[1].trim();
      // Remove HTML tags
      const plainTextH1 = h1Content.replace(/<[^>]*>/g, '');
      // Decode HTML entities
      const decodedH1 = plainTextH1.replace(/&[^;]+;/g, match => {
        const span = document.createElement('span');
        span.innerHTML = match;
        return span.textContent;
      });
      document.title = decodedH1;
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

    // Function to process citations
    function processCitations(text) {
      const citationRegex = /\[(\d+)\]/g;
      return text.replace(citationRegex, (match, p1) => {
        if (referenceMap.has(p1)) {
          return `<a href="#ref-${p1}" style="text-decoration: none;">${match}</a>`;
        }
        return match;
      });
    }

    // Override heading renderer to add IDs and collect TOC items
    renderer.heading = function(text, level) {
      const slug = text.toLowerCase().replace(/[^\w]+/g, '-');
      if (level > 1) { // Only add to TOC if level is greater than 1 (i.e., not H1)
        toc.push({ text, level, slug });
      }
      return `<h${level} id="${slug}">${text}</h${level}>`;
    };

    // Override link renderer to change local .md links to .html
    renderer.link = function(href, title, text) {
      if (href && href.endsWith('.md')) {
        href = href.slice(0, -3) + '.html';
      }
      if (title) {
        return `<a href="${href}" title="${title}">${text}</a>`;
      }
      return `<a href="${href}">${text}</a>`;
    };

    // Override the paragraph renderer to add links to citations
    renderer.paragraph = function(text) {
      const linkedText = processCitations(text);
      return `<p>${linkedText}</p>`;
    };

    // Override the list item renderer to add links to citations
    renderer.listitem = function(text) {
      const linkedText = processCitations(text);
      return `<li>${linkedText}</li>`;
    };

    marked.use({ renderer });

    // Generate table of contents
    function generateTOC(items) {
      let currentLevel = 2; // Start at level 2 since we're excluding H1
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
      // Add References to TOC as level 2
      if (referenceList.length > 0) {
        if (currentLevel > 2) {
          html += '</ul>'.repeat(currentLevel - 2);
        }
        html += `<li><a href="#references">References</a></li>`;
      }
      html += '</ul>'.repeat(currentLevel - 1); // Adjust closing tags
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

    // Extract H1 title from parsed HTML and remove HTML formatting
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = content;
    const h1Element = tempDiv.querySelector('h1');
    if (h1Element) {
      document.title = h1Element.textContent.trim();
    }

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

    // Function to recursively get text content
    function getTextContent(element) {
      let text = '';
      for (let node of element.childNodes) {
        if (node.nodeType === Node.TEXT_NODE) {
          text += node.textContent;
        } else if (node.nodeType === Node.ELEMENT_NODE) {
          text += getTextContent(node);
        }
      }
      return text;
    }

    // Set the page title after the content has been added to the DOM
    setTimeout(() => {
      const h1Element = document.querySelector('h1');
      console.log('H1 element:', h1Element);
      if (h1Element) {
        console.log('H1 innerHTML:', h1Element.innerHTML);
        console.log('H1 textContent:', h1Element.textContent);
        const extractedText = getTextContent(h1Element).trim();
        console.log('Extracted H1 text:', extractedText);
        document.title = extractedText;
        console.log('Set document title to:', document.title);
      } else {
        console.log('No H1 element found');
      }
    }, 100);

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

    // Add a footer spacer div
    document.getElementById('content').innerHTML += '<div class="footer-spacer"></div>';

  } catch (error) {
    console.error('Error loading Markdown:', error);
    document.getElementById('content').innerHTML = 'Error loading content. Please check the console for details.';
  }
}

window.onload = loadAndRenderMarkdown;