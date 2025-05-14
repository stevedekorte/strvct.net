(() => {
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __commonJS = (cb, mod) => function __require() {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  };

  // jwt-decode/jwt-decode.js
  var require_jwt_decode = __commonJS({
    "jwt-decode/jwt-decode.js"(exports, module) {
      (() => {
        "use strict";
        var __webpack_modules__ = {
          /***/
          "../../../node_modules/jwt-decode/build/esm/index.js": (
            /*!***********************************************************!*\
              !*** ../../../node_modules/jwt-decode/build/esm/index.js ***!
              \***********************************************************/
            /***/
            (__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {
              eval('__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   InvalidTokenError: () => (/* binding */ InvalidTokenError),\n/* harmony export */   jwtDecode: () => (/* binding */ jwtDecode)\n/* harmony export */ });\nclass InvalidTokenError extends Error {\n}\nInvalidTokenError.prototype.name = "InvalidTokenError";\nfunction b64DecodeUnicode(str) {\n    return decodeURIComponent(atob(str).replace(/(.)/g, (m, p) => {\n        let code = p.charCodeAt(0).toString(16).toUpperCase();\n        if (code.length < 2) {\n            code = "0" + code;\n        }\n        return "%" + code;\n    }));\n}\nfunction base64UrlDecode(str) {\n    let output = str.replace(/-/g, "+").replace(/_/g, "/");\n    switch (output.length % 4) {\n        case 0:\n            break;\n        case 2:\n            output += "==";\n            break;\n        case 3:\n            output += "=";\n            break;\n        default:\n            throw new Error("base64 string is not of the correct length");\n    }\n    try {\n        return b64DecodeUnicode(output);\n    }\n    catch (err) {\n        return atob(output);\n    }\n}\nfunction jwtDecode(token, options) {\n    if (typeof token !== "string") {\n        throw new InvalidTokenError("Invalid token specified: must be a string");\n    }\n    options || (options = {});\n    const pos = options.header === true ? 0 : 1;\n    const part = token.split(".")[pos];\n    if (typeof part !== "string") {\n        throw new InvalidTokenError(`Invalid token specified: missing part #${pos + 1}`);\n    }\n    let decoded;\n    try {\n        decoded = base64UrlDecode(part);\n    }\n    catch (e) {\n        throw new InvalidTokenError(`Invalid token specified: invalid base64 for part #${pos + 1} (${e.message})`);\n    }\n    try {\n        return JSON.parse(decoded);\n    }\n    catch (e) {\n        throw new InvalidTokenError(`Invalid token specified: invalid json for part #${pos + 1} (${e.message})`);\n    }\n}\n\n\n//# sourceURL=webpack:///../../../node_modules/jwt-decode/build/esm/index.js?');
            }
          ),
          /***/
          "./entry.js": (
            /*!******************!*\
              !*** ./entry.js ***!
              \******************/
            /***/
            (__unused_webpack_module, __webpack_exports__, __webpack_require__) => {
              eval('__webpack_require__.r(__webpack_exports__);\n/* harmony import */ var jwt_decode__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! jwt-decode */ "../../../node_modules/jwt-decode/build/esm/index.js");\n \nwindow.jwt_decode = jwt_decode__WEBPACK_IMPORTED_MODULE_0__;\n\n\n//# sourceURL=webpack:///./entry.js?');
            }
          )
          /******/
        };
        var __webpack_module_cache__ = {};
        function __webpack_require__(moduleId) {
          var cachedModule = __webpack_module_cache__[moduleId];
          if (cachedModule !== void 0) {
            return cachedModule.exports;
          }
          var module2 = __webpack_module_cache__[moduleId] = {
            /******/
            // no module.id needed
            /******/
            // no module.loaded needed
            /******/
            exports: {}
            /******/
          };
          __webpack_modules__[moduleId](module2, module2.exports, __webpack_require__);
          return module2.exports;
        }
        (() => {
          __webpack_require__.d = (exports2, definition) => {
            for (var key in definition) {
              if (__webpack_require__.o(definition, key) && !__webpack_require__.o(exports2, key)) {
                Object.defineProperty(exports2, key, { enumerable: true, get: definition[key] });
              }
            }
          };
        })();
        (() => {
          __webpack_require__.o = (obj, prop) => Object.prototype.hasOwnProperty.call(obj, prop);
        })();
        (() => {
          __webpack_require__.r = (exports2) => {
            if (typeof Symbol !== "undefined" && Symbol.toStringTag) {
              Object.defineProperty(exports2, Symbol.toStringTag, { value: "Module" });
            }
            Object.defineProperty(exports2, "__esModule", { value: true });
          };
        })();
        var __webpack_exports__ = __webpack_require__("./entry.js");
      })();
      assert(window.jwt_decode, "jwt-decode is not available");
    }
  });
  require_jwt_decode();
})();
//# sourceMappingURL=jwt-decode.bundle.js.map
