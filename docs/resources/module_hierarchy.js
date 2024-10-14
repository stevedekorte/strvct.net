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

async function findJsFiles(dir) {
  const files = await fs.readdir(dir, { withFileTypes: true });
  const jsFiles = [];

  for (const file of files) {
    const fullPath = path.join(dir, file.name);
    if (file.isDirectory()) {
      // Skip directories named "_unused", "external-libs", or "docs"
      if (file.name !== "_unused" && file.name !== "external-libs" && file.name !== "docs") {
        jsFiles.push(...await findJsFiles(fullPath));
      }
    } else if (file.name.endsWith('.js')) {
      jsFiles.push(fullPath);
    }
  }

  return jsFiles;
}

function parseModules(content, fileName) {
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
    const modules = new Map();

    walk.simple(ast, {
      ClassDeclaration(node) {
        const className = node.id.name;
        const moduleName = getModuleName(node, comments) || 'globals';
        addToModule(modules, moduleName, className);
      },
      ClassExpression(node) {
        if (node.id) {
          const className = node.id.name;
          const moduleName = getModuleName(node, comments) || 'globals';
          addToModule(modules, moduleName, className);
        }
      }
    });

    return modules;
  } catch (error) {
    console.error(`Error parsing file: ${fileName}`);
    console.error(`Error message: ${error.message}`);
    console.error(`Error location: Line ${error.loc.line}, Column ${error.loc.column}`);
    throw error;
  }
}

function getModuleName(node, comments) {
  // Find all comments before the node
  const relevantComments = comments.filter(comment => comment.loc.end.line <= node.loc.start.line);

  // Iterate through comments in reverse order to find the closest @module tag
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

function addToModule(modules, moduleName, itemName) {
  if (!modules.has(moduleName)) {
    modules.set(moduleName, new Set());
  }
  modules.get(moduleName).add(itemName);
}

function buildHierarchy(modules) {
  const hierarchy = {};

  for (const [moduleName, items] of modules) {
    const parts = moduleName.split('.');
    let current = hierarchy;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      if (!current[part]) {
        current[part] = { name: part, children: {}, items: [] };
      }
      if (i === parts.length - 1) {
        // We're at the last part, so add the items here
        current[part].items = Array.from(items);
      } else {
        // Move to the next level
        current = current[part].children;
      }
    }
  }

  return hierarchy;
}

function printHierarchy(hierarchy, classFiles, indent = '') {
  let output = '';
  const entries = Object.entries(hierarchy);

  entries.sort(([nameA], [nameB]) => nameA.localeCompare(nameB));

  for (const [name, module] of entries) {
    output += `${indent}- ${name}\n`;

    if (module.items && module.items.length > 0) {
      for (const item of module.items.sort()) {
        const encodedPath = classFiles[item] ? ensureLeadingSlash(classFiles[item]) : '';
        const link = classFiles[item] ? `[${item}](${composeClassDocUrl(encodedPath)})` : item;
        output += `${indent}  - ${link}\n`;
      }
    }

    if (Object.keys(module.children).length > 0) {
      output += printHierarchy(module.children, classFiles, indent + '  ');
    }
  }

  return output;
}

async function main(folderPath) {
  try {
    const jsFiles = await findJsFiles(folderPath);
    const allModules = new Map();
    const classFiles = {};

    for (const file of jsFiles) {
      const content = await fs.readFile(file, 'utf-8');
      console.log(`Processing file: ${file}`); // Log the file being processed
      console.log(`File content preview: ${content.slice(0, 100)}...`); // Log the first 100 characters of the file content
      const modules = parseModules(content, path.basename(file));
      
      for (const [moduleName, items] of modules) {
        if (!allModules.has(moduleName)) {
          allModules.set(moduleName, new Set());
        }
        for (const item of items) {
          allModules.get(moduleName).add(item);
          classFiles[item] = encodeURI(path.relative(folderPath, file).replace(/\\/g, '/'));
        }
      }
    }

    const hierarchy = buildHierarchy(allModules);
    const markdownHierarchy = printHierarchy(hierarchy, classFiles);

    const markdownContent = `# Modules\n\n${markdownHierarchy}`;

    // Create the output directory if it doesn't exist
    const outputDir = path.join(folderPath, OUTPUT_DIR);
    await fs.mkdir(outputDir, { recursive: true });

    // Write the file to the output directory
    await fs.writeFile(path.join(outputDir, 'module_hierarchy.md'), markdownContent);
    console.log(`Module hierarchy has been written to ${path.join(OUTPUT_DIR, 'module_hierarchy.md')}`);
  } catch (error) {
    console.error('An error occurred:', error);
  }
}

const folderPath = process.argv[2] || '.';
main(folderPath).catch(console.error);
