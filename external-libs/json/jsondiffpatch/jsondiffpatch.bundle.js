(() => {
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __commonJS = (cb, mod) => function __require() {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  };

  // json/jsondiffpatch/jsondiffpatch.js
  var require_jsondiffpatch = __commonJS({
    "json/jsondiffpatch/jsondiffpatch.js"(exports, module) {
      (() => {
        "use strict";
        var __webpack_modules__ = {
          /***/
          "./entry.js": (
            /*!******************!*\
              !*** ./entry.js ***!
              \******************/
            /***/
            (__unused_webpack_module, __webpack_exports__, __webpack_require__) => {
              eval('__webpack_require__.r(__webpack_exports__);\n/* harmony import */ var jsondiffpatch__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! jsondiffpatch */ "../../node_modules/jsondiffpatch/lib/index.js");\n \nwindow.jsondiffpatch = jsondiffpatch__WEBPACK_IMPORTED_MODULE_0__;\n\n\n//# sourceURL=webpack:///./entry.js?');
            }
          ),
          /***/
          "../../node_modules/jsondiffpatch/lib/clone.js": (
            /*!*****************************************************!*\
              !*** ../../node_modules/jsondiffpatch/lib/clone.js ***!
              \*****************************************************/
            /***/
            (__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {
              eval(`__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ clone)
/* harmony export */ });
function cloneRegExp(re) {
    const regexMatch = /^\\/(.*)\\/([gimyu]*)$/.exec(re.toString());
    return new RegExp(regexMatch[1], regexMatch[2]);
}
function clone(arg) {
    if (typeof arg !== 'object') {
        return arg;
    }
    if (arg === null) {
        return null;
    }
    if (Array.isArray(arg)) {
        return arg.map(clone);
    }
    if (arg instanceof Date) {
        return new Date(arg.getTime());
    }
    if (arg instanceof RegExp) {
        return cloneRegExp(arg);
    }
    const cloned = {};
    for (const name in arg) {
        if (Object.prototype.hasOwnProperty.call(arg, name)) {
            cloned[name] = clone(arg[name]);
        }
    }
    return cloned;
}


//# sourceURL=webpack:///../../node_modules/jsondiffpatch/lib/clone.js?`);
            }
          ),
          /***/
          "../../node_modules/jsondiffpatch/lib/contexts/context.js": (
            /*!****************************************************************!*\
              !*** ../../node_modules/jsondiffpatch/lib/contexts/context.js ***!
              \****************************************************************/
            /***/
            (__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {
              eval(`__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ Context)
/* harmony export */ });
class Context {
    setResult(result) {
        this.result = result;
        this.hasResult = true;
        return this;
    }
    exit() {
        this.exiting = true;
        return this;
    }
    push(child, name) {
        child.parent = this;
        if (typeof name !== 'undefined') {
            child.childName = name;
        }
        child.root = this.root || this;
        child.options = child.options || this.options;
        if (!this.children) {
            this.children = [child];
            this.nextAfterChildren = this.next || null;
            this.next = child;
        }
        else {
            this.children[this.children.length - 1].next = child;
            this.children.push(child);
        }
        child.next = this;
        return this;
    }
}


//# sourceURL=webpack:///../../node_modules/jsondiffpatch/lib/contexts/context.js?`);
            }
          ),
          /***/
          "../../node_modules/jsondiffpatch/lib/contexts/diff.js": (
            /*!*************************************************************!*\
              !*** ../../node_modules/jsondiffpatch/lib/contexts/diff.js ***!
              \*************************************************************/
            /***/
            (__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {
              eval(`__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _context_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./context.js */ "../../node_modules/jsondiffpatch/lib/contexts/context.js");
/* harmony import */ var _clone_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../clone.js */ "../../node_modules/jsondiffpatch/lib/clone.js");


class DiffContext extends _context_js__WEBPACK_IMPORTED_MODULE_0__["default"] {
    constructor(left, right) {
        super();
        this.left = left;
        this.right = right;
        this.pipe = 'diff';
    }
    setResult(result) {
        if (this.options.cloneDiffValues && typeof result === 'object') {
            const clone = typeof this.options.cloneDiffValues === 'function'
                ? this.options.cloneDiffValues
                : _clone_js__WEBPACK_IMPORTED_MODULE_1__["default"];
            if (typeof result[0] === 'object') {
                result[0] = clone(result[0]);
            }
            if (typeof result[1] === 'object') {
                result[1] = clone(result[1]);
            }
        }
        return super.setResult(result);
    }
}
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (DiffContext);


//# sourceURL=webpack:///../../node_modules/jsondiffpatch/lib/contexts/diff.js?`);
            }
          ),
          /***/
          "../../node_modules/jsondiffpatch/lib/contexts/patch.js": (
            /*!**************************************************************!*\
              !*** ../../node_modules/jsondiffpatch/lib/contexts/patch.js ***!
              \**************************************************************/
            /***/
            (__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {
              eval(`__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _context_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./context.js */ "../../node_modules/jsondiffpatch/lib/contexts/context.js");

class PatchContext extends _context_js__WEBPACK_IMPORTED_MODULE_0__["default"] {
    constructor(left, delta) {
        super();
        this.left = left;
        this.delta = delta;
        this.pipe = 'patch';
    }
}
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (PatchContext);


//# sourceURL=webpack:///../../node_modules/jsondiffpatch/lib/contexts/patch.js?`);
            }
          ),
          /***/
          "../../node_modules/jsondiffpatch/lib/contexts/reverse.js": (
            /*!****************************************************************!*\
              !*** ../../node_modules/jsondiffpatch/lib/contexts/reverse.js ***!
              \****************************************************************/
            /***/
            (__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {
              eval(`__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _context_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./context.js */ "../../node_modules/jsondiffpatch/lib/contexts/context.js");

class ReverseContext extends _context_js__WEBPACK_IMPORTED_MODULE_0__["default"] {
    constructor(delta) {
        super();
        this.delta = delta;
        this.pipe = 'reverse';
    }
}
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (ReverseContext);


//# sourceURL=webpack:///../../node_modules/jsondiffpatch/lib/contexts/reverse.js?`);
            }
          ),
          /***/
          "../../node_modules/jsondiffpatch/lib/date-reviver.js": (
            /*!************************************************************!*\
              !*** ../../node_modules/jsondiffpatch/lib/date-reviver.js ***!
              \************************************************************/
            /***/
            (__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {
              eval(`__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ dateReviver)
/* harmony export */ });
// use as 2nd parameter for JSON.parse to revive Date instances
function dateReviver(key, value) {
    let parts;
    if (typeof value === 'string') {
        parts =
            /^(\\d{4})-(\\d{2})-(\\d{2})T(\\d{2}):(\\d{2}):(\\d{2})(?:\\.(\\d*))?(Z|([+-])(\\d{2}):(\\d{2}))$/.exec(value);
        if (parts) {
            return new Date(Date.UTC(+parts[1], +parts[2] - 1, +parts[3], +parts[4], +parts[5], +parts[6], +(parts[7] || 0)));
        }
    }
    return value;
}


//# sourceURL=webpack:///../../node_modules/jsondiffpatch/lib/date-reviver.js?`);
            }
          ),
          /***/
          "../../node_modules/jsondiffpatch/lib/diffpatcher.js": (
            /*!***********************************************************!*\
              !*** ../../node_modules/jsondiffpatch/lib/diffpatcher.js ***!
              \***********************************************************/
            /***/
            (__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {
              eval(`__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _processor_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./processor.js */ "../../node_modules/jsondiffpatch/lib/processor.js");
/* harmony import */ var _pipe_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./pipe.js */ "../../node_modules/jsondiffpatch/lib/pipe.js");
/* harmony import */ var _contexts_diff_js__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ./contexts/diff.js */ "../../node_modules/jsondiffpatch/lib/contexts/diff.js");
/* harmony import */ var _contexts_patch_js__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! ./contexts/patch.js */ "../../node_modules/jsondiffpatch/lib/contexts/patch.js");
/* harmony import */ var _contexts_reverse_js__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(/*! ./contexts/reverse.js */ "../../node_modules/jsondiffpatch/lib/contexts/reverse.js");
/* harmony import */ var _clone_js__WEBPACK_IMPORTED_MODULE_10__ = __webpack_require__(/*! ./clone.js */ "../../node_modules/jsondiffpatch/lib/clone.js");
/* harmony import */ var _filters_trivial_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./filters/trivial.js */ "../../node_modules/jsondiffpatch/lib/filters/trivial.js");
/* harmony import */ var _filters_nested_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./filters/nested.js */ "../../node_modules/jsondiffpatch/lib/filters/nested.js");
/* harmony import */ var _filters_arrays_js__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ./filters/arrays.js */ "../../node_modules/jsondiffpatch/lib/filters/arrays.js");
/* harmony import */ var _filters_dates_js__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./filters/dates.js */ "../../node_modules/jsondiffpatch/lib/filters/dates.js");
/* harmony import */ var _filters_texts_js__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./filters/texts.js */ "../../node_modules/jsondiffpatch/lib/filters/texts.js");











class DiffPatcher {
    constructor(options) {
        this.processor = new _processor_js__WEBPACK_IMPORTED_MODULE_0__["default"](options);
        this.processor.pipe(new _pipe_js__WEBPACK_IMPORTED_MODULE_1__["default"]('diff')
            .append(_filters_nested_js__WEBPACK_IMPORTED_MODULE_2__.collectChildrenDiffFilter, _filters_trivial_js__WEBPACK_IMPORTED_MODULE_3__.diffFilter, _filters_dates_js__WEBPACK_IMPORTED_MODULE_4__.diffFilter, _filters_texts_js__WEBPACK_IMPORTED_MODULE_5__.diffFilter, _filters_nested_js__WEBPACK_IMPORTED_MODULE_2__.objectsDiffFilter, _filters_arrays_js__WEBPACK_IMPORTED_MODULE_6__.diffFilter)
            .shouldHaveResult());
        this.processor.pipe(new _pipe_js__WEBPACK_IMPORTED_MODULE_1__["default"]('patch')
            .append(_filters_nested_js__WEBPACK_IMPORTED_MODULE_2__.collectChildrenPatchFilter, _filters_arrays_js__WEBPACK_IMPORTED_MODULE_6__.collectChildrenPatchFilter, _filters_trivial_js__WEBPACK_IMPORTED_MODULE_3__.patchFilter, _filters_texts_js__WEBPACK_IMPORTED_MODULE_5__.patchFilter, _filters_nested_js__WEBPACK_IMPORTED_MODULE_2__.patchFilter, _filters_arrays_js__WEBPACK_IMPORTED_MODULE_6__.patchFilter)
            .shouldHaveResult());
        this.processor.pipe(new _pipe_js__WEBPACK_IMPORTED_MODULE_1__["default"]('reverse')
            .append(_filters_nested_js__WEBPACK_IMPORTED_MODULE_2__.collectChildrenReverseFilter, _filters_arrays_js__WEBPACK_IMPORTED_MODULE_6__.collectChildrenReverseFilter, _filters_trivial_js__WEBPACK_IMPORTED_MODULE_3__.reverseFilter, _filters_texts_js__WEBPACK_IMPORTED_MODULE_5__.reverseFilter, _filters_nested_js__WEBPACK_IMPORTED_MODULE_2__.reverseFilter, _filters_arrays_js__WEBPACK_IMPORTED_MODULE_6__.reverseFilter)
            .shouldHaveResult());
    }
    options(options) {
        return this.processor.options(options);
    }
    diff(left, right) {
        return this.processor.process(new _contexts_diff_js__WEBPACK_IMPORTED_MODULE_7__["default"](left, right));
    }
    patch(left, delta) {
        return this.processor.process(new _contexts_patch_js__WEBPACK_IMPORTED_MODULE_8__["default"](left, delta));
    }
    reverse(delta) {
        return this.processor.process(new _contexts_reverse_js__WEBPACK_IMPORTED_MODULE_9__["default"](delta));
    }
    unpatch(right, delta) {
        return this.patch(right, this.reverse(delta));
    }
    clone(value) {
        return (0,_clone_js__WEBPACK_IMPORTED_MODULE_10__["default"])(value);
    }
}
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (DiffPatcher);


//# sourceURL=webpack:///../../node_modules/jsondiffpatch/lib/diffpatcher.js?`);
            }
          ),
          /***/
          "../../node_modules/jsondiffpatch/lib/filters/arrays.js": (
            /*!**************************************************************!*\
              !*** ../../node_modules/jsondiffpatch/lib/filters/arrays.js ***!
              \**************************************************************/
            /***/
            (__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {
              eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   collectChildrenPatchFilter: () => (/* binding */ collectChildrenPatchFilter),\n/* harmony export */   collectChildrenReverseFilter: () => (/* binding */ collectChildrenReverseFilter),\n/* harmony export */   diffFilter: () => (/* binding */ diffFilter),\n/* harmony export */   patchFilter: () => (/* binding */ patchFilter),\n/* harmony export */   reverseFilter: () => (/* binding */ reverseFilter)\n/* harmony export */ });\n/* harmony import */ var _contexts_diff_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../contexts/diff.js */ \"../../node_modules/jsondiffpatch/lib/contexts/diff.js\");\n/* harmony import */ var _contexts_patch_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../contexts/patch.js */ \"../../node_modules/jsondiffpatch/lib/contexts/patch.js\");\n/* harmony import */ var _contexts_reverse_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../contexts/reverse.js */ \"../../node_modules/jsondiffpatch/lib/contexts/reverse.js\");\n/* harmony import */ var _lcs_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./lcs.js */ \"../../node_modules/jsondiffpatch/lib/filters/lcs.js\");\n\n\n\n\nconst ARRAY_MOVE = 3;\nfunction arraysHaveMatchByRef(array1, array2, len1, len2) {\n    for (let index1 = 0; index1 < len1; index1++) {\n        const val1 = array1[index1];\n        for (let index2 = 0; index2 < len2; index2++) {\n            const val2 = array2[index2];\n            if (index1 !== index2 && val1 === val2) {\n                return true;\n            }\n        }\n    }\n}\nfunction matchItems(array1, array2, index1, index2, context) {\n    const value1 = array1[index1];\n    const value2 = array2[index2];\n    if (value1 === value2) {\n        return true;\n    }\n    if (typeof value1 !== 'object' || typeof value2 !== 'object') {\n        return false;\n    }\n    const objectHash = context.objectHash;\n    if (!objectHash) {\n        // no way to match objects was provided, try match by position\n        return context.matchByPosition && index1 === index2;\n    }\n    context.hashCache1 = context.hashCache1 || [];\n    let hash1 = context.hashCache1[index1];\n    if (typeof hash1 === 'undefined') {\n        context.hashCache1[index1] = hash1 = objectHash(value1, index1);\n    }\n    if (typeof hash1 === 'undefined') {\n        return false;\n    }\n    context.hashCache2 = context.hashCache2 || [];\n    let hash2 = context.hashCache2[index2];\n    if (typeof hash2 === 'undefined') {\n        context.hashCache2[index2] = hash2 = objectHash(value2, index2);\n    }\n    if (typeof hash2 === 'undefined') {\n        return false;\n    }\n    return hash1 === hash2;\n}\nconst diffFilter = function arraysDiffFilter(context) {\n    if (!context.leftIsArray) {\n        return;\n    }\n    const matchContext = {\n        objectHash: context.options && context.options.objectHash,\n        matchByPosition: context.options && context.options.matchByPosition,\n    };\n    let commonHead = 0;\n    let commonTail = 0;\n    let index;\n    let index1;\n    let index2;\n    const array1 = context.left;\n    const array2 = context.right;\n    const len1 = array1.length;\n    const len2 = array2.length;\n    let child;\n    if (len1 > 0 &&\n        len2 > 0 &&\n        !matchContext.objectHash &&\n        typeof matchContext.matchByPosition !== 'boolean') {\n        matchContext.matchByPosition = !arraysHaveMatchByRef(array1, array2, len1, len2);\n    }\n    // separate common head\n    while (commonHead < len1 &&\n        commonHead < len2 &&\n        matchItems(array1, array2, commonHead, commonHead, matchContext)) {\n        index = commonHead;\n        child = new _contexts_diff_js__WEBPACK_IMPORTED_MODULE_0__[\"default\"](array1[index], array2[index]);\n        context.push(child, index);\n        commonHead++;\n    }\n    // separate common tail\n    while (commonTail + commonHead < len1 &&\n        commonTail + commonHead < len2 &&\n        matchItems(array1, array2, len1 - 1 - commonTail, len2 - 1 - commonTail, matchContext)) {\n        index1 = len1 - 1 - commonTail;\n        index2 = len2 - 1 - commonTail;\n        child = new _contexts_diff_js__WEBPACK_IMPORTED_MODULE_0__[\"default\"](array1[index1], array2[index2]);\n        context.push(child, index2);\n        commonTail++;\n    }\n    let result;\n    if (commonHead + commonTail === len1) {\n        if (len1 === len2) {\n            // arrays are identical\n            context.setResult(undefined).exit();\n            return;\n        }\n        // trivial case, a block (1 or more consecutive items) was added\n        result = result || {\n            _t: 'a',\n        };\n        for (index = commonHead; index < len2 - commonTail; index++) {\n            result[index] = [array2[index]];\n        }\n        context.setResult(result).exit();\n        return;\n    }\n    if (commonHead + commonTail === len2) {\n        // trivial case, a block (1 or more consecutive items) was removed\n        result = result || {\n            _t: 'a',\n        };\n        for (index = commonHead; index < len1 - commonTail; index++) {\n            result[`_${index}`] = [array1[index], 0, 0];\n        }\n        context.setResult(result).exit();\n        return;\n    }\n    // reset hash cache\n    delete matchContext.hashCache1;\n    delete matchContext.hashCache2;\n    // diff is not trivial, find the LCS (Longest Common Subsequence)\n    const trimmed1 = array1.slice(commonHead, len1 - commonTail);\n    const trimmed2 = array2.slice(commonHead, len2 - commonTail);\n    const seq = _lcs_js__WEBPACK_IMPORTED_MODULE_1__[\"default\"].get(trimmed1, trimmed2, matchItems, matchContext);\n    const removedItems = [];\n    result = result || {\n        _t: 'a',\n    };\n    for (index = commonHead; index < len1 - commonTail; index++) {\n        if (seq.indices1.indexOf(index - commonHead) < 0) {\n            // removed\n            result[`_${index}`] = [array1[index], 0, 0];\n            removedItems.push(index);\n        }\n    }\n    let detectMove = true;\n    if (context.options &&\n        context.options.arrays &&\n        context.options.arrays.detectMove === false) {\n        detectMove = false;\n    }\n    let includeValueOnMove = false;\n    if (context.options &&\n        context.options.arrays &&\n        context.options.arrays.includeValueOnMove) {\n        includeValueOnMove = true;\n    }\n    const removedItemsLength = removedItems.length;\n    for (index = commonHead; index < len2 - commonTail; index++) {\n        const indexOnArray2 = seq.indices2.indexOf(index - commonHead);\n        if (indexOnArray2 < 0) {\n            // added, try to match with a removed item and register as position move\n            let isMove = false;\n            if (detectMove && removedItemsLength > 0) {\n                for (let removeItemIndex1 = 0; removeItemIndex1 < removedItemsLength; removeItemIndex1++) {\n                    index1 = removedItems[removeItemIndex1];\n                    if (matchItems(trimmed1, trimmed2, index1 - commonHead, index - commonHead, matchContext)) {\n                        // store position move as: [originalValue, newPosition, ARRAY_MOVE]\n                        result[`_${index1}`].splice(1, 2, index, ARRAY_MOVE);\n                        if (!includeValueOnMove) {\n                            // don't include moved value on diff, to save bytes\n                            result[`_${index1}`][0] = '';\n                        }\n                        index2 = index;\n                        child = new _contexts_diff_js__WEBPACK_IMPORTED_MODULE_0__[\"default\"](array1[index1], array2[index2]);\n                        context.push(child, index2);\n                        removedItems.splice(removeItemIndex1, 1);\n                        isMove = true;\n                        break;\n                    }\n                }\n            }\n            if (!isMove) {\n                // added\n                result[index] = [array2[index]];\n            }\n        }\n        else {\n            // match, do inner diff\n            index1 = seq.indices1[indexOnArray2] + commonHead;\n            index2 = seq.indices2[indexOnArray2] + commonHead;\n            child = new _contexts_diff_js__WEBPACK_IMPORTED_MODULE_0__[\"default\"](array1[index1], array2[index2]);\n            context.push(child, index2);\n        }\n    }\n    context.setResult(result).exit();\n};\ndiffFilter.filterName = 'arrays';\nconst compare = {\n    numerically(a, b) {\n        return a - b;\n    },\n    numericallyBy(name) {\n        return (a, b) => a[name] - b[name];\n    },\n};\nconst patchFilter = function nestedPatchFilter(context) {\n    if (!context.nested) {\n        return;\n    }\n    const nestedDelta = context.delta;\n    if (nestedDelta._t !== 'a') {\n        return;\n    }\n    let index;\n    let index1;\n    const delta = nestedDelta;\n    const array = context.left;\n    // first, separate removals, insertions and modifications\n    let toRemove = [];\n    let toInsert = [];\n    const toModify = [];\n    for (index in delta) {\n        if (index !== '_t') {\n            if (index[0] === '_') {\n                const removedOrMovedIndex = index;\n                // removed item from original array\n                if (delta[removedOrMovedIndex][2] === 0 ||\n                    delta[removedOrMovedIndex][2] === ARRAY_MOVE) {\n                    toRemove.push(parseInt(index.slice(1), 10));\n                }\n                else {\n                    throw new Error('only removal or move can be applied at original array indices,' +\n                        ` invalid diff type: ${delta[removedOrMovedIndex][2]}`);\n                }\n            }\n            else {\n                const numberIndex = index;\n                if (delta[numberIndex].length === 1) {\n                    // added item at new array\n                    toInsert.push({\n                        index: parseInt(numberIndex, 10),\n                        value: delta[numberIndex][0],\n                    });\n                }\n                else {\n                    // modified item at new array\n                    toModify.push({\n                        index: parseInt(numberIndex, 10),\n                        delta: delta[numberIndex],\n                    });\n                }\n            }\n        }\n    }\n    // remove items, in reverse order to avoid sawing our own floor\n    toRemove = toRemove.sort(compare.numerically);\n    for (index = toRemove.length - 1; index >= 0; index--) {\n        index1 = toRemove[index];\n        const indexDiff = delta[`_${index1}`];\n        const removedValue = array.splice(index1, 1)[0];\n        if (indexDiff[2] === ARRAY_MOVE) {\n            // reinsert later\n            toInsert.push({\n                index: indexDiff[1],\n                value: removedValue,\n            });\n        }\n    }\n    // insert items, in reverse order to avoid moving our own floor\n    toInsert = toInsert.sort(compare.numericallyBy('index'));\n    const toInsertLength = toInsert.length;\n    for (index = 0; index < toInsertLength; index++) {\n        const insertion = toInsert[index];\n        array.splice(insertion.index, 0, insertion.value);\n    }\n    // apply modifications\n    const toModifyLength = toModify.length;\n    let child;\n    if (toModifyLength > 0) {\n        for (index = 0; index < toModifyLength; index++) {\n            const modification = toModify[index];\n            child = new _contexts_patch_js__WEBPACK_IMPORTED_MODULE_2__[\"default\"](array[modification.index], modification.delta);\n            context.push(child, modification.index);\n        }\n    }\n    if (!context.children) {\n        context.setResult(array).exit();\n        return;\n    }\n    context.exit();\n};\npatchFilter.filterName = 'arrays';\nconst collectChildrenPatchFilter = function collectChildrenPatchFilter(context) {\n    if (!context || !context.children) {\n        return;\n    }\n    const deltaWithChildren = context.delta;\n    if (deltaWithChildren._t !== 'a') {\n        return;\n    }\n    const array = context.left;\n    const length = context.children.length;\n    let child;\n    for (let index = 0; index < length; index++) {\n        child = context.children[index];\n        const arrayIndex = child.childName;\n        array[arrayIndex] = child.result;\n    }\n    context.setResult(array).exit();\n};\ncollectChildrenPatchFilter.filterName = 'arraysCollectChildren';\nconst reverseFilter = function arraysReverseFilter(context) {\n    if (!context.nested) {\n        const nonNestedDelta = context.delta;\n        if (nonNestedDelta[2] === ARRAY_MOVE) {\n            const arrayMoveDelta = nonNestedDelta;\n            context.newName = `_${arrayMoveDelta[1]}`;\n            context\n                .setResult([\n                arrayMoveDelta[0],\n                parseInt(context.childName.substring(1), 10),\n                ARRAY_MOVE,\n            ])\n                .exit();\n        }\n        return;\n    }\n    const nestedDelta = context.delta;\n    if (nestedDelta._t !== 'a') {\n        return;\n    }\n    const arrayDelta = nestedDelta;\n    let name;\n    let child;\n    for (name in arrayDelta) {\n        if (name === '_t') {\n            continue;\n        }\n        child = new _contexts_reverse_js__WEBPACK_IMPORTED_MODULE_3__[\"default\"](arrayDelta[name]);\n        context.push(child, name);\n    }\n    context.exit();\n};\nreverseFilter.filterName = 'arrays';\nconst reverseArrayDeltaIndex = (delta, index, itemDelta) => {\n    if (typeof index === 'string' && index[0] === '_') {\n        return parseInt(index.substring(1), 10);\n    }\n    else if (Array.isArray(itemDelta) && itemDelta[2] === 0) {\n        return `_${index}`;\n    }\n    let reverseIndex = +index;\n    for (const deltaIndex in delta) {\n        const deltaItem = delta[deltaIndex];\n        if (Array.isArray(deltaItem)) {\n            if (deltaItem[2] === ARRAY_MOVE) {\n                const moveFromIndex = parseInt(deltaIndex.substring(1), 10);\n                const moveToIndex = deltaItem[1];\n                if (moveToIndex === +index) {\n                    return moveFromIndex;\n                }\n                if (moveFromIndex <= reverseIndex && moveToIndex > reverseIndex) {\n                    reverseIndex++;\n                }\n                else if (moveFromIndex >= reverseIndex &&\n                    moveToIndex < reverseIndex) {\n                    reverseIndex--;\n                }\n            }\n            else if (deltaItem[2] === 0) {\n                const deleteIndex = parseInt(deltaIndex.substring(1), 10);\n                if (deleteIndex <= reverseIndex) {\n                    reverseIndex++;\n                }\n            }\n            else if (deltaItem.length === 1 &&\n                parseInt(deltaIndex, 10) <= reverseIndex) {\n                reverseIndex--;\n            }\n        }\n    }\n    return reverseIndex;\n};\nconst collectChildrenReverseFilter = (context) => {\n    if (!context || !context.children) {\n        return;\n    }\n    const deltaWithChildren = context.delta;\n    if (deltaWithChildren._t !== 'a') {\n        return;\n    }\n    const arrayDelta = deltaWithChildren;\n    const length = context.children.length;\n    let child;\n    const delta = {\n        _t: 'a',\n    };\n    for (let index = 0; index < length; index++) {\n        child = context.children[index];\n        let name = child.newName;\n        if (typeof name === 'undefined') {\n            name = reverseArrayDeltaIndex(arrayDelta, child.childName, child.result);\n        }\n        if (delta[name] !== child.result) {\n            // There's no way to type this well.\n            delta[name] = child.result;\n        }\n    }\n    context.setResult(delta).exit();\n};\ncollectChildrenReverseFilter.filterName = 'arraysCollectChildren';\n\n\n//# sourceURL=webpack:///../../node_modules/jsondiffpatch/lib/filters/arrays.js?");
            }
          ),
          /***/
          "../../node_modules/jsondiffpatch/lib/filters/dates.js": (
            /*!*************************************************************!*\
              !*** ../../node_modules/jsondiffpatch/lib/filters/dates.js ***!
              \*************************************************************/
            /***/
            (__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {
              eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   diffFilter: () => (/* binding */ diffFilter)\n/* harmony export */ });\nconst diffFilter = function datesDiffFilter(context) {\n    if (context.left instanceof Date) {\n        if (context.right instanceof Date) {\n            if (context.left.getTime() !== context.right.getTime()) {\n                context.setResult([context.left, context.right]);\n            }\n            else {\n                context.setResult(undefined);\n            }\n        }\n        else {\n            context.setResult([context.left, context.right]);\n        }\n        context.exit();\n    }\n    else if (context.right instanceof Date) {\n        context.setResult([context.left, context.right]).exit();\n    }\n};\ndiffFilter.filterName = 'dates';\n\n\n//# sourceURL=webpack:///../../node_modules/jsondiffpatch/lib/filters/dates.js?");
            }
          ),
          /***/
          "../../node_modules/jsondiffpatch/lib/filters/lcs.js": (
            /*!***********************************************************!*\
              !*** ../../node_modules/jsondiffpatch/lib/filters/lcs.js ***!
              \***********************************************************/
            /***/
            (__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {
              eval('__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)\n/* harmony export */ });\n/*\n\nLCS implementation that supports arrays or strings\n\nreference: http://en.wikipedia.org/wiki/Longest_common_subsequence_problem\n\n*/\nconst defaultMatch = function (array1, array2, index1, index2) {\n    return array1[index1] === array2[index2];\n};\nconst lengthMatrix = function (array1, array2, match, context) {\n    const len1 = array1.length;\n    const len2 = array2.length;\n    let x, y;\n    // initialize empty matrix of len1+1 x len2+1\n    const matrix = new Array(len1 + 1);\n    for (x = 0; x < len1 + 1; x++) {\n        matrix[x] = new Array(len2 + 1);\n        for (y = 0; y < len2 + 1; y++) {\n            matrix[x][y] = 0;\n        }\n    }\n    matrix.match = match;\n    // save sequence lengths for each coordinate\n    for (x = 1; x < len1 + 1; x++) {\n        for (y = 1; y < len2 + 1; y++) {\n            if (match(array1, array2, x - 1, y - 1, context)) {\n                matrix[x][y] = matrix[x - 1][y - 1] + 1;\n            }\n            else {\n                matrix[x][y] = Math.max(matrix[x - 1][y], matrix[x][y - 1]);\n            }\n        }\n    }\n    return matrix;\n};\nconst backtrack = function (matrix, array1, array2, context) {\n    let index1 = array1.length;\n    let index2 = array2.length;\n    const subsequence = {\n        sequence: [],\n        indices1: [],\n        indices2: [],\n    };\n    while (index1 !== 0 && index2 !== 0) {\n        const sameLetter = matrix.match(array1, array2, index1 - 1, index2 - 1, context);\n        if (sameLetter) {\n            subsequence.sequence.unshift(array1[index1 - 1]);\n            subsequence.indices1.unshift(index1 - 1);\n            subsequence.indices2.unshift(index2 - 1);\n            --index1;\n            --index2;\n        }\n        else {\n            const valueAtMatrixAbove = matrix[index1][index2 - 1];\n            const valueAtMatrixLeft = matrix[index1 - 1][index2];\n            if (valueAtMatrixAbove > valueAtMatrixLeft) {\n                --index2;\n            }\n            else {\n                --index1;\n            }\n        }\n    }\n    return subsequence;\n};\nconst get = function (array1, array2, match, context) {\n    const innerContext = context || {};\n    const matrix = lengthMatrix(array1, array2, match || defaultMatch, innerContext);\n    return backtrack(matrix, array1, array2, innerContext);\n};\n/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = ({\n    get,\n});\n\n\n//# sourceURL=webpack:///../../node_modules/jsondiffpatch/lib/filters/lcs.js?');
            }
          ),
          /***/
          "../../node_modules/jsondiffpatch/lib/filters/nested.js": (
            /*!**************************************************************!*\
              !*** ../../node_modules/jsondiffpatch/lib/filters/nested.js ***!
              \**************************************************************/
            /***/
            (__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {
              eval(`__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   collectChildrenDiffFilter: () => (/* binding */ collectChildrenDiffFilter),
/* harmony export */   collectChildrenPatchFilter: () => (/* binding */ collectChildrenPatchFilter),
/* harmony export */   collectChildrenReverseFilter: () => (/* binding */ collectChildrenReverseFilter),
/* harmony export */   objectsDiffFilter: () => (/* binding */ objectsDiffFilter),
/* harmony export */   patchFilter: () => (/* binding */ patchFilter),
/* harmony export */   reverseFilter: () => (/* binding */ reverseFilter)
/* harmony export */ });
/* harmony import */ var _contexts_diff_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../contexts/diff.js */ "../../node_modules/jsondiffpatch/lib/contexts/diff.js");
/* harmony import */ var _contexts_patch_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../contexts/patch.js */ "../../node_modules/jsondiffpatch/lib/contexts/patch.js");
/* harmony import */ var _contexts_reverse_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../contexts/reverse.js */ "../../node_modules/jsondiffpatch/lib/contexts/reverse.js");



const collectChildrenDiffFilter = (context) => {
    if (!context || !context.children) {
        return;
    }
    const length = context.children.length;
    let child;
    let result = context.result;
    for (let index = 0; index < length; index++) {
        child = context.children[index];
        if (typeof child.result === 'undefined') {
            continue;
        }
        result = result || {};
        result[child.childName] = child.result;
    }
    if (result && context.leftIsArray) {
        result._t = 'a';
    }
    context.setResult(result).exit();
};
collectChildrenDiffFilter.filterName = 'collectChildren';
const objectsDiffFilter = (context) => {
    if (context.leftIsArray || context.leftType !== 'object') {
        return;
    }
    const left = context.left;
    const right = context.right;
    let name;
    let child;
    const propertyFilter = context.options.propertyFilter;
    for (name in left) {
        if (!Object.prototype.hasOwnProperty.call(left, name)) {
            continue;
        }
        if (propertyFilter && !propertyFilter(name, context)) {
            continue;
        }
        child = new _contexts_diff_js__WEBPACK_IMPORTED_MODULE_0__["default"](left[name], right[name]);
        context.push(child, name);
    }
    for (name in right) {
        if (!Object.prototype.hasOwnProperty.call(right, name)) {
            continue;
        }
        if (propertyFilter && !propertyFilter(name, context)) {
            continue;
        }
        if (typeof left[name] === 'undefined') {
            child = new _contexts_diff_js__WEBPACK_IMPORTED_MODULE_0__["default"](undefined, right[name]);
            context.push(child, name);
        }
    }
    if (!context.children || context.children.length === 0) {
        context.setResult(undefined).exit();
        return;
    }
    context.exit();
};
objectsDiffFilter.filterName = 'objects';
const patchFilter = function nestedPatchFilter(context) {
    if (!context.nested) {
        return;
    }
    const nestedDelta = context.delta;
    if (nestedDelta._t) {
        return;
    }
    const objectDelta = nestedDelta;
    let name;
    let child;
    for (name in objectDelta) {
        child = new _contexts_patch_js__WEBPACK_IMPORTED_MODULE_1__["default"](context.left[name], objectDelta[name]);
        context.push(child, name);
    }
    context.exit();
};
patchFilter.filterName = 'objects';
const collectChildrenPatchFilter = function collectChildrenPatchFilter(context) {
    if (!context || !context.children) {
        return;
    }
    const deltaWithChildren = context.delta;
    if (deltaWithChildren._t) {
        return;
    }
    const object = context.left;
    const length = context.children.length;
    let child;
    for (let index = 0; index < length; index++) {
        child = context.children[index];
        const property = child.childName;
        if (Object.prototype.hasOwnProperty.call(context.left, property) &&
            child.result === undefined) {
            delete object[property];
        }
        else if (object[property] !== child.result) {
            object[property] = child.result;
        }
    }
    context.setResult(object).exit();
};
collectChildrenPatchFilter.filterName = 'collectChildren';
const reverseFilter = function nestedReverseFilter(context) {
    if (!context.nested) {
        return;
    }
    const nestedDelta = context.delta;
    if (nestedDelta._t) {
        return;
    }
    const objectDelta = context.delta;
    let name;
    let child;
    for (name in objectDelta) {
        child = new _contexts_reverse_js__WEBPACK_IMPORTED_MODULE_2__["default"](objectDelta[name]);
        context.push(child, name);
    }
    context.exit();
};
reverseFilter.filterName = 'objects';
const collectChildrenReverseFilter = (context) => {
    if (!context || !context.children) {
        return;
    }
    const deltaWithChildren = context.delta;
    if (deltaWithChildren._t) {
        return;
    }
    const length = context.children.length;
    let child;
    const delta = {};
    for (let index = 0; index < length; index++) {
        child = context.children[index];
        const property = child.childName;
        if (delta[property] !== child.result) {
            delta[property] = child.result;
        }
    }
    context.setResult(delta).exit();
};
collectChildrenReverseFilter.filterName = 'collectChildren';


//# sourceURL=webpack:///../../node_modules/jsondiffpatch/lib/filters/nested.js?`);
            }
          ),
          /***/
          "../../node_modules/jsondiffpatch/lib/filters/texts.js": (
            /*!*************************************************************!*\
              !*** ../../node_modules/jsondiffpatch/lib/filters/texts.js ***!
              \*************************************************************/
            /***/
            (__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {
              eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   diffFilter: () => (/* binding */ diffFilter),\n/* harmony export */   patchFilter: () => (/* binding */ patchFilter),\n/* harmony export */   reverseFilter: () => (/* binding */ reverseFilter)\n/* harmony export */ });\nconst TEXT_DIFF = 2;\nconst DEFAULT_MIN_LENGTH = 60;\nlet cachedDiffPatch = null;\nfunction getDiffMatchPatch(options, required) {\n    var _a;\n    if (!cachedDiffPatch) {\n        let instance;\n        if ((_a = options === null || options === void 0 ? void 0 : options.textDiff) === null || _a === void 0 ? void 0 : _a.diffMatchPatch) {\n            instance = new options.textDiff.diffMatchPatch();\n        }\n        else {\n            if (!required) {\n                return null;\n            }\n            const error = new Error('The diff-match-patch library was not provided. Pass the library in through the options or use the `jsondiffpatch/with-text-diffs` entry-point.');\n            // eslint-disable-next-line camelcase\n            error.diff_match_patch_not_found = true;\n            throw error;\n        }\n        cachedDiffPatch = {\n            diff: function (txt1, txt2) {\n                return instance.patch_toText(instance.patch_make(txt1, txt2));\n            },\n            patch: function (txt1, patch) {\n                const results = instance.patch_apply(instance.patch_fromText(patch), txt1);\n                for (let i = 0; i < results[1].length; i++) {\n                    if (!results[1][i]) {\n                        const error = new Error('text patch failed');\n                        error.textPatchFailed = true;\n                    }\n                }\n                return results[0];\n            },\n        };\n    }\n    return cachedDiffPatch;\n}\nconst diffFilter = function textsDiffFilter(context) {\n    if (context.leftType !== 'string') {\n        return;\n    }\n    const left = context.left;\n    const right = context.right;\n    const minLength = (context.options &&\n        context.options.textDiff &&\n        context.options.textDiff.minLength) ||\n        DEFAULT_MIN_LENGTH;\n    if (left.length < minLength || right.length < minLength) {\n        context.setResult([left, right]).exit();\n        return;\n    }\n    // large text, try to use a text-diff algorithm\n    const diffMatchPatch = getDiffMatchPatch(context.options);\n    if (!diffMatchPatch) {\n        // diff-match-patch library not available,\n        // fallback to regular string replace\n        context.setResult([left, right]).exit();\n        return;\n    }\n    const diff = diffMatchPatch.diff;\n    context.setResult([diff(left, right), 0, TEXT_DIFF]).exit();\n};\ndiffFilter.filterName = 'texts';\nconst patchFilter = function textsPatchFilter(context) {\n    if (context.nested) {\n        return;\n    }\n    const nonNestedDelta = context.delta;\n    if (nonNestedDelta[2] !== TEXT_DIFF) {\n        return;\n    }\n    const textDiffDelta = nonNestedDelta;\n    // text-diff, use a text-patch algorithm\n    const patch = getDiffMatchPatch(context.options, true).patch;\n    context.setResult(patch(context.left, textDiffDelta[0])).exit();\n};\npatchFilter.filterName = 'texts';\nconst textDeltaReverse = function (delta) {\n    let i;\n    let l;\n    let line;\n    let lineTmp;\n    let header = null;\n    const headerRegex = /^@@ +-(\\d+),(\\d+) +\\+(\\d+),(\\d+) +@@$/;\n    let lineHeader;\n    const lines = delta.split('\\n');\n    for (i = 0, l = lines.length; i < l; i++) {\n        line = lines[i];\n        const lineStart = line.slice(0, 1);\n        if (lineStart === '@') {\n            header = headerRegex.exec(line);\n            lineHeader = i;\n            // fix header\n            lines[lineHeader] =\n                '@@ -' +\n                    header[3] +\n                    ',' +\n                    header[4] +\n                    ' +' +\n                    header[1] +\n                    ',' +\n                    header[2] +\n                    ' @@';\n        }\n        else if (lineStart === '+') {\n            lines[i] = '-' + lines[i].slice(1);\n            if (lines[i - 1].slice(0, 1) === '+') {\n                // swap lines to keep default order (-+)\n                lineTmp = lines[i];\n                lines[i] = lines[i - 1];\n                lines[i - 1] = lineTmp;\n            }\n        }\n        else if (lineStart === '-') {\n            lines[i] = '+' + lines[i].slice(1);\n        }\n    }\n    return lines.join('\\n');\n};\nconst reverseFilter = function textsReverseFilter(context) {\n    if (context.nested) {\n        return;\n    }\n    const nonNestedDelta = context.delta;\n    if (nonNestedDelta[2] !== TEXT_DIFF) {\n        return;\n    }\n    const textDiffDelta = nonNestedDelta;\n    // text-diff, use a text-diff algorithm\n    context\n        .setResult([textDeltaReverse(textDiffDelta[0]), 0, TEXT_DIFF])\n        .exit();\n};\nreverseFilter.filterName = 'texts';\n\n\n//# sourceURL=webpack:///../../node_modules/jsondiffpatch/lib/filters/texts.js?");
            }
          ),
          /***/
          "../../node_modules/jsondiffpatch/lib/filters/trivial.js": (
            /*!***************************************************************!*\
              !*** ../../node_modules/jsondiffpatch/lib/filters/trivial.js ***!
              \***************************************************************/
            /***/
            (__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {
              eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   diffFilter: () => (/* binding */ diffFilter),\n/* harmony export */   patchFilter: () => (/* binding */ patchFilter),\n/* harmony export */   reverseFilter: () => (/* binding */ reverseFilter)\n/* harmony export */ });\nconst diffFilter = function trivialMatchesDiffFilter(context) {\n    if (context.left === context.right) {\n        context.setResult(undefined).exit();\n        return;\n    }\n    if (typeof context.left === 'undefined') {\n        if (typeof context.right === 'function') {\n            throw new Error('functions are not supported');\n        }\n        context.setResult([context.right]).exit();\n        return;\n    }\n    if (typeof context.right === 'undefined') {\n        context.setResult([context.left, 0, 0]).exit();\n        return;\n    }\n    if (typeof context.left === 'function' ||\n        typeof context.right === 'function') {\n        throw new Error('functions are not supported');\n    }\n    context.leftType = context.left === null ? 'null' : typeof context.left;\n    context.rightType = context.right === null ? 'null' : typeof context.right;\n    if (context.leftType !== context.rightType) {\n        context.setResult([context.left, context.right]).exit();\n        return;\n    }\n    if (context.leftType === 'boolean' || context.leftType === 'number') {\n        context.setResult([context.left, context.right]).exit();\n        return;\n    }\n    if (context.leftType === 'object') {\n        context.leftIsArray = Array.isArray(context.left);\n    }\n    if (context.rightType === 'object') {\n        context.rightIsArray = Array.isArray(context.right);\n    }\n    if (context.leftIsArray !== context.rightIsArray) {\n        context.setResult([context.left, context.right]).exit();\n        return;\n    }\n    if (context.left instanceof RegExp) {\n        if (context.right instanceof RegExp) {\n            context\n                .setResult([context.left.toString(), context.right.toString()])\n                .exit();\n        }\n        else {\n            context.setResult([context.left, context.right]).exit();\n        }\n    }\n};\ndiffFilter.filterName = 'trivial';\nconst patchFilter = function trivialMatchesPatchFilter(context) {\n    if (typeof context.delta === 'undefined') {\n        context.setResult(context.left).exit();\n        return;\n    }\n    context.nested = !Array.isArray(context.delta);\n    if (context.nested) {\n        return;\n    }\n    const nonNestedDelta = context.delta;\n    if (nonNestedDelta.length === 1) {\n        context.setResult(nonNestedDelta[0]).exit();\n        return;\n    }\n    if (nonNestedDelta.length === 2) {\n        if (context.left instanceof RegExp) {\n            const regexArgs = /^\\/(.*)\\/([gimyu]+)$/.exec(nonNestedDelta[1]);\n            if (regexArgs) {\n                context.setResult(new RegExp(regexArgs[1], regexArgs[2])).exit();\n                return;\n            }\n        }\n        context.setResult(nonNestedDelta[1]).exit();\n        return;\n    }\n    if (nonNestedDelta.length === 3 && nonNestedDelta[2] === 0) {\n        context.setResult(undefined).exit();\n    }\n};\npatchFilter.filterName = 'trivial';\nconst reverseFilter = function trivialReferseFilter(context) {\n    if (typeof context.delta === 'undefined') {\n        context.setResult(context.delta).exit();\n        return;\n    }\n    context.nested = !Array.isArray(context.delta);\n    if (context.nested) {\n        return;\n    }\n    const nonNestedDelta = context.delta;\n    if (nonNestedDelta.length === 1) {\n        context.setResult([nonNestedDelta[0], 0, 0]).exit();\n        return;\n    }\n    if (nonNestedDelta.length === 2) {\n        context.setResult([nonNestedDelta[1], nonNestedDelta[0]]).exit();\n        return;\n    }\n    if (nonNestedDelta.length === 3 && nonNestedDelta[2] === 0) {\n        context.setResult([nonNestedDelta[0]]).exit();\n    }\n};\nreverseFilter.filterName = 'trivial';\n\n\n//# sourceURL=webpack:///../../node_modules/jsondiffpatch/lib/filters/trivial.js?");
            }
          ),
          /***/
          "../../node_modules/jsondiffpatch/lib/index.js": (
            /*!*****************************************************!*\
              !*** ../../node_modules/jsondiffpatch/lib/index.js ***!
              \*****************************************************/
            /***/
            (__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {
              eval('__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   DiffPatcher: () => (/* reexport safe */ _diffpatcher_js__WEBPACK_IMPORTED_MODULE_0__["default"]),\n/* harmony export */   clone: () => (/* binding */ clone),\n/* harmony export */   create: () => (/* binding */ create),\n/* harmony export */   dateReviver: () => (/* reexport safe */ _date_reviver_js__WEBPACK_IMPORTED_MODULE_1__["default"]),\n/* harmony export */   diff: () => (/* binding */ diff),\n/* harmony export */   patch: () => (/* binding */ patch),\n/* harmony export */   reverse: () => (/* binding */ reverse),\n/* harmony export */   unpatch: () => (/* binding */ unpatch)\n/* harmony export */ });\n/* harmony import */ var _diffpatcher_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./diffpatcher.js */ "../../node_modules/jsondiffpatch/lib/diffpatcher.js");\n/* harmony import */ var _date_reviver_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./date-reviver.js */ "../../node_modules/jsondiffpatch/lib/date-reviver.js");\n\n\n\nfunction create(options) {\n    return new _diffpatcher_js__WEBPACK_IMPORTED_MODULE_0__["default"](options);\n}\nlet defaultInstance;\nfunction diff(left, right) {\n    if (!defaultInstance) {\n        defaultInstance = new _diffpatcher_js__WEBPACK_IMPORTED_MODULE_0__["default"]();\n    }\n    return defaultInstance.diff(left, right);\n}\nfunction patch(left, delta) {\n    if (!defaultInstance) {\n        defaultInstance = new _diffpatcher_js__WEBPACK_IMPORTED_MODULE_0__["default"]();\n    }\n    return defaultInstance.patch(left, delta);\n}\nfunction unpatch(right, delta) {\n    if (!defaultInstance) {\n        defaultInstance = new _diffpatcher_js__WEBPACK_IMPORTED_MODULE_0__["default"]();\n    }\n    return defaultInstance.unpatch(right, delta);\n}\nfunction reverse(delta) {\n    if (!defaultInstance) {\n        defaultInstance = new _diffpatcher_js__WEBPACK_IMPORTED_MODULE_0__["default"]();\n    }\n    return defaultInstance.reverse(delta);\n}\nfunction clone(value) {\n    if (!defaultInstance) {\n        defaultInstance = new _diffpatcher_js__WEBPACK_IMPORTED_MODULE_0__["default"]();\n    }\n    return defaultInstance.clone(value);\n}\n\n\n//# sourceURL=webpack:///../../node_modules/jsondiffpatch/lib/index.js?');
            }
          ),
          /***/
          "../../node_modules/jsondiffpatch/lib/pipe.js": (
            /*!****************************************************!*\
              !*** ../../node_modules/jsondiffpatch/lib/pipe.js ***!
              \****************************************************/
            /***/
            (__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {
              eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   \"default\": () => (__WEBPACK_DEFAULT_EXPORT__)\n/* harmony export */ });\n// eslint-disable-next-line @typescript-eslint/no-explicit-any\nclass Pipe {\n    constructor(name) {\n        this.name = name;\n        this.filters = [];\n    }\n    process(input) {\n        if (!this.processor) {\n            throw new Error('add this pipe to a processor before using it');\n        }\n        const debug = this.debug;\n        const length = this.filters.length;\n        const context = input;\n        for (let index = 0; index < length; index++) {\n            const filter = this.filters[index];\n            if (debug) {\n                this.log(`filter: ${filter.filterName}`);\n            }\n            filter(context);\n            if (typeof context === 'object' && context.exiting) {\n                context.exiting = false;\n                break;\n            }\n        }\n        if (!context.next && this.resultCheck) {\n            this.resultCheck(context);\n        }\n    }\n    log(msg) {\n        console.log(`[jsondiffpatch] ${this.name} pipe, ${msg}`);\n    }\n    append(...args) {\n        this.filters.push(...args);\n        return this;\n    }\n    prepend(...args) {\n        this.filters.unshift(...args);\n        return this;\n    }\n    indexOf(filterName) {\n        if (!filterName) {\n            throw new Error('a filter name is required');\n        }\n        for (let index = 0; index < this.filters.length; index++) {\n            const filter = this.filters[index];\n            if (filter.filterName === filterName) {\n                return index;\n            }\n        }\n        throw new Error(`filter not found: ${filterName}`);\n    }\n    list() {\n        return this.filters.map((f) => f.filterName);\n    }\n    after(filterName, ...params) {\n        const index = this.indexOf(filterName);\n        this.filters.splice(index + 1, 0, ...params);\n        return this;\n    }\n    before(filterName, ...params) {\n        const index = this.indexOf(filterName);\n        this.filters.splice(index, 0, ...params);\n        return this;\n    }\n    replace(filterName, ...params) {\n        const index = this.indexOf(filterName);\n        this.filters.splice(index, 1, ...params);\n        return this;\n    }\n    remove(filterName) {\n        const index = this.indexOf(filterName);\n        this.filters.splice(index, 1);\n        return this;\n    }\n    clear() {\n        this.filters.length = 0;\n        return this;\n    }\n    shouldHaveResult(should) {\n        if (should === false) {\n            this.resultCheck = null;\n            return;\n        }\n        if (this.resultCheck) {\n            return;\n        }\n        this.resultCheck = (context) => {\n            if (!context.hasResult) {\n                console.log(context);\n                const error = new Error(`${this.name} failed`);\n                error.noResult = true;\n                throw error;\n            }\n        };\n        return this;\n    }\n}\n/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (Pipe);\n\n\n//# sourceURL=webpack:///../../node_modules/jsondiffpatch/lib/pipe.js?");
            }
          ),
          /***/
          "../../node_modules/jsondiffpatch/lib/processor.js": (
            /*!*********************************************************!*\
              !*** ../../node_modules/jsondiffpatch/lib/processor.js ***!
              \*********************************************************/
            /***/
            (__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {
              eval(`__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
class Processor {
    constructor(options) {
        this.selfOptions = options || {};
        this.pipes = {};
    }
    options(options) {
        if (options) {
            this.selfOptions = options;
        }
        return this.selfOptions;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    pipe(name, pipeArg) {
        let pipe = pipeArg;
        if (typeof name === 'string') {
            if (typeof pipe === 'undefined') {
                return this.pipes[name];
            }
            else {
                this.pipes[name] = pipe;
            }
        }
        if (name && name.name) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            pipe = name;
            if (pipe.processor === this) {
                return pipe;
            }
            this.pipes[pipe.name] = pipe;
        }
        pipe.processor = this;
        return pipe;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    process(input, pipe) {
        let context = input;
        context.options = this.options();
        let nextPipe = pipe || input.pipe || 'default';
        let lastPipe;
        while (nextPipe) {
            if (typeof context.nextAfterChildren !== 'undefined') {
                // children processed and coming back to parent
                context.next = context.nextAfterChildren;
                context.nextAfterChildren = null;
            }
            if (typeof nextPipe === 'string') {
                nextPipe = this.pipe(nextPipe);
            }
            nextPipe.process(context);
            lastPipe = nextPipe;
            nextPipe = null;
            if (context) {
                if (context.next) {
                    context = context.next;
                    nextPipe = context.pipe || lastPipe;
                }
            }
        }
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        return context.hasResult ? context.result : undefined;
    }
}
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (Processor);


//# sourceURL=webpack:///../../node_modules/jsondiffpatch/lib/processor.js?`);
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
    }
  });
  require_jsondiffpatch();
})();
//# sourceMappingURL=jsondiffpatch.bundle.js.map
