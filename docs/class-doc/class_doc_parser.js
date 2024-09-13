class JsClassParser {
    constructor(code, filePath) {
        this.code = code;
        this.lines = code.split('\n'); 
        this.filePath = filePath;
        this.comments = [];
    }

    parse() {
        console.log("Starting to parse file:", this.filePath);
        let ast;
        try {
            // First, try to parse the entire file
            ast = acorn.parse(this.code, { 
                ecmaVersion: 2020, 
                sourceType: 'module', 
                locations: true, 
                onComment: this.comments 
            });
        } catch (error) {
            console.error("Parsing error:", error);
            console.error("Error location:", error.loc);
            console.error("Problematic code:", this.code.split('\n')[error.loc.line - 1]);
            
            // If parsing fails, try to extract the class definition
            const classMatch = this.code.match(/class\s+(\w+)[\s\S]*?{([\s\S]*?)}\s*\)\s*\.initThisCategory\(\);/);
            if (classMatch) {
                const className = classMatch[1];
                const classBody = classMatch[2];
                
                // Create a valid class syntax for parsing
                const validClassCode = `class ${className} { ${classBody} }`;
                
                try {
                    ast = acorn.parse(validClassCode, { 
                        ecmaVersion: 2020, 
                        sourceType: 'module', 
                        locations: true, 
                        onComment: this.comments 
                    });
                } catch (innerError) {
                    console.error("Failed to parse extracted class:", innerError);
                    this.parseError = `${error.message} at line ${error.loc.line}, column ${error.loc.column}`;
                    return this.fallbackParse();
                }
            } else {
                this.parseError = `${error.message} at line ${error.loc.line}, column ${error.loc.column}`;
                return this.fallbackParse();
            }
        }

        const result = {
            classInfo: {
                className: '',
                extends: '',
                filePath: this.filePath,
                description: 'Undocumented'
            },
            methods: []
        };

        // Find the class declaration or expression
        let classNode = null;
        acorn.walk.simple(ast, {
            ClassDeclaration: (node) => {
                if (!classNode) classNode = node;
            },
            ClassExpression: (node) => {
                if (!classNode) classNode = node;
            },
            CallExpression: (node) => {
                // Check for .initThisCategory() call
                if (node.callee.property && node.callee.property.name === 'initThisCategory') {
                    // The class might be the object before .initThisCategory()
                    if (node.callee.object.type === 'ClassExpression') {
                        classNode = node.callee.object;
                    }
                }
            }
        });

        if (classNode) {
            console.log("Found class node:", classNode);
            const classComments = this.getClassComments(classNode.start);
            console.log("Class-level comments:", classComments);
            const { description, entries } = this.extractJSDocInfo(classComments);
            result.classInfo.description = description || 'Undocumented';

            this.handleClassNode(classNode, result);
        }

        // Parse methods
        acorn.walk.simple(ast, {
            MethodDefinition: (node) => {
                this.handleMethodNode(node, result);
            },
            Property: (node) => {
                // Handle methods defined as properties (e.g., arrow functions)
                if (typeof node.value === 'function' || node.value.type === 'FunctionExpression' || node.value.type === 'ArrowFunctionExpression') {
                    this.handleMethodNode(node, result);
                }
            }
        });

        console.log("Parsing complete. Result:", result);
        return result;
    }

    fallbackParse() {
        console.log("Falling back to partial parsing");
        const result = {
            classInfo: {
                className: 'Unknown',
                extends: '',
                filePath: this.filePath,
                description: `Unable to fully parse the class due to syntax errors: ${this.parseError}`
            },
            methods: []
        };

        // Try to extract class name and methods using regex
        const classMatch = this.code.match(/class\s+(\w+)/);
        if (classMatch) {
            result.classInfo.className = classMatch[1];
        }

        const methodRegex = /(static\s+)?(\w+)\s*\(([^)]*)\)\s*{/g;
        let match;
        while ((match = methodRegex.exec(this.code)) !== null) {
            const isStatic = !!match[1];
            const methodName = match[2];
            const parameters = match[3].split(',').map(param => param.trim()).filter(param => param);
            result.methods.push({
                methodName: methodName,
                fullMethodName: `${isStatic ? 'static ' : ''}${methodName}(${match[3]})`,
                parameters: parameters.map(param => ({
                    paramName: param,
                    paramType: 'unknown',
                    description: 'Parameter extracted during fallback parsing.'
                })),
                description: `Parse error: ${this.parseError}. Method extracted during fallback parsing.`,
                isAsync: false,
                access: isStatic ? 'static' : 'public',
                isStatic: isStatic
            });
        }

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
        const methodName = node.key ? node.key.name : node.method ? node.method.name : 'anonymous';
        const methodComments = this.getMethodComments(node.start);
        console.log(`Method comments for "${methodName}":`, methodComments);
        const { description, entries } = this.extractJSDocInfo(methodComments);

        // Get the method arguments
        const args = node.value && node.value.params ? 
            node.value.params.map(param => param.name).join(', ') :
            node.params ? node.params.map(param => param.name).join(', ') : '';

        const fullMethodName = args ? `${methodName}(${args})` : methodName;

        const methodInfo = {
            methodName,
            fullMethodName: `${node.value && node.value.async ? 'async ' : ''}${fullMethodName}`,
            isAsync: node.value ? node.value.async : false,
            parameters: entries.params || [],
            access: this.getAccessModifier(node),
            isStatic: node.static || false,
            description: description || 'Undocumented',
            example: entries.example || null,
            deprecated: entries.deprecated || null,
            since: entries.since || null
        };

        if (entries.throws && entries.throws.trim() !== '') {
            methodInfo.throws = entries.throws;
        }

        if (entries.returns && (entries.returns.returnType || entries.returns.description)) {
            methodInfo.returns = entries.returns;
        }

        result.methods.push(methodInfo);
    }

    getAccessModifier(node) {
        if (node.kind === 'constructor') return 'constructor';
        if (node.static) return 'static';
        if (node.key && node.key.name.startsWith('_')) return 'private';
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
        const lines = comment.split('\n').map(line => line.replace(/^\s*\*\s?/, ''));
        console.log("Processed comment lines:", lines);
        
        let description = [];
        const entries = { params: [], returns: null, throws: null, example: null, deprecated: null, since: null, class: null };
        let currentTag = null;
        let currentTagContent = [];
        let inCodeBlock = false;
        let codeBlockContent = [];

        lines.forEach((line, index) => {
            if (line.trim().startsWith('```')) {
                if (inCodeBlock) {
                    // End of code block
                    description.push('```' + codeBlockContent.join('\n') + '```');
                    codeBlockContent = [];
                }
                inCodeBlock = !inCodeBlock;
            } else if (inCodeBlock) {
                codeBlockContent.push(line);
            } else {
                const tagMatch = line.match(/^@(\w+)/);
                if (tagMatch) {
                    console.log("Found tag:", tagMatch[1]);
                    if (currentTag) {
                        this.processTag(currentTag, currentTagContent.join('\n'), entries);
                    }
                    currentTag = tagMatch[1];
                    currentTagContent = [line.slice(tagMatch[0].length).trim()];
                } else if (currentTag) {
                    currentTagContent.push(line);
                } else {
                    // Preserve empty lines in the description
                    if (line.trim() === '' && index > 0 && lines[index - 1].trim() !== '') {
                        description.push('');
                    }
                    if (line.trim() !== '') {
                        description.push(line);
                    }
                }
            }
        });

        // Handle case where code block is at the end of the comment
        if (inCodeBlock) {
            description.push('```' + codeBlockContent.join('\n') + '```');
        }

        if (currentTag) {
            this.processTag(currentTag, currentTagContent.join('\n'), entries);
        }

        // If there's a @description tag, use its content as the description
        if (entries.description) {
            description = [entries.description];
            delete entries.description;
        }

        console.log("Final description:", description);
        console.log("Final entries:", entries);

        return {
            description: description.join('\n'),
            entries
        };
    }

    processTag(tag, content, entries) {
        switch (tag) {
            case 'param':
                const [paramType, paramName, ...paramDesc] = content.split(/\s+/);
                entries.params.push({
                    paramName: paramName.replace('-', '').trim(),
                    paramType: paramType.replace(/[{}]/g, '').trim(),
                    description: paramDesc.join(' ').trim().replace(/^- /, '') // Remove leading "- "
                });
                break;
            case 'returns':
                const [returnType, ...returnDesc] = content.split(/\s+/);
                entries.returns = {
                    returnType: returnType.replace(/[{}]/g, '').trim(),
                    description: returnDesc.join(' ').trim()
                };
                break;
            case 'throws':
            case 'example':
            case 'deprecated':
            case 'since':
            case 'class':
            case 'extends':
            case 'description':
                entries[tag] = content.trim();
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
                    } else if (classKey === 'description') {
                        xml += `<description>${escapeXmlPreserveWhitespace(value[classKey])}</description>\n`;
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
                } else if (key === 'description') {
                    xml += `<${key}>${escapeXmlPreserveWhitespace(value)}</${key}>\n`;
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

function escapeXmlPreserveWhitespace(unsafe) {
    if (unsafe === undefined || unsafe === null) {
        return '';
    }
    let inCodeBlock = false;
    return unsafe.toString()
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;")
        .replace(/\n/g, "&#10;")  // Preserve line breaks
        .replace(/\r/g, "&#13;")  // Preserve carriage returns
        .replace(/\t/g, "&#9;")   // Preserve tabs
        .replace(/```([\s\S]*?)```/g, (match, content) => {
            return `<code>${content}</code>`;
        });
}

function displayClassInfo(result) {
    const outputElement = document.getElementById('output');
    
    // Separate class methods from instance methods
    const classMethods = result.methods.filter(method => method.isStatic || method.access === 'static');
    const instanceMethods = result.methods.filter(method => !method.isStatic && method.access !== 'static');
    
    const xmlOutput = `
        <class>
            <classInfo>
                <className>${escapeXml(result.classInfo.className)}</className>
                <extends>${escapeXml(result.classInfo.extends)}</extends>
                <filePath><a href="${escapeXml(result.classInfo.filePath)}">${escapeXml(result.classInfo.filePath)}</a></filePath>
                <description>${escapeXmlPreserveWhitespace(result.classInfo.description)}</description>
            </classInfo>
            ${classMethods.length > 0 ? `
            <classmethods>
                ${classMethods.map(method => generateMethodXml(method)).join('')}
            </classmethods>
            ` : ''}
            ${instanceMethods.length > 0 ? `
            <instancemethods>
                ${instanceMethods.map(method => generateMethodXml(method)).join('')}
            </instancemethods>
            ` : ''}
        </class>
    `;
    outputElement.innerHTML = xmlOutput;
}

function generateMethodXml(method) {
    console.log(`Generating XML for method: ${method.methodName}`);
    console.log(`Method description: ${method.description}`);
    console.log(`Method returns: `, method.returns);

    let xml = '<method>\n';
    xml += `  <name>${method.methodName}</name>\n`;
    xml += `  <fullMethodName>${method.fullMethodName.replace(/^static\s+/, '')}</fullMethodName>\n`;
    
    // Output params first
    if (method.parameters && method.parameters.length > 0) {
        xml += '  <params>\n';
        method.parameters.forEach(param => {
            xml += '    <param>\n';
            xml += `      <paramname>${param.paramName}</paramname>\n`;
            xml += `      <paramtype>${param.paramType}</paramtype>\n`;
            if (param.description) {
                xml += `      <description>${param.description}</description>\n`;
            }
            xml += '    </param>\n';
        });
        xml += '  </params>\n';
    }
    
    // Output method description after params
    if (method.description || method.returns) {
        console.log('Method has description or returns');
        if (method.description) {
            console.log('Adding method description to XML');
            xml += `  <description>${method.description}</description>\n`;
        } else {
            console.log('Method has returns but no description');
        }
    } else {
        console.log('Adding "Undocumented" to XML');
        xml += `  <description>Undocumented</description>\n`;
    }
    
    // Output returns if present
    if (method.returns) {
        xml += '  <returns>\n';
        xml += `    <returntype>${method.returns.returnType}</returntype>\n`;
        if (method.returns.description) {
            xml += `    <description>${method.returns.description}</description>\n`;
        }
        xml += '  </returns>\n';
    }
    
    xml += `  <isAsync>${method.isAsync}</isAsync>\n`;
    xml += `  <access>${method.access}</access>\n`;
    xml += `  <isStatic>${method.isStatic}</isStatic>\n`;
    if (method.example) {
        xml += `  <example>${method.example}</example>\n`;
    }
    if (method.deprecated) {
        xml += `  <deprecated>${method.deprecated}</deprecated>\n`;
    }
    if (method.since) {
        xml += `  <since>${method.since}</since>\n`;
    }
    if (method.throws) {
        xml += `  <throws>${method.throws}</throws>\n`;
    }
    xml += '</method>\n';

    console.log('Final XML:', xml);
    return xml;
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