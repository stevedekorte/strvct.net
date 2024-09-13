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
        console.log("Entering handleClassNode");
        if (node.id) {
            result.classInfo.className = node.id.name;
            console.log("Class name from AST:", result.classInfo.className);
        }
        if (node.superClass) {
            result.classInfo.extends = node.superClass.name;
            console.log("Extends from AST:", result.classInfo.extends);
        }
        
        const classComments = this.getClassComments(node.start);
        console.log("Raw class comments:", classComments);
        
        const { description, entries } = this.extractJSDocInfo(classComments);
        console.log("Extracted description:", description);
        console.log("Extracted entries:", entries);
        
        result.classInfo.description = description;
        if (entries.class) {
            result.classInfo.className = entries.class;
            console.log("Class name from JSDoc:", entries.class);
        }
        if (entries.extends) {
            result.classInfo.extends = entries.extends;
            console.log("Extends from JSDoc:", entries.extends);
        }
        result.classInfo.filePath = this.filePath;
        console.log("Final classInfo:", result.classInfo);
    }

    handleMethodNode(node, result) {
        const methodName = node.key.name;
        const methodComments = this.getMethodComments(node.start);
        if (!methodComments) {
            console.log(`No JSDoc comment found for method "${methodName}"`);
        } else {
            console.log(`Method comments for – "${methodName}" – :`, methodComments);
        }
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
            .filter(comment => 
                comment.end < methodStart && 
                comment.type === 'Block' &&
                comment.value.startsWith('*') &&
                this.isImmediatelyBeforeMethod(comment.end, methodStart)
            )
            .sort((a, b) => b.end - a.end);

        if (relevantComments.length > 0) {
            const closestComment = relevantComments[0];
            // Remove the comment from the list to avoid reusing it for other methods
            this.comments = this.comments.filter(comment => comment !== closestComment);
            return closestComment.value;
        }

        return '';
    }

    isImmediatelyBeforeMethod(commentEnd, methodStart) {
        const codeInBetween = this.code.slice(commentEnd, methodStart).trim();
        return codeInBetween === '' || codeInBetween === '{';
    }

    extractJSDocInfo(comment) {
        console.log("Entering extractJSDocInfo with comment:", comment);
        const lines = comment.split('\n').map(line => line.trim().replace(/^\*+/, '').trim());
        console.log("Processed comment lines:", lines);
        
        let description = [];
        const entries = { params: [], returns: null, throws: null, example: null, deprecated: null, since: null, class: null };
        let currentTag = null;
        let currentTagContent = [];

        lines.forEach(line => {
            const tagMatch = line.match(/^@(\w+)/);
            if (tagMatch) {
                console.log("Found tag:", tagMatch[1]);
                if (currentTag) {
                    this.processTag(currentTag, currentTagContent.join(' '), entries);
                }
                currentTag = tagMatch[1];
                currentTagContent = [line.slice(tagMatch[0].length).trim()];
            } else if (currentTag) {
                currentTagContent.push(line);
            } else if (line.trim() !== '') {
                description.push(line);
            }
        });

        if (currentTag) {
            this.processTag(currentTag, currentTagContent.join(' '), entries);
        }

        // If there's a @class tag, use its content as the class name and the rest as the description
        if (entries.class) {
            const classNameAndDesc = entries.class.split(/\s+(.+)/);
            entries.class = classNameAndDesc[0];
            if (classNameAndDesc[1]) {
                description.unshift(classNameAndDesc[1]);
            }
        }

        console.log("Final description:", description);
        console.log("Final entries:", entries);

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
            case 'class':
                entries.class = content.trim();
                break;
            case 'extends':
                entries.extends = content.trim();
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
            } else if (key === 'classInfo') {
                xml += '<classInfo>\n';
                for (const classKey in value) {
                    if (classKey === 'filePath') {
                        xml += `<filePath><a href="${escapeXml(value[classKey])}">${escapeXml(value[classKey])}</a></filePath>\n`;
                    } else {
                        xml += `<${classKey}>${escapeXml(value[classKey])}</${classKey}>\n`;
                    }
                }
                xml += '</classInfo>\n';
            } else if (typeof value === 'object' && value !== null) {
                xml += `<${key}>${jsonToXml(value)}</${key}>\n`;
            } else if (value !== undefined && value !== '') {
                if (typeof value === 'boolean') {
                    xml += `<${key}>${value ? 'true' : 'false'}</${key}>\n`;
                } else if (key === 'fullMethodName') {
                    const methodName = value.replace('async ', '');
                    xml += `<${key}${value.startsWith('async ') ? ' async="true"' : ''}>${escapeXml(methodName)}</${key}>\n`;
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
    
    const classMethods = result.methods.filter(method => method.isStatic);
    const instanceMethods = result.methods.filter(method => !method.isStatic);
    
    const xmlOutput = `
        <class>
            <classInfo>
                <className>${escapeXml(result.classInfo.className)}</className>
                <extends>${escapeXml(result.classInfo.extends)}</extends>
                <filePath><a href="${escapeXml(result.classInfo.filePath)}">${escapeXml(result.classInfo.filePath)}</a></filePath>
                <description>${escapeXml(result.classInfo.description)}</description>
            </classInfo>
            ${classMethods.length > 0 ? `
            <classmethods>
                ${classMethods.map(method => generateMethodXml(method)).join('')}
            </classmethods>
            ` : ''}
            <methods>
                ${instanceMethods.map(method => generateMethodXml(method)).join('')}
            </methods>
        </class>
    `;
    outputElement.innerHTML = xmlOutput;
}

function generateMethodXml(method) {
    return `
        <method>
            <name>${escapeXml(method.name)}</name>
            <fullMethodName>${escapeXml(method.fullMethodName)}</fullMethodName>
            <isAsync>${method.isAsync}</isAsync>
            <access>${escapeXml(method.access)}</access>
            <isStatic>${method.isStatic}</isStatic>
            <description>${escapeXml(method.description)}</description>
            <params>${method.parameters.map(param => `
                <param>
                    <paramName>${escapeXml(param.paramName)}</paramName>
                    <paramType>${escapeXml(param.paramType)}</paramType>
                    <description>${escapeXml(param.description)}</description>
                </param>
            `).join('')}</params>
            ${method.returns ? `
                <returns>
                    <returnType>${escapeXml(method.returns.returnType)}</returnType>
                    <description>${escapeXml(method.returns.description)}</description>
                </returns>
            ` : ''}
            ${method.throws ? `<throws>${escapeXml(method.throws)}</throws>` : ''}
            ${method.example ? `<example>${escapeXml(method.example)}</example>` : ''}
            ${method.deprecated ? `<deprecated>${escapeXml(method.deprecated)}</deprecated>` : ''}
            ${method.since ? `<since>${escapeXml(method.since)}</since>` : ''}
        </method>
    `;
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