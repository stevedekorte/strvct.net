class JsClassParser {
    constructor(code, filePath) {
        this.code = code;
        this.lines = code.split('\n'); 
        this.filePath = filePath;
        this.comments = [];
    }

    parse() {
        console.log("Starting to parse file:", this.filePath);
        const ast = acorn.parse(this.code, { ecmaVersion: 2020, sourceType: 'module', locations: true, onComment: this.comments });

        const result = {
            classInfo: {
                className: '',
                extends: '',
                filePath: this.filePath,
                description: 'Undocumented' // Default to "Undocumented"
            },
            methods: []
        };

        // Find the first class declaration or expression
        let classNode = null;
        acorn.walk.simple(ast, {
            ClassDeclaration: (node) => {
                if (!classNode) classNode = node;
            },
            ClassExpression: (node) => {
                if (!classNode) classNode = node;
            }
        });

        if (classNode) {
            console.log("Found class node:", classNode);
            console.log("Code around class node:", this.code.slice(classNode.start - 50, classNode.start + 50));
            // Extract class-level comments
            const classComments = this.getClassComments(classNode.start);
            console.log("Class-level comments:", classComments);
            const { description, entries } = this.extractJSDocInfo(classComments);
            result.classInfo.description = description || 'Undocumented'; // Set the description directly

            this.handleClassNode(classNode, result);
        }

        acorn.walk.simple(ast, {
            MethodDefinition: (node) => {
                this.handleMethodNode(node, result);
            }
        });

        console.log("Parsing complete. Result:", result);
        return result;
    }

    handleClassNode(node, result) {
        if (node.id) {
            result.classInfo.className = node.id.name;
        }
        if (node.superClass) {
            result.classInfo.extends = node.superClass.name;
        }
        // Remove this line as we'll handle filepath in jsonToXml
        // result.classInfo.filepath = this.filePath;
    }

    handleMethodNode(node, result) {
        const methodName = node.key.name;
        const methodComments = this.getMethodComments(node.start);
        console.log(`Method comments for – "${methodName}" – :`, methodComments);
        const { description, entries } = this.extractJSDocInfo(methodComments);

        // Get the method arguments
        const args = node.value.params.map(param => param.name).join(', ');
        const fullMethodName = args ? `${methodName}(${args})` : methodName;

        const methodInfo = {
            methodName,
            fullMethodName: `${node.value.async ? 'async ' : ''}${fullMethodName}`,
            isAsync: node.value.async,
            parameters: entries.params || [],
            access: this.getAccessModifier(node),
            isStatic: node.static || false,
            description: description || 'Undocumented',
            example: entries.example || null,
            deprecated: entries.deprecated || null,
            since: entries.since || null
        };

        // Only include throws if it's not null or empty
        if (entries.throws && entries.throws.trim() !== '') {
            methodInfo.throws = entries.throws;
        }

        // Only include returns if it's not null or empty
        if (entries.returns && (entries.returns.returnType || entries.returns.description)) {
            methodInfo.returns = entries.returns;
        }

        result.methods.push(methodInfo);
    }

    getAccessModifier(node) {
        if (node.kind === 'constructor') return 'constructor';
        if (node.static) return 'static';
        if (node.key.name.startsWith('_')) return 'private';
        return 'public';
    }

    getClassComments(classStart) {
        return this.comments
            .filter(comment => comment.end < classStart)
            .map(comment => comment.value)
            .join('\n');
    }

    getMethodComments(methodStart) {
        const relevantComments = this.comments
            .filter(comment => comment.end < methodStart && comment.type === 'Block')
            .sort((a, b) => b.end - a.end);

        if (relevantComments.length > 0) {
            const closestComment = relevantComments[0];
            // Remove the comment from the list to avoid reusing it for other methods
            this.comments = this.comments.filter(comment => comment !== closestComment);
            return closestComment.value;
        }

        return '';
    }

    extractJSDocInfo(comment) {
        const lines = comment.split('\n').map(line => line.trim().replace(/^\*+/, '').trim());
        const description = [];
        const entries = { params: [], returns: null, throws: null, example: null, deprecated: null, since: null };
        let currentTag = null;
        let currentTagContent = [];

        lines.forEach(line => {
            const tagMatch = line.match(/^@(\w+)/);
            if (tagMatch) {
                if (currentTag) {
                    this.processTag(currentTag, currentTagContent.join(' '), entries);
                }
                currentTag = tagMatch[1];
                currentTagContent = [line.slice(tagMatch[0].length).trim()];
            } else if (currentTag) {
                currentTagContent.push(line);
            } else {
                description.push(line);
            }
        });

        if (currentTag) {
            this.processTag(currentTag, currentTagContent.join(' '), entries);
        }

        return {
            description: description.join(' ').trim(),
            entries
        };
    }

    processTag(tag, content, entries) {
        switch (tag) {
            case 'param':
                const [paramType, paramName, ...paramDesc] = content.split(' ');
                entries.params.push({
                    paramName: paramName.replace('-', '').trim(),
                    paramType: paramType.replace(/[{}]/g, '').trim(),
                    description: paramDesc.join(' ').trim().replace(/^- /, '') // Remove leading "- "
                });
                break;
            case 'returns':
                const [returnType, ...returnDesc] = content.split(' ');
                entries.returns = {
                    returnType: returnType.replace(/[{}]/g, '').trim(),
                    description: returnDesc.join(' ').trim()
                };
                break;
            case 'throws':
                entries.throws = content.trim();
                break;
            case 'example':
                entries.example = content.trim();
                break;
            case 'deprecated':
                entries.deprecated = content.trim();
                break;
            case 'since':
                entries.since = content.trim();
                break;
        }
    }
}

function jsonToXml(json) {
    let xml = '';
    for (const key in json) {
        if (json.hasOwnProperty(key)) {
            const value = json[key];
            if (key === 'methods') {
                xml += '<methods>\n';
                value.forEach((method) => {
                    xml += `<method>\n${jsonToXml(method)}</method>\n`;
                });
                xml += '</methods>\n';
            } else if (key === 'parameters') {
                xml += '<parameters>\n';
                value.forEach((param) => {
                    xml += `<parameter>\n${jsonToXml(param)}</parameter>\n`;
                });
                xml += '</parameters>\n';
            } else if (typeof value === 'object' && value !== null) {
                xml += `<${key}>${jsonToXml(value)}</${key}>\n`;
            } else if (value !== undefined && value !== '') {
                if (typeof value === 'boolean') {
                    xml += `<${key}>${value ? 'true' : 'false'}</${key}>\n`;
                } else if (key === 'fullMethodName') {
                    const methodName = value.replace('async ', '');
                    xml += `<${key}${value.startsWith('async ') ? ' async="true"' : ''}>${escapeXml(methodName)}</${key}>\n`;
                } else if (key === 'filePath') {
                    xml += `<filepath><a href="${escapeXml(value)}">${escapeXml(value)}</a></filepath>\n`;
                } else if (key === 'throws') {
                    xml += `<${key}>${escapeXml(value)}</${key}>\n`;
                } else if (['access', 'isStatic', 'example', 'deprecated', 'since', 'returns'].includes(key)) {
                    if (value && (typeof value === 'string' ? value.trim() !== '' : Object.keys(value).length > 0)) {
                        xml += `<${key}>${jsonToXml(value)}</${key}>\n`;
                    }
                } else {
                    xml += `<${key}>${escapeXml(value)}</${key}>\n`;
                }
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

function displayClassInfo(result) {
    const outputElement = document.getElementById('output');
    const xmlOutput = jsonToXml(result);
    outputElement.innerHTML = `<class>${xmlOutput}</class>`;
}

document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const path = urlParams.get('path');

    if (!path) {
        console.error('No path parameter provided');
        return;
    }

    try {
        const response = await fetch(path);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const code = await response.text();
        
        const parser = new JsClassParser(code, path);
        const result = parser.parse();

        displayClassInfo(result);
    } catch (error) {
        console.error('Error:', error);
    }
});