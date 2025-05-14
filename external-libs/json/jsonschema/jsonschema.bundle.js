(() => {
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __commonJS = (cb, mod) => function __require() {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  };

  // json/jsonschema/jsonschema.js
  var require_jsonschema = __commonJS({
    "json/jsonschema/jsonschema.js"(exports, module) {
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
              eval('var jsonschema__WEBPACK_IMPORTED_MODULE_0___namespace_cache;\n__webpack_require__.r(__webpack_exports__);\n/* harmony import */ var jsonschema__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! jsonschema */ "../../../node_modules/jsonschema/lib/index.js");\n \nwindow.jsonschema = /*#__PURE__*/ (jsonschema__WEBPACK_IMPORTED_MODULE_0___namespace_cache || (jsonschema__WEBPACK_IMPORTED_MODULE_0___namespace_cache = __webpack_require__.t(jsonschema__WEBPACK_IMPORTED_MODULE_0__, 2)));\n\n\n//# sourceURL=webpack:///./entry.js?');
            }
          ),
          /***/
          "../../../node_modules/jsonschema/lib/attribute.js": (
            /*!*********************************************************!*\
              !*** ../../../node_modules/jsonschema/lib/attribute.js ***!
              \*********************************************************/
            /***/
            (module, __unused_webpack_exports, __webpack_require__) => {
              eval(`

var helpers = __webpack_require__(/*! ./helpers */ "../../../node_modules/jsonschema/lib/helpers.js");

/** @type ValidatorResult */
var ValidatorResult = helpers.ValidatorResult;
/** @type SchemaError */
var SchemaError = helpers.SchemaError;

var attribute = {};

attribute.ignoreProperties = {
  // informative properties
  'id': true,
  'default': true,
  'description': true,
  'title': true,
  // arguments to other properties
  'additionalItems': true,
  'then': true,
  'else': true,
  // special-handled properties
  '$schema': true,
  '$ref': true,
  'extends': true,
};

/**
 * @name validators
 */
var validators = attribute.validators = {};

/**
 * Validates whether the instance if of a certain type
 * @param instance
 * @param schema
 * @param options
 * @param ctx
 * @return {ValidatorResult|null}
 */
validators.type = function validateType (instance, schema, options, ctx) {
  // Ignore undefined instances
  if (instance === undefined) {
    return null;
  }
  var result = new ValidatorResult(instance, schema, options, ctx);
  var types = Array.isArray(schema.type) ? schema.type : [schema.type];
  if (!types.some(this.testType.bind(this, instance, schema, options, ctx))) {
    var list = types.map(function (v) {
      if(!v) return;
      var id = v.$id || v.id;
      return id ? ('<' + id + '>') : (v+'');
    });
    result.addError({
      name: 'type',
      argument: list,
      message: "is not of a type(s) " + list,
    });
  }
  return result;
};

function testSchemaNoThrow(instance, options, ctx, callback, schema){
  var throwError = options.throwError;
  var throwAll = options.throwAll;
  options.throwError = false;
  options.throwAll = false;
  var res = this.validateSchema(instance, schema, options, ctx);
  options.throwError = throwError;
  options.throwAll = throwAll;

  if (!res.valid && callback instanceof Function) {
    callback(res);
  }
  return res.valid;
}

/**
 * Validates whether the instance matches some of the given schemas
 * @param instance
 * @param schema
 * @param options
 * @param ctx
 * @return {ValidatorResult|null}
 */
validators.anyOf = function validateAnyOf (instance, schema, options, ctx) {
  // Ignore undefined instances
  if (instance === undefined) {
    return null;
  }
  var result = new ValidatorResult(instance, schema, options, ctx);
  var inner = new ValidatorResult(instance, schema, options, ctx);
  if (!Array.isArray(schema.anyOf)){
    throw new SchemaError("anyOf must be an array");
  }
  if (!schema.anyOf.some(
    testSchemaNoThrow.bind(
      this, instance, options, ctx, function(res){inner.importErrors(res);}
    ))) {
    var list = schema.anyOf.map(function (v, i) {
      var id = v.$id || v.id;
      if(id) return '<' + id + '>';
      return(v.title && JSON.stringify(v.title)) || (v['$ref'] && ('<' + v['$ref'] + '>')) || '[subschema '+i+']';
    });
    if (options.nestedErrors) {
      result.importErrors(inner);
    }
    result.addError({
      name: 'anyOf',
      argument: list,
      message: "is not any of " + list.join(','),
    });
  }
  return result;
};

/**
 * Validates whether the instance matches every given schema
 * @param instance
 * @param schema
 * @param options
 * @param ctx
 * @return {String|null}
 */
validators.allOf = function validateAllOf (instance, schema, options, ctx) {
  // Ignore undefined instances
  if (instance === undefined) {
    return null;
  }
  if (!Array.isArray(schema.allOf)){
    throw new SchemaError("allOf must be an array");
  }
  var result = new ValidatorResult(instance, schema, options, ctx);
  var self = this;
  schema.allOf.forEach(function(v, i){
    var valid = self.validateSchema(instance, v, options, ctx);
    if(!valid.valid){
      var id = v.$id || v.id;
      var msg = id || (v.title && JSON.stringify(v.title)) || (v['$ref'] && ('<' + v['$ref'] + '>')) || '[subschema '+i+']';
      result.addError({
        name: 'allOf',
        argument: { id: msg, length: valid.errors.length, valid: valid },
        message: 'does not match allOf schema ' + msg + ' with ' + valid.errors.length + ' error[s]:',
      });
      result.importErrors(valid);
    }
  });
  return result;
};

/**
 * Validates whether the instance matches exactly one of the given schemas
 * @param instance
 * @param schema
 * @param options
 * @param ctx
 * @return {String|null}
 */
validators.oneOf = function validateOneOf (instance, schema, options, ctx) {
  // Ignore undefined instances
  if (instance === undefined) {
    return null;
  }
  if (!Array.isArray(schema.oneOf)){
    throw new SchemaError("oneOf must be an array");
  }
  var result = new ValidatorResult(instance, schema, options, ctx);
  var inner = new ValidatorResult(instance, schema, options, ctx);
  var count = schema.oneOf.filter(
    testSchemaNoThrow.bind(
      this, instance, options, ctx, function(res) {inner.importErrors(res);}
    ) ).length;
  var list = schema.oneOf.map(function (v, i) {
    var id = v.$id || v.id;
    return id || (v.title && JSON.stringify(v.title)) || (v['$ref'] && ('<' + v['$ref'] + '>')) || '[subschema '+i+']';
  });
  if (count!==1) {
    if (options.nestedErrors) {
      result.importErrors(inner);
    }
    result.addError({
      name: 'oneOf',
      argument: list,
      message: "is not exactly one from " + list.join(','),
    });
  }
  return result;
};

/**
 * Validates "then" or "else" depending on the result of validating "if"
 * @param instance
 * @param schema
 * @param options
 * @param ctx
 * @return {String|null}
 */
validators.if = function validateIf (instance, schema, options, ctx) {
  // Ignore undefined instances
  if (instance === undefined) return null;
  if (!helpers.isSchema(schema.if)) throw new Error('Expected "if" keyword to be a schema');
  var ifValid = testSchemaNoThrow.call(this, instance, options, ctx, null, schema.if);
  var result = new ValidatorResult(instance, schema, options, ctx);
  var res;
  if(ifValid){
    if (schema.then === undefined) return;
    if (!helpers.isSchema(schema.then)) throw new Error('Expected "then" keyword to be a schema');
    res = this.validateSchema(instance, schema.then, options, ctx.makeChild(schema.then));
    result.importErrors(res);
  }else{
    if (schema.else === undefined) return;
    if (!helpers.isSchema(schema.else)) throw new Error('Expected "else" keyword to be a schema');
    res = this.validateSchema(instance, schema.else, options, ctx.makeChild(schema.else));
    result.importErrors(res);
  }
  return result;
};

function getEnumerableProperty(object, key){
  // Determine if \`key\` shows up in \`for(var key in object)\`
  // First test Object.hasOwnProperty.call as an optimization: that guarantees it does
  if(Object.hasOwnProperty.call(object, key)) return object[key];
  // Test \`key in object\` as an optimization; false means it won't
  if(!(key in object)) return;
  while( (object = Object.getPrototypeOf(object)) ){
    if(Object.propertyIsEnumerable.call(object, key)) return object[key];
  }
}

/**
 * Validates propertyNames
 * @param instance
 * @param schema
 * @param options
 * @param ctx
 * @return {String|null|ValidatorResult}
 */
validators.propertyNames = function validatePropertyNames (instance, schema, options, ctx) {
  if(!this.types.object(instance)) return;
  var result = new ValidatorResult(instance, schema, options, ctx);
  var subschema = schema.propertyNames!==undefined ? schema.propertyNames : {};
  if(!helpers.isSchema(subschema)) throw new SchemaError('Expected "propertyNames" to be a schema (object or boolean)');

  for (var property in instance) {
    if(getEnumerableProperty(instance, property) !== undefined){
      var res = this.validateSchema(property, subschema, options, ctx.makeChild(subschema));
      result.importErrors(res);
    }
  }

  return result;
};

/**
 * Validates properties
 * @param instance
 * @param schema
 * @param options
 * @param ctx
 * @return {String|null|ValidatorResult}
 */
validators.properties = function validateProperties (instance, schema, options, ctx) {
  if(!this.types.object(instance)) return;
  var result = new ValidatorResult(instance, schema, options, ctx);
  var properties = schema.properties || {};
  for (var property in properties) {
    var subschema = properties[property];
    if(subschema===undefined){
      continue;
    }else if(subschema===null){
      throw new SchemaError('Unexpected null, expected schema in "properties"');
    }
    if (typeof options.preValidateProperty == 'function') {
      options.preValidateProperty(instance, property, subschema, options, ctx);
    }
    var prop = getEnumerableProperty(instance, property);
    var res = this.validateSchema(prop, subschema, options, ctx.makeChild(subschema, property));
    if(res.instance !== result.instance[property]) result.instance[property] = res.instance;
    result.importErrors(res);
  }
  return result;
};

/**
 * Test a specific property within in instance against the additionalProperties schema attribute
 * This ignores properties with definitions in the properties schema attribute, but no other attributes.
 * If too many more types of property-existence tests pop up they may need their own class of tests (like \`type\` has)
 * @private
 * @return {boolean}
 */
function testAdditionalProperty (instance, schema, options, ctx, property, result) {
  if(!this.types.object(instance)) return;
  if (schema.properties && schema.properties[property] !== undefined) {
    return;
  }
  if (schema.additionalProperties === false) {
    result.addError({
      name: 'additionalProperties',
      argument: property,
      message: "is not allowed to have the additional property " + JSON.stringify(property),
    });
  } else {
    var additionalProperties = schema.additionalProperties || {};

    if (typeof options.preValidateProperty == 'function') {
      options.preValidateProperty(instance, property, additionalProperties, options, ctx);
    }

    var res = this.validateSchema(instance[property], additionalProperties, options, ctx.makeChild(additionalProperties, property));
    if(res.instance !== result.instance[property]) result.instance[property] = res.instance;
    result.importErrors(res);
  }
}

/**
 * Validates patternProperties
 * @param instance
 * @param schema
 * @param options
 * @param ctx
 * @return {String|null|ValidatorResult}
 */
validators.patternProperties = function validatePatternProperties (instance, schema, options, ctx) {
  if(!this.types.object(instance)) return;
  var result = new ValidatorResult(instance, schema, options, ctx);
  var patternProperties = schema.patternProperties || {};

  for (var property in instance) {
    var test = true;
    for (var pattern in patternProperties) {
      var subschema = patternProperties[pattern];
      if(subschema===undefined){
        continue;
      }else if(subschema===null){
        throw new SchemaError('Unexpected null, expected schema in "patternProperties"');
      }
      try {
        var regexp = new RegExp(pattern, 'u');
      } catch(_e) {
        // In the event the stricter handling causes an error, fall back on the forgiving handling
        // DEPRECATED
        regexp = new RegExp(pattern);
      }
      if (!regexp.test(property)) {
        continue;
      }
      test = false;

      if (typeof options.preValidateProperty == 'function') {
        options.preValidateProperty(instance, property, subschema, options, ctx);
      }

      var res = this.validateSchema(instance[property], subschema, options, ctx.makeChild(subschema, property));
      if(res.instance !== result.instance[property]) result.instance[property] = res.instance;
      result.importErrors(res);
    }
    if (test) {
      testAdditionalProperty.call(this, instance, schema, options, ctx, property, result);
    }
  }

  return result;
};

/**
 * Validates additionalProperties
 * @param instance
 * @param schema
 * @param options
 * @param ctx
 * @return {String|null|ValidatorResult}
 */
validators.additionalProperties = function validateAdditionalProperties (instance, schema, options, ctx) {
  if(!this.types.object(instance)) return;
  // if patternProperties is defined then we'll test when that one is called instead
  if (schema.patternProperties) {
    return null;
  }
  var result = new ValidatorResult(instance, schema, options, ctx);
  for (var property in instance) {
    testAdditionalProperty.call(this, instance, schema, options, ctx, property, result);
  }
  return result;
};

/**
 * Validates whether the instance value is at least of a certain length, when the instance value is a string.
 * @param instance
 * @param schema
 * @return {String|null}
 */
validators.minProperties = function validateMinProperties (instance, schema, options, ctx) {
  if (!this.types.object(instance)) return;
  var result = new ValidatorResult(instance, schema, options, ctx);
  var keys = Object.keys(instance);
  if (!(keys.length >= schema.minProperties)) {
    result.addError({
      name: 'minProperties',
      argument: schema.minProperties,
      message: "does not meet minimum property length of " + schema.minProperties,
    });
  }
  return result;
};

/**
 * Validates whether the instance value is at most of a certain length, when the instance value is a string.
 * @param instance
 * @param schema
 * @return {String|null}
 */
validators.maxProperties = function validateMaxProperties (instance, schema, options, ctx) {
  if (!this.types.object(instance)) return;
  var result = new ValidatorResult(instance, schema, options, ctx);
  var keys = Object.keys(instance);
  if (!(keys.length <= schema.maxProperties)) {
    result.addError({
      name: 'maxProperties',
      argument: schema.maxProperties,
      message: "does not meet maximum property length of " + schema.maxProperties,
    });
  }
  return result;
};

/**
 * Validates items when instance is an array
 * @param instance
 * @param schema
 * @param options
 * @param ctx
 * @return {String|null|ValidatorResult}
 */
validators.items = function validateItems (instance, schema, options, ctx) {
  var self = this;
  if (!this.types.array(instance)) return;
  if (schema.items===undefined) return;
  var result = new ValidatorResult(instance, schema, options, ctx);
  instance.every(function (value, i) {
    if(Array.isArray(schema.items)){
      var items =  schema.items[i]===undefined ? schema.additionalItems : schema.items[i];
    }else{
      var items = schema.items;
    }
    if (items === undefined) {
      return true;
    }
    if (items === false) {
      result.addError({
        name: 'items',
        message: "additionalItems not permitted",
      });
      return false;
    }
    var res = self.validateSchema(value, items, options, ctx.makeChild(items, i));
    if(res.instance !== result.instance[i]) result.instance[i] = res.instance;
    result.importErrors(res);
    return true;
  });
  return result;
};

/**
 * Validates the "contains" keyword
 * @param instance
 * @param schema
 * @param options
 * @param ctx
 * @return {String|null|ValidatorResult}
 */
validators.contains = function validateContains (instance, schema, options, ctx) {
  var self = this;
  if (!this.types.array(instance)) return;
  if (schema.contains===undefined) return;
  if (!helpers.isSchema(schema.contains)) throw new Error('Expected "contains" keyword to be a schema');
  var result = new ValidatorResult(instance, schema, options, ctx);
  var count = instance.some(function (value, i) {
    var res = self.validateSchema(value, schema.contains, options, ctx.makeChild(schema.contains, i));
    return res.errors.length===0;
  });
  if(count===false){
    result.addError({
      name: 'contains',
      argument: schema.contains,
      message: "must contain an item matching given schema",
    });
  }
  return result;
};

/**
 * Validates minimum and exclusiveMinimum when the type of the instance value is a number.
 * @param instance
 * @param schema
 * @return {String|null}
 */
validators.minimum = function validateMinimum (instance, schema, options, ctx) {
  if (!this.types.number(instance)) return;
  var result = new ValidatorResult(instance, schema, options, ctx);
  if (schema.exclusiveMinimum && schema.exclusiveMinimum === true) {
    if(!(instance > schema.minimum)){
      result.addError({
        name: 'minimum',
        argument: schema.minimum,
        message: "must be greater than " + schema.minimum,
      });
    }
  } else {
    if(!(instance >= schema.minimum)){
      result.addError({
        name: 'minimum',
        argument: schema.minimum,
        message: "must be greater than or equal to " + schema.minimum,
      });
    }
  }
  return result;
};

/**
 * Validates maximum and exclusiveMaximum when the type of the instance value is a number.
 * @param instance
 * @param schema
 * @return {String|null}
 */
validators.maximum = function validateMaximum (instance, schema, options, ctx) {
  if (!this.types.number(instance)) return;
  var result = new ValidatorResult(instance, schema, options, ctx);
  if (schema.exclusiveMaximum && schema.exclusiveMaximum === true) {
    if(!(instance < schema.maximum)){
      result.addError({
        name: 'maximum',
        argument: schema.maximum,
        message: "must be less than " + schema.maximum,
      });
    }
  } else {
    if(!(instance <= schema.maximum)){
      result.addError({
        name: 'maximum',
        argument: schema.maximum,
        message: "must be less than or equal to " + schema.maximum,
      });
    }
  }
  return result;
};

/**
 * Validates the number form of exclusiveMinimum when the type of the instance value is a number.
 * @param instance
 * @param schema
 * @return {String|null}
 */
validators.exclusiveMinimum = function validateExclusiveMinimum (instance, schema, options, ctx) {
  // Support the boolean form of exclusiveMinimum, which is handled by the "minimum" keyword.
  if(typeof schema.exclusiveMinimum === 'boolean') return;
  if (!this.types.number(instance)) return;
  var result = new ValidatorResult(instance, schema, options, ctx);
  var valid = instance > schema.exclusiveMinimum;
  if (!valid) {
    result.addError({
      name: 'exclusiveMinimum',
      argument: schema.exclusiveMinimum,
      message: "must be strictly greater than " + schema.exclusiveMinimum,
    });
  }
  return result;
};

/**
 * Validates the number form of exclusiveMaximum when the type of the instance value is a number.
 * @param instance
 * @param schema
 * @return {String|null}
 */
validators.exclusiveMaximum = function validateExclusiveMaximum (instance, schema, options, ctx) {
  // Support the boolean form of exclusiveMaximum, which is handled by the "maximum" keyword.
  if(typeof schema.exclusiveMaximum === 'boolean') return;
  if (!this.types.number(instance)) return;
  var result = new ValidatorResult(instance, schema, options, ctx);
  var valid = instance < schema.exclusiveMaximum;
  if (!valid) {
    result.addError({
      name: 'exclusiveMaximum',
      argument: schema.exclusiveMaximum,
      message: "must be strictly less than " + schema.exclusiveMaximum,
    });
  }
  return result;
};

/**
 * Perform validation for multipleOf and divisibleBy, which are essentially the same.
 * @param instance
 * @param schema
 * @param validationType
 * @param errorMessage
 * @returns {String|null}
 */
var validateMultipleOfOrDivisbleBy = function validateMultipleOfOrDivisbleBy (instance, schema, options, ctx, validationType, errorMessage) {
  if (!this.types.number(instance)) return;

  var validationArgument = schema[validationType];
  if (validationArgument == 0) {
    throw new SchemaError(validationType + " cannot be zero");
  }

  var result = new ValidatorResult(instance, schema, options, ctx);

  var instanceDecimals = helpers.getDecimalPlaces(instance);
  var divisorDecimals = helpers.getDecimalPlaces(validationArgument);

  var maxDecimals = Math.max(instanceDecimals , divisorDecimals);
  var multiplier = Math.pow(10, maxDecimals);

  if (Math.round(instance * multiplier) % Math.round(validationArgument * multiplier) !== 0) {
    result.addError({
      name: validationType,
      argument:  validationArgument,
      message: errorMessage + JSON.stringify(validationArgument),
    });
  }

  return result;
};

/**
 * Validates divisibleBy when the type of the instance value is a number.
 * @param instance
 * @param schema
 * @return {String|null}
 */
validators.multipleOf = function validateMultipleOf (instance, schema, options, ctx) {
  return validateMultipleOfOrDivisbleBy.call(this, instance, schema, options, ctx, "multipleOf", "is not a multiple of (divisible by) ");
};

/**
 * Validates multipleOf when the type of the instance value is a number.
 * @param instance
 * @param schema
 * @return {String|null}
 */
validators.divisibleBy = function validateDivisibleBy (instance, schema, options, ctx) {
  return validateMultipleOfOrDivisbleBy.call(this, instance, schema, options, ctx, "divisibleBy", "is not divisible by (multiple of) ");
};

/**
 * Validates whether the instance value is present.
 * @param instance
 * @param schema
 * @return {String|null}
 */
validators.required = function validateRequired (instance, schema, options, ctx) {
  var result = new ValidatorResult(instance, schema, options, ctx);
  if (instance === undefined && schema.required === true) {
    // A boolean form is implemented for reverse-compatibility with schemas written against older drafts
    result.addError({
      name: 'required',
      message: "is required",
    });
  } else if (this.types.object(instance) && Array.isArray(schema.required)) {
    schema.required.forEach(function(n){
      if(getEnumerableProperty(instance, n)===undefined){
        result.addError({
          name: 'required',
          argument: n,
          message: "requires property " + JSON.stringify(n),
        });
      }
    });
  }
  return result;
};

/**
 * Validates whether the instance value matches the regular expression, when the instance value is a string.
 * @param instance
 * @param schema
 * @return {String|null}
 */
validators.pattern = function validatePattern (instance, schema, options, ctx) {
  if (!this.types.string(instance)) return;
  var result = new ValidatorResult(instance, schema, options, ctx);
  var pattern = schema.pattern;
  try {
    var regexp = new RegExp(pattern, 'u');
  } catch(_e) {
    // In the event the stricter handling causes an error, fall back on the forgiving handling
    // DEPRECATED
    regexp = new RegExp(pattern);
  }
  if (!instance.match(regexp)) {
    result.addError({
      name: 'pattern',
      argument: schema.pattern,
      message: "does not match pattern " + JSON.stringify(schema.pattern.toString()),
    });
  }
  return result;
};

/**
 * Validates whether the instance value is of a certain defined format or a custom
 * format.
 * The following formats are supported for string types:
 *   - date-time
 *   - date
 *   - time
 *   - ip-address
 *   - ipv6
 *   - uri
 *   - color
 *   - host-name
 *   - alpha
 *   - alpha-numeric
 *   - utc-millisec
 * @param instance
 * @param schema
 * @param [options]
 * @param [ctx]
 * @return {String|null}
 */
validators.format = function validateFormat (instance, schema, options, ctx) {
  if (instance===undefined) return;
  var result = new ValidatorResult(instance, schema, options, ctx);
  if (!result.disableFormat && !helpers.isFormat(instance, schema.format, this)) {
    result.addError({
      name: 'format',
      argument: schema.format,
      message: "does not conform to the " + JSON.stringify(schema.format) + " format",
    });
  }
  return result;
};

/**
 * Validates whether the instance value is at least of a certain length, when the instance value is a string.
 * @param instance
 * @param schema
 * @return {String|null}
 */
validators.minLength = function validateMinLength (instance, schema, options, ctx) {
  if (!this.types.string(instance)) return;
  var result = new ValidatorResult(instance, schema, options, ctx);
  var hsp = instance.match(/[\\uDC00-\\uDFFF]/g);
  var length = instance.length - (hsp ? hsp.length : 0);
  if (!(length >= schema.minLength)) {
    result.addError({
      name: 'minLength',
      argument: schema.minLength,
      message: "does not meet minimum length of " + schema.minLength,
    });
  }
  return result;
};

/**
 * Validates whether the instance value is at most of a certain length, when the instance value is a string.
 * @param instance
 * @param schema
 * @return {String|null}
 */
validators.maxLength = function validateMaxLength (instance, schema, options, ctx) {
  if (!this.types.string(instance)) return;
  var result = new ValidatorResult(instance, schema, options, ctx);
  // TODO if this was already computed in "minLength", use that value instead of re-computing
  var hsp = instance.match(/[\\uDC00-\\uDFFF]/g);
  var length = instance.length - (hsp ? hsp.length : 0);
  if (!(length <= schema.maxLength)) {
    result.addError({
      name: 'maxLength',
      argument: schema.maxLength,
      message: "does not meet maximum length of " + schema.maxLength,
    });
  }
  return result;
};

/**
 * Validates whether instance contains at least a minimum number of items, when the instance is an Array.
 * @param instance
 * @param schema
 * @return {String|null}
 */
validators.minItems = function validateMinItems (instance, schema, options, ctx) {
  if (!this.types.array(instance)) return;
  var result = new ValidatorResult(instance, schema, options, ctx);
  if (!(instance.length >= schema.minItems)) {
    result.addError({
      name: 'minItems',
      argument: schema.minItems,
      message: "does not meet minimum length of " + schema.minItems,
    });
  }
  return result;
};

/**
 * Validates whether instance contains no more than a maximum number of items, when the instance is an Array.
 * @param instance
 * @param schema
 * @return {String|null}
 */
validators.maxItems = function validateMaxItems (instance, schema, options, ctx) {
  if (!this.types.array(instance)) return;
  var result = new ValidatorResult(instance, schema, options, ctx);
  if (!(instance.length <= schema.maxItems)) {
    result.addError({
      name: 'maxItems',
      argument: schema.maxItems,
      message: "does not meet maximum length of " + schema.maxItems,
    });
  }
  return result;
};

/**
 * Deep compares arrays for duplicates
 * @param v
 * @param i
 * @param a
 * @private
 * @return {boolean}
 */
function testArrays (v, i, a) {
  var j, len = a.length;
  for (j = i + 1, len; j < len; j++) {
    if (helpers.deepCompareStrict(v, a[j])) {
      return false;
    }
  }
  return true;
}

/**
 * Validates whether there are no duplicates, when the instance is an Array.
 * @param instance
 * @return {String|null}
 */
validators.uniqueItems = function validateUniqueItems (instance, schema, options, ctx) {
  if (schema.uniqueItems!==true) return;
  if (!this.types.array(instance)) return;
  var result = new ValidatorResult(instance, schema, options, ctx);
  if (!instance.every(testArrays)) {
    result.addError({
      name: 'uniqueItems',
      message: "contains duplicate item",
    });
  }
  return result;
};

/**
 * Validate for the presence of dependency properties, if the instance is an object.
 * @param instance
 * @param schema
 * @param options
 * @param ctx
 * @return {null|ValidatorResult}
 */
validators.dependencies = function validateDependencies (instance, schema, options, ctx) {
  if (!this.types.object(instance)) return;
  var result = new ValidatorResult(instance, schema, options, ctx);
  for (var property in schema.dependencies) {
    if (instance[property] === undefined) {
      continue;
    }
    var dep = schema.dependencies[property];
    var childContext = ctx.makeChild(dep, property);
    if (typeof dep == 'string') {
      dep = [dep];
    }
    if (Array.isArray(dep)) {
      dep.forEach(function (prop) {
        if (instance[prop] === undefined) {
          result.addError({
            // FIXME there's two different "dependencies" errors here with slightly different outputs
            // Can we make these the same? Or should we create different error types?
            name: 'dependencies',
            argument: childContext.propertyPath,
            message: "property " + prop + " not found, required by " + childContext.propertyPath,
          });
        }
      });
    } else {
      var res = this.validateSchema(instance, dep, options, childContext);
      if(result.instance !== res.instance) result.instance = res.instance;
      if (res && res.errors.length) {
        result.addError({
          name: 'dependencies',
          argument: childContext.propertyPath,
          message: "does not meet dependency required by " + childContext.propertyPath,
        });
        result.importErrors(res);
      }
    }
  }
  return result;
};

/**
 * Validates whether the instance value is one of the enumerated values.
 *
 * @param instance
 * @param schema
 * @return {ValidatorResult|null}
 */
validators['enum'] = function validateEnum (instance, schema, options, ctx) {
  if (instance === undefined) {
    return null;
  }
  if (!Array.isArray(schema['enum'])) {
    throw new SchemaError("enum expects an array", schema);
  }
  var result = new ValidatorResult(instance, schema, options, ctx);
  if (!schema['enum'].some(helpers.deepCompareStrict.bind(null, instance))) {
    result.addError({
      name: 'enum',
      argument: schema['enum'],
      message: "is not one of enum values: " + schema['enum'].map(String).join(','),
    });
  }
  return result;
};

/**
 * Validates whether the instance exactly matches a given value
 *
 * @param instance
 * @param schema
 * @return {ValidatorResult|null}
 */
validators['const'] = function validateEnum (instance, schema, options, ctx) {
  if (instance === undefined) {
    return null;
  }
  var result = new ValidatorResult(instance, schema, options, ctx);
  if (!helpers.deepCompareStrict(schema['const'], instance)) {
    result.addError({
      name: 'const',
      argument: schema['const'],
      message: "does not exactly match expected constant: " + schema['const'],
    });
  }
  return result;
};

/**
 * Validates whether the instance if of a prohibited type.
 * @param instance
 * @param schema
 * @param options
 * @param ctx
 * @return {null|ValidatorResult}
 */
validators.not = validators.disallow = function validateNot (instance, schema, options, ctx) {
  var self = this;
  if(instance===undefined) return null;
  var result = new ValidatorResult(instance, schema, options, ctx);
  var notTypes = schema.not || schema.disallow;
  if(!notTypes) return null;
  if(!Array.isArray(notTypes)) notTypes=[notTypes];
  notTypes.forEach(function (type) {
    if (self.testType(instance, schema, options, ctx, type)) {
      var id = type && (type.$id || type.id);
      var schemaId = id || type;
      result.addError({
        name: 'not',
        argument: schemaId,
        message: "is of prohibited type " + schemaId,
      });
    }
  });
  return result;
};

module.exports = attribute;


//# sourceURL=webpack:///../../../node_modules/jsonschema/lib/attribute.js?`);
            }
          ),
          /***/
          "../../../node_modules/jsonschema/lib/helpers.js": (
            /*!*******************************************************!*\
              !*** ../../../node_modules/jsonschema/lib/helpers.js ***!
              \*******************************************************/
            /***/
            (module, exports) => {
              eval(`

var ValidationError = exports.ValidationError = function ValidationError (message, instance, schema, path, name, argument) {
  if(Array.isArray(path)){
    this.path = path;
    this.property = path.reduce(function(sum, item){
      return sum + makeSuffix(item);
    }, 'instance');
  }else if(path !== undefined){
    this.property = path;
  }
  if (message) {
    this.message = message;
  }
  if (schema) {
    var id = schema.$id || schema.id;
    this.schema = id || schema;
  }
  if (instance !== undefined) {
    this.instance = instance;
  }
  this.name = name;
  this.argument = argument;
  this.stack = this.toString();
};

ValidationError.prototype.toString = function toString() {
  return this.property + ' ' + this.message;
};

var ValidatorResult = exports.ValidatorResult = function ValidatorResult(instance, schema, options, ctx) {
  this.instance = instance;
  this.schema = schema;
  this.options = options;
  this.path = ctx.path;
  this.propertyPath = ctx.propertyPath;
  this.errors = [];
  this.throwError = options && options.throwError;
  this.throwFirst = options && options.throwFirst;
  this.throwAll = options && options.throwAll;
  this.disableFormat = options && options.disableFormat === true;
};

ValidatorResult.prototype.addError = function addError(detail) {
  var err;
  if (typeof detail == 'string') {
    err = new ValidationError(detail, this.instance, this.schema, this.path);
  } else {
    if (!detail) throw new Error('Missing error detail');
    if (!detail.message) throw new Error('Missing error message');
    if (!detail.name) throw new Error('Missing validator type');
    err = new ValidationError(detail.message, this.instance, this.schema, this.path, detail.name, detail.argument);
  }

  this.errors.push(err);
  if (this.throwFirst) {
    throw new ValidatorResultError(this);
  }else if(this.throwError){
    throw err;
  }
  return err;
};

ValidatorResult.prototype.importErrors = function importErrors(res) {
  if (typeof res == 'string' || (res && res.validatorType)) {
    this.addError(res);
  } else if (res && res.errors) {
    this.errors = this.errors.concat(res.errors);
  }
};

function stringizer (v,i){
  return i+': '+v.toString()+'\\n';
}
ValidatorResult.prototype.toString = function toString(res) {
  return this.errors.map(stringizer).join('');
};

Object.defineProperty(ValidatorResult.prototype, "valid", { get: function() {
  return !this.errors.length;
} });

module.exports.ValidatorResultError = ValidatorResultError;
function ValidatorResultError(result) {
  if(typeof Error.captureStackTrace === 'function'){
    Error.captureStackTrace(this, ValidatorResultError);
  }
  this.instance = result.instance;
  this.schema = result.schema;
  this.options = result.options;
  this.errors = result.errors;
}
ValidatorResultError.prototype = new Error();
ValidatorResultError.prototype.constructor = ValidatorResultError;
ValidatorResultError.prototype.name = "Validation Error";

/**
 * Describes a problem with a Schema which prevents validation of an instance
 * @name SchemaError
 * @constructor
 */
var SchemaError = exports.SchemaError = function SchemaError (msg, schema) {
  this.message = msg;
  this.schema = schema;
  Error.call(this, msg);
  if(typeof Error.captureStackTrace === 'function'){
    Error.captureStackTrace(this, SchemaError);
  }
};
SchemaError.prototype = Object.create(Error.prototype,
  {
    constructor: {value: SchemaError, enumerable: false},
    name: {value: 'SchemaError', enumerable: false},
  });

var SchemaContext = exports.SchemaContext = function SchemaContext (schema, options, path, base, schemas) {
  this.schema = schema;
  this.options = options;
  if(Array.isArray(path)){
    this.path = path;
    this.propertyPath = path.reduce(function(sum, item){
      return sum + makeSuffix(item);
    }, 'instance');
  }else{
    this.propertyPath = path;
  }
  this.base = base;
  this.schemas = schemas;
};

SchemaContext.prototype.resolve = function resolve (target) {
  return (() => resolveUrl(this.base,target))();
};

SchemaContext.prototype.makeChild = function makeChild(schema, propertyName){
  var path = (propertyName===undefined) ? this.path : this.path.concat([propertyName]);
  var id = schema.$id || schema.id;
  let base = (() => resolveUrl(this.base,id||''))();
  var ctx = new SchemaContext(schema, this.options, path, base, Object.create(this.schemas));
  if(id && !ctx.schemas[base]){
    ctx.schemas[base] = schema;
  }
  return ctx;
};

var FORMAT_REGEXPS = exports.FORMAT_REGEXPS = {
  // 7.3.1. Dates, Times, and Duration
  'date-time': /^\\d{4}-(?:0[0-9]{1}|1[0-2]{1})-(3[01]|0[1-9]|[12][0-9])[tT ](2[0-4]|[01][0-9]):([0-5][0-9]):(60|[0-5][0-9])(\\.\\d+)?([zZ]|[+-]([0-5][0-9]):(60|[0-5][0-9]))$/,
  'date': /^\\d{4}-(?:0[0-9]{1}|1[0-2]{1})-(3[01]|0[1-9]|[12][0-9])$/,
  'time': /^(2[0-4]|[01][0-9]):([0-5][0-9]):(60|[0-5][0-9])$/,
  'duration': /P(T\\d+(H(\\d+M(\\d+S)?)?|M(\\d+S)?|S)|\\d+(D|M(\\d+D)?|Y(\\d+M(\\d+D)?)?)(T\\d+(H(\\d+M(\\d+S)?)?|M(\\d+S)?|S))?|\\d+W)/i,

  // 7.3.2. Email Addresses
  // TODO: fix the email production
  'email': /^(?:[\\w\\!\\#\\$\\%\\&\\'\\*\\+\\-\\/\\=\\?\\^\\\`\\{\\|\\}\\~]+\\.)*[\\w\\!\\#\\$\\%\\&\\'\\*\\+\\-\\/\\=\\?\\^\\\`\\{\\|\\}\\~]+@(?:(?:(?:[a-zA-Z0-9](?:[a-zA-Z0-9\\-](?!\\.)){0,61}[a-zA-Z0-9]?\\.)+[a-zA-Z0-9](?:[a-zA-Z0-9\\-](?!$)){0,61}[a-zA-Z0-9]?)|(?:\\[(?:(?:[01]?\\d{1,2}|2[0-4]\\d|25[0-5])\\.){3}(?:[01]?\\d{1,2}|2[0-4]\\d|25[0-5])\\]))$/,
  'idn-email': /^("(?:[!#-\\[\\]-\\u{10FFFF}]|\\\\[\\t -\\u{10FFFF}])*"|[!#-'*+\\-/-9=?A-Z\\^-\\u{10FFFF}](?:\\.?[!#-'*+\\-/-9=?A-Z\\^-\\u{10FFFF}])*)@([!#-'*+\\-/-9=?A-Z\\^-\\u{10FFFF}](?:\\.?[!#-'*+\\-/-9=?A-Z\\^-\\u{10FFFF}])*|\\[[!-Z\\^-\\u{10FFFF}]*\\])$/u,

  // 7.3.3. Hostnames

  // 7.3.4. IP Addresses
  'ip-address': /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/,
  // FIXME whitespace is invalid
  'ipv6': /^\\s*((([0-9A-Fa-f]{1,4}:){7}([0-9A-Fa-f]{1,4}|:))|(([0-9A-Fa-f]{1,4}:){6}(:[0-9A-Fa-f]{1,4}|((25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)(\\.(25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)){3})|:))|(([0-9A-Fa-f]{1,4}:){5}(((:[0-9A-Fa-f]{1,4}){1,2})|:((25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)(\\.(25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)){3})|:))|(([0-9A-Fa-f]{1,4}:){4}(((:[0-9A-Fa-f]{1,4}){1,3})|((:[0-9A-Fa-f]{1,4})?:((25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)(\\.(25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){3}(((:[0-9A-Fa-f]{1,4}){1,4})|((:[0-9A-Fa-f]{1,4}){0,2}:((25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)(\\.(25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){2}(((:[0-9A-Fa-f]{1,4}){1,5})|((:[0-9A-Fa-f]{1,4}){0,3}:((25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)(\\.(25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){1}(((:[0-9A-Fa-f]{1,4}){1,6})|((:[0-9A-Fa-f]{1,4}){0,4}:((25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)(\\.(25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)){3}))|:))|(:(((:[0-9A-Fa-f]{1,4}){1,7})|((:[0-9A-Fa-f]{1,4}){0,5}:((25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)(\\.(25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)){3}))|:)))(%.+)?\\s*$/,

  // 7.3.5. Resource Identifiers
  // TODO: A more accurate regular expression for "uri" goes:
  // [A-Za-z][+\\-.0-9A-Za-z]*:((/(/((%[0-9A-Fa-f]{2}|[!$&-.0-9;=A-Z_a-z~])+|(\\[(([Vv][0-9A-Fa-f]+\\.[!$&-.0-;=A-Z_a-z~]+)?|[.0-:A-Fa-f]+)\\])?)(:\\d*)?)?)?#(%[0-9A-Fa-f]{2}|[!$&-;=?-Z_a-z~])*|(/(/((%[0-9A-Fa-f]{2}|[!$&-.0-9;=A-Z_a-z~])+|(\\[(([Vv][0-9A-Fa-f]+\\.[!$&-.0-;=A-Z_a-z~]+)?|[.0-:A-Fa-f]+)\\])?)(:\\d*)?[/?]|[!$&-.0-;=?-Z_a-z~])|/?%[0-9A-Fa-f]{2}|[!$&-.0-;=?-Z_a-z~])(%[0-9A-Fa-f]{2}|[!$&-;=?-Z_a-z~])*(#(%[0-9A-Fa-f]{2}|[!$&-;=?-Z_a-z~])*)?|/(/((%[0-9A-Fa-f]{2}|[!$&-.0-9;=A-Z_a-z~])+(:\\d*)?|(\\[(([Vv][0-9A-Fa-f]+\\.[!$&-.0-;=A-Z_a-z~]+)?|[.0-:A-Fa-f]+)\\])?:\\d*|\\[(([Vv][0-9A-Fa-f]+\\.[!$&-.0-;=A-Z_a-z~]+)?|[.0-:A-Fa-f]+)\\])?)?)?
  'uri': /^[a-zA-Z][a-zA-Z0-9+.-]*:[^\\s]*$/,
  'uri-reference': /^(((([A-Za-z][+\\-.0-9A-Za-z]*(:%[0-9A-Fa-f]{2}|:[!$&-.0-;=?-Z_a-z~]|[/?])|\\?)(%[0-9A-Fa-f]{2}|[!$&-;=?-Z_a-z~])*|([A-Za-z][+\\-.0-9A-Za-z]*:?)?)|([A-Za-z][+\\-.0-9A-Za-z]*:)?\\/((%[0-9A-Fa-f]{2}|\\/((%[0-9A-Fa-f]{2}|[!$&-.0-9;=A-Z_a-z~])+|(\\[(([Vv][0-9A-Fa-f]+\\.[!$&-.0-;=A-Z_a-z~]+)?|[.0-:A-Fa-f]+)\\])?)(:\\d*)?[/?]|[!$&-.0-;=?-Z_a-z~])(%[0-9A-Fa-f]{2}|[!$&-;=?-Z_a-z~])*|(\\/((%[0-9A-Fa-f]{2}|[!$&-.0-9;=A-Z_a-z~])+|(\\[(([Vv][0-9A-Fa-f]+\\.[!$&-.0-;=A-Z_a-z~]+)?|[.0-:A-Fa-f]+)\\])?)(:\\d*)?)?))#(%[0-9A-Fa-f]{2}|[!$&-;=?-Z_a-z~])*|(([A-Za-z][+\\-.0-9A-Za-z]*)?%[0-9A-Fa-f]{2}|[!$&-.0-9;=@_~]|[A-Za-z][+\\-.0-9A-Za-z]*[!$&-*,;=@_~])(%[0-9A-Fa-f]{2}|[!$&-.0-9;=@-Z_a-z~])*((([/?](%[0-9A-Fa-f]{2}|[!$&-;=?-Z_a-z~])*)?#|[/?])(%[0-9A-Fa-f]{2}|[!$&-;=?-Z_a-z~])*)?|([A-Za-z][+\\-.0-9A-Za-z]*(:%[0-9A-Fa-f]{2}|:[!$&-.0-;=?-Z_a-z~]|[/?])|\\?)(%[0-9A-Fa-f]{2}|[!$&-;=?-Z_a-z~])*|([A-Za-z][+\\-.0-9A-Za-z]*:)?\\/((%[0-9A-Fa-f]{2}|\\/((%[0-9A-Fa-f]{2}|[!$&-.0-9;=A-Z_a-z~])+|(\\[(([Vv][0-9A-Fa-f]+\\.[!$&-.0-;=A-Z_a-z~]+)?|[.0-:A-Fa-f]+)\\])?)(:\\d*)?[/?]|[!$&-.0-;=?-Z_a-z~])(%[0-9A-Fa-f]{2}|[!$&-;=?-Z_a-z~])*|\\/((%[0-9A-Fa-f]{2}|[!$&-.0-9;=A-Z_a-z~])+(:\\d*)?|(\\[(([Vv][0-9A-Fa-f]+\\.[!$&-.0-;=A-Z_a-z~]+)?|[.0-:A-Fa-f]+)\\])?:\\d*|\\[(([Vv][0-9A-Fa-f]+\\.[!$&-.0-;=A-Z_a-z~]+)?|[.0-:A-Fa-f]+)\\])?)?|[A-Za-z][+\\-.0-9A-Za-z]*:?)?$/,
  'iri': /^[a-zA-Z][a-zA-Z0-9+.-]*:[^\\s]*$/,
  'iri-reference': /^(((([A-Za-z][+\\-.0-9A-Za-z]*(:%[0-9A-Fa-f]{2}|:[!$&-.0-;=?-Z_a-z~-\\u{10FFFF}]|[/?])|\\?)(%[0-9A-Fa-f]{2}|[!$&-;=?-Z_a-z~-\\u{10FFFF}])*|([A-Za-z][+\\-.0-9A-Za-z]*:?)?)|([A-Za-z][+\\-.0-9A-Za-z]*:)?\\/((%[0-9A-Fa-f]{2}|\\/((%[0-9A-Fa-f]{2}|[!$&-.0-9;=A-Z_a-z~-\\u{10FFFF}])+|(\\[(([Vv][0-9A-Fa-f]+\\.[!$&-.0-;=A-Z_a-z~-\\u{10FFFF}]+)?|[.0-:A-Fa-f]+)\\])?)(:\\d*)?[/?]|[!$&-.0-;=?-Z_a-z~-\\u{10FFFF}])(%[0-9A-Fa-f]{2}|[!$&-;=?-Z_a-z~-\\u{10FFFF}])*|(\\/((%[0-9A-Fa-f]{2}|[!$&-.0-9;=A-Z_a-z~-\\u{10FFFF}])+|(\\[(([Vv][0-9A-Fa-f]+\\.[!$&-.0-;=A-Z_a-z~-\\u{10FFFF}]+)?|[.0-:A-Fa-f]+)\\])?)(:\\d*)?)?))#(%[0-9A-Fa-f]{2}|[!$&-;=?-Z_a-z~-\\u{10FFFF}])*|(([A-Za-z][+\\-.0-9A-Za-z]*)?%[0-9A-Fa-f]{2}|[!$&-.0-9;=@_~-\\u{10FFFF}]|[A-Za-z][+\\-.0-9A-Za-z]*[!$&-*,;=@_~-\\u{10FFFF}])(%[0-9A-Fa-f]{2}|[!$&-.0-9;=@-Z_a-z~-\\u{10FFFF}])*((([/?](%[0-9A-Fa-f]{2}|[!$&-;=?-Z_a-z~-\\u{10FFFF}])*)?#|[/?])(%[0-9A-Fa-f]{2}|[!$&-;=?-Z_a-z~-\\u{10FFFF}])*)?|([A-Za-z][+\\-.0-9A-Za-z]*(:%[0-9A-Fa-f]{2}|:[!$&-.0-;=?-Z_a-z~-\\u{10FFFF}]|[/?])|\\?)(%[0-9A-Fa-f]{2}|[!$&-;=?-Z_a-z~-\\u{10FFFF}])*|([A-Za-z][+\\-.0-9A-Za-z]*:)?\\/((%[0-9A-Fa-f]{2}|\\/((%[0-9A-Fa-f]{2}|[!$&-.0-9;=A-Z_a-z~-\\u{10FFFF}])+|(\\[(([Vv][0-9A-Fa-f]+\\.[!$&-.0-;=A-Z_a-z~-\\u{10FFFF}]+)?|[.0-:A-Fa-f]+)\\])?)(:\\d*)?[/?]|[!$&-.0-;=?-Z_a-z~-\\u{10FFFF}])(%[0-9A-Fa-f]{2}|[!$&-;=?-Z_a-z~-\\u{10FFFF}])*|\\/((%[0-9A-Fa-f]{2}|[!$&-.0-9;=A-Z_a-z~-\\u{10FFFF}])+(:\\d*)?|(\\[(([Vv][0-9A-Fa-f]+\\.[!$&-.0-;=A-Z_a-z~-\\u{10FFFF}]+)?|[.0-:A-Fa-f]+)\\])?:\\d*|\\[(([Vv][0-9A-Fa-f]+\\.[!$&-.0-;=A-Z_a-z~-\\u{10FFFF}]+)?|[.0-:A-Fa-f]+)\\])?)?|[A-Za-z][+\\-.0-9A-Za-z]*:?)?$/u,
  'uuid': /^[0-9A-F]{8}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{12}$/i,

  // 7.3.6. uri-template
  'uri-template': /(%[0-9a-f]{2}|[!#$&(-;=?@\\[\\]_a-z~]|\\{[!#&+,./;=?@|]?(%[0-9a-f]{2}|[0-9_a-z])(\\.?(%[0-9a-f]{2}|[0-9_a-z]))*(:[1-9]\\d{0,3}|\\*)?(,(%[0-9a-f]{2}|[0-9_a-z])(\\.?(%[0-9a-f]{2}|[0-9_a-z]))*(:[1-9]\\d{0,3}|\\*)?)*\\})*/iu,

  // 7.3.7. JSON Pointers
  'json-pointer': /^(\\/([\\x00-\\x2e0-@\\[-}\\x7f]|~[01])*)*$/iu,
  'relative-json-pointer': /^\\d+(#|(\\/([\\x00-\\x2e0-@\\[-}\\x7f]|~[01])*)*)$/iu,

  // hostname regex from: http://stackoverflow.com/a/1420225/5628
  'hostname': /^(?=.{1,255}$)[0-9A-Za-z](?:(?:[0-9A-Za-z]|-){0,61}[0-9A-Za-z])?(?:\\.[0-9A-Za-z](?:(?:[0-9A-Za-z]|-){0,61}[0-9A-Za-z])?)*\\.?$/,
  'host-name': /^(?=.{1,255}$)[0-9A-Za-z](?:(?:[0-9A-Za-z]|-){0,61}[0-9A-Za-z])?(?:\\.[0-9A-Za-z](?:(?:[0-9A-Za-z]|-){0,61}[0-9A-Za-z])?)*\\.?$/,

  'utc-millisec': function (input) {
    return (typeof input === 'string') && parseFloat(input) === parseInt(input, 10) && !isNaN(input);
  },

  // 7.3.8. regex
  'regex': function (input) {
    var result = true;
    try {
      new RegExp(input);
    } catch (e) {
      result = false;
    }
    return result;
  },

  // Other definitions
  // "style" was removed from JSON Schema in draft-4 and is deprecated
  'style': /[\\r\\n\\t ]*[^\\r\\n\\t ][^:]*:[\\r\\n\\t ]*[^\\r\\n\\t ;]*[\\r\\n\\t ]*;?/,
  // "color" was removed from JSON Schema in draft-4 and is deprecated
  'color': /^(#?([0-9A-Fa-f]{3}){1,2}\\b|aqua|black|blue|fuchsia|gray|green|lime|maroon|navy|olive|orange|purple|red|silver|teal|white|yellow|(rgb\\(\\s*\\b([0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])\\b\\s*,\\s*\\b([0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])\\b\\s*,\\s*\\b([0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])\\b\\s*\\))|(rgb\\(\\s*(\\d?\\d%|100%)+\\s*,\\s*(\\d?\\d%|100%)+\\s*,\\s*(\\d?\\d%|100%)+\\s*\\)))$/,
  'phone': /^\\+(?:[0-9] ?){6,14}[0-9]$/,
  'alpha': /^[a-zA-Z]+$/,
  'alphanumeric': /^[a-zA-Z0-9]+$/,
};

FORMAT_REGEXPS.regexp = FORMAT_REGEXPS.regex;
FORMAT_REGEXPS.pattern = FORMAT_REGEXPS.regex;
FORMAT_REGEXPS.ipv4 = FORMAT_REGEXPS['ip-address'];

exports.isFormat = function isFormat (input, format, validator) {
  if (typeof input === 'string' && FORMAT_REGEXPS[format] !== undefined) {
    if (FORMAT_REGEXPS[format] instanceof RegExp) {
      return FORMAT_REGEXPS[format].test(input);
    }
    if (typeof FORMAT_REGEXPS[format] === 'function') {
      return FORMAT_REGEXPS[format](input);
    }
  } else if (validator && validator.customFormats &&
      typeof validator.customFormats[format] === 'function') {
    return validator.customFormats[format](input);
  }
  return true;
};

var makeSuffix = exports.makeSuffix = function makeSuffix (key) {
  key = key.toString();
  // This function could be capable of outputting valid a ECMAScript string, but the
  // resulting code for testing which form to use would be tens of thousands of characters long
  // That means this will use the name form for some illegal forms
  if (!key.match(/[.\\s\\[\\]]/) && !key.match(/^[\\d]/)) {
    return '.' + key;
  }
  if (key.match(/^\\d+$/)) {
    return '[' + key + ']';
  }
  return '[' + JSON.stringify(key) + ']';
};

exports.deepCompareStrict = function deepCompareStrict (a, b) {
  if (typeof a !== typeof b) {
    return false;
  }
  if (Array.isArray(a)) {
    if (!Array.isArray(b)) {
      return false;
    }
    if (a.length !== b.length) {
      return false;
    }
    return a.every(function (v, i) {
      return deepCompareStrict(a[i], b[i]);
    });
  }
  if (typeof a === 'object') {
    if (!a || !b) {
      return a === b;
    }
    var aKeys = Object.keys(a);
    var bKeys = Object.keys(b);
    if (aKeys.length !== bKeys.length) {
      return false;
    }
    return aKeys.every(function (v) {
      return deepCompareStrict(a[v], b[v]);
    });
  }
  return a === b;
};

function deepMerger (target, dst, e, i) {
  if (typeof e === 'object') {
    dst[i] = deepMerge(target[i], e);
  } else {
    if (target.indexOf(e) === -1) {
      dst.push(e);
    }
  }
}

function copyist (src, dst, key) {
  dst[key] = src[key];
}

function copyistWithDeepMerge (target, src, dst, key) {
  if (typeof src[key] !== 'object' || !src[key]) {
    dst[key] = src[key];
  }
  else {
    if (!target[key]) {
      dst[key] = src[key];
    } else {
      dst[key] = deepMerge(target[key], src[key]);
    }
  }
}

function deepMerge (target, src) {
  var array = Array.isArray(src);
  var dst = array && [] || {};

  if (array) {
    target = target || [];
    dst = dst.concat(target);
    src.forEach(deepMerger.bind(null, target, dst));
  } else {
    if (target && typeof target === 'object') {
      Object.keys(target).forEach(copyist.bind(null, target, dst));
    }
    Object.keys(src).forEach(copyistWithDeepMerge.bind(null, target, src, dst));
  }

  return dst;
}

module.exports.deepMerge = deepMerge;

/**
 * Validates instance against the provided schema
 * Implements URI+JSON Pointer encoding, e.g. "%7e"="~0"=>"~", "~1"="%2f"=>"/"
 * @param o
 * @param s The path to walk o along
 * @return any
 */
exports.objectGetPath = function objectGetPath(o, s) {
  var parts = s.split('/').slice(1);
  var k;
  while (typeof (k=parts.shift()) == 'string') {
    var n = decodeURIComponent(k.replace(/~0/,'~').replace(/~1/g,'/'));
    if (!(n in o)) return;
    o = o[n];
  }
  return o;
};

function pathEncoder (v) {
  return '/'+encodeURIComponent(v).replace(/~/g,'%7E');
}
/**
 * Accept an Array of property names and return a JSON Pointer URI fragment
 * @param Array a
 * @return {String}
 */
exports.encodePath = function encodePointer(a){
  // ~ must be encoded explicitly because hacks
  // the slash is encoded by encodeURIComponent
  return a.map(pathEncoder).join('');
};


/**
 * Calculate the number of decimal places a number uses
 * We need this to get correct results out of multipleOf and divisibleBy
 * when either figure is has decimal places, due to IEEE-754 float issues.
 * @param number
 * @returns {number}
 */
exports.getDecimalPlaces = function getDecimalPlaces(number) {

  var decimalPlaces = 0;
  if (isNaN(number)) return decimalPlaces;

  if (typeof number !== 'number') {
    number = Number(number);
  }

  var parts = number.toString().split('e');
  if (parts.length === 2) {
    if (parts[1][0] !== '-') {
      return decimalPlaces;
    } else {
      decimalPlaces = Number(parts[1].slice(1));
    }
  }

  var decimalParts = parts[0].split('.');
  if (decimalParts.length === 2) {
    decimalPlaces += decimalParts[1].length;
  }

  return decimalPlaces;
};

exports.isSchema = function isSchema(val){
  return (typeof val === 'object' && val) || (typeof val === 'boolean');
};

/**
 * Resolve target URL from a base and relative URL.
 * Similar to Node's URL Lib's legacy resolve function.
 * Code from example in deprecation note in said library.
 * @param string
 * @param string
 * @returns {string}
 */
var resolveUrl = exports.resolveUrl = function resolveUrl(from, to) {
  const resolvedUrl = new URL(to, new URL(from, 'resolve://'));
  if (resolvedUrl.protocol === 'resolve:') {
    const { pathname, search, hash } = resolvedUrl;
    return pathname + search + hash;
  }
  return resolvedUrl.toString();
}


//# sourceURL=webpack:///../../../node_modules/jsonschema/lib/helpers.js?`);
            }
          ),
          /***/
          "../../../node_modules/jsonschema/lib/index.js": (
            /*!*****************************************************!*\
              !*** ../../../node_modules/jsonschema/lib/index.js ***!
              \*****************************************************/
            /***/
            (module, __unused_webpack_exports, __webpack_require__) => {
              eval('\n\nvar Validator = module.exports.Validator = __webpack_require__(/*! ./validator */ "../../../node_modules/jsonschema/lib/validator.js");\n\nmodule.exports.ValidatorResult = __webpack_require__(/*! ./helpers */ "../../../node_modules/jsonschema/lib/helpers.js").ValidatorResult;\nmodule.exports.ValidatorResultError = __webpack_require__(/*! ./helpers */ "../../../node_modules/jsonschema/lib/helpers.js").ValidatorResultError;\nmodule.exports.ValidationError = __webpack_require__(/*! ./helpers */ "../../../node_modules/jsonschema/lib/helpers.js").ValidationError;\nmodule.exports.SchemaError = __webpack_require__(/*! ./helpers */ "../../../node_modules/jsonschema/lib/helpers.js").SchemaError;\nmodule.exports.SchemaScanResult = __webpack_require__(/*! ./scan */ "../../../node_modules/jsonschema/lib/scan.js").SchemaScanResult;\nmodule.exports.scan = __webpack_require__(/*! ./scan */ "../../../node_modules/jsonschema/lib/scan.js").scan;\n\nmodule.exports.validate = function (instance, schema, options) {\n  var v = new Validator();\n  return v.validate(instance, schema, options);\n};\n\n\n//# sourceURL=webpack:///../../../node_modules/jsonschema/lib/index.js?');
            }
          ),
          /***/
          "../../../node_modules/jsonschema/lib/scan.js": (
            /*!****************************************************!*\
              !*** ../../../node_modules/jsonschema/lib/scan.js ***!
              \****************************************************/
            /***/
            (module, __unused_webpack_exports, __webpack_require__) => {
              eval(`

var helpers = __webpack_require__(/*! ./helpers */ "../../../node_modules/jsonschema/lib/helpers.js");

module.exports.SchemaScanResult = SchemaScanResult;
function SchemaScanResult(found, ref){
  this.id = found;
  this.ref = ref;
}

/**
 * Adds a schema with a certain urn to the Validator instance.
 * @param string uri
 * @param object schema
 * @return {Object}
 */
module.exports.scan = function scan(base, schema){
  function scanSchema(baseuri, schema){
    if(!schema || typeof schema!='object') return;
    // Mark all referenced schemas so we can tell later which schemas are referred to, but never defined
    if(schema.$ref){
      let resolvedUri = helpers.resolveUrl(baseuri,schema.$ref);
      ref[resolvedUri] = ref[resolvedUri] ? ref[resolvedUri]+1 : 0;
      return;
    }
    var id = schema.$id || schema.id;
    let resolvedBase = helpers.resolveUrl(baseuri,id);
    var ourBase = id ? resolvedBase : baseuri;
    if (ourBase) {
      // If there's no fragment, append an empty one
      if(ourBase.indexOf('#')<0) ourBase += '#';
      if(found[ourBase]){
        if(!helpers.deepCompareStrict(found[ourBase], schema)){
          throw new Error('Schema <'+ourBase+'> already exists with different definition');
        }
        return found[ourBase];
      }
      found[ourBase] = schema;
      // strip trailing fragment
      if(ourBase[ourBase.length-1]=='#'){
        found[ourBase.substring(0, ourBase.length-1)] = schema;
      }
    }
    scanArray(ourBase+'/items', (Array.isArray(schema.items)?schema.items:[schema.items]));
    scanArray(ourBase+'/extends', (Array.isArray(schema.extends)?schema.extends:[schema.extends]));
    scanSchema(ourBase+'/additionalItems', schema.additionalItems);
    scanObject(ourBase+'/properties', schema.properties);
    scanSchema(ourBase+'/additionalProperties', schema.additionalProperties);
    scanObject(ourBase+'/definitions', schema.definitions);
    scanObject(ourBase+'/patternProperties', schema.patternProperties);
    scanObject(ourBase+'/dependencies', schema.dependencies);
    scanArray(ourBase+'/disallow', schema.disallow);
    scanArray(ourBase+'/allOf', schema.allOf);
    scanArray(ourBase+'/anyOf', schema.anyOf);
    scanArray(ourBase+'/oneOf', schema.oneOf);
    scanSchema(ourBase+'/not', schema.not);
  }
  function scanArray(baseuri, schemas){
    if(!Array.isArray(schemas)) return;
    for(var i=0; i<schemas.length; i++){
      scanSchema(baseuri+'/'+i, schemas[i]);
    }
  }
  function scanObject(baseuri, schemas){
    if(!schemas || typeof schemas!='object') return;
    for(var p in schemas){
      scanSchema(baseuri+'/'+p, schemas[p]);
    }
  }

  var found = {};
  var ref = {};
  scanSchema(base, schema);
  return new SchemaScanResult(found, ref);
};


//# sourceURL=webpack:///../../../node_modules/jsonschema/lib/scan.js?`);
            }
          ),
          /***/
          "../../../node_modules/jsonschema/lib/validator.js": (
            /*!*********************************************************!*\
              !*** ../../../node_modules/jsonschema/lib/validator.js ***!
              \*********************************************************/
            /***/
            (module, __unused_webpack_exports, __webpack_require__) => {
              eval(`

var attribute = __webpack_require__(/*! ./attribute */ "../../../node_modules/jsonschema/lib/attribute.js");
var helpers = __webpack_require__(/*! ./helpers */ "../../../node_modules/jsonschema/lib/helpers.js");
var scanSchema = (__webpack_require__(/*! ./scan */ "../../../node_modules/jsonschema/lib/scan.js").scan);
var ValidatorResult = helpers.ValidatorResult;
var ValidatorResultError = helpers.ValidatorResultError;
var SchemaError = helpers.SchemaError;
var SchemaContext = helpers.SchemaContext;
//var anonymousBase = 'vnd.jsonschema:///';
var anonymousBase = '/';

/**
 * Creates a new Validator object
 * @name Validator
 * @constructor
 */
var Validator = function Validator () {
  // Allow a validator instance to override global custom formats or to have their
  // own custom formats.
  this.customFormats = Object.create(Validator.prototype.customFormats);
  this.schemas = {};
  this.unresolvedRefs = [];

  // Use Object.create to make this extensible without Validator instances stepping on each other's toes.
  this.types = Object.create(types);
  this.attributes = Object.create(attribute.validators);
};

// Allow formats to be registered globally.
Validator.prototype.customFormats = {};

// Hint at the presence of a property
Validator.prototype.schemas = null;
Validator.prototype.types = null;
Validator.prototype.attributes = null;
Validator.prototype.unresolvedRefs = null;

/**
 * Adds a schema with a certain urn to the Validator instance.
 * @param schema
 * @param urn
 * @return {Object}
 */
Validator.prototype.addSchema = function addSchema (schema, base) {
  var self = this;
  if (!schema) {
    return null;
  }
  var scan = scanSchema(base||anonymousBase, schema);
  var ourUri = base || schema.$id || schema.id;
  for(var uri in scan.id){
    this.schemas[uri] = scan.id[uri];
  }
  for(var uri in scan.ref){
    // If this schema is already defined, it will be filtered out by the next step
    this.unresolvedRefs.push(uri);
  }
  // Remove newly defined schemas from unresolvedRefs
  this.unresolvedRefs = this.unresolvedRefs.filter(function(uri){
    return typeof self.schemas[uri]==='undefined';
  });
  return this.schemas[ourUri];
};

Validator.prototype.addSubSchemaArray = function addSubSchemaArray(baseuri, schemas) {
  if(!Array.isArray(schemas)) return;
  for(var i=0; i<schemas.length; i++){
    this.addSubSchema(baseuri, schemas[i]);
  }
};

Validator.prototype.addSubSchemaObject = function addSubSchemaArray(baseuri, schemas) {
  if(!schemas || typeof schemas!='object') return;
  for(var p in schemas){
    this.addSubSchema(baseuri, schemas[p]);
  }
};



/**
 * Sets all the schemas of the Validator instance.
 * @param schemas
 */
Validator.prototype.setSchemas = function setSchemas (schemas) {
  this.schemas = schemas;
};

/**
 * Returns the schema of a certain urn
 * @param urn
 */
Validator.prototype.getSchema = function getSchema (urn) {
  return this.schemas[urn];
};

/**
 * Validates instance against the provided schema
 * @param instance
 * @param schema
 * @param [options]
 * @param [ctx]
 * @return {Array}
 */
Validator.prototype.validate = function validate (instance, schema, options, ctx) {
  if((typeof schema !== 'boolean' && typeof schema !== 'object') || schema === null){
    throw new SchemaError('Expected \`schema\` to be an object or boolean');
  }
  if (!options) {
    options = {};
  }
  // This section indexes subschemas in the provided schema, so they don't need to be added with Validator#addSchema
  // This will work so long as the function at uri.resolve() will resolve a relative URI to a relative URI
  var id = schema.$id || schema.id;
  let base = helpers.resolveUrl(options.base,id||'');
  if(!ctx){
    ctx = new SchemaContext(schema, options, [], base, Object.create(this.schemas));
    if (!ctx.schemas[base]) {
      ctx.schemas[base] = schema;
    }
    var found = scanSchema(base, schema);
    for(var n in found.id){
      var sch = found.id[n];
      ctx.schemas[n] = sch;
    }
  }
  if(options.required && instance===undefined){
    var result = new ValidatorResult(instance, schema, options, ctx);
    result.addError('is required, but is undefined');
    return result;
  }
  var result = this.validateSchema(instance, schema, options, ctx);
  if (!result) {
    throw new Error('Result undefined');
  }else if(options.throwAll && result.errors.length){
    throw new ValidatorResultError(result);
  }
  return result;
};

/**
* @param Object schema
* @return mixed schema uri or false
*/
function shouldResolve(schema) {
  var ref = (typeof schema === 'string') ? schema : schema.$ref;
  if (typeof ref=='string') return ref;
  return false;
}

/**
 * Validates an instance against the schema (the actual work horse)
 * @param instance
 * @param schema
 * @param options
 * @param ctx
 * @private
 * @return {ValidatorResult}
 */
Validator.prototype.validateSchema = function validateSchema (instance, schema, options, ctx) {
  var result = new ValidatorResult(instance, schema, options, ctx);

  // Support for the true/false schemas
  if(typeof schema==='boolean') {
    if(schema===true){
      // \`true\` is always valid
      schema = {};
    }else if(schema===false){
      // \`false\` is always invalid
      schema = {type: []};
    }
  }else if(!schema){
    // This might be a string
    throw new Error("schema is undefined");
  }

  if (schema['extends']) {
    if (Array.isArray(schema['extends'])) {
      var schemaobj = {schema: schema, ctx: ctx};
      schema['extends'].forEach(this.schemaTraverser.bind(this, schemaobj));
      schema = schemaobj.schema;
      schemaobj.schema = null;
      schemaobj.ctx = null;
      schemaobj = null;
    } else {
      schema = helpers.deepMerge(schema, this.superResolve(schema['extends'], ctx));
    }
  }

  // If passed a string argument, load that schema URI
  var switchSchema = shouldResolve(schema);
  if (switchSchema) {
    var resolved = this.resolve(schema, switchSchema, ctx);
    var subctx = new SchemaContext(resolved.subschema, options, ctx.path, resolved.switchSchema, ctx.schemas);
    return this.validateSchema(instance, resolved.subschema, options, subctx);
  }

  var skipAttributes = options && options.skipAttributes || [];
  // Validate each schema attribute against the instance
  for (var key in schema) {
    if (!attribute.ignoreProperties[key] && skipAttributes.indexOf(key) < 0) {
      var validatorErr = null;
      var validator = this.attributes[key];
      if (validator) {
        validatorErr = validator.call(this, instance, schema, options, ctx);
      } else if (options.allowUnknownAttributes === false) {
        // This represents an error with the schema itself, not an invalid instance
        throw new SchemaError("Unsupported attribute: " + key, schema);
      }
      if (validatorErr) {
        result.importErrors(validatorErr);
      }
    }
  }

  if (typeof options.rewrite == 'function') {
    var value = options.rewrite.call(this, instance, schema, options, ctx);
    result.instance = value;
  }
  return result;
};

/**
* @private
* @param Object schema
* @param SchemaContext ctx
* @returns Object schema or resolved schema
*/
Validator.prototype.schemaTraverser = function schemaTraverser (schemaobj, s) {
  schemaobj.schema = helpers.deepMerge(schemaobj.schema, this.superResolve(s, schemaobj.ctx));
};

/**
* @private
* @param Object schema
* @param SchemaContext ctx
* @returns Object schema or resolved schema
*/
Validator.prototype.superResolve = function superResolve (schema, ctx) {
  var ref = shouldResolve(schema);
  if(ref) {
    return this.resolve(schema, ref, ctx).subschema;
  }
  return schema;
};

/**
* @private
* @param Object schema
* @param Object switchSchema
* @param SchemaContext ctx
* @return Object resolved schemas {subschema:String, switchSchema: String}
* @throws SchemaError
*/
Validator.prototype.resolve = function resolve (schema, switchSchema, ctx) {
  switchSchema = ctx.resolve(switchSchema);
  // First see if the schema exists under the provided URI
  if (ctx.schemas[switchSchema]) {
    return {subschema: ctx.schemas[switchSchema], switchSchema: switchSchema};
  }
  // Else try walking the property pointer
  let parsed = new URL(switchSchema,'thismessage::/');
  let fragment = parsed.hash;
  var document = fragment && fragment.length && switchSchema.substr(0, switchSchema.length - fragment.length);
  if (!document || !ctx.schemas[document]) {
    throw new SchemaError("no such schema <" + switchSchema + ">", schema);
  }
  var subschema = helpers.objectGetPath(ctx.schemas[document], fragment.substr(1));
  if(subschema===undefined){
    throw new SchemaError("no such schema " + fragment + " located in <" + document + ">", schema);
  }
  return {subschema: subschema, switchSchema: switchSchema};
};

/**
 * Tests whether the instance if of a certain type.
 * @private
 * @param instance
 * @param schema
 * @param options
 * @param ctx
 * @param type
 * @return {boolean}
 */
Validator.prototype.testType = function validateType (instance, schema, options, ctx, type) {
  if(type===undefined){
    return;
  }else if(type===null){
    throw new SchemaError('Unexpected null in "type" keyword');
  }
  if (typeof this.types[type] == 'function') {
    return this.types[type].call(this, instance);
  }
  if (type && typeof type == 'object') {
    var res = this.validateSchema(instance, type, options, ctx);
    return res === undefined || !(res && res.errors.length);
  }
  // Undefined or properties not on the list are acceptable, same as not being defined
  return true;
};

var types = Validator.prototype.types = {};
types.string = function testString (instance) {
  return typeof instance == 'string';
};
types.number = function testNumber (instance) {
  // isFinite returns false for NaN, Infinity, and -Infinity
  return typeof instance == 'number' && isFinite(instance);
};
types.integer = function testInteger (instance) {
  return (typeof instance == 'number') && instance % 1 === 0;
};
types.boolean = function testBoolean (instance) {
  return typeof instance == 'boolean';
};
types.array = function testArray (instance) {
  return Array.isArray(instance);
};
types['null'] = function testNull (instance) {
  return instance === null;
};
types.date = function testDate (instance) {
  return instance instanceof Date;
};
types.any = function testAny (instance) {
  return true;
};
types.object = function testObject (instance) {
  // TODO: fix this - see #15
  return instance && (typeof instance === 'object') && !(Array.isArray(instance)) && !(instance instanceof Date);
};

module.exports = Validator;


//# sourceURL=webpack:///../../../node_modules/jsonschema/lib/validator.js?`);
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
          var getProto = Object.getPrototypeOf ? (obj) => Object.getPrototypeOf(obj) : (obj) => obj.__proto__;
          var leafPrototypes;
          __webpack_require__.t = function(value, mode) {
            if (mode & 1) value = this(value);
            if (mode & 8) return value;
            if (typeof value === "object" && value) {
              if (mode & 4 && value.__esModule) return value;
              if (mode & 16 && typeof value.then === "function") return value;
            }
            var ns = /* @__PURE__ */ Object.create(null);
            __webpack_require__.r(ns);
            var def = {};
            leafPrototypes = leafPrototypes || [null, getProto({}), getProto([]), getProto(getProto)];
            for (var current = mode & 2 && value; typeof current == "object" && !~leafPrototypes.indexOf(current); current = getProto(current)) {
              Object.getOwnPropertyNames(current).forEach((key) => def[key] = () => value[key]);
            }
            def["default"] = () => value;
            __webpack_require__.d(ns, def);
            return ns;
          };
        })();
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
      if (jsonschema === void 0) {
        throw new Error("local jsonschema is undefined");
      }
      getGlobalThis().jsonschema = jsonschema;
      if (getGlobalThis().jsonschema === void 0) {
        throw new Error("global jsonschema is undefined");
      }
    }
  });
  require_jsonschema();
})();
//# sourceMappingURL=jsonschema.bundle.js.map
