"use strict";

/**
 * @module library.services.Firebase
 */

/**
 * @class FirebaseStoragePermissions
 * @extends ProtoClass
 * @classdesc Evaluates Firebase Storage security rules against paths
 *
 * This class provides a client-side simulation of Firebase Storage security rules.
 * It is NOT a security boundary - the server rules are authoritative.
 * This is only for UI purposes (enabling/disabling actions, showing permissions).
 *
 * Rule Format:
 * The rules are defined as an array of rule objects, each with:
 * - pattern: Path pattern with {variable} placeholders and ** wildcards
 * - read: Condition string or boolean for read permission
 * - write: Condition string or boolean for write permission
 *
 * Example:
 * {
 *   pattern: "users/{userId}/**",
 *   read: "auth.uid == userId",
 *   write: "auth.uid == userId"
 * }
 */
(class FirebaseStoragePermissions extends ProtoClass {

    initPrototypeSlots () {

        /**
         * @member {Array} rules - Array of rule definitions
         */
        {
            const slot = this.newSlot("rules", null);
            slot.setSlotType("Array");
        }

        /**
         * @member {Object} context - Evaluation context (auth, etc.)
         */
        {
            const slot = this.newSlot("context", null);
            slot.setSlotType("Object");
        }
    }

    initPrototype () {
        this.setRules(this.defaultRules());
    }

    /**
     * @description Default rules matching storage.rules file
     * @returns {Array} Array of rule objects
     * @category Rules
     */
    defaultRules () {
        return [
            {
                pattern: "",
                read: false,
                write: false,
                description: "Root bucket - no access"
            },
            {
                pattern: "users",
                read: "auth != null",
                write: false,
                description: "Users folder - authenticated users can list"
            },
            {
                pattern: "users/{userId}/**",
                read: "auth != null && auth.uid == userId",
                write: "auth != null && auth.uid == userId",
                description: "User files - only owner can access"
            },
            {
                pattern: "public/**",
                read: true,
                write: "auth != null",
                description: "Public files - everyone reads, auth users write"
            },
            {
                pattern: "shared/**",
                read: "auth != null",
                write: "auth != null",
                description: "Shared files - auth users can read/write"
            }
        ];
    }

    /**
     * @description Evaluates permissions for a given path
     * @param {string} path - The storage path to check
     * @param {Object} context - Context object with auth property
     * @returns {Object} Object with canRead, canWrite, anyoneCanRead properties
     * @category Evaluation
     */
    evaluatePath (path, context) {
        this.setContext(context);

        // Try each rule in order
        for (const rule of this.rules()) {
            const match = this.matchPattern(path, rule.pattern);
            if (match) {
                const variables = match.variables;
                const canRead = this.evaluateCondition(rule.read, variables);
                const canWrite = this.evaluateCondition(rule.write, variables);
                const anyoneCanRead = this.evaluateCondition(rule.read, variables, { auth: null });

                return { canRead, canWrite, anyoneCanRead };
            }
        }

        // No matching rule - deny by default
        return { canRead: false, canWrite: false, anyoneCanRead: false };
    }

    /**
     * @description Matches a path against a pattern
     * @param {string} path - The path to match
     * @param {string} pattern - Pattern with {variable} and ** wildcards
     * @returns {Object|null} Match object with variables, or null if no match
     * @category Pattern Matching
     */
    matchPattern (path, pattern) {
        // Handle root/empty path
        if (pattern === "" || pattern === "root") {
            return (path === "" || path === "root") ? { variables: {} } : null;
        }

        const pathParts = path.split("/").filter(p => p.length > 0);
        const patternParts = pattern.split("/").filter(p => p.length > 0);
        const variables = {};
        let pathIndex = 0;
        let patternIndex = 0;

        while (patternIndex < patternParts.length) {
            const patternPart = patternParts[patternIndex];

            // Handle ** wildcard (matches rest of path)
            if (patternPart === "**") {
                return { variables };
            }

            // Handle {variable} placeholder
            if (patternPart.startsWith("{") && patternPart.endsWith("}")) {
                if (pathIndex >= pathParts.length) {
                    return null; // Pattern expects more path segments
                }
                const varName = patternPart.slice(1, -1);
                variables[varName] = pathParts[pathIndex];
                pathIndex++;
                patternIndex++;
                continue;
            }

            // Handle literal match
            if (pathIndex >= pathParts.length || pathParts[pathIndex] !== patternPart) {
                return null; // No match
            }

            pathIndex++;
            patternIndex++;
        }

        // Pattern consumed - path must also be fully consumed (unless pattern ended with **)
        if (pathIndex === pathParts.length) {
            return { variables };
        }

        return null;
    }

    /**
     * @description Evaluates a condition expression
     * @param {boolean|string} condition - Boolean or expression string
     * @param {Object} variables - Variables extracted from path pattern
     * @param {Object} contextOverride - Optional context override (for anyoneCanRead check)
     * @returns {boolean} Result of evaluation
     * @category Evaluation
     */
    evaluateCondition (condition, variables, contextOverride = null) {
        // Simple boolean
        if (typeof condition === "boolean") {
            return condition;
        }

        // Expression string
        if (typeof condition === "string") {
            try {
                const context = contextOverride || this.context();

                // Build evaluation scope
                const scope = { // this is used by eval()
                    auth: context.auth,
                    ...variables
                };

                if (scope) {
                    // just to keep linter happy
                }

                // Simple expression evaluator
                // Supports: auth, auth.uid, variable names, ==, !=, &&, ||, null
                const expr = condition
                    .replace(/\b(\w+)\b(?:\.(uid))?/g, (match, word, prop) => {
                        // Handle reserved words
                        if (word === "null" || word === "true" || word === "false") {
                            return match;
                        }
                        // Handle auth with property access
                        if (word === "auth") {
                            if (prop === "uid") {
                                return "scope.auth?.uid";
                            }
                            return "scope.auth";
                        }
                        // Handle other variables (only if no property access)
                        if (!prop) {
                            return `scope.${word}`;
                        }
                        return match;
                    });

                // Evaluate
                const result = eval(expr);
                return !!result;
            } catch (error) {
                console.error("Error evaluating condition:", condition, error);
                return false;
            }
        }

        return false;
    }

}.initThisClass());
