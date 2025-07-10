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
            "space-before-function-paren": ["error", "always"],
            "no-undef": "off",
            "no-debugger": "off"
        }
    }
];