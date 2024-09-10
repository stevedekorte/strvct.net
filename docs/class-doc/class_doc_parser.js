class JsClassParser {
    constructor(code, filePath) {
        this.code = code;
        this.lines = code.split('\n'); 
        this.filePath = filePath;
    }

    parse() {
        console.log("Starting to parse file:", this.filePath);
        const ast = acorn.parse(this.code, { ecmaVersion: 2020, sourceType: 'module', locations: true });
        
        const result = {
            classInfo: {
                className: '',
                extends: '',
                filePath: this.filePath,
                description: ''
            },
            methods: []
        };

        acorn.walk.simple(ast, {
            ClassDeclaration: (node) => {
                console.log("Found ClassDeclaration:", node.id.name);
                result.classInfo.className = node.id.name;
                if (node.superClass) {
                    result.classInfo.extends = node.superClass.name;
                }
                
                const comments = this.getLeadingComments(node.start);
                console.log("Leading comments:", comments);
                const { description, entries } = this.extractJSDocInfo(comments);
                result.classInfo.description = description;
                Object.assign(result.classInfo, entries);
            },
            ClassExpression: (node) => {
                console.log("Found ClassExpression:", node);
                if (node.id) {
                    result.classInfo.className = node.id.name;
                }
                if (node.superClass) {
                    result.classInfo.extends = node.superClass.name;
                }
                
                const comments = this.getLeadingComments(node.start);
                console.log("Leading comments:", comments);
                const { description, entries } = this.extractJSDocInfo(comments);
                result.classInfo.description = description;
                Object.assign(result.classInfo, entries);
            },
            MethodDefinition: (node) => {
                console.log("Found MethodDefinition:", node.key.name);
                const method = {
                    methodName: node.key.name,
                    fullMethodName: this.getFullMethodName(node),
                    isAsync: node.value.async,
                    parameters: this.getMethodParameters(node),
                    lineno: node.loc.start.line,
                    description: ''
                };

                const methodComments = this.getMethodComments(node);
                const { description, entries } = this.extractJSDocInfo(methodComments);
                method.description = description || entries.description || 'Undocumented';
                Object.assign(method, entries);

                result.methods.push(method);
            }
        });

        console.log("Parsing complete. Result:", result);
        return result;
    }

    getFullMethodName(node) {
        const asyncPrefix = node.value.async ? 'async ' : '';
        const methodName = node.key.name;
        const params = node.value.params.map(param => {
            if (param.type === 'AssignmentPattern') {
                return `${param.left.name} = ${this.code.slice(param.right.start, param.right.end)}`;
            }
            return param.name;
        }).join(', ');
        return `${asyncPrefix}${methodName}${params ? `(${params})` : ''}`;
    }

    getLeadingComments(start) {
        const lines = this.code.slice(0, start).split('\n').reverse();
        const comments = [];
        for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.startsWith('//') || trimmed.startsWith('*')) {
                comments.unshift(trimmed.replace(/^\/\/|\*/, '').trim());
            } else if (trimmed === '') {
                continue;
            } else {
                break;
            }
        }
        return comments.join('\n');
    }

    getMethodComments(node) {
        const leadingComments = this.getLeadingComments(node.start);
        const bodyComments = this.getBodyComments(node.value.body);
        return this.cleanComments(leadingComments + '\n' + bodyComments.join('\n'));
    }

    getBodyComments(body) {
        const comments = this.code.slice(body.start + 1, body.end - 1).match(/\/\*[\s\S]*?\*\/|\/\/.*/g) || [];
        return comments.map(comment => this.cleanComment(comment));
    }

    cleanComments(comments) {
        return comments.split('\n')
            .map(line => this.cleanComment(line))
            .join('\n');
    }

    cleanComment(comment) {
        // Remove // from single-line comments
        if (comment.trim().startsWith('//')) {
            return comment.replace(/^\s*\/\/\s?/, '');
        }
        // For multi-line comments, you might want to remove the * at the start of each line
        return comment.replace(/^\s*\*\s?/gm, '');
    }

    extractJSDocInfo(comments) {
        const lines = comments.split('\n');
        let description = '';
        const entries = {};
        let currentTag = null;

        for (const line of lines) {
            const trimmedLine = line.trim();
            if (trimmedLine.startsWith('@')) {
                const [tagPart, ...valueParts] = trimmedLine.split(/\s+/);
                const tag = tagPart.slice(1); // Remove the @ symbol
                if (tag) {
                    currentTag = tag.toLowerCase();
                    entries[currentTag] = valueParts.join(' ').trim();
                }
            } else if (currentTag) {
                entries[currentTag] += ' ' + trimmedLine;
            } else if (trimmedLine !== '') {
                description += (description ? ' ' : '') + trimmedLine;
            }
        }

        // Clean up entries
        for (const key in entries) {
            entries[key] = entries[key].trim().replace(/\/+$/, '');
        }

        return { description, entries };
    }

    getMethodParameters(node) {
        return node.value.params.map(param => {
            if (param.type === 'AssignmentPattern') {
                return {
                    paramName: param.left.name,
                    default: this.code.slice(param.right.start, param.right.end)
                };
            }
            return { paramName: param.name };
        });
    }
}

function jsonToXml(obj, indent = '') {
    let xml = '';
    for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
            const value = obj[key];
            if (key === 'classInfo') {
                xml += `${indent}<classInfo>\n`;
                // Ensure specific order for className, extends, and filePath
                xml += `${indent}  <className>${escapeXml(value.className)}</className>\n`;
                if (value.extends) {
                    xml += `${indent}  <extends>${escapeXml(value.extends)}</extends>\n`;
                }
                xml += `${indent}  <filePath>${escapeXml(value.filePath)}</filePath>\n`;
                // Add the rest of the classInfo properties
                for (const classInfoKey in value) {
                    if (!['className', 'extends', 'filePath'].includes(classInfoKey)) {
                        xml += `${indent}  <${classInfoKey}>${escapeXml(value[classInfoKey])}</${classInfoKey}>\n`;
                    }
                }
                xml += `${indent}</classInfo>\n`;
            } else if (key === 'methods') {
                xml += `${indent}<methods>\n`;
                for (const method of value) {
                    xml += `${indent}  <method>\n`;
                    xml += `${indent}    <name>${escapeXml(method.methodName)}</name>\n`;
                    xml += `${indent}    <fullMethodName>${escapeXml(method.fullMethodName)}</fullMethodName>\n`;
                    xml += `${indent}    <isAsync>${method.isAsync}</isAsync>\n`;
                    xml += `${indent}    <lineno>${method.lineno}</lineno>\n`;
                    if (method.parameters.length > 0) {
                        xml += `${indent}    <parameters>\n`;
                        for (const param of method.parameters) {
                            xml += `${indent}      <parameter>\n`;
                            if (param.paramName) {
                                xml += `${indent}        <name>${escapeXml(param.paramName)}</name>\n`;
                            }
                            if (param.default !== undefined) {
                                xml += `${indent}        <default>${escapeXml(param.default)}</default>\n`;
                            }
                            xml += `${indent}      </parameter>\n`;
                        }
                        xml += `${indent}    </parameters>\n`;
                    }
                    if (method.description) {
                        xml += `${indent}    <description>${escapeXml(method.description)}</description>\n`;
                    }
                    for (const tag in method) {
                        if (!['isAsync', 'methodName', 'fullMethodName', 'parameters', 'description', 'lineno'].includes(tag)) {
                            xml += `${indent}    <${tag}>${escapeXml(method[tag])}</${tag}>\n`;
                        }
                    }
                    xml += `${indent}  </method>\n`;
                }
                xml += `${indent}</methods>\n`;
            } else if (typeof value === 'object' && value !== null) {
                xml += `${indent}<${key}>\n${jsonToXml(value, indent + '  ')}${indent}</${key}>\n`;
            } else if (value !== undefined && value !== '') {
                xml += `${indent}<${key}>${escapeXml(value)}</${key}>\n`;
            }
        }
    }
    return xml;
}

function escapeXml(unsafe) {
    if (unsafe === undefined || unsafe === null) {
        return '';
    }
    return unsafe.toString()
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function displayClassInfo(classInfo) {
    const output = document.getElementById('output');
    output.innerHTML = `
        <h1>${classInfo.className}</h1>
        ${classInfo.classDescription ? `<p>${classInfo.classDescription}</p>` : ''}
        <h2>Methods:</h2>
        <ul>
            ${classInfo.methods.map(method => `
                <li>${method.name}(${method.params.join(', ')})</li>
            `).join('')}
        </ul>
    `;
}

document.addEventListener('DOMContentLoaded', async () => {
    console.log("DOM content loaded");
    const urlParams = new URLSearchParams(window.location.search);
    const path = urlParams.get('path');

    console.log("Path from URL:", path);

    if (!path) {
        console.error('No path parameter provided');
        return;
    }

    try {
        console.log("Fetching file:", path);
        const response = await fetch(path);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const code = await response.text();
        console.log("File content fetched successfully");
        
        const parser = new JsClassParser(code, path);
        const result = parser.parse();

        console.log("Parsing result:", result);

        const xmlOutput = jsonToXml(result);
        const outputElement = document.getElementById('output');
        outputElement.innerHTML = `<class>${xmlOutput}</class>`;
        console.log("XML output generated and inserted into DOM");
    } catch (error) {
        console.error('Error:', error);
    }
});