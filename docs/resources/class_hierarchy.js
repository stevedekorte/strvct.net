// class_hierarchy.js

const fs = require('fs').promises;
const path = require('path');
const acorn = require('acorn');
const walk = require('acorn-walk');

async function findJsFiles(dir) {
  const files = await fs.readdir(dir, { withFileTypes: true });
  const jsFiles = [];

  for (const file of files) {
    const fullPath = path.join(dir, file.name);
    if (file.isDirectory()) {
      // Skip directories named "_unused"
      if (file.name !== "_unused") {
        jsFiles.push(...await findJsFiles(fullPath));
      }
    } else if (file.name.endsWith('.js')) {
      jsFiles.push(fullPath);
    }
  }

  return jsFiles;
}

function parseClasses(content) {
  const ast = acorn.parse(content, { ecmaVersion: 'latest', sourceType: 'module' });
  const classes = [];

  walk.simple(ast, {
    ClassDeclaration(node) {
      classes.push({
        name: node.id.name,
        superClass: node.superClass ? node.superClass.name : null
      });
    },
    ClassExpression(node) {
      if (node.id) {
        classes.push({
          name: node.id.name,
          superClass: node.superClass ? node.superClass.name : null
        });
      }
    }
  });

  return classes;
}

function buildHierarchy(classes) {
  const classIndex = {};
  const hierarchy = { Object: { name: 'Object', children: {}, superClass: null } };
  const builtInTypes = ['Array', 'Boolean', 'Date', 'Error', 'Map', 'Set', 'String', 'Number', 'ArrayBuffer', 'Blob', 'Image', 'Range'];

  // Initialize hierarchy with built-in types
  for (const type of builtInTypes) {
    const classObj = { name: type, children: {}, superClass: 'Object' };
    hierarchy.Object.children[type] = classObj;
    classIndex[type] = classObj;
  }

  // First pass: create class objects
  for (const cls of classes) {
    if (cls && cls.name) {
      classIndex[cls.name] = { name: cls.name, children: {}, superClass: cls.superClass || 'Object' };
    }
  }

  // Second pass: build hierarchy
  for (const cls of classes) {
    if (cls && cls.name) {
      const classObj = classIndex[cls.name];
      const superClass = classObj.superClass;
      
      if (superClass === 'Object') {
        hierarchy.Object.children[cls.name] = classObj;
      } else if (classIndex[superClass]) {
        classIndex[superClass].children[cls.name] = classObj;
      } else {
        console.warn(`Superclass ${superClass} not found for ${cls.name}. Placing under Object.`);
        hierarchy.Object.children[cls.name] = classObj;
      }
    }
  }

  return { hierarchy, classIndex };
}

function placeOrphan(hierarchy, orphan) {
  if (hierarchy[orphan.superClass]) {
    hierarchy[orphan.superClass].children[orphan.name] = orphan;
    return true;
  }
  for (const cls of Object.values(hierarchy)) {
    if (placeOrphan(cls.children, orphan)) {
      return true;
    }
  }
  return false;
}

function printHierarchy(hierarchy, classFiles, indent = '', isRoot = true) {
  let output = '';
  const entries = Object.entries(hierarchy);
  
  // Sort entries to ensure 'Object' is first if it exists
  entries.sort(([nameA], [nameB]) => {
    if (nameA === 'Object') return -1;
    if (nameB === 'Object') return 1;
    return nameA.localeCompare(nameB);
  });

  for (const [name, cls] of entries) {
    if (cls) {
      const encodedPath = classFiles[name] ? encodeURIComponent(classFiles[name]) : '';
      const link = classFiles[name] ? `[${name}](./class_doc.html?path=${encodedPath})` : name;
      if (isRoot && name !== 'Object') {
        // For root-level classes that aren't Object, indent them under Object
        output += `${indent}- Object\n`;
        output += `${indent}  - ${link}\n`;
      } else {
        output += `${indent}- ${link}\n`;
      }
      if (Object.keys(cls.children).length > 0) {
        output += printHierarchy(cls.children, classFiles, isRoot && name !== 'Object' ? indent + '    ' : indent + '  ', false);
      }
    }
  }
  return output;
}

function createClassLink(className, filePath) {
    const link = document.createElement('a');
    link.textContent = className;
    link.href = `./class_doc.html?path=${encodeURIComponent(filePath)}`;
    return link;
}

async function main(folderPath) {
  try {
    const jsFiles = await findJsFiles(folderPath);
    const allClasses = [];
    let warnings = '';
    const classFiles = {};

    // Get the last component of the input path
    const folderName = path.basename(folderPath);

    for (const file of jsFiles) {
      const content = await fs.readFile(file, 'utf-8');
      const classes = parseClasses(content);
      allClasses.push(...classes);
      
      // Store the relative path for each class
      classes.forEach(cls => {
        classFiles[cls.name] = encodeURI(path.relative(folderPath, file).replace(/\\/g, '/'));
      });
    }

    // Redirect console.warn to our warnings string
    const originalWarn = console.warn;
    console.warn = (...args) => {
      warnings += args.join(' ') + '\n';
    };

    const { hierarchy, classIndex } = buildHierarchy(allClasses);

    // Restore original console.warn
    console.warn = originalWarn;

    const markdownHierarchy = printHierarchy(hierarchy, classFiles);

    // Add H1 header to the markdown content without the period
    const markdownContent = `# Classes\n\n${markdownHierarchy}`;

    // Write the markdown hierarchy to a file
    await fs.writeFile(path.join(folderPath, 'class_hierarchy.md'), markdownContent);
    console.log('Class hierarchy has been written to class_hierarchy.md');

    // Write warnings to a file if there are any
    if (warnings) {
      await fs.writeFile(path.join(folderPath, 'hierarchy_warnings.log'), warnings);
      console.log('Warnings have been written to hierarchy_warnings.log');
    }
  } catch (error) {
    console.error('An error occurred:', error);
  }
}

const folderPath = process.argv[2] || '.';
main(folderPath).catch(console.error);
main(folderPath).catch(console.error);