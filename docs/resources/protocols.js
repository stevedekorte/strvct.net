const fs = require('fs').promises;
const path = require('path');
const acorn = require('acorn');
const walk = require('acorn-walk');
const doctrine = require('doctrine');

// Add these lines
const CLASS_DOC_PATH = '../resources/class-doc/class_doc.html';
const OUTPUT_DIR = 'docs/reference';

function ensureLeadingSlash(path) {
  return path.startsWith('/') ? path : '/' + path;
}

function composeClassDocUrl(path) {
  return `${CLASS_DOC_PATH}?path=${encodeURIComponent(ensureLeadingSlash(path))}`;
}

class ProtocolAnalyzer {
  constructor(folderPath) {
    this.folderPath = folderPath;
    this.allProtocols = new Map();
    this.protocolFiles = {};
    this.implementors = new Map();
  }

  async analyze() {
    const jsFiles = await this.findJsFiles(this.folderPath);
    await this.processFiles(jsFiles);
    const hierarchy = this.buildHierarchy();
    const markdownHierarchy = this.printHierarchy(hierarchy);
    const markdownContent = `# Protocols\n\n${markdownHierarchy}`;
    await this.writeOutput(markdownContent);
  }

  async findJsFiles(dir) {
    const files = await fs.readdir(dir, { withFileTypes: true });
    const jsFiles = [];

    for (const file of files) {
      const fullPath = path.join(dir, file.name);
      if (file.isDirectory()) {
        if (file.name !== "_unused" && file.name !== "external-libs" && file.name !== "docs") {
          jsFiles.push(...await this.findJsFiles(fullPath));
        }
      } else if (file.name.endsWith('.js')) {
        jsFiles.push(fullPath);
      }
    }

    return jsFiles;
  }

  async processFiles(jsFiles) {
    for (const file of jsFiles) {
      const content = await fs.readFile(file, 'utf-8');
      console.log(`Processing file: ${file}`);
      console.log(`File content preview: ${content.slice(0, 100)}...`);
      const protocols = this.parseProtocols(content, path.basename(file));
      
      for (const [moduleName, items] of protocols) {
        if (!this.allProtocols.has(moduleName)) {
          this.allProtocols.set(moduleName, new Set());
        }
        for (const item of items) {
          this.allProtocols.get(moduleName).add(item);
          this.protocolFiles[item] = encodeURI(path.relative(this.folderPath, file).replace(/\\/g, '/'));
        }
      }
    }
  }

  parseProtocols(content, fileName) {
    const comments = [];
    try {
      const ast = acorn.parse(content, {
        ecmaVersion: 'latest',
        sourceType: 'module',
        onComment: (block, text, start, end, startLoc, endLoc) => {
          if (block && text.startsWith('*')) {
            comments.push({ value: text, loc: { start: startLoc, end: endLoc } });
          }
        },
        locations: true
      });
      const protocols = new Map();

      walk.simple(ast, {
        ClassDeclaration: (node) => this.processClass(node, comments, protocols),
        ClassExpression: (node) => this.processClass(node, comments, protocols)
      });

      return protocols;
    } catch (error) {
      console.error(`Error parsing file: ${fileName}`);
      console.error(`Error message: ${error.message}`);
      console.error(`Error location: Line ${error.loc.line}, Column ${error.loc.column}`);
      throw error;
    }
  }

  processClass(node, comments, protocols) {
    if (node.id) {
      const className = node.id.name;
      const moduleName = this.getModuleName(node, comments) || 'globals';
      
      // Only add subclasses of Protocol, not Protocol itself
      if (this.isProtocolSubclass(node)) {
        this.addToProtocol(protocols, moduleName, className);
      }
      
      const implementedProtocols = this.getImplementedProtocols(node, comments);
      for (const protocol of implementedProtocols) {
        if (!this.implementors.has(protocol)) {
          this.implementors.set(protocol, new Set());
        }
        this.implementors.get(protocol).add(className);
      }
    }
  }

  isProtocolSubclass(node) {
    return node.superClass && node.superClass.name === 'Protocol';
  }

  getModuleName(node, comments) {
    const relevantComments = comments.filter(comment => comment.loc.end.line <= node.loc.start.line);
    for (let i = relevantComments.length - 1; i >= 0; i--) {
      const comment = relevantComments[i];
      const jsdoc = doctrine.parse(comment.value, { unwrap: true });
      const moduleTag = jsdoc.tags.find(tag => tag.title === 'module');
      if (moduleTag) {
        return moduleTag.name;
      }
    }
    return null;
  }

  getImplementedProtocols(node, comments) {
    const relevantComments = comments.filter(comment => comment.loc.end.line <= node.loc.start.line);
    const implementedProtocols = [];
    for (let i = relevantComments.length - 1; i >= 0; i--) {
      const comment = relevantComments[i];
      const jsdoc = doctrine.parse(comment.value, { unwrap: true });
      const implementsTags = jsdoc.tags.filter(tag => tag.title === 'implements');
      implementedProtocols.push(...implementsTags.map(tag => tag.name));
    }
    return implementedProtocols;
  }

  addToProtocol(protocols, moduleName, itemName) {
    if (!protocols.has(moduleName)) {
      protocols.set(moduleName, new Set());
    }
    protocols.get(moduleName).add(itemName);
  }

  buildHierarchy() {
    const hierarchy = {};

    for (const [moduleName, items] of this.allProtocols) {
      const parts = moduleName.split('.');
      let current = hierarchy;

      for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        if (!current[part]) {
          current[part] = { name: part, children: {}, items: [] };
        }
        if (i === parts.length - 1) {
          current[part].items = Array.from(items);
        } else {
          current = current[part].children;
        }
      }
    }

    return hierarchy;
  }

  printHierarchy(hierarchy, indent = '') {
    let output = '';
    const entries = Object.entries(hierarchy);

    entries.sort(([nameA], [nameB]) => nameA.localeCompare(nameB));

    for (const [name, module] of entries) {
      output += `${indent}- ${name}\n`;

      if (module.items && module.items.length > 0) {
        for (const item of module.items.sort()) {
          // Skip the Protocol class itself
          if (item === 'Protocol') continue;

          const encodedPath = this.protocolFiles[item] ? ensureLeadingSlash(this.protocolFiles[item]) : '';
          const link = this.protocolFiles[item] ? `[${item}](${composeClassDocUrl(encodedPath)})` : item;
          const implementors = this.implementors.get(item);
          const implementorsStr = implementors ? ` (implemented by: ${Array.from(implementors).join(', ')})` : '';
          output += `${indent}  - ${link}${implementorsStr}\n`;
        }
      }

      if (Object.keys(module.children).length > 0) {
        output += this.printHierarchy(module.children, indent + '  ');
      }
    }

    return output;
  }

  async writeOutput(content) {
    // Create the output directory if it doesn't exist
    const outputDir = path.join(this.folderPath, OUTPUT_DIR);
    await fs.mkdir(outputDir, { recursive: true });

    // Write the file to the output directory
    await fs.writeFile(path.join(outputDir, 'protocols.md'), content);
    console.log(`Protocol hierarchy has been written to ${path.join(OUTPUT_DIR, 'protocols.md')}`);
  }
}

async function main() {
  const folderPath = process.argv[2] || '.';
  const analyzer = new ProtocolAnalyzer(folderPath);
  try {
    await analyzer.analyze();
  } catch (error) {
    console.error('An error occurred:', error);
  }
}

main().catch(console.error);
