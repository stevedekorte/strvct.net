const js = require("@eslint/js");

module.exports = [
    js.configs.recommended,
    {
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: "script",
            globals: {
                // Browser globals
                window: "readonly",
                document: "readonly",
                console: "readonly",
                
                // Node.js globals
                process: "readonly",
                Buffer: "readonly",
                __dirname: "readonly",
                __filename: "readonly",
                global: "readonly",
                require: "readonly",
                module: "readonly",
                exports: "readonly",
                
                // Project-specific globals (add as needed)
                SvGlobals: "readonly"
            }
        },
        rules: {
            // Linting rules
            "no-undef": "off",
            "no-debugger": "off",

            // Formatting rules
            "indent": ["error", 4, { "SwitchCase": 1 }],
            "semi": ["error", "always"],
            "quotes": ["error", "double", { "avoidEscape": true }],
            "space-before-function-paren": ["error", "always"],
            "space-before-blocks": ["error", "always"],
            "keyword-spacing": ["error", { "before": true, "after": true }],
            "comma-spacing": ["error", { "before": false, "after": true }],
            "object-curly-spacing": ["error", "always"],
            "array-bracket-spacing": ["error", "never"],
            "space-in-parens": ["error", "never"],
            "space-infix-ops": ["error"],
            "no-trailing-spaces": ["error"],
            "eol-last": ["error", "always"],
            "no-multiple-empty-lines": ["error", { "max": 2, "maxEOF": 1 }]
        }
    }
];