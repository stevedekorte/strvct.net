async function loadAndRenderMarkdown() {
  try {
    const contentDiv = document.getElementById('content');
    
    const urlParams = new URLSearchParams(window.location.search);
    const markdownSource = urlParams.get('path') || './README.md';
    
    const response = await fetch(markdownSource);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const markdown = await response.text();

    const svgPlaceholderRegex = /(<object\s+type="image\/svg\+xml"\s+data="([^"]+)"(?:\s+style="[^"]*")?\s*>[^<]*<\/object>)/g;
    let svgCounter = 0;
    const svgMap = new Map();
    
    const preprocessedMarkdown = markdown.replace(svgPlaceholderRegex, (match, fullTag, svgPath) => {
      const placeholder = `{{SVG_PLACEHOLDER_${svgCounter}:${svgPath}}}`;
      svgMap.set(svgCounter, fullTag);
      svgCounter++;
      return placeholder;
    });

    const referenceMap = new Map();
    const referenceList = [];
    const toc = [];

    const h1Match = markdown.match(/^#\s+(.+)$/m);
    if (h1Match) {
      const h1Content = h1Match[1].trim();
      const plainTextH1 = h1Content.replace(/<[^>]*>/g, '');
      const decodedH1 = plainTextH1.replace(/&[^;]+;/g, match => {
        const span = document.createElement('span');
        span.innerHTML = match;
        return span.textContent;
      });
      document.title = decodedH1;
    }

    const contentWithoutTitle = markdown.replace(/<head>[\s\S]*?<\/head>/, '');

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

    const renderer = new marked.Renderer();

    function processCitations(text) {
      const citationRegex = /\[(\d+)\]/g;
      return text.replace(citationRegex, (match, p1) => {
        if (referenceMap.has(p1)) {
          return `<a href="#ref-${p1}" style="text-decoration: none;">${match}</a>`;
        }
        return match;
      });
    }

    renderer.heading = function(text, level) {
      const slug = text.toLowerCase().replace(/[^\w]+/g, '-');
      if (level > 1) {
        toc.push({ text, level, slug });
      }
      return `<h${level} id="${slug}">${text}</h${level}>`;
    };

    function transformLocalPath(path) {
      if (path && !path.startsWith('http') && !path.startsWith('#')) {
        const urlParams = new URLSearchParams(window.location.search);
        const currentPath = urlParams.get('path') || './README.md';
        
        const currentDir = currentPath.split('/').slice(0, -1).join('/');
        
        let newPath = `${currentDir}/${path}`;
        
        newPath = newPath.split('/').reduce((acc, part) => {
          if (part === '..') acc.pop();
          else if (part !== '.' && part !== '') acc.push(part);
          return acc;
        }, []).join('/');
        
        if (currentPath.startsWith('docs/') && !newPath.startsWith('docs/')) {
          newPath = `docs/${newPath}`;
        }
        
        if (newPath.endsWith('.md')) {
          newPath = `index.html?path=${encodeURIComponent(newPath)}`;
        }
        
        return newPath;
      }
      return path;
    }

    renderer.link = function(href, title, text) {
      let transformedHref = href; //transformLocalPath(href);
      
      if (title) {
        return `<a href="${transformedHref}" title="${title}">${text}</a>`;
      } else {
        return `<a href="${transformedHref}">${text}</a>`;
      }
    };

    const svgPlaceholderTokenizer = {
      name: 'svgPlaceholder',
      level: 'inline',
      start(src) { return src.match(/{{SVG_PLACEHOLDER_/)?.index; },
      tokenizer(src, tokens) {
        const match = src.match(/{{SVG_PLACEHOLDER_(\d+):([^}]+)}}/);
        if (match) {
          return {
            type: 'svgPlaceholder',
            raw: match[0],
            id: parseInt(match[1]),
            path: match[2]
          };
        }
      },
      renderer(token) {
        const originalTag = svgMap.get(token.id);
        if (originalTag) {
          const transformedPath = transformLocalPath(token.path);
          return originalTag.replace(/data="([^"]+)"/, `data="${transformedPath}"`);
        }
        const transformedPath = transformLocalPath(token.path);
        return `<object type="image/svg+xml" data="${transformedPath}">[SVG diagram]</object>`;
      }
    };

    marked.use({
      extensions: [svgPlaceholderTokenizer]
    });

    marked.use({ renderer });

    renderer.paragraph = function(text) {
      const linkedText = processCitations(text);
      return `<p>${linkedText}</p>`;
    };

    renderer.listitem = function(text) {
      const linkedText = processCitations(text);
      return `<li>${linkedText}</li>`;
    };

    function generateTOC(items) {
      let currentLevel = 2;
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
      if (referenceList.length > 0) {
        if (currentLevel > 2) {
          html += '</ul>'.repeat(currentLevel - 2);
        }
        html += `<li><a href="#references">References</a></li>`;
      }
      html += '</ul>'.repeat(currentLevel - 1);
      return html;
    }

    function decodeURL(url) {
      try {
        return decodeURIComponent(url.replace(/\+/g, ' '));
      } catch (e) {
        return url;
      }
    }

    const tocPlaceholder = '<!--TOC_PLACEHOLDER-->';
    const contentWithPlaceholder = contentLines.join('\n').replace('[TOC]', tocPlaceholder);

    let content = marked.parse(preprocessedMarkdown);

    content = content.replace(/{{SVG_PLACEHOLDER_(\d+):([^}]+)}}/g, (match, id, path) => {
      const originalTag = svgMap.get(parseInt(id));
      if (originalTag) {
        const transformedPath = transformLocalPath(path);
        return originalTag.replace(/data="([^"]+)"/, `data="${transformedPath}"`);
      }
      const transformedPath = transformLocalPath(path);
      return `<object type="image/svg+xml" data="${transformedPath}">[SVG diagram]</object>`;
    });

    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = content;
    const h1Element = tempDiv.querySelector('h1');
    if (h1Element) {
      document.title = h1Element.textContent.trim();
    }

    const tocHtml = generateTOC(toc);

    content = content.replace('[TOC]', `
      <table-of-contents class="collapsed">
        <div class="toc-toggle collapsed">Table of Contents</div>
        <div class="toc-content collapsed">
          ${tocHtml}
        </div>
      </table-of-contents>
    `);

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

    setTimeout(() => {
      const h1Element = document.querySelector('h1');
      if (h1Element) {
        const extractedText = getTextContent(h1Element).trim();
        document.title = extractedText;
      }
    }, 100);

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

    document.getElementById('content').innerHTML += '<div class="footer-spacer"></div>';

  } catch (error) {
    console.error('Error loading Markdown:', error);
    document.getElementById('content').innerHTML = 'Error loading content. Please check the console for details.';
  }
}

window.onload = loadAndRenderMarkdown;