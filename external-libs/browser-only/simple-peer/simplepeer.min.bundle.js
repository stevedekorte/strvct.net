(() => {
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
    get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
  }) : x)(function (x) {
    if (typeof require !== "undefined") return require.apply(this, arguments);
    throw Error('Dynamic require of "' + x + '" is not supported');
  });
  var __commonJS = (cb, mod) => function __require2 () {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  };

  // simple-peer/simplepeer.min.js
  var require_simplepeer_min = __commonJS({
    "simple-peer/simplepeer.min.js" (exports, module) {
      (function (e) {
        if (typeof exports === "object" && typeof module !== "undefined") {
          module.exports = e();
        } else if (typeof define === "function" && define.amd) {
          define([], e);
        } else {
          var t;
          if (typeof window !== "undefined") {
            t = window;
          } else if (typeof global !== "undefined") {
            t = global;
          } else if (typeof self !== "undefined") {
            t = self;
          } else {
            t = this;
          }
          t.SimplePeer = e();
        }
      })(function () {
        var e, t, r;
        return (/* @__PURE__ */ function () {
          function l (o, a, s) {
            function f (r2, e3) {
              if (!a[r2]) {
                if (!o[r2]) {
                  var t2 = "function" == typeof __require && __require;
                  if (!e3 && t2) return t2(r2, true);
                  if (u) return u(r2, true);
                  var n = new Error("Cannot find module '" + r2 + "'");
                  throw n.code = "MODULE_NOT_FOUND", n;
                }
                var i = a[r2] = { exports: {} };
                o[r2][0].call(i.exports, function (e4) {
                  var t3 = o[r2][1][e4];
                  return f(t3 || e4);
                }, i, i.exports, l, o, a, s);
              }
              return a[r2].exports;
            }
            for (var u = "function" == typeof __require && __require, e2 = 0; e2 < s.length; e2++) f(s[e2]);
            return f;
          }
          return l;
        }())({ 1: [function (e2, t2, r2) {
          "use strict";
          r2.byteLength = a;
          r2.toByteArray = s;
          r2.fromByteArray = g;
          var f = [];
          var u = [];
          var l = typeof Uint8Array !== "undefined" ? Uint8Array : Array;
          var n = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
          for (var i = 0, o = n.length; i < o; ++i) {
            f[i] = n[i];
            u[n.charCodeAt(i)] = i;
          }
          u["-".charCodeAt(0)] = 62;
          u["_".charCodeAt(0)] = 63;
          function c (e3) {
            var t3 = e3.length;
            if (t3 % 4 > 0) {
              throw new Error("Invalid string. Length must be a multiple of 4");
            }
            var r3 = e3.indexOf("=");
            if (r3 === -1) r3 = t3;
            var n2 = r3 === t3 ? 0 : 4 - r3 % 4;
            return [r3, n2];
          }
          function a (e3) {
            var t3 = c(e3);
            var r3 = t3[0];
            var n2 = t3[1];
            return (r3 + n2) * 3 / 4 - n2;
          }
          function h (e3, t3, r3) {
            return (t3 + r3) * 3 / 4 - r3;
          }
          function s (e3) {
            var t3;
            var r3 = c(e3);
            var n2 = r3[0];
            var i2 = r3[1];
            var o2 = new l(h(e3, n2, i2));
            var a2 = 0;
            var s2 = i2 > 0 ? n2 - 4 : n2;
            for (var f2 = 0; f2 < s2; f2 += 4) {
              t3 = u[e3.charCodeAt(f2)] << 18 | u[e3.charCodeAt(f2 + 1)] << 12 | u[e3.charCodeAt(f2 + 2)] << 6 | u[e3.charCodeAt(f2 + 3)];
              o2[a2++] = t3 >> 16 & 255;
              o2[a2++] = t3 >> 8 & 255;
              o2[a2++] = t3 & 255;
            }
            if (i2 === 2) {
              t3 = u[e3.charCodeAt(f2)] << 2 | u[e3.charCodeAt(f2 + 1)] >> 4;
              o2[a2++] = t3 & 255;
            }
            if (i2 === 1) {
              t3 = u[e3.charCodeAt(f2)] << 10 | u[e3.charCodeAt(f2 + 1)] << 4 | u[e3.charCodeAt(f2 + 2)] >> 2;
              o2[a2++] = t3 >> 8 & 255;
              o2[a2++] = t3 & 255;
            }
            return o2;
          }
          function d (e3) {
            return f[e3 >> 18 & 63] + f[e3 >> 12 & 63] + f[e3 >> 6 & 63] + f[e3 & 63];
          }
          function p (e3, t3, r3) {
            var n2;
            var i2 = [];
            for (var o2 = t3; o2 < r3; o2 += 3) {
              n2 = (e3[o2] << 16 & 16711680) + (e3[o2 + 1] << 8 & 65280) + (e3[o2 + 2] & 255);
              i2.push(d(n2));
            }
            return i2.join("");
          }
          function g (e3) {
            var t3;
            var r3 = e3.length;
            var n2 = r3 % 3;
            var i2 = [];
            var o2 = 16383;
            for (var a2 = 0, s2 = r3 - n2; a2 < s2; a2 += o2) {
              i2.push(p(e3, a2, a2 + o2 > s2 ? s2 : a2 + o2));
            }
            if (n2 === 1) {
              t3 = e3[r3 - 1];
              i2.push(f[t3 >> 2] + f[t3 << 4 & 63] + "==");
            } else if (n2 === 2) {
              t3 = (e3[r3 - 2] << 8) + e3[r3 - 1];
              i2.push(f[t3 >> 10] + f[t3 >> 4 & 63] + f[t3 << 2 & 63] + "=");
            }
            return i2.join("");
          }
        }, {}], 2: [function (e2, t2, r2) {
        }, {}], 3: [function (e2, t2, n) {
          "use strict";
          var i = e2("base64-js");
          var o = e2("ieee754");
          n.Buffer = h;
          n.SlowBuffer = b;
          n.INSPECT_MAX_BYTES = 50;
          var r2 = 2147483647;
          n.kMaxLength = r2;
          h.TYPED_ARRAY_SUPPORT = a();
          if (!h.TYPED_ARRAY_SUPPORT && typeof console !== "undefined" && typeof console.error === "function") {
            console.error("This browser lacks typed array (Uint8Array) support which is required by `buffer` v5.x. Use `buffer` v4.x if you require old browser support.");
          }
          function a () {
            try {
              var e3 = new Uint8Array(1);
              e3.__proto__ = { __proto__: Uint8Array.prototype, foo: function () {
                return 42;
              } };
              return e3.foo() === 42;
            } catch (e4) {
              return false;
            }
          }
          Object.defineProperty(h.prototype, "parent", { get: function () {
            if (!(this instanceof h)) {
              return void 0;
            }
            return this.buffer;
          } });
          Object.defineProperty(h.prototype, "offset", { get: function () {
            if (!(this instanceof h)) {
              return void 0;
            }
            return this.byteOffset;
          } });
          function s (e3) {
            if (e3 > r2) {
              throw new RangeError("Invalid typed array length");
            }
            var t3 = new Uint8Array(e3);
            t3.__proto__ = h.prototype;
            return t3;
          }
          function h (e3, t3, r3) {
            if (typeof e3 === "number") {
              if (typeof t3 === "string") {
                throw new Error("If encoding is specified then the first argument must be a string");
              }
              return c(e3);
            }
            return f(e3, t3, r3);
          }
          if (typeof Symbol !== "undefined" && Symbol.species && h[Symbol.species] === h) {
            Object.defineProperty(h, Symbol.species, { value: null, configurable: true, enumerable: false, writable: false });
          }
          h.poolSize = 8192;
          function f (e3, t3, r3) {
            if (typeof e3 === "number") {
              throw new TypeError('"value" argument must not be a number');
            }
            if ($(e3) || e3 && $(e3.buffer)) {
              return g(e3, t3, r3);
            }
            if (typeof e3 === "string") {
              return d(e3, t3);
            }
            return y(e3);
          }
          h.from = function (e3, t3, r3) {
            return f(e3, t3, r3);
          };
          h.prototype.__proto__ = Uint8Array.prototype;
          h.__proto__ = Uint8Array;
          function u (e3) {
            if (typeof e3 !== "number") {
              throw new TypeError('"size" argument must be of type number');
            } else if (e3 < 0) {
              throw new RangeError('"size" argument must not be negative');
            }
          }
          function l (e3, t3, r3) {
            u(e3);
            if (e3 <= 0) {
              return s(e3);
            }
            if (t3 !== void 0) {
              return typeof r3 === "string" ? s(e3).fill(t3, r3) : s(e3).fill(t3);
            }
            return s(e3);
          }
          h.alloc = function (e3, t3, r3) {
            return l(e3, t3, r3);
          };
          function c (e3) {
            u(e3);
            return s(e3 < 0 ? 0 : v(e3) | 0);
          }
          h.allocUnsafe = function (e3) {
            return c(e3);
          };
          h.allocUnsafeSlow = function (e3) {
            return c(e3);
          };
          function d (e3, t3) {
            if (typeof t3 !== "string" || t3 === "") {
              t3 = "utf8";
            }
            if (!h.isEncoding(t3)) {
              throw new TypeError("Unknown encoding: " + t3);
            }
            var r3 = m(e3, t3) | 0;
            var n2 = s(r3);
            var i2 = n2.write(e3, t3);
            if (i2 !== r3) {
              n2 = n2.slice(0, i2);
            }
            return n2;
          }
          function p (e3) {
            var t3 = e3.length < 0 ? 0 : v(e3.length) | 0;
            var r3 = s(t3);
            for (var n2 = 0; n2 < t3; n2 += 1) {
              r3[n2] = e3[n2] & 255;
            }
            return r3;
          }
          function g (e3, t3, r3) {
            if (t3 < 0 || e3.byteLength < t3) {
              throw new RangeError('"offset" is outside of buffer bounds');
            }
            if (e3.byteLength < t3 + (r3 || 0)) {
              throw new RangeError('"length" is outside of buffer bounds');
            }
            var n2;
            if (t3 === void 0 && r3 === void 0) {
              n2 = new Uint8Array(e3);
            } else if (r3 === void 0) {
              n2 = new Uint8Array(e3, t3);
            } else {
              n2 = new Uint8Array(e3, t3, r3);
            }
            n2.__proto__ = h.prototype;
            return n2;
          }
          function y (e3) {
            if (h.isBuffer(e3)) {
              var t3 = v(e3.length) | 0;
              var r3 = s(t3);
              if (r3.length === 0) {
                return r3;
              }
              e3.copy(r3, 0, 0, t3);
              return r3;
            }
            if (e3) {
              if (ArrayBuffer.isView(e3) || "length" in e3) {
                if (typeof e3.length !== "number" || K(e3.length)) {
                  return s(0);
                }
                return p(e3);
              }
              if (e3.type === "Buffer" && Array.isArray(e3.data)) {
                return p(e3.data);
              }
            }
            throw new TypeError("The first argument must be one of type string, Buffer, ArrayBuffer, Array, or Array-like Object.");
          }
          function v (e3) {
            if (e3 >= r2) {
              throw new RangeError("Attempt to allocate Buffer larger than maximum size: 0x" + r2.toString(16) + " bytes");
            }
            return e3 | 0;
          }
          function b (e3) {
            if (+e3 != e3) {
              e3 = 0;
            }
            return h.alloc(+e3);
          }
          h.isBuffer = function e3 (t3) {
            return t3 != null && t3._isBuffer === true;
          };
          h.compare = function e3 (t3, r3) {
            if (!h.isBuffer(t3) || !h.isBuffer(r3)) {
              throw new TypeError("Arguments must be Buffers");
            }
            if (t3 === r3) return 0;
            var n2 = t3.length;
            var i2 = r3.length;
            for (var o2 = 0, a2 = Math.min(n2, i2); o2 < a2; ++o2) {
              if (t3[o2] !== r3[o2]) {
                n2 = t3[o2];
                i2 = r3[o2];
                break;
              }
            }
            if (n2 < i2) return -1;
            if (i2 < n2) return 1;
            return 0;
          };
          h.isEncoding = function e3 (t3) {
            switch (String(t3).toLowerCase()) {
              case "hex":
              case "utf8":
              case "utf-8":
              case "ascii":
              case "latin1":
              case "binary":
              case "base64":
              case "ucs2":
              case "ucs-2":
              case "utf16le":
              case "utf-16le":
                return true;
              default:
                return false;
            }
          };
          h.concat = function e3 (t3, r3) {
            if (!Array.isArray(t3)) {
              throw new TypeError('"list" argument must be an Array of Buffers');
            }
            if (t3.length === 0) {
              return h.alloc(0);
            }
            var n2;
            if (r3 === void 0) {
              r3 = 0;
              for (n2 = 0; n2 < t3.length; ++n2) {
                r3 += t3[n2].length;
              }
            }
            var i2 = h.allocUnsafe(r3);
            var o2 = 0;
            for (n2 = 0; n2 < t3.length; ++n2) {
              var a2 = t3[n2];
              if (ArrayBuffer.isView(a2)) {
                a2 = h.from(a2);
              }
              if (!h.isBuffer(a2)) {
                throw new TypeError('"list" argument must be an Array of Buffers');
              }
              a2.copy(i2, o2);
              o2 += a2.length;
            }
            return i2;
          };
          function m (e3, t3) {
            if (h.isBuffer(e3)) {
              return e3.length;
            }
            if (ArrayBuffer.isView(e3) || $(e3)) {
              return e3.byteLength;
            }
            if (typeof e3 !== "string") {
              e3 = "" + e3;
            }
            var r3 = e3.length;
            if (r3 === 0) return 0;
            var n2 = false;
            for (; ; ) {
              switch (t3) {
                case "ascii":
                case "latin1":
                case "binary":
                  return r3;
                case "utf8":
                case "utf-8":
                case void 0:
                  return G(e3).length;
                case "ucs2":
                case "ucs-2":
                case "utf16le":
                case "utf-16le":
                  return r3 * 2;
                case "hex":
                  return r3 >>> 1;
                case "base64":
                  return X(e3).length;
                default:
                  if (n2) return G(e3).length;
                  t3 = ("" + t3).toLowerCase();
                  n2 = true;
              }
            }
          }
          h.byteLength = m;
          function w (e3, t3, r3) {
            var n2 = false;
            if (t3 === void 0 || t3 < 0) {
              t3 = 0;
            }
            if (t3 > this.length) {
              return "";
            }
            if (r3 === void 0 || r3 > this.length) {
              r3 = this.length;
            }
            if (r3 <= 0) {
              return "";
            }
            r3 >>>= 0;
            t3 >>>= 0;
            if (r3 <= t3) {
              return "";
            }
            if (!e3) e3 = "utf8";
            while (true) {
              switch (e3) {
                case "hex":
                  return O(this, t3, r3);
                case "utf8":
                case "utf-8":
                  return M(this, t3, r3);
                case "ascii":
                  return F(this, t3, r3);
                case "latin1":
                case "binary":
                  return I(this, t3, r3);
                case "base64":
                  return L(this, t3, r3);
                case "ucs2":
                case "ucs-2":
                case "utf16le":
                case "utf-16le":
                  return j(this, t3, r3);
                default:
                  if (n2) throw new TypeError("Unknown encoding: " + e3);
                  e3 = (e3 + "").toLowerCase();
                  n2 = true;
              }
            }
          }
          h.prototype._isBuffer = true;
          function _ (e3, t3, r3) {
            var n2 = e3[t3];
            e3[t3] = e3[r3];
            e3[r3] = n2;
          }
          h.prototype.swap16 = function e3 () {
            var t3 = this.length;
            if (t3 % 2 !== 0) {
              throw new RangeError("Buffer size must be a multiple of 16-bits");
            }
            for (var r3 = 0; r3 < t3; r3 += 2) {
              _(this, r3, r3 + 1);
            }
            return this;
          };
          h.prototype.swap32 = function e3 () {
            var t3 = this.length;
            if (t3 % 4 !== 0) {
              throw new RangeError("Buffer size must be a multiple of 32-bits");
            }
            for (var r3 = 0; r3 < t3; r3 += 4) {
              _(this, r3, r3 + 3);
              _(this, r3 + 1, r3 + 2);
            }
            return this;
          };
          h.prototype.swap64 = function e3 () {
            var t3 = this.length;
            if (t3 % 8 !== 0) {
              throw new RangeError("Buffer size must be a multiple of 64-bits");
            }
            for (var r3 = 0; r3 < t3; r3 += 8) {
              _(this, r3, r3 + 7);
              _(this, r3 + 1, r3 + 6);
              _(this, r3 + 2, r3 + 5);
              _(this, r3 + 3, r3 + 4);
            }
            return this;
          };
          h.prototype.toString = function e3 () {
            var t3 = this.length;
            if (t3 === 0) return "";
            if (arguments.length === 0) return M(this, 0, t3);
            return w.apply(this, arguments);
          };
          h.prototype.toLocaleString = h.prototype.toString;
          h.prototype.equals = function e3 (t3) {
            if (!h.isBuffer(t3)) throw new TypeError("Argument must be a Buffer");
            if (this === t3) return true;
            return h.compare(this, t3) === 0;
          };
          h.prototype.inspect = function e3 () {
            var t3 = "";
            var r3 = n.INSPECT_MAX_BYTES;
            if (this.length > 0) {
              t3 = this.toString("hex", 0, r3).match(/.{2}/g).join(" ");
              if (this.length > r3) t3 += " ... ";
            }
            return "<Buffer " + t3 + ">";
          };
          h.prototype.compare = function e3 (t3, r3, n2, i2, o2) {
            if (!h.isBuffer(t3)) {
              throw new TypeError("Argument must be a Buffer");
            }
            if (r3 === void 0) {
              r3 = 0;
            }
            if (n2 === void 0) {
              n2 = t3 ? t3.length : 0;
            }
            if (i2 === void 0) {
              i2 = 0;
            }
            if (o2 === void 0) {
              o2 = this.length;
            }
            if (r3 < 0 || n2 > t3.length || i2 < 0 || o2 > this.length) {
              throw new RangeError("out of range index");
            }
            if (i2 >= o2 && r3 >= n2) {
              return 0;
            }
            if (i2 >= o2) {
              return -1;
            }
            if (r3 >= n2) {
              return 1;
            }
            r3 >>>= 0;
            n2 >>>= 0;
            i2 >>>= 0;
            o2 >>>= 0;
            if (this === t3) return 0;
            var a2 = o2 - i2;
            var s2 = n2 - r3;
            var f2 = Math.min(a2, s2);
            var u2 = this.slice(i2, o2);
            var l2 = t3.slice(r3, n2);
            for (var c2 = 0; c2 < f2; ++c2) {
              if (u2[c2] !== l2[c2]) {
                a2 = u2[c2];
                s2 = l2[c2];
                break;
              }
            }
            if (a2 < s2) return -1;
            if (s2 < a2) return 1;
            return 0;
          };
          function C (e3, t3, r3, n2, i2) {
            if (e3.length === 0) return -1;
            if (typeof r3 === "string") {
              n2 = r3;
              r3 = 0;
            } else if (r3 > 2147483647) {
              r3 = 2147483647;
            } else if (r3 < -2147483648) {
              r3 = -2147483648;
            }
            r3 = +r3;
            if (K(r3)) {
              r3 = i2 ? 0 : e3.length - 1;
            }
            if (r3 < 0) r3 = e3.length + r3;
            if (r3 >= e3.length) {
              if (i2) return -1;
              else r3 = e3.length - 1;
            } else if (r3 < 0) {
              if (i2) r3 = 0;
              else return -1;
            }
            if (typeof t3 === "string") {
              t3 = h.from(t3, n2);
            }
            if (h.isBuffer(t3)) {
              if (t3.length === 0) {
                return -1;
              }
              return E(e3, t3, r3, n2, i2);
            } else if (typeof t3 === "number") {
              t3 = t3 & 255;
              if (typeof Uint8Array.prototype.indexOf === "function") {
                if (i2) {
                  return Uint8Array.prototype.indexOf.call(e3, t3, r3);
                } else {
                  return Uint8Array.prototype.lastIndexOf.call(e3, t3, r3);
                }
              }
              return E(e3, [t3], r3, n2, i2);
            }
            throw new TypeError("val must be string, number or Buffer");
          }
          function E (e3, t3, r3, n2, i2) {
            var o2 = 1;
            var a2 = e3.length;
            var s2 = t3.length;
            if (n2 !== void 0) {
              n2 = String(n2).toLowerCase();
              if (n2 === "ucs2" || n2 === "ucs-2" || n2 === "utf16le" || n2 === "utf-16le") {
                if (e3.length < 2 || t3.length < 2) {
                  return -1;
                }
                o2 = 2;
                a2 /= 2;
                s2 /= 2;
                r3 /= 2;
              }
            }
            function f2 (e4, t4) {
              if (o2 === 1) {
                return e4[t4];
              } else {
                return e4.readUInt16BE(t4 * o2);
              }
            }
            var u2;
            if (i2) {
              var l2 = -1;
              for (u2 = r3; u2 < a2; u2++) {
                if (f2(e3, u2) === f2(t3, l2 === -1 ? 0 : u2 - l2)) {
                  if (l2 === -1) l2 = u2;
                  if (u2 - l2 + 1 === s2) return l2 * o2;
                } else {
                  if (l2 !== -1) u2 -= u2 - l2;
                  l2 = -1;
                }
              }
            } else {
              if (r3 + s2 > a2) r3 = a2 - s2;
              for (u2 = r3; u2 >= 0; u2--) {
                var c2 = true;
                for (var h2 = 0; h2 < s2; h2++) {
                  if (f2(e3, u2 + h2) !== f2(t3, h2)) {
                    c2 = false;
                    break;
                  }
                }
                if (c2) return u2;
              }
            }
            return -1;
          }
          h.prototype.includes = function e3 (t3, r3, n2) {
            return this.indexOf(t3, r3, n2) !== -1;
          };
          h.prototype.indexOf = function e3 (t3, r3, n2) {
            return C(this, t3, r3, n2, true);
          };
          h.prototype.lastIndexOf = function e3 (t3, r3, n2) {
            return C(this, t3, r3, n2, false);
          };
          function S (e3, t3, r3, n2) {
            r3 = Number(r3) || 0;
            var i2 = e3.length - r3;
            if (!n2) {
              n2 = i2;
            } else {
              n2 = Number(n2);
              if (n2 > i2) {
                n2 = i2;
              }
            }
            var o2 = t3.length;
            if (n2 > o2 / 2) {
              n2 = o2 / 2;
            }
            for (var a2 = 0; a2 < n2; ++a2) {
              var s2 = parseInt(t3.substr(a2 * 2, 2), 16);
              if (K(s2)) return a2;
              e3[r3 + a2] = s2;
            }
            return a2;
          }
          function T (e3, t3, r3, n2) {
            return Z(G(t3, e3.length - r3), e3, r3, n2);
          }
          function k (e3, t3, r3, n2) {
            return Z(Y(t3), e3, r3, n2);
          }
          function R (e3, t3, r3, n2) {
            return k(e3, t3, r3, n2);
          }
          function A (e3, t3, r3, n2) {
            return Z(X(t3), e3, r3, n2);
          }
          function x (e3, t3, r3, n2) {
            return Z(J(t3, e3.length - r3), e3, r3, n2);
          }
          h.prototype.write = function e3 (t3, r3, n2, i2) {
            if (r3 === void 0) {
              i2 = "utf8";
              n2 = this.length;
              r3 = 0;
            } else if (n2 === void 0 && typeof r3 === "string") {
              i2 = r3;
              n2 = this.length;
              r3 = 0;
            } else if (isFinite(r3)) {
              r3 = r3 >>> 0;
              if (isFinite(n2)) {
                n2 = n2 >>> 0;
                if (i2 === void 0) i2 = "utf8";
              } else {
                i2 = n2;
                n2 = void 0;
              }
            } else {
              throw new Error("Buffer.write(string, encoding, offset[, length]) is no longer supported");
            }
            var o2 = this.length - r3;
            if (n2 === void 0 || n2 > o2) n2 = o2;
            if (t3.length > 0 && (n2 < 0 || r3 < 0) || r3 > this.length) {
              throw new RangeError("Attempt to write outside buffer bounds");
            }
            if (!i2) i2 = "utf8";
            var a2 = false;
            for (; ; ) {
              switch (i2) {
                case "hex":
                  return S(this, t3, r3, n2);
                case "utf8":
                case "utf-8":
                  return T(this, t3, r3, n2);
                case "ascii":
                  return k(this, t3, r3, n2);
                case "latin1":
                case "binary":
                  return R(this, t3, r3, n2);
                case "base64":
                  return A(this, t3, r3, n2);
                case "ucs2":
                case "ucs-2":
                case "utf16le":
                case "utf-16le":
                  return x(this, t3, r3, n2);
                default:
                  if (a2) throw new TypeError("Unknown encoding: " + i2);
                  i2 = ("" + i2).toLowerCase();
                  a2 = true;
              }
            }
          };
          h.prototype.toJSON = function e3 () {
            return { type: "Buffer", data: Array.prototype.slice.call(this._arr || this, 0) };
          };
          function L (e3, t3, r3) {
            if (t3 === 0 && r3 === e3.length) {
              return i.fromByteArray(e3);
            } else {
              return i.fromByteArray(e3.slice(t3, r3));
            }
          }
          function M (e3, t3, r3) {
            r3 = Math.min(e3.length, r3);
            var n2 = [];
            var i2 = t3;
            while (i2 < r3) {
              var o2 = e3[i2];
              var a2 = null;
              var s2 = o2 > 239 ? 4 : o2 > 223 ? 3 : o2 > 191 ? 2 : 1;
              if (i2 + s2 <= r3) {
                var f2, u2, l2, c2;
                switch (s2) {
                  case 1:
                    if (o2 < 128) {
                      a2 = o2;
                    }
                    break;
                  case 2:
                    f2 = e3[i2 + 1];
                    if ((f2 & 192) === 128) {
                      c2 = (o2 & 31) << 6 | f2 & 63;
                      if (c2 > 127) {
                        a2 = c2;
                      }
                    }
                    break;
                  case 3:
                    f2 = e3[i2 + 1];
                    u2 = e3[i2 + 2];
                    if ((f2 & 192) === 128 && (u2 & 192) === 128) {
                      c2 = (o2 & 15) << 12 | (f2 & 63) << 6 | u2 & 63;
                      if (c2 > 2047 && (c2 < 55296 || c2 > 57343)) {
                        a2 = c2;
                      }
                    }
                    break;
                  case 4:
                    f2 = e3[i2 + 1];
                    u2 = e3[i2 + 2];
                    l2 = e3[i2 + 3];
                    if ((f2 & 192) === 128 && (u2 & 192) === 128 && (l2 & 192) === 128) {
                      c2 = (o2 & 15) << 18 | (f2 & 63) << 12 | (u2 & 63) << 6 | l2 & 63;
                      if (c2 > 65535 && c2 < 1114112) {
                        a2 = c2;
                      }
                    }
                }
              }
              if (a2 === null) {
                a2 = 65533;
                s2 = 1;
              } else if (a2 > 65535) {
                a2 -= 65536;
                n2.push(a2 >>> 10 & 1023 | 55296);
                a2 = 56320 | a2 & 1023;
              }
              n2.push(a2);
              i2 += s2;
            }
            return B(n2);
          }
          var N = 4096;
          function B (e3) {
            var t3 = e3.length;
            if (t3 <= N) {
              return String.fromCharCode.apply(String, e3);
            }
            var r3 = "";
            var n2 = 0;
            while (n2 < t3) {
              r3 += String.fromCharCode.apply(String, e3.slice(n2, n2 += N));
            }
            return r3;
          }
          function F (e3, t3, r3) {
            var n2 = "";
            r3 = Math.min(e3.length, r3);
            for (var i2 = t3; i2 < r3; ++i2) {
              n2 += String.fromCharCode(e3[i2] & 127);
            }
            return n2;
          }
          function I (e3, t3, r3) {
            var n2 = "";
            r3 = Math.min(e3.length, r3);
            for (var i2 = t3; i2 < r3; ++i2) {
              n2 += String.fromCharCode(e3[i2]);
            }
            return n2;
          }
          function O (e3, t3, r3) {
            var n2 = e3.length;
            if (!t3 || t3 < 0) t3 = 0;
            if (!r3 || r3 < 0 || r3 > n2) r3 = n2;
            var i2 = "";
            for (var o2 = t3; o2 < r3; ++o2) {
              i2 += V(e3[o2]);
            }
            return i2;
          }
          function j (e3, t3, r3) {
            var n2 = e3.slice(t3, r3);
            var i2 = "";
            for (var o2 = 0; o2 < n2.length; o2 += 2) {
              i2 += String.fromCharCode(n2[o2] + n2[o2 + 1] * 256);
            }
            return i2;
          }
          h.prototype.slice = function e3 (t3, r3) {
            var n2 = this.length;
            t3 = ~~t3;
            r3 = r3 === void 0 ? n2 : ~~r3;
            if (t3 < 0) {
              t3 += n2;
              if (t3 < 0) t3 = 0;
            } else if (t3 > n2) {
              t3 = n2;
            }
            if (r3 < 0) {
              r3 += n2;
              if (r3 < 0) r3 = 0;
            } else if (r3 > n2) {
              r3 = n2;
            }
            if (r3 < t3) r3 = t3;
            var i2 = this.subarray(t3, r3);
            i2.__proto__ = h.prototype;
            return i2;
          };
          function D (e3, t3, r3) {
            if (e3 % 1 !== 0 || e3 < 0) throw new RangeError("offset is not uint");
            if (e3 + t3 > r3) throw new RangeError("Trying to access beyond buffer length");
          }
          h.prototype.readUIntLE = function e3 (t3, r3, n2) {
            t3 = t3 >>> 0;
            r3 = r3 >>> 0;
            if (!n2) D(t3, r3, this.length);
            var i2 = this[t3];
            var o2 = 1;
            var a2 = 0;
            while (++a2 < r3 && (o2 *= 256)) {
              i2 += this[t3 + a2] * o2;
            }
            return i2;
          };
          h.prototype.readUIntBE = function e3 (t3, r3, n2) {
            t3 = t3 >>> 0;
            r3 = r3 >>> 0;
            if (!n2) {
              D(t3, r3, this.length);
            }
            var i2 = this[t3 + --r3];
            var o2 = 1;
            while (r3 > 0 && (o2 *= 256)) {
              i2 += this[t3 + --r3] * o2;
            }
            return i2;
          };
          h.prototype.readUInt8 = function e3 (t3, r3) {
            t3 = t3 >>> 0;
            if (!r3) D(t3, 1, this.length);
            return this[t3];
          };
          h.prototype.readUInt16LE = function e3 (t3, r3) {
            t3 = t3 >>> 0;
            if (!r3) D(t3, 2, this.length);
            return this[t3] | this[t3 + 1] << 8;
          };
          h.prototype.readUInt16BE = function e3 (t3, r3) {
            t3 = t3 >>> 0;
            if (!r3) D(t3, 2, this.length);
            return this[t3] << 8 | this[t3 + 1];
          };
          h.prototype.readUInt32LE = function e3 (t3, r3) {
            t3 = t3 >>> 0;
            if (!r3) D(t3, 4, this.length);
            return (this[t3] | this[t3 + 1] << 8 | this[t3 + 2] << 16) + this[t3 + 3] * 16777216;
          };
          h.prototype.readUInt32BE = function e3 (t3, r3) {
            t3 = t3 >>> 0;
            if (!r3) D(t3, 4, this.length);
            return this[t3] * 16777216 + (this[t3 + 1] << 16 | this[t3 + 2] << 8 | this[t3 + 3]);
          };
          h.prototype.readIntLE = function e3 (t3, r3, n2) {
            t3 = t3 >>> 0;
            r3 = r3 >>> 0;
            if (!n2) D(t3, r3, this.length);
            var i2 = this[t3];
            var o2 = 1;
            var a2 = 0;
            while (++a2 < r3 && (o2 *= 256)) {
              i2 += this[t3 + a2] * o2;
            }
            o2 *= 128;
            if (i2 >= o2) i2 -= Math.pow(2, 8 * r3);
            return i2;
          };
          h.prototype.readIntBE = function e3 (t3, r3, n2) {
            t3 = t3 >>> 0;
            r3 = r3 >>> 0;
            if (!n2) D(t3, r3, this.length);
            var i2 = r3;
            var o2 = 1;
            var a2 = this[t3 + --i2];
            while (i2 > 0 && (o2 *= 256)) {
              a2 += this[t3 + --i2] * o2;
            }
            o2 *= 128;
            if (a2 >= o2) a2 -= Math.pow(2, 8 * r3);
            return a2;
          };
          h.prototype.readInt8 = function e3 (t3, r3) {
            t3 = t3 >>> 0;
            if (!r3) D(t3, 1, this.length);
            if (!(this[t3] & 128)) return this[t3];
            return (255 - this[t3] + 1) * -1;
          };
          h.prototype.readInt16LE = function e3 (t3, r3) {
            t3 = t3 >>> 0;
            if (!r3) D(t3, 2, this.length);
            var n2 = this[t3] | this[t3 + 1] << 8;
            return n2 & 32768 ? n2 | 4294901760 : n2;
          };
          h.prototype.readInt16BE = function e3 (t3, r3) {
            t3 = t3 >>> 0;
            if (!r3) D(t3, 2, this.length);
            var n2 = this[t3 + 1] | this[t3] << 8;
            return n2 & 32768 ? n2 | 4294901760 : n2;
          };
          h.prototype.readInt32LE = function e3 (t3, r3) {
            t3 = t3 >>> 0;
            if (!r3) D(t3, 4, this.length);
            return this[t3] | this[t3 + 1] << 8 | this[t3 + 2] << 16 | this[t3 + 3] << 24;
          };
          h.prototype.readInt32BE = function e3 (t3, r3) {
            t3 = t3 >>> 0;
            if (!r3) D(t3, 4, this.length);
            return this[t3] << 24 | this[t3 + 1] << 16 | this[t3 + 2] << 8 | this[t3 + 3];
          };
          h.prototype.readFloatLE = function e3 (t3, r3) {
            t3 = t3 >>> 0;
            if (!r3) D(t3, 4, this.length);
            return o.read(this, t3, true, 23, 4);
          };
          h.prototype.readFloatBE = function e3 (t3, r3) {
            t3 = t3 >>> 0;
            if (!r3) D(t3, 4, this.length);
            return o.read(this, t3, false, 23, 4);
          };
          h.prototype.readDoubleLE = function e3 (t3, r3) {
            t3 = t3 >>> 0;
            if (!r3) D(t3, 8, this.length);
            return o.read(this, t3, true, 52, 8);
          };
          h.prototype.readDoubleBE = function e3 (t3, r3) {
            t3 = t3 >>> 0;
            if (!r3) D(t3, 8, this.length);
            return o.read(this, t3, false, 52, 8);
          };
          function P (e3, t3, r3, n2, i2, o2) {
            if (!h.isBuffer(e3)) throw new TypeError('"buffer" argument must be a Buffer instance');
            if (t3 > i2 || t3 < o2) throw new RangeError('"value" argument is out of bounds');
            if (r3 + n2 > e3.length) throw new RangeError("Index out of range");
          }
          h.prototype.writeUIntLE = function e3 (t3, r3, n2, i2) {
            t3 = +t3;
            r3 = r3 >>> 0;
            n2 = n2 >>> 0;
            if (!i2) {
              var o2 = Math.pow(2, 8 * n2) - 1;
              P(this, t3, r3, n2, o2, 0);
            }
            var a2 = 1;
            var s2 = 0;
            this[r3] = t3 & 255;
            while (++s2 < n2 && (a2 *= 256)) {
              this[r3 + s2] = t3 / a2 & 255;
            }
            return r3 + n2;
          };
          h.prototype.writeUIntBE = function e3 (t3, r3, n2, i2) {
            t3 = +t3;
            r3 = r3 >>> 0;
            n2 = n2 >>> 0;
            if (!i2) {
              var o2 = Math.pow(2, 8 * n2) - 1;
              P(this, t3, r3, n2, o2, 0);
            }
            var a2 = n2 - 1;
            var s2 = 1;
            this[r3 + a2] = t3 & 255;
            while (--a2 >= 0 && (s2 *= 256)) {
              this[r3 + a2] = t3 / s2 & 255;
            }
            return r3 + n2;
          };
          h.prototype.writeUInt8 = function e3 (t3, r3, n2) {
            t3 = +t3;
            r3 = r3 >>> 0;
            if (!n2) P(this, t3, r3, 1, 255, 0);
            this[r3] = t3 & 255;
            return r3 + 1;
          };
          h.prototype.writeUInt16LE = function e3 (t3, r3, n2) {
            t3 = +t3;
            r3 = r3 >>> 0;
            if (!n2) P(this, t3, r3, 2, 65535, 0);
            this[r3] = t3 & 255;
            this[r3 + 1] = t3 >>> 8;
            return r3 + 2;
          };
          h.prototype.writeUInt16BE = function e3 (t3, r3, n2) {
            t3 = +t3;
            r3 = r3 >>> 0;
            if (!n2) P(this, t3, r3, 2, 65535, 0);
            this[r3] = t3 >>> 8;
            this[r3 + 1] = t3 & 255;
            return r3 + 2;
          };
          h.prototype.writeUInt32LE = function e3 (t3, r3, n2) {
            t3 = +t3;
            r3 = r3 >>> 0;
            if (!n2) P(this, t3, r3, 4, 4294967295, 0);
            this[r3 + 3] = t3 >>> 24;
            this[r3 + 2] = t3 >>> 16;
            this[r3 + 1] = t3 >>> 8;
            this[r3] = t3 & 255;
            return r3 + 4;
          };
          h.prototype.writeUInt32BE = function e3 (t3, r3, n2) {
            t3 = +t3;
            r3 = r3 >>> 0;
            if (!n2) P(this, t3, r3, 4, 4294967295, 0);
            this[r3] = t3 >>> 24;
            this[r3 + 1] = t3 >>> 16;
            this[r3 + 2] = t3 >>> 8;
            this[r3 + 3] = t3 & 255;
            return r3 + 4;
          };
          h.prototype.writeIntLE = function e3 (t3, r3, n2, i2) {
            t3 = +t3;
            r3 = r3 >>> 0;
            if (!i2) {
              var o2 = Math.pow(2, 8 * n2 - 1);
              P(this, t3, r3, n2, o2 - 1, -o2);
            }
            var a2 = 0;
            var s2 = 1;
            var f2 = 0;
            this[r3] = t3 & 255;
            while (++a2 < n2 && (s2 *= 256)) {
              if (t3 < 0 && f2 === 0 && this[r3 + a2 - 1] !== 0) {
                f2 = 1;
              }
              this[r3 + a2] = (t3 / s2 >> 0) - f2 & 255;
            }
            return r3 + n2;
          };
          h.prototype.writeIntBE = function e3 (t3, r3, n2, i2) {
            t3 = +t3;
            r3 = r3 >>> 0;
            if (!i2) {
              var o2 = Math.pow(2, 8 * n2 - 1);
              P(this, t3, r3, n2, o2 - 1, -o2);
            }
            var a2 = n2 - 1;
            var s2 = 1;
            var f2 = 0;
            this[r3 + a2] = t3 & 255;
            while (--a2 >= 0 && (s2 *= 256)) {
              if (t3 < 0 && f2 === 0 && this[r3 + a2 + 1] !== 0) {
                f2 = 1;
              }
              this[r3 + a2] = (t3 / s2 >> 0) - f2 & 255;
            }
            return r3 + n2;
          };
          h.prototype.writeInt8 = function e3 (t3, r3, n2) {
            t3 = +t3;
            r3 = r3 >>> 0;
            if (!n2) P(this, t3, r3, 1, 127, -128);
            if (t3 < 0) t3 = 255 + t3 + 1;
            this[r3] = t3 & 255;
            return r3 + 1;
          };
          h.prototype.writeInt16LE = function e3 (t3, r3, n2) {
            t3 = +t3;
            r3 = r3 >>> 0;
            if (!n2) P(this, t3, r3, 2, 32767, -32768);
            this[r3] = t3 & 255;
            this[r3 + 1] = t3 >>> 8;
            return r3 + 2;
          };
          h.prototype.writeInt16BE = function e3 (t3, r3, n2) {
            t3 = +t3;
            r3 = r3 >>> 0;
            if (!n2) P(this, t3, r3, 2, 32767, -32768);
            this[r3] = t3 >>> 8;
            this[r3 + 1] = t3 & 255;
            return r3 + 2;
          };
          h.prototype.writeInt32LE = function e3 (t3, r3, n2) {
            t3 = +t3;
            r3 = r3 >>> 0;
            if (!n2) P(this, t3, r3, 4, 2147483647, -2147483648);
            this[r3] = t3 & 255;
            this[r3 + 1] = t3 >>> 8;
            this[r3 + 2] = t3 >>> 16;
            this[r3 + 3] = t3 >>> 24;
            return r3 + 4;
          };
          h.prototype.writeInt32BE = function e3 (t3, r3, n2) {
            t3 = +t3;
            r3 = r3 >>> 0;
            if (!n2) P(this, t3, r3, 4, 2147483647, -2147483648);
            if (t3 < 0) t3 = 4294967295 + t3 + 1;
            this[r3] = t3 >>> 24;
            this[r3 + 1] = t3 >>> 16;
            this[r3 + 2] = t3 >>> 8;
            this[r3 + 3] = t3 & 255;
            return r3 + 4;
          };
          function U (e3, t3, r3, n2, i2, o2) {
            if (r3 + n2 > e3.length) throw new RangeError("Index out of range");
            if (r3 < 0) throw new RangeError("Index out of range");
          }
          function W (e3, t3, r3, n2, i2) {
            t3 = +t3;
            r3 = r3 >>> 0;
            if (!i2) {
              U(e3, t3, r3, 4, 34028234663852886e22, -34028234663852886e22);
            }
            o.write(e3, t3, r3, n2, 23, 4);
            return r3 + 4;
          }
          h.prototype.writeFloatLE = function e3 (t3, r3, n2) {
            return W(this, t3, r3, true, n2);
          };
          h.prototype.writeFloatBE = function e3 (t3, r3, n2) {
            return W(this, t3, r3, false, n2);
          };
          function q (e3, t3, r3, n2, i2) {
            t3 = +t3;
            r3 = r3 >>> 0;
            if (!i2) {
              U(e3, t3, r3, 8, 17976931348623157e292, -17976931348623157e292);
            }
            o.write(e3, t3, r3, n2, 52, 8);
            return r3 + 8;
          }
          h.prototype.writeDoubleLE = function e3 (t3, r3, n2) {
            return q(this, t3, r3, true, n2);
          };
          h.prototype.writeDoubleBE = function e3 (t3, r3, n2) {
            return q(this, t3, r3, false, n2);
          };
          h.prototype.copy = function e3 (t3, r3, n2, i2) {
            if (!h.isBuffer(t3)) throw new TypeError("argument should be a Buffer");
            if (!n2) n2 = 0;
            if (!i2 && i2 !== 0) i2 = this.length;
            if (r3 >= t3.length) r3 = t3.length;
            if (!r3) r3 = 0;
            if (i2 > 0 && i2 < n2) i2 = n2;
            if (i2 === n2) return 0;
            if (t3.length === 0 || this.length === 0) return 0;
            if (r3 < 0) {
              throw new RangeError("targetStart out of bounds");
            }
            if (n2 < 0 || n2 >= this.length) throw new RangeError("Index out of range");
            if (i2 < 0) throw new RangeError("sourceEnd out of bounds");
            if (i2 > this.length) i2 = this.length;
            if (t3.length - r3 < i2 - n2) {
              i2 = t3.length - r3 + n2;
            }
            var o2 = i2 - n2;
            if (this === t3 && typeof Uint8Array.prototype.copyWithin === "function") {
              this.copyWithin(r3, n2, i2);
            } else if (this === t3 && n2 < r3 && r3 < i2) {
              for (var a2 = o2 - 1; a2 >= 0; --a2) {
                t3[a2 + r3] = this[a2 + n2];
              }
            } else {
              Uint8Array.prototype.set.call(t3, this.subarray(n2, i2), r3);
            }
            return o2;
          };
          h.prototype.fill = function e3 (t3, r3, n2, i2) {
            if (typeof t3 === "string") {
              if (typeof r3 === "string") {
                i2 = r3;
                r3 = 0;
                n2 = this.length;
              } else if (typeof n2 === "string") {
                i2 = n2;
                n2 = this.length;
              }
              if (i2 !== void 0 && typeof i2 !== "string") {
                throw new TypeError("encoding must be a string");
              }
              if (typeof i2 === "string" && !h.isEncoding(i2)) {
                throw new TypeError("Unknown encoding: " + i2);
              }
              if (t3.length === 1) {
                var o2 = t3.charCodeAt(0);
                if (i2 === "utf8" && o2 < 128 || i2 === "latin1") {
                  t3 = o2;
                }
              }
            } else if (typeof t3 === "number") {
              t3 = t3 & 255;
            }
            if (r3 < 0 || this.length < r3 || this.length < n2) {
              throw new RangeError("Out of range index");
            }
            if (n2 <= r3) {
              return this;
            }
            r3 = r3 >>> 0;
            n2 = n2 === void 0 ? this.length : n2 >>> 0;
            if (!t3) t3 = 0;
            var a2;
            if (typeof t3 === "number") {
              for (a2 = r3; a2 < n2; ++a2) {
                this[a2] = t3;
              }
            } else {
              var s2 = h.isBuffer(t3) ? t3 : new h(t3, i2);
              var f2 = s2.length;
              if (f2 === 0) {
                throw new TypeError('The value "' + t3 + '" is invalid for argument "value"');
              }
              for (a2 = 0; a2 < n2 - r3; ++a2) {
                this[a2 + r3] = s2[a2 % f2];
              }
            }
            return this;
          };
          var z = /[^+/0-9A-Za-z-_]/g;
          function H (e3) {
            e3 = e3.split("=")[0];
            e3 = e3.trim().replace(z, "");
            if (e3.length < 2) return "";
            while (e3.length % 4 !== 0) {
              e3 = e3 + "=";
            }
            return e3;
          }
          function V (e3) {
            if (e3 < 16) return "0" + e3.toString(16);
            return e3.toString(16);
          }
          function G (e3, t3) {
            t3 = t3 || Infinity;
            var r3;
            var n2 = e3.length;
            var i2 = null;
            var o2 = [];
            for (var a2 = 0; a2 < n2; ++a2) {
              r3 = e3.charCodeAt(a2);
              if (r3 > 55295 && r3 < 57344) {
                if (!i2) {
                  if (r3 > 56319) {
                    if ((t3 -= 3) > -1) o2.push(239, 191, 189);
                    continue;
                  } else if (a2 + 1 === n2) {
                    if ((t3 -= 3) > -1) o2.push(239, 191, 189);
                    continue;
                  }
                  i2 = r3;
                  continue;
                }
                if (r3 < 56320) {
                  if ((t3 -= 3) > -1) o2.push(239, 191, 189);
                  i2 = r3;
                  continue;
                }
                r3 = (i2 - 55296 << 10 | r3 - 56320) + 65536;
              } else if (i2) {
                if ((t3 -= 3) > -1) o2.push(239, 191, 189);
              }
              i2 = null;
              if (r3 < 128) {
                if ((t3 -= 1) < 0) break;
                o2.push(r3);
              } else if (r3 < 2048) {
                if ((t3 -= 2) < 0) break;
                o2.push(r3 >> 6 | 192, r3 & 63 | 128);
              } else if (r3 < 65536) {
                if ((t3 -= 3) < 0) break;
                o2.push(r3 >> 12 | 224, r3 >> 6 & 63 | 128, r3 & 63 | 128);
              } else if (r3 < 1114112) {
                if ((t3 -= 4) < 0) break;
                o2.push(r3 >> 18 | 240, r3 >> 12 & 63 | 128, r3 >> 6 & 63 | 128, r3 & 63 | 128);
              } else {
                throw new Error("Invalid code point");
              }
            }
            return o2;
          }
          function Y (e3) {
            var t3 = [];
            for (var r3 = 0; r3 < e3.length; ++r3) {
              t3.push(e3.charCodeAt(r3) & 255);
            }
            return t3;
          }
          function J (e3, t3) {
            var r3, n2, i2;
            var o2 = [];
            for (var a2 = 0; a2 < e3.length; ++a2) {
              if ((t3 -= 2) < 0) break;
              r3 = e3.charCodeAt(a2);
              n2 = r3 >> 8;
              i2 = r3 % 256;
              o2.push(i2);
              o2.push(n2);
            }
            return o2;
          }
          function X (e3) {
            return i.toByteArray(H(e3));
          }
          function Z (e3, t3, r3, n2) {
            for (var i2 = 0; i2 < n2; ++i2) {
              if (i2 + r3 >= t3.length || i2 >= e3.length) break;
              t3[i2 + r3] = e3[i2];
            }
            return i2;
          }
          function $ (e3) {
            return e3 instanceof ArrayBuffer || e3 != null && e3.constructor != null && e3.constructor.name === "ArrayBuffer" && typeof e3.byteLength === "number";
          }
          function K (e3) {
            return e3 !== e3;
          }
        }, { "base64-js": 1, ieee754: 9 }], 4: [function (e2, t2, r2) {
          var f = Object.create || E;
          var s = Object.keys || S;
          var o = Function.prototype.bind || T;
          function n () {
            if (!this._events || !Object.prototype.hasOwnProperty.call(this, "_events")) {
              this._events = f(null);
              this._eventsCount = 0;
            }
            this._maxListeners = this._maxListeners || void 0;
          }
          t2.exports = n;
          n.EventEmitter = n;
          n.prototype._events = void 0;
          n.prototype._maxListeners = void 0;
          var i = 10;
          var a;
          try {
            var u = {};
            if (Object.defineProperty) Object.defineProperty(u, "x", { value: 0 });
            a = u.x === 0;
          } catch (e3) {
            a = false;
          }
          if (a) {
            Object.defineProperty(n, "defaultMaxListeners", { enumerable: true, get: function () {
              return i;
            }, set: function (e3) {
              if (typeof e3 !== "number" || e3 < 0 || e3 !== e3) throw new TypeError('"defaultMaxListeners" must be a positive number');
              i = e3;
            } });
          } else {
            n.defaultMaxListeners = i;
          }
          n.prototype.setMaxListeners = function e3 (t3) {
            if (typeof t3 !== "number" || t3 < 0 || isNaN(t3)) throw new TypeError('"n" argument must be a positive number');
            this._maxListeners = t3;
            return this;
          };
          function l (e3) {
            if (e3._maxListeners === void 0) return n.defaultMaxListeners;
            return e3._maxListeners;
          }
          n.prototype.getMaxListeners = function e3 () {
            return l(this);
          };
          function c (e3, t3, r3) {
            if (t3) e3.call(r3);
            else {
              var n2 = e3.length;
              var i2 = _(e3, n2);
              for (var o2 = 0; o2 < n2; ++o2) i2[o2].call(r3);
            }
          }
          function h (e3, t3, r3, n2) {
            if (t3) e3.call(r3, n2);
            else {
              var i2 = e3.length;
              var o2 = _(e3, i2);
              for (var a2 = 0; a2 < i2; ++a2) o2[a2].call(r3, n2);
            }
          }
          function d (e3, t3, r3, n2, i2) {
            if (t3) e3.call(r3, n2, i2);
            else {
              var o2 = e3.length;
              var a2 = _(e3, o2);
              for (var s2 = 0; s2 < o2; ++s2) a2[s2].call(r3, n2, i2);
            }
          }
          function p (e3, t3, r3, n2, i2, o2) {
            if (t3) e3.call(r3, n2, i2, o2);
            else {
              var a2 = e3.length;
              var s2 = _(e3, a2);
              for (var f2 = 0; f2 < a2; ++f2) s2[f2].call(r3, n2, i2, o2);
            }
          }
          function g (e3, t3, r3, n2) {
            if (t3) e3.apply(r3, n2);
            else {
              var i2 = e3.length;
              var o2 = _(e3, i2);
              for (var a2 = 0; a2 < i2; ++a2) o2[a2].apply(r3, n2);
            }
          }
          n.prototype.emit = function e3 (t3) {
            var r3, n2, i2, o2, a2, s2;
            var f2 = t3 === "error";
            s2 = this._events;
            if (s2) f2 = f2 && s2.error == null;
            else if (!f2) return false;
            if (f2) {
              if (arguments.length > 1) r3 = arguments[1];
              if (r3 instanceof Error) {
                throw r3;
              } else {
                var u2 = new Error('Unhandled "error" event. (' + r3 + ")");
                u2.context = r3;
                throw u2;
              }
              return false;
            }
            n2 = s2[t3];
            if (!n2) return false;
            var l2 = typeof n2 === "function";
            i2 = arguments.length;
            switch (i2) {
              case 1:
                c(n2, l2, this);
                break;
              case 2:
                h(n2, l2, this, arguments[1]);
                break;
              case 3:
                d(n2, l2, this, arguments[1], arguments[2]);
                break;
              case 4:
                p(n2, l2, this, arguments[1], arguments[2], arguments[3]);
                break;
              default:
                o2 = new Array(i2 - 1);
                for (a2 = 1; a2 < i2; a2++) o2[a2 - 1] = arguments[a2];
                g(n2, l2, this, o2);
            }
            return true;
          };
          function y (e3, t3, r3, n2) {
            var i2;
            var o2;
            var a2;
            if (typeof r3 !== "function") throw new TypeError('"listener" argument must be a function');
            o2 = e3._events;
            if (!o2) {
              o2 = e3._events = f(null);
              e3._eventsCount = 0;
            } else {
              if (o2.newListener) {
                e3.emit("newListener", t3, r3.listener ? r3.listener : r3);
                o2 = e3._events;
              }
              a2 = o2[t3];
            }
            if (!a2) {
              a2 = o2[t3] = r3;
              ++e3._eventsCount;
            } else {
              if (typeof a2 === "function") {
                a2 = o2[t3] = n2 ? [r3, a2] : [a2, r3];
              } else {
                if (n2) {
                  a2.unshift(r3);
                } else {
                  a2.push(r3);
                }
              }
              if (!a2.warned) {
                i2 = l(e3);
                if (i2 && i2 > 0 && a2.length > i2) {
                  a2.warned = true;
                  var s2 = new Error("Possible EventEmitter memory leak detected. " + a2.length + ' "' + String(t3) + '" listeners added. Use emitter.setMaxListeners() to increase limit.');
                  s2.name = "MaxListenersExceededWarning";
                  s2.emitter = e3;
                  s2.type = t3;
                  s2.count = a2.length;
                  if (typeof console === "object" && console.warn) {
                    console.warn("%s: %s", s2.name, s2.message);
                  }
                }
              }
            }
            return e3;
          }
          n.prototype.addListener = function e3 (t3, r3) {
            return y(this, t3, r3, false);
          };
          n.prototype.on = n.prototype.addListener;
          n.prototype.prependListener = function e3 (t3, r3) {
            return y(this, t3, r3, true);
          };
          function v () {
            if (!this.fired) {
              this.target.removeListener(this.type, this.wrapFn);
              this.fired = true;
              switch (arguments.length) {
                case 0:
                  return this.listener.call(this.target);
                case 1:
                  return this.listener.call(this.target, arguments[0]);
                case 2:
                  return this.listener.call(this.target, arguments[0], arguments[1]);
                case 3:
                  return this.listener.call(this.target, arguments[0], arguments[1], arguments[2]);
                default:
                  var e3 = new Array(arguments.length);
                  for (var t3 = 0; t3 < e3.length; ++t3) e3[t3] = arguments[t3];
                  this.listener.apply(this.target, e3);
              }
            }
          }
          function b (e3, t3, r3) {
            var n2 = { fired: false, wrapFn: void 0, target: e3, type: t3, listener: r3 };
            var i2 = o.call(v, n2);
            i2.listener = r3;
            n2.wrapFn = i2;
            return i2;
          }
          n.prototype.once = function e3 (t3, r3) {
            if (typeof r3 !== "function") throw new TypeError('"listener" argument must be a function');
            this.on(t3, b(this, t3, r3));
            return this;
          };
          n.prototype.prependOnceListener = function e3 (t3, r3) {
            if (typeof r3 !== "function") throw new TypeError('"listener" argument must be a function');
            this.prependListener(t3, b(this, t3, r3));
            return this;
          };
          n.prototype.removeListener = function e3 (t3, r3) {
            var n2, i2, o2, a2, s2;
            if (typeof r3 !== "function") throw new TypeError('"listener" argument must be a function');
            i2 = this._events;
            if (!i2) return this;
            n2 = i2[t3];
            if (!n2) return this;
            if (n2 === r3 || n2.listener === r3) {
              if (--this._eventsCount === 0) this._events = f(null);
              else {
                delete i2[t3];
                if (i2.removeListener) this.emit("removeListener", t3, n2.listener || r3);
              }
            } else if (typeof n2 !== "function") {
              o2 = -1;
              for (a2 = n2.length - 1; a2 >= 0; a2--) {
                if (n2[a2] === r3 || n2[a2].listener === r3) {
                  s2 = n2[a2].listener;
                  o2 = a2;
                  break;
                }
              }
              if (o2 < 0) return this;
              if (o2 === 0) n2.shift();
              else w(n2, o2);
              if (n2.length === 1) i2[t3] = n2[0];
              if (i2.removeListener) this.emit("removeListener", t3, s2 || r3);
            }
            return this;
          };
          n.prototype.removeAllListeners = function e3 (t3) {
            var r3, n2, i2;
            n2 = this._events;
            if (!n2) return this;
            if (!n2.removeListener) {
              if (arguments.length === 0) {
                this._events = f(null);
                this._eventsCount = 0;
              } else if (n2[t3]) {
                if (--this._eventsCount === 0) this._events = f(null);
                else delete n2[t3];
              }
              return this;
            }
            if (arguments.length === 0) {
              var o2 = s(n2);
              var a2;
              for (i2 = 0; i2 < o2.length; ++i2) {
                a2 = o2[i2];
                if (a2 === "removeListener") continue;
                this.removeAllListeners(a2);
              }
              this.removeAllListeners("removeListener");
              this._events = f(null);
              this._eventsCount = 0;
              return this;
            }
            r3 = n2[t3];
            if (typeof r3 === "function") {
              this.removeListener(t3, r3);
            } else if (r3) {
              for (i2 = r3.length - 1; i2 >= 0; i2--) {
                this.removeListener(t3, r3[i2]);
              }
            }
            return this;
          };
          n.prototype.listeners = function e3 (t3) {
            var r3;
            var n2;
            var i2 = this._events;
            if (!i2) n2 = [];
            else {
              r3 = i2[t3];
              if (!r3) n2 = [];
              else if (typeof r3 === "function") n2 = [r3.listener || r3];
              else n2 = C(r3);
            }
            return n2;
          };
          n.listenerCount = function (e3, t3) {
            if (typeof e3.listenerCount === "function") {
              return e3.listenerCount(t3);
            } else {
              return m.call(e3, t3);
            }
          };
          n.prototype.listenerCount = m;
          function m (e3) {
            var t3 = this._events;
            if (t3) {
              var r3 = t3[e3];
              if (typeof r3 === "function") {
                return 1;
              } else if (r3) {
                return r3.length;
              }
            }
            return 0;
          }
          n.prototype.eventNames = function e3 () {
            return this._eventsCount > 0 ? Reflect.ownKeys(this._events) : [];
          };
          function w (e3, t3) {
            for (var r3 = t3, n2 = r3 + 1, i2 = e3.length; n2 < i2; r3 += 1, n2 += 1) e3[r3] = e3[n2];
            e3.pop();
          }
          function _ (e3, t3) {
            var r3 = new Array(t3);
            for (var n2 = 0; n2 < t3; ++n2) r3[n2] = e3[n2];
            return r3;
          }
          function C (e3) {
            var t3 = new Array(e3.length);
            for (var r3 = 0; r3 < t3.length; ++r3) {
              t3[r3] = e3[r3].listener || e3[r3];
            }
            return t3;
          }
          function E (e3) {
            var t3 = function () {
            };
            t3.prototype = e3;
            return new t3();
          }
          function S (e3) {
            var t3 = [];
            for (var r3 in e3) if (Object.prototype.hasOwnProperty.call(e3, r3)) {
              t3.push(r3);
            }
            return r3;
          }
          function T (e3) {
            var t3 = this;
            return function () {
              return t3.apply(e3, arguments);
            };
          }
        }, {}], 5: [function (e2, t2, y) {
          (function (e3) {
            function t3 (e4) {
              if (Array.isArray) {
                return Array.isArray(e4);
              }
              return g(e4) === "[object Array]";
            }
            y.isArray = t3;
            function r2 (e4) {
              return typeof e4 === "boolean";
            }
            y.isBoolean = r2;
            function n (e4) {
              return e4 === null;
            }
            y.isNull = n;
            function i (e4) {
              return e4 == null;
            }
            y.isNullOrUndefined = i;
            function o (e4) {
              return typeof e4 === "number";
            }
            y.isNumber = o;
            function a (e4) {
              return typeof e4 === "string";
            }
            y.isString = a;
            function s (e4) {
              return typeof e4 === "symbol";
            }
            y.isSymbol = s;
            function f (e4) {
              return e4 === void 0;
            }
            y.isUndefined = f;
            function u (e4) {
              return g(e4) === "[object RegExp]";
            }
            y.isRegExp = u;
            function l (e4) {
              return typeof e4 === "object" && e4 !== null;
            }
            y.isObject = l;
            function c (e4) {
              return g(e4) === "[object Date]";
            }
            y.isDate = c;
            function h (e4) {
              return g(e4) === "[object Error]" || e4 instanceof Error;
            }
            y.isError = h;
            function d (e4) {
              return typeof e4 === "function";
            }
            y.isFunction = d;
            function p (e4) {
              return e4 === null || typeof e4 === "boolean" || typeof e4 === "number" || typeof e4 === "string" || typeof e4 === "symbol" || typeof e4 === "undefined";
            }
            y.isPrimitive = p;
            y.isBuffer = e3.isBuffer;
            function g (e4) {
              return Object.prototype.toString.call(e4);
            }
          }).call(this, { isBuffer: e2("../../is-buffer/index.js") });
        }, { "../../is-buffer/index.js": 11 }], 6: [function (s, f, u) {
          (function (t2) {
            u = f.exports = s("./debug");
            u.log = n;
            u.formatArgs = r2;
            u.save = i;
            u.load = o;
            u.useColors = e2;
            u.storage = "undefined" != typeof chrome && "undefined" != typeof chrome.storage ? chrome.storage.local : a();
            u.colors = ["#0000CC", "#0000FF", "#0033CC", "#0033FF", "#0066CC", "#0066FF", "#0099CC", "#0099FF", "#00CC00", "#00CC33", "#00CC66", "#00CC99", "#00CCCC", "#00CCFF", "#3300CC", "#3300FF", "#3333CC", "#3333FF", "#3366CC", "#3366FF", "#3399CC", "#3399FF", "#33CC00", "#33CC33", "#33CC66", "#33CC99", "#33CCCC", "#33CCFF", "#6600CC", "#6600FF", "#6633CC", "#6633FF", "#66CC00", "#66CC33", "#9900CC", "#9900FF", "#9933CC", "#9933FF", "#99CC00", "#99CC33", "#CC0000", "#CC0033", "#CC0066", "#CC0099", "#CC00CC", "#CC00FF", "#CC3300", "#CC3333", "#CC3366", "#CC3399", "#CC33CC", "#CC33FF", "#CC6600", "#CC6633", "#CC9900", "#CC9933", "#CCCC00", "#CCCC33", "#FF0000", "#FF0033", "#FF0066", "#FF0099", "#FF00CC", "#FF00FF", "#FF3300", "#FF3333", "#FF3366", "#FF3399", "#FF33CC", "#FF33FF", "#FF6600", "#FF6633", "#FF9900", "#FF9933", "#FFCC00", "#FFCC33"];
            function e2 () {
              if (typeof window !== "undefined" && window.process && window.process.type === "renderer") {
                return true;
              }
              if (typeof navigator !== "undefined" && navigator.userAgent && navigator.userAgent.toLowerCase().match(/(edge|trident)\/(\d+)/)) {
                return false;
              }
              return typeof document !== "undefined" && document.documentElement && document.documentElement.style && document.documentElement.style.WebkitAppearance || typeof window !== "undefined" && window.console && (window.console.firebug || window.console.exception && window.console.table) || typeof navigator !== "undefined" && navigator.userAgent && navigator.userAgent.toLowerCase().match(/firefox\/(\d+)/) && parseInt(RegExp.$1, 10) >= 31 || typeof navigator !== "undefined" && navigator.userAgent && navigator.userAgent.toLowerCase().match(/applewebkit\/(\d+)/);
            }
            u.formatters.j = function (e3) {
              try {
                return JSON.stringify(e3);
              } catch (e4) {
                return "[UnexpectedJSONParseError]: " + e4.message;
              }
            };
            function r2 (e3) {
              var t3 = this.useColors;
              e3[0] = (t3 ? "%c" : "") + this.namespace + (t3 ? " %c" : " ") + e3[0] + (t3 ? "%c " : " ") + "+" + u.humanize(this.diff);
              if (!t3) return;
              var r3 = "color: " + this.color;
              e3.splice(1, 0, r3, "color: inherit");
              var n2 = 0;
              var i2 = 0;
              e3[0].replace(/%[a-zA-Z%]/g, function (e4) {
                if ("%%" === e4) return;
                n2++;
                if ("%c" === e4) {
                  i2 = n2;
                }
              });
              e3.splice(i2, 0, r3);
            }
            function n () {
              return "object" === typeof console && console.log && Function.prototype.apply.call(console.log, console, arguments);
            }
            function i (e3) {
              try {
                if (null == e3) {
                  u.storage.removeItem("debug");
                } else {
                  u.storage.debug = e3;
                }
              } catch (e4) {
              }
            }
            function o () {
              var e3;
              try {
                e3 = u.storage.debug;
              } catch (e4) {
              }
              if (!e3 && typeof t2 !== "undefined" && "env" in t2) {
                e3 = t2.env.DEBUG;
              }
              return e3;
            }
            u.enable(o());
            function a () {
              try {
                return window.localStorage;
              } catch (e3) {
              }
            }
          }).call(this, s("_process"));
        }, { "./debug": 7, _process: 15 }], 7: [function (e2, t2, u) {
          u = t2.exports = n.debug = n["default"] = n;
          u.coerce = f;
          u.disable = a;
          u.enable = o;
          u.enabled = s;
          u.humanize = e2("ms");
          u.instances = [];
          u.names = [];
          u.skips = [];
          u.formatters = {};
          function r2 (e3) {
            var t3 = 0, r3;
            for (r3 in e3) {
              t3 = (t3 << 5) - t3 + e3.charCodeAt(r3);
              t3 |= 0;
            }
            return u.colors[Math.abs(t3) % u.colors.length];
          }
          function n (e3) {
            var s2;
            function f2 () {
              if (!f2.enabled) return;
              var i2 = f2;
              var e4 = +/* @__PURE__ */ new Date();
              var t3 = e4 - (s2 || e4);
              i2.diff = t3;
              i2.prev = s2;
              i2.curr = e4;
              s2 = e4;
              var o2 = new Array(arguments.length);
              for (var r3 = 0; r3 < o2.length; r3++) {
                o2[r3] = arguments[r3];
              }
              o2[0] = u.coerce(o2[0]);
              if ("string" !== typeof o2[0]) {
                o2.unshift("%O");
              }
              var a2 = 0;
              o2[0] = o2[0].replace(/%([a-zA-Z%])/g, function (e5, t4) {
                if (e5 === "%%") return e5;
                a2++;
                var r4 = u.formatters[t4];
                if ("function" === typeof r4) {
                  var n3 = o2[a2];
                  e5 = r4.call(i2, n3);
                  o2.splice(a2, 1);
                  a2--;
                }
                return e5;
              });
              u.formatArgs.call(i2, o2);
              var n2 = f2.log || u.log || console.log.bind(console);
              n2.apply(i2, o2);
            }
            f2.namespace = e3;
            f2.enabled = u.enabled(e3);
            f2.useColors = u.useColors();
            f2.color = r2(e3);
            f2.destroy = i;
            if ("function" === typeof u.init) {
              u.init(f2);
            }
            u.instances.push(f2);
            return f2;
          }
          function i () {
            var e3 = u.instances.indexOf(this);
            if (e3 !== -1) {
              u.instances.splice(e3, 1);
              return true;
            } else {
              return false;
            }
          }
          function o (e3) {
            u.save(e3);
            u.names = [];
            u.skips = [];
            var t3;
            var r3 = (typeof e3 === "string" ? e3 : "").split(/[\s,]+/);
            var n2 = r3.length;
            for (t3 = 0; t3 < n2; t3++) {
              if (!r3[t3]) continue;
              e3 = r3[t3].replace(/\*/g, ".*?");
              if (e3[0] === "-") {
                u.skips.push(new RegExp("^" + e3.substr(1) + "$"));
              } else {
                u.names.push(new RegExp("^" + e3 + "$"));
              }
            }
            for (t3 = 0; t3 < u.instances.length; t3++) {
              var i2 = u.instances[t3];
              i2.enabled = u.enabled(i2.namespace);
            }
          }
          function a () {
            u.enable("");
          }
          function s (e3) {
            if (e3[e3.length - 1] === "*") {
              return true;
            }
            var t3, r3;
            for (t3 = 0, r3 = u.skips.length; t3 < r3; t3++) {
              if (u.skips[t3].test(e3)) {
                return false;
              }
            }
            for (t3 = 0, r3 = u.names.length; t3 < r3; t3++) {
              if (u.names[t3].test(e3)) {
                return true;
              }
            }
            return false;
          }
          function f (e3) {
            if (e3 instanceof Error) return e3.stack || e3.message;
            return e3;
          }
        }, { ms: 13 }], 8: [function (e2, t2, r2) {
          t2.exports = function e3 () {
            if (typeof window === "undefined") return null;
            var t3 = { RTCPeerConnection: window.RTCPeerConnection || window.mozRTCPeerConnection || window.webkitRTCPeerConnection, RTCSessionDescription: window.RTCSessionDescription || window.mozRTCSessionDescription || window.webkitRTCSessionDescription, RTCIceCandidate: window.RTCIceCandidate || window.mozRTCIceCandidate || window.webkitRTCIceCandidate };
            if (!t3.RTCPeerConnection) return null;
            return t3;
          };
        }, {}], 9: [function (e2, t2, r2) {
          r2.read = function (e3, t3, r3, n, i) {
            var o, a;
            var s = i * 8 - n - 1;
            var f = (1 << s) - 1;
            var u = f >> 1;
            var l = -7;
            var c = r3 ? i - 1 : 0;
            var h = r3 ? -1 : 1;
            var d = e3[t3 + c];
            c += h;
            o = d & (1 << -l) - 1;
            d >>= -l;
            l += s;
            for (; l > 0; o = o * 256 + e3[t3 + c], c += h, l -= 8) {
            }
            a = o & (1 << -l) - 1;
            o >>= -l;
            l += n;
            for (; l > 0; a = a * 256 + e3[t3 + c], c += h, l -= 8) {
            }
            if (o === 0) {
              o = 1 - u;
            } else if (o === f) {
              return a ? NaN : (d ? -1 : 1) * Infinity;
            } else {
              a = a + Math.pow(2, n);
              o = o - u;
            }
            return (d ? -1 : 1) * a * Math.pow(2, o - n);
          };
          r2.write = function (e3, t3, r3, n, i, o) {
            var a, s, f;
            var u = o * 8 - i - 1;
            var l = (1 << u) - 1;
            var c = l >> 1;
            var h = i === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0;
            var d = n ? 0 : o - 1;
            var p = n ? 1 : -1;
            var g = t3 < 0 || t3 === 0 && 1 / t3 < 0 ? 1 : 0;
            t3 = Math.abs(t3);
            if (isNaN(t3) || t3 === Infinity) {
              s = isNaN(t3) ? 1 : 0;
              a = l;
            } else {
              a = Math.floor(Math.log(t3) / Math.LN2);
              if (t3 * (f = Math.pow(2, -a)) < 1) {
                a--;
                f *= 2;
              }
              if (a + c >= 1) {
                t3 += h / f;
              } else {
                t3 += h * Math.pow(2, 1 - c);
              }
              if (t3 * f >= 2) {
                a++;
                f /= 2;
              }
              if (a + c >= l) {
                s = 0;
                a = l;
              } else if (a + c >= 1) {
                s = (t3 * f - 1) * Math.pow(2, i);
                a = a + c;
              } else {
                s = t3 * Math.pow(2, c - 1) * Math.pow(2, i);
                a = 0;
              }
            }
            for (; i >= 8; e3[r3 + d] = s & 255, d += p, s /= 256, i -= 8) {
            }
            a = a << i | s;
            u += i;
            for (; u > 0; e3[r3 + d] = a & 255, d += p, a /= 256, u -= 8) {
            }
            e3[r3 + d - p] |= g * 128;
          };
        }, {}], 10: [function (e2, t2, r2) {
          if (typeof Object.create === "function") {
            t2.exports = function e3 (t3, r3) {
              t3.super_ = r3;
              t3.prototype = Object.create(r3.prototype, { constructor: { value: t3, enumerable: false, writable: true, configurable: true } });
            };
          } else {
            t2.exports = function e3 (t3, r3) {
              t3.super_ = r3;
              var n = function () {
              };
              n.prototype = r3.prototype;
              t3.prototype = new n();
              t3.prototype.constructor = t3;
            };
          }
        }, {}], 11: [function (e2, t2, r2) {
          t2.exports = function (e3) {
            return e3 != null && (n(e3) || i(e3) || !!e3._isBuffer);
          };
          function n (e3) {
            return !!e3.constructor && typeof e3.constructor.isBuffer === "function" && e3.constructor.isBuffer(e3);
          }
          function i (e3) {
            return typeof e3.readFloatLE === "function" && typeof e3.slice === "function" && n(e3.slice(0, 0));
          }
        }, {}], 12: [function (e2, t2, r2) {
          var n = {}.toString;
          t2.exports = Array.isArray || function (e3) {
            return n.call(e3) == "[object Array]";
          };
        }, {}], 13: [function (e2, t2, r2) {
          var i = 1e3;
          var o = i * 60;
          var a = o * 60;
          var s = a * 24;
          var f = s * 365.25;
          t2.exports = function (e3, t3) {
            t3 = t3 || {};
            var r3 = typeof e3;
            if (r3 === "string" && e3.length > 0) {
              return n(e3);
            } else if (r3 === "number" && isNaN(e3) === false) {
              return t3.long ? l(e3) : u(e3);
            }
            throw new Error("val is not a non-empty string or a valid number. val=" + JSON.stringify(e3));
          };
          function n (e3) {
            e3 = String(e3);
            if (e3.length > 100) {
              return;
            }
            var t3 = /^((?:\d+)?\.?\d+) *(milliseconds?|msecs?|ms|seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|years?|yrs?|y)?$/i.exec(e3);
            if (!t3) {
              return;
            }
            var r3 = parseFloat(t3[1]);
            var n2 = (t3[2] || "ms").toLowerCase();
            switch (n2) {
              case "years":
              case "year":
              case "yrs":
              case "yr":
              case "y":
                return r3 * f;
              case "days":
              case "day":
              case "d":
                return r3 * s;
              case "hours":
              case "hour":
              case "hrs":
              case "hr":
              case "h":
                return r3 * a;
              case "minutes":
              case "minute":
              case "mins":
              case "min":
              case "m":
                return r3 * o;
              case "seconds":
              case "second":
              case "secs":
              case "sec":
              case "s":
                return r3 * i;
              case "milliseconds":
              case "millisecond":
              case "msecs":
              case "msec":
              case "ms":
                return r3;
              default:
                return void 0;
            }
          }
          function u (e3) {
            if (e3 >= s) {
              return Math.round(e3 / s) + "d";
            }
            if (e3 >= a) {
              return Math.round(e3 / a) + "h";
            }
            if (e3 >= o) {
              return Math.round(e3 / o) + "m";
            }
            if (e3 >= i) {
              return Math.round(e3 / i) + "s";
            }
            return e3 + "ms";
          }
          function l (e3) {
            return c(e3, s, "day") || c(e3, a, "hour") || c(e3, o, "minute") || c(e3, i, "second") || e3 + " ms";
          }
          function c (e3, t3, r3) {
            if (e3 < t3) {
              return;
            }
            if (e3 < t3 * 1.5) {
              return Math.floor(e3 / t3) + " " + r3;
            }
            return Math.ceil(e3 / t3) + " " + r3 + "s";
          }
        }, {}], 14: [function (e2, t2, r2) {
          (function (s) {
            "use strict";
            if (!s.version || s.version.indexOf("v0.") === 0 || s.version.indexOf("v1.") === 0 && s.version.indexOf("v1.8.") !== 0) {
              t2.exports = { nextTick: e3 };
            } else {
              t2.exports = s;
            }
            function e3 (t3, r3, n, i) {
              if (typeof t3 !== "function") {
                throw new TypeError('"callback" argument must be a function');
              }
              var e4 = arguments.length;
              var o, a;
              switch (e4) {
                case 0:
                case 1:
                  return s.nextTick(t3);
                case 2:
                  return s.nextTick(function e5 () {
                    t3.call(null, r3);
                  });
                case 3:
                  return s.nextTick(function e5 () {
                    t3.call(null, r3, n);
                  });
                case 4:
                  return s.nextTick(function e5 () {
                    t3.call(null, r3, n, i);
                  });
                default:
                  o = new Array(e4 - 1);
                  a = 0;
                  while (a < o.length) {
                    o[a++] = arguments[a];
                  }
                  return s.nextTick(function e5 () {
                    t3.apply(null, o);
                  });
              }
            }
          }).call(this, e2("_process"));
        }, { _process: 15 }], 15: [function (e2, t2, r2) {
          var n = t2.exports = {};
          var i;
          var o;
          function a () {
            throw new Error("setTimeout has not been defined");
          }
          function s () {
            throw new Error("clearTimeout has not been defined");
          }
          (function () {
            try {
              if (typeof setTimeout === "function") {
                i = setTimeout;
              } else {
                i = a;
              }
            } catch (e3) {
              i = a;
            }
            try {
              if (typeof clearTimeout === "function") {
                o = clearTimeout;
              } else {
                o = s;
              }
            } catch (e3) {
              o = s;
            }
          })();
          function f (t3) {
            if (i === setTimeout) {
              return setTimeout(t3, 0);
            }
            if ((i === a || !i) && setTimeout) {
              i = setTimeout;
              return setTimeout(t3, 0);
            }
            try {
              return i(t3, 0);
            } catch (e3) {
              try {
                return i.call(null, t3, 0);
              } catch (e4) {
                return i.call(this, t3, 0);
              }
            }
          }
          function u (t3) {
            if (o === clearTimeout) {
              return clearTimeout(t3);
            }
            if ((o === s || !o) && clearTimeout) {
              o = clearTimeout;
              return clearTimeout(t3);
            }
            try {
              return o(t3);
            } catch (e3) {
              try {
                return o.call(null, t3);
              } catch (e4) {
                return o.call(this, t3);
              }
            }
          }
          var l = [];
          var c = false;
          var h;
          var d = -1;
          function p () {
            if (!c || !h) {
              return;
            }
            c = false;
            if (h.length) {
              l = h.concat(l);
            } else {
              d = -1;
            }
            if (l.length) {
              g();
            }
          }
          function g () {
            if (c) {
              return;
            }
            var e3 = f(p);
            c = true;
            var t3 = l.length;
            while (t3) {
              h = l;
              l = [];
              while (++d < t3) {
                if (h) {
                  h[d].run();
                }
              }
              d = -1;
              t3 = l.length;
            }
            h = null;
            c = false;
            u(e3);
          }
          n.nextTick = function (e3) {
            var t3 = new Array(arguments.length - 1);
            if (arguments.length > 1) {
              for (var r3 = 1; r3 < arguments.length; r3++) {
                t3[r3 - 1] = arguments[r3];
              }
            }
            l.push(new y(e3, t3));
            if (l.length === 1 && !c) {
              f(g);
            }
          };
          function y (e3, t3) {
            this.fun = e3;
            this.array = t3;
          }
          y.prototype.run = function () {
            this.fun.apply(null, this.array);
          };
          n.title = "browser";
          n.browser = true;
          n.env = {};
          n.argv = [];
          n.version = "";
          n.versions = {};
          function v () {
          }
          n.on = v;
          n.addListener = v;
          n.once = v;
          n.off = v;
          n.removeListener = v;
          n.removeAllListeners = v;
          n.emit = v;
          n.prependListener = v;
          n.prependOnceListener = v;
          n.listeners = function (e3) {
            return [];
          };
          n.binding = function (e3) {
            throw new Error("process.binding is not supported");
          };
          n.cwd = function () {
            return "/";
          };
          n.chdir = function (e3) {
            throw new Error("process.chdir is not supported");
          };
          n.umask = function () {
            return 0;
          };
        }, {}], 16: [function (r2, n, e2) {
          (function (i, o) {
            "use strict";
            function e3 () {
              throw new Error("Secure random number generation is not supported by this browser.\nUse Chrome, Firefox or Internet Explorer 11");
            }
            var a = r2("safe-buffer").Buffer;
            var s = o.crypto || o.msCrypto;
            if (s && s.getRandomValues) {
              n.exports = t2;
            } else {
              n.exports = e3;
            }
            function t2 (e4, t3) {
              if (e4 > 65536) throw new Error("requested too many random bytes");
              var r3 = new o.Uint8Array(e4);
              if (e4 > 0) {
                s.getRandomValues(r3);
              }
              var n2 = a.from(r3.buffer);
              if (typeof t3 === "function") {
                return i.nextTick(function () {
                  t3(null, n2);
                });
              }
              return n2;
            }
          }).call(this, r2("_process"), typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {});
        }, { _process: 15, "safe-buffer": 26 }], 17: [function (e2, t2, r2) {
          "use strict";
          var n = e2("process-nextick-args");
          var i = Object.keys || function (e3) {
            var t3 = [];
            for (var r3 in e3) {
              t3.push(r3);
            }
            return t3;
          };
          t2.exports = c;
          var o = e2("core-util-is");
          o.inherits = e2("inherits");
          var a = e2("./_stream_readable");
          var s = e2("./_stream_writable");
          o.inherits(c, a);
          {
            var f = i(s.prototype);
            for (var u = 0; u < f.length; u++) {
              var l = f[u];
              if (!c.prototype[l]) c.prototype[l] = s.prototype[l];
            }
          }
          function c (e3) {
            if (!(this instanceof c)) return new c(e3);
            a.call(this, e3);
            s.call(this, e3);
            if (e3 && e3.readable === false) this.readable = false;
            if (e3 && e3.writable === false) this.writable = false;
            this.allowHalfOpen = true;
            if (e3 && e3.allowHalfOpen === false) this.allowHalfOpen = false;
            this.once("end", h);
          }
          Object.defineProperty(c.prototype, "writableHighWaterMark", { enumerable: false, get: function () {
            return this._writableState.highWaterMark;
          } });
          function h () {
            if (this.allowHalfOpen || this._writableState.ended) return;
            n.nextTick(d, this);
          }
          function d (e3) {
            e3.end();
          }
          Object.defineProperty(c.prototype, "destroyed", { get: function () {
            if (this._readableState === void 0 || this._writableState === void 0) {
              return false;
            }
            return this._readableState.destroyed && this._writableState.destroyed;
          }, set: function (e3) {
            if (this._readableState === void 0 || this._writableState === void 0) {
              return;
            }
            this._readableState.destroyed = e3;
            this._writableState.destroyed = e3;
          } });
          c.prototype._destroy = function (e3, t3) {
            this.push(null);
            this.end();
            n.nextTick(t3, e3);
          };
        }, { "./_stream_readable": 19, "./_stream_writable": 21, "core-util-is": 5, inherits: 10, "process-nextick-args": 14 }], 18: [function (e2, t2, r2) {
          "use strict";
          t2.exports = o;
          var n = e2("./_stream_transform");
          var i = e2("core-util-is");
          i.inherits = e2("inherits");
          i.inherits(o, n);
          function o (e3) {
            if (!(this instanceof o)) return new o(e3);
            n.call(this, e3);
          }
          o.prototype._transform = function (e3, t3, r3) {
            r3(null, e3);
          };
        }, { "./_stream_transform": 20, "core-util-is": 5, inherits: 10 }], 19: [function (G, Y, e2) {
          (function (v, e3) {
            "use strict";
            var b = G("process-nextick-args");
            Y.exports = y;
            var n = G("isarray");
            var a;
            y.ReadableState = g;
            var t2 = G("events").EventEmitter;
            var m = function (e4, t3) {
              return e4.listeners(t3).length;
            };
            var i = G("./internal/streams/stream");
            var s = G("safe-buffer").Buffer;
            var r2 = e3.Uint8Array || function () {
            };
            function f (e4) {
              return s.from(e4);
            }
            function o (e4) {
              return s.isBuffer(e4) || e4 instanceof r2;
            }
            var u = G("core-util-is");
            u.inherits = G("inherits");
            var l = G("util");
            var w = void 0;
            if (l && l.debuglog) {
              w = l.debuglog("stream");
            } else {
              w = function () {
              };
            }
            var c = G("./internal/streams/BufferList");
            var h = G("./internal/streams/destroy");
            var d;
            u.inherits(y, i);
            var p = ["error", "close", "destroy", "pause", "resume"];
            function _ (e4, t3, r3) {
              if (typeof e4.prependListener === "function") return e4.prependListener(t3, r3);
              if (!e4._events || !e4._events[t3]) e4.on(t3, r3);
              else if (n(e4._events[t3])) e4._events[t3].unshift(r3);
              else e4._events[t3] = [r3, e4._events[t3]];
            }
            function g (e4, t3) {
              a = a || G("./_stream_duplex");
              e4 = e4 || {};
              var r3 = t3 instanceof a;
              this.objectMode = !!e4.objectMode;
              if (r3) this.objectMode = this.objectMode || !!e4.readableObjectMode;
              var n2 = e4.highWaterMark;
              var i2 = e4.readableHighWaterMark;
              var o2 = this.objectMode ? 16 : 16 * 1024;
              if (n2 || n2 === 0) this.highWaterMark = n2;
              else if (r3 && (i2 || i2 === 0)) this.highWaterMark = i2;
              else this.highWaterMark = o2;
              this.highWaterMark = Math.floor(this.highWaterMark);
              this.buffer = new c();
              this.length = 0;
              this.pipes = null;
              this.pipesCount = 0;
              this.flowing = null;
              this.ended = false;
              this.endEmitted = false;
              this.reading = false;
              this.sync = true;
              this.needReadable = false;
              this.emittedReadable = false;
              this.readableListening = false;
              this.resumeScheduled = false;
              this.destroyed = false;
              this.defaultEncoding = e4.defaultEncoding || "utf8";
              this.awaitDrain = 0;
              this.readingMore = false;
              this.decoder = null;
              this.encoding = null;
              if (e4.encoding) {
                if (!d) d = G("string_decoder/").StringDecoder;
                this.decoder = new d(e4.encoding);
                this.encoding = e4.encoding;
              }
            }
            function y (e4) {
              a = a || G("./_stream_duplex");
              if (!(this instanceof y)) return new y(e4);
              this._readableState = new g(e4, this);
              this.readable = true;
              if (e4) {
                if (typeof e4.read === "function") this._read = e4.read;
                if (typeof e4.destroy === "function") this._destroy = e4.destroy;
              }
              i.call(this);
            }
            Object.defineProperty(y.prototype, "destroyed", { get: function () {
              if (this._readableState === void 0) {
                return false;
              }
              return this._readableState.destroyed;
            }, set: function (e4) {
              if (!this._readableState) {
                return;
              }
              this._readableState.destroyed = e4;
            } });
            y.prototype.destroy = h.destroy;
            y.prototype._undestroy = h.undestroy;
            y.prototype._destroy = function (e4, t3) {
              this.push(null);
              t3(e4);
            };
            y.prototype.push = function (e4, t3) {
              var r3 = this._readableState;
              var n2;
              if (!r3.objectMode) {
                if (typeof e4 === "string") {
                  t3 = t3 || r3.defaultEncoding;
                  if (t3 !== r3.encoding) {
                    e4 = s.from(e4, t3);
                    t3 = "";
                  }
                  n2 = true;
                }
              } else {
                n2 = true;
              }
              return C(this, e4, t3, false, n2);
            };
            y.prototype.unshift = function (e4) {
              return C(this, e4, null, true, false);
            };
            function C (e4, t3, r3, n2, i2) {
              var o2 = e4._readableState;
              if (t3 === null) {
                o2.reading = false;
                x(e4, o2);
              } else {
                var a2;
                if (!i2) a2 = S(o2, t3);
                if (a2) {
                  e4.emit("error", a2);
                } else if (o2.objectMode || t3 && t3.length > 0) {
                  if (typeof t3 !== "string" && !o2.objectMode && Object.getPrototypeOf(t3) !== s.prototype) {
                    t3 = f(t3);
                  }
                  if (n2) {
                    if (o2.endEmitted) e4.emit("error", new Error("stream.unshift() after end event"));
                    else E(e4, o2, t3, true);
                  } else if (o2.ended) {
                    e4.emit("error", new Error("stream.push() after EOF"));
                  } else {
                    o2.reading = false;
                    if (o2.decoder && !r3) {
                      t3 = o2.decoder.write(t3);
                      if (o2.objectMode || t3.length !== 0) E(e4, o2, t3, false);
                      else N(e4, o2);
                    } else {
                      E(e4, o2, t3, false);
                    }
                  }
                } else if (!n2) {
                  o2.reading = false;
                }
              }
              return T(o2);
            }
            function E (e4, t3, r3, n2) {
              if (t3.flowing && t3.length === 0 && !t3.sync) {
                e4.emit("data", r3);
                e4.read(0);
              } else {
                t3.length += t3.objectMode ? 1 : r3.length;
                if (n2) t3.buffer.unshift(r3);
                else t3.buffer.push(r3);
                if (t3.needReadable) L(e4);
              }
              N(e4, t3);
            }
            function S (e4, t3) {
              var r3;
              if (!o(t3) && typeof t3 !== "string" && t3 !== void 0 && !e4.objectMode) {
                r3 = new TypeError("Invalid non-string/buffer chunk");
              }
              return r3;
            }
            function T (e4) {
              return !e4.ended && (e4.needReadable || e4.length < e4.highWaterMark || e4.length === 0);
            }
            y.prototype.isPaused = function () {
              return this._readableState.flowing === false;
            };
            y.prototype.setEncoding = function (e4) {
              if (!d) d = G("string_decoder/").StringDecoder;
              this._readableState.decoder = new d(e4);
              this._readableState.encoding = e4;
              return this;
            };
            var k = 8388608;
            function R (e4) {
              if (e4 >= k) {
                e4 = k;
              } else {
                e4--;
                e4 |= e4 >>> 1;
                e4 |= e4 >>> 2;
                e4 |= e4 >>> 4;
                e4 |= e4 >>> 8;
                e4 |= e4 >>> 16;
                e4++;
              }
              return e4;
            }
            function A (e4, t3) {
              if (e4 <= 0 || t3.length === 0 && t3.ended) return 0;
              if (t3.objectMode) return 1;
              if (e4 !== e4) {
                if (t3.flowing && t3.length) return t3.buffer.head.data.length;
                else return t3.length;
              }
              if (e4 > t3.highWaterMark) t3.highWaterMark = R(e4);
              if (e4 <= t3.length) return e4;
              if (!t3.ended) {
                t3.needReadable = true;
                return 0;
              }
              return t3.length;
            }
            y.prototype.read = function (e4) {
              w("read", e4);
              e4 = parseInt(e4, 10);
              var t3 = this._readableState;
              var r3 = e4;
              if (e4 !== 0) t3.emittedReadable = false;
              if (e4 === 0 && t3.needReadable && (t3.length >= t3.highWaterMark || t3.ended)) {
                w("read: emitReadable", t3.length, t3.ended);
                if (t3.length === 0 && t3.ended) z(this);
                else L(this);
                return null;
              }
              e4 = A(e4, t3);
              if (e4 === 0 && t3.ended) {
                if (t3.length === 0) z(this);
                return null;
              }
              var n2 = t3.needReadable;
              w("need readable", n2);
              if (t3.length === 0 || t3.length - e4 < t3.highWaterMark) {
                n2 = true;
                w("length less than watermark", n2);
              }
              if (t3.ended || t3.reading) {
                n2 = false;
                w("reading or ended", n2);
              } else if (n2) {
                w("do read");
                t3.reading = true;
                t3.sync = true;
                if (t3.length === 0) t3.needReadable = true;
                this._read(t3.highWaterMark);
                t3.sync = false;
                if (!t3.reading) e4 = A(r3, t3);
              }
              var i2;
              if (e4 > 0) i2 = P(e4, t3);
              else i2 = null;
              if (i2 === null) {
                t3.needReadable = true;
                e4 = 0;
              } else {
                t3.length -= e4;
              }
              if (t3.length === 0) {
                if (!t3.ended) t3.needReadable = true;
                if (r3 !== e4 && t3.ended) z(this);
              }
              if (i2 !== null) this.emit("data", i2);
              return i2;
            };
            function x (e4, t3) {
              if (t3.ended) return;
              if (t3.decoder) {
                var r3 = t3.decoder.end();
                if (r3 && r3.length) {
                  t3.buffer.push(r3);
                  t3.length += t3.objectMode ? 1 : r3.length;
                }
              }
              t3.ended = true;
              L(e4);
            }
            function L (e4) {
              var t3 = e4._readableState;
              t3.needReadable = false;
              if (!t3.emittedReadable) {
                w("emitReadable", t3.flowing);
                t3.emittedReadable = true;
                if (t3.sync) b.nextTick(M, e4);
                else M(e4);
              }
            }
            function M (e4) {
              w("emit readable");
              e4.emit("readable");
              D(e4);
            }
            function N (e4, t3) {
              if (!t3.readingMore) {
                t3.readingMore = true;
                b.nextTick(B, e4, t3);
              }
            }
            function B (e4, t3) {
              var r3 = t3.length;
              while (!t3.reading && !t3.flowing && !t3.ended && t3.length < t3.highWaterMark) {
                w("maybeReadMore read 0");
                e4.read(0);
                if (r3 === t3.length) break;
                else r3 = t3.length;
              }
              t3.readingMore = false;
            }
            y.prototype._read = function (e4) {
              this.emit("error", new Error("_read() is not implemented"));
            };
            y.prototype.pipe = function (r3, e4) {
              var n2 = this;
              var i2 = this._readableState;
              switch (i2.pipesCount) {
                case 0:
                  i2.pipes = r3;
                  break;
                case 1:
                  i2.pipes = [i2.pipes, r3];
                  break;
                default:
                  i2.pipes.push(r3);
                  break;
              }
              i2.pipesCount += 1;
              w("pipe count=%d opts=%j", i2.pipesCount, e4);
              var t3 = (!e4 || e4.end !== false) && r3 !== v.stdout && r3 !== v.stderr;
              var o2 = t3 ? s2 : y2;
              if (i2.endEmitted) b.nextTick(o2);
              else n2.once("end", o2);
              r3.on("unpipe", a2);
              function a2 (e5, t4) {
                w("onunpipe");
                if (e5 === n2) {
                  if (t4 && t4.hasUnpiped === false) {
                    t4.hasUnpiped = true;
                    l2();
                  }
                }
              }
              function s2 () {
                w("onend");
                r3.end();
              }
              var f2 = F(n2);
              r3.on("drain", f2);
              var u2 = false;
              function l2 () {
                w("cleanup");
                r3.removeListener("close", p2);
                r3.removeListener("finish", g2);
                r3.removeListener("drain", f2);
                r3.removeListener("error", d2);
                r3.removeListener("unpipe", a2);
                n2.removeListener("end", s2);
                n2.removeListener("end", y2);
                n2.removeListener("data", h2);
                u2 = true;
                if (i2.awaitDrain && (!r3._writableState || r3._writableState.needDrain)) f2();
              }
              var c2 = false;
              n2.on("data", h2);
              function h2 (e5) {
                w("ondata");
                c2 = false;
                var t4 = r3.write(e5);
                if (false === t4 && !c2) {
                  if ((i2.pipesCount === 1 && i2.pipes === r3 || i2.pipesCount > 1 && V(i2.pipes, r3) !== -1) && !u2) {
                    w("false write response, pause", n2._readableState.awaitDrain);
                    n2._readableState.awaitDrain++;
                    c2 = true;
                  }
                  n2.pause();
                }
              }
              function d2 (e5) {
                w("onerror", e5);
                y2();
                r3.removeListener("error", d2);
                if (m(r3, "error") === 0) r3.emit("error", e5);
              }
              _(r3, "error", d2);
              function p2 () {
                r3.removeListener("finish", g2);
                y2();
              }
              r3.once("close", p2);
              function g2 () {
                w("onfinish");
                r3.removeListener("close", p2);
                y2();
              }
              r3.once("finish", g2);
              function y2 () {
                w("unpipe");
                n2.unpipe(r3);
              }
              r3.emit("pipe", n2);
              if (!i2.flowing) {
                w("pipe resume");
                n2.resume();
              }
              return r3;
            };
            function F (t3) {
              return function () {
                var e4 = t3._readableState;
                w("pipeOnDrain", e4.awaitDrain);
                if (e4.awaitDrain) e4.awaitDrain--;
                if (e4.awaitDrain === 0 && m(t3, "data")) {
                  e4.flowing = true;
                  D(t3);
                }
              };
            }
            y.prototype.unpipe = function (e4) {
              var t3 = this._readableState;
              var r3 = { hasUnpiped: false };
              if (t3.pipesCount === 0) return this;
              if (t3.pipesCount === 1) {
                if (e4 && e4 !== t3.pipes) return this;
                if (!e4) e4 = t3.pipes;
                t3.pipes = null;
                t3.pipesCount = 0;
                t3.flowing = false;
                if (e4) e4.emit("unpipe", this, r3);
                return this;
              }
              if (!e4) {
                var n2 = t3.pipes;
                var i2 = t3.pipesCount;
                t3.pipes = null;
                t3.pipesCount = 0;
                t3.flowing = false;
                for (var o2 = 0; o2 < i2; o2++) {
                  n2[o2].emit("unpipe", this, r3);
                }
                return this;
              }
              var a2 = V(t3.pipes, e4);
              if (a2 === -1) return this;
              t3.pipes.splice(a2, 1);
              t3.pipesCount -= 1;
              if (t3.pipesCount === 1) t3.pipes = t3.pipes[0];
              e4.emit("unpipe", this, r3);
              return this;
            };
            y.prototype.on = function (e4, t3) {
              var r3 = i.prototype.on.call(this, e4, t3);
              if (e4 === "data") {
                if (this._readableState.flowing !== false) this.resume();
              } else if (e4 === "readable") {
                var n2 = this._readableState;
                if (!n2.endEmitted && !n2.readableListening) {
                  n2.readableListening = n2.needReadable = true;
                  n2.emittedReadable = false;
                  if (!n2.reading) {
                    b.nextTick(I, this);
                  } else if (n2.length) {
                    L(this);
                  }
                }
              }
              return r3;
            };
            y.prototype.addListener = y.prototype.on;
            function I (e4) {
              w("readable nexttick read 0");
              e4.read(0);
            }
            y.prototype.resume = function () {
              var e4 = this._readableState;
              if (!e4.flowing) {
                w("resume");
                e4.flowing = true;
                O(this, e4);
              }
              return this;
            };
            function O (e4, t3) {
              if (!t3.resumeScheduled) {
                t3.resumeScheduled = true;
                b.nextTick(j, e4, t3);
              }
            }
            function j (e4, t3) {
              if (!t3.reading) {
                w("resume read 0");
                e4.read(0);
              }
              t3.resumeScheduled = false;
              t3.awaitDrain = 0;
              e4.emit("resume");
              D(e4);
              if (t3.flowing && !t3.reading) e4.read(0);
            }
            y.prototype.pause = function () {
              w("call pause flowing=%j", this._readableState.flowing);
              if (false !== this._readableState.flowing) {
                w("pause");
                this._readableState.flowing = false;
                this.emit("pause");
              }
              return this;
            };
            function D (e4) {
              var t3 = e4._readableState;
              w("flow", t3.flowing);
              while (t3.flowing && e4.read() !== null) {
              }
            }
            y.prototype.wrap = function (r3) {
              var n2 = this;
              var i2 = this._readableState;
              var o2 = false;
              r3.on("end", function () {
                w("wrapped end");
                if (i2.decoder && !i2.ended) {
                  var e5 = i2.decoder.end();
                  if (e5 && e5.length) n2.push(e5);
                }
                n2.push(null);
              });
              r3.on("data", function (e5) {
                w("wrapped data");
                if (i2.decoder) e5 = i2.decoder.write(e5);
                if (i2.objectMode && (e5 === null || e5 === void 0)) return;
                else if (!i2.objectMode && (!e5 || !e5.length)) return;
                var t4 = n2.push(e5);
                if (!t4) {
                  o2 = true;
                  r3.pause();
                }
              });
              for (var e4 in r3) {
                if (this[e4] === void 0 && typeof r3[e4] === "function") {
                  this[e4] = /* @__PURE__ */ function (e5) {
                    return function () {
                      return r3[e5].apply(r3, arguments);
                    };
                  }(e4);
                }
              }
              for (var t3 = 0; t3 < p.length; t3++) {
                r3.on(p[t3], this.emit.bind(this, p[t3]));
              }
              this._read = function (e5) {
                w("wrapped _read", e5);
                if (o2) {
                  o2 = false;
                  r3.resume();
                }
              };
              return this;
            };
            Object.defineProperty(y.prototype, "readableHighWaterMark", { enumerable: false, get: function () {
              return this._readableState.highWaterMark;
            } });
            y._fromList = P;
            function P (e4, t3) {
              if (t3.length === 0) return null;
              var r3;
              if (t3.objectMode) r3 = t3.buffer.shift();
              else if (!e4 || e4 >= t3.length) {
                if (t3.decoder) r3 = t3.buffer.join("");
                else if (t3.buffer.length === 1) r3 = t3.buffer.head.data;
                else r3 = t3.buffer.concat(t3.length);
                t3.buffer.clear();
              } else {
                r3 = U(e4, t3.buffer, t3.decoder);
              }
              return r3;
            }
            function U (e4, t3, r3) {
              var n2;
              if (e4 < t3.head.data.length) {
                n2 = t3.head.data.slice(0, e4);
                t3.head.data = t3.head.data.slice(e4);
              } else if (e4 === t3.head.data.length) {
                n2 = t3.shift();
              } else {
                n2 = r3 ? W(e4, t3) : q(e4, t3);
              }
              return n2;
            }
            function W (e4, t3) {
              var r3 = t3.head;
              var n2 = 1;
              var i2 = r3.data;
              e4 -= i2.length;
              while (r3 = r3.next) {
                var o2 = r3.data;
                var a2 = e4 > o2.length ? o2.length : e4;
                if (a2 === o2.length) i2 += o2;
                else i2 += o2.slice(0, e4);
                e4 -= a2;
                if (e4 === 0) {
                  if (a2 === o2.length) {
                    ++n2;
                    if (r3.next) t3.head = r3.next;
                    else t3.head = t3.tail = null;
                  } else {
                    t3.head = r3;
                    r3.data = o2.slice(a2);
                  }
                  break;
                }
                ++n2;
              }
              t3.length -= n2;
              return i2;
            }
            function q (e4, t3) {
              var r3 = s.allocUnsafe(e4);
              var n2 = t3.head;
              var i2 = 1;
              n2.data.copy(r3);
              e4 -= n2.data.length;
              while (n2 = n2.next) {
                var o2 = n2.data;
                var a2 = e4 > o2.length ? o2.length : e4;
                o2.copy(r3, r3.length - e4, 0, a2);
                e4 -= a2;
                if (e4 === 0) {
                  if (a2 === o2.length) {
                    ++i2;
                    if (n2.next) t3.head = n2.next;
                    else t3.head = t3.tail = null;
                  } else {
                    t3.head = n2;
                    n2.data = o2.slice(a2);
                  }
                  break;
                }
                ++i2;
              }
              t3.length -= i2;
              return r3;
            }
            function z (e4) {
              var t3 = e4._readableState;
              if (t3.length > 0) throw new Error('"endReadable()" called on non-empty stream');
              if (!t3.endEmitted) {
                t3.ended = true;
                b.nextTick(H, t3, e4);
              }
            }
            function H (e4, t3) {
              if (!e4.endEmitted && e4.length === 0) {
                e4.endEmitted = true;
                t3.readable = false;
                t3.emit("end");
              }
            }
            function V (e4, t3) {
              for (var r3 = 0, n2 = e4.length; r3 < n2; r3++) {
                if (e4[r3] === t3) return r3;
              }
              return -1;
            }
          }).call(this, G("_process"), typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {});
        }, { "./_stream_duplex": 17, "./internal/streams/BufferList": 22, "./internal/streams/destroy": 23, "./internal/streams/stream": 24, _process: 15, "core-util-is": 5, events: 4, inherits: 10, isarray: 12, "process-nextick-args": 14, "safe-buffer": 26, "string_decoder/": 27, util: 2 }], 20: [function (e2, t2, r2) {
          "use strict";
          t2.exports = a;
          var n = e2("./_stream_duplex");
          var i = e2("core-util-is");
          i.inherits = e2("inherits");
          i.inherits(a, n);
          function o (e3, t3) {
            var r3 = this._transformState;
            r3.transforming = false;
            var n2 = r3.writecb;
            if (!n2) {
              return this.emit("error", new Error("write callback called multiple times"));
            }
            r3.writechunk = null;
            r3.writecb = null;
            if (t3 != null) this.push(t3);
            n2(e3);
            var i2 = this._readableState;
            i2.reading = false;
            if (i2.needReadable || i2.length < i2.highWaterMark) {
              this._read(i2.highWaterMark);
            }
          }
          function a (e3) {
            if (!(this instanceof a)) return new a(e3);
            n.call(this, e3);
            this._transformState = { afterTransform: o.bind(this), needTransform: false, transforming: false, writecb: null, writechunk: null, writeencoding: null };
            this._readableState.needReadable = true;
            this._readableState.sync = false;
            if (e3) {
              if (typeof e3.transform === "function") this._transform = e3.transform;
              if (typeof e3.flush === "function") this._flush = e3.flush;
            }
            this.on("prefinish", s);
          }
          function s () {
            var r3 = this;
            if (typeof this._flush === "function") {
              this._flush(function (e3, t3) {
                f(r3, e3, t3);
              });
            } else {
              f(this, null, null);
            }
          }
          a.prototype.push = function (e3, t3) {
            this._transformState.needTransform = false;
            return n.prototype.push.call(this, e3, t3);
          };
          a.prototype._transform = function (e3, t3, r3) {
            throw new Error("_transform() is not implemented");
          };
          a.prototype._write = function (e3, t3, r3) {
            var n2 = this._transformState;
            n2.writecb = r3;
            n2.writechunk = e3;
            n2.writeencoding = t3;
            if (!n2.transforming) {
              var i2 = this._readableState;
              if (n2.needTransform || i2.needReadable || i2.length < i2.highWaterMark) this._read(i2.highWaterMark);
            }
          };
          a.prototype._read = function (e3) {
            var t3 = this._transformState;
            if (t3.writechunk !== null && t3.writecb && !t3.transforming) {
              t3.transforming = true;
              this._transform(t3.writechunk, t3.writeencoding, t3.afterTransform);
            } else {
              t3.needTransform = true;
            }
          };
          a.prototype._destroy = function (e3, t3) {
            var r3 = this;
            n.prototype._destroy.call(this, e3, function (e4) {
              t3(e4);
              r3.emit("close");
            });
          };
          function f (e3, t3, r3) {
            if (t3) return e3.emit("error", t3);
            if (r3 != null) e3.push(r3);
            if (e3._writableState.length) throw new Error("Calling transform done when ws.length != 0");
            if (e3._transformState.transforming) throw new Error("Calling transform done when still transforming");
            return e3.push(null);
          }
        }, { "./_stream_duplex": 17, "core-util-is": 5, inherits: 10 }], 21: [function (O, j, e2) {
          (function (e3, t2) {
            "use strict";
            var a = O("process-nextick-args");
            j.exports = b;
            function r2 (e4, t3, r3) {
              this.chunk = e4;
              this.encoding = t3;
              this.callback = r3;
              this.next = null;
            }
            function h (e4) {
              var t3 = this;
              this.next = null;
              this.entry = null;
              this.finish = function () {
                I(t3, e4);
              };
            }
            var s = !e3.browser && ["v0.10", "v0.9."].indexOf(e3.version.slice(0, 5)) > -1 ? setImmediate : a.nextTick;
            var f;
            b.WritableState = y;
            var n = O("core-util-is");
            n.inherits = O("inherits");
            var i = { deprecate: O("util-deprecate") };
            var o = O("./internal/streams/stream");
            var u = O("safe-buffer").Buffer;
            var l = t2.Uint8Array || function () {
            };
            function c (e4) {
              return u.from(e4);
            }
            function d (e4) {
              return u.isBuffer(e4) || e4 instanceof l;
            }
            var p = O("./internal/streams/destroy");
            n.inherits(b, o);
            function g () {
            }
            function y (e4, t3) {
              f = f || O("./_stream_duplex");
              e4 = e4 || {};
              var r3 = t3 instanceof f;
              this.objectMode = !!e4.objectMode;
              if (r3) this.objectMode = this.objectMode || !!e4.writableObjectMode;
              var n2 = e4.highWaterMark;
              var i2 = e4.writableHighWaterMark;
              var o2 = this.objectMode ? 16 : 16 * 1024;
              if (n2 || n2 === 0) this.highWaterMark = n2;
              else if (r3 && (i2 || i2 === 0)) this.highWaterMark = i2;
              else this.highWaterMark = o2;
              this.highWaterMark = Math.floor(this.highWaterMark);
              this.finalCalled = false;
              this.needDrain = false;
              this.ending = false;
              this.ended = false;
              this.finished = false;
              this.destroyed = false;
              var a2 = e4.decodeStrings === false;
              this.decodeStrings = !a2;
              this.defaultEncoding = e4.defaultEncoding || "utf8";
              this.length = 0;
              this.writing = false;
              this.corked = 0;
              this.sync = true;
              this.bufferProcessing = false;
              this.onwrite = function (e5) {
                k(t3, e5);
              };
              this.writecb = null;
              this.writelen = 0;
              this.bufferedRequest = null;
              this.lastBufferedRequest = null;
              this.pendingcb = 0;
              this.prefinished = false;
              this.errorEmitted = false;
              this.bufferedRequestCount = 0;
              this.corkedRequestsFree = new h(this);
            }
            y.prototype.getBuffer = function e4 () {
              var t3 = this.bufferedRequest;
              var r3 = [];
              while (t3) {
                r3.push(t3);
                t3 = t3.next;
              }
              return r3;
            };
            (function () {
              try {
                Object.defineProperty(y.prototype, "buffer", { get: i.deprecate(function () {
                  return this.getBuffer();
                }, "_writableState.buffer is deprecated. Use _writableState.getBuffer instead.", "DEP0003") });
              } catch (e4) {
              }
            })();
            var v;
            if (typeof Symbol === "function" && Symbol.hasInstance && typeof Function.prototype[Symbol.hasInstance] === "function") {
              v = Function.prototype[Symbol.hasInstance];
              Object.defineProperty(b, Symbol.hasInstance, { value: function (e4) {
                if (v.call(this, e4)) return true;
                if (this !== b) return false;
                return e4 && e4._writableState instanceof y;
              } });
            } else {
              v = function (e4) {
                return e4 instanceof this;
              };
            }
            function b (e4) {
              f = f || O("./_stream_duplex");
              if (!v.call(b, this) && !(this instanceof f)) {
                return new b(e4);
              }
              this._writableState = new y(e4, this);
              this.writable = true;
              if (e4) {
                if (typeof e4.write === "function") this._write = e4.write;
                if (typeof e4.writev === "function") this._writev = e4.writev;
                if (typeof e4.destroy === "function") this._destroy = e4.destroy;
                if (typeof e4.final === "function") this._final = e4.final;
              }
              o.call(this);
            }
            b.prototype.pipe = function () {
              this.emit("error", new Error("Cannot pipe, not readable"));
            };
            function m (e4, t3) {
              var r3 = new Error("write after end");
              e4.emit("error", r3);
              a.nextTick(t3, r3);
            }
            function w (e4, t3, r3, n2) {
              var i2 = true;
              var o2 = false;
              if (r3 === null) {
                o2 = new TypeError("May not write null values to stream");
              } else if (typeof r3 !== "string" && r3 !== void 0 && !t3.objectMode) {
                o2 = new TypeError("Invalid non-string/buffer chunk");
              }
              if (o2) {
                e4.emit("error", o2);
                a.nextTick(n2, o2);
                i2 = false;
              }
              return i2;
            }
            b.prototype.write = function (e4, t3, r3) {
              var n2 = this._writableState;
              var i2 = false;
              var o2 = !n2.objectMode && d(e4);
              if (o2 && !u.isBuffer(e4)) {
                e4 = c(e4);
              }
              if (typeof t3 === "function") {
                r3 = t3;
                t3 = null;
              }
              if (o2) t3 = "buffer";
              else if (!t3) t3 = n2.defaultEncoding;
              if (typeof r3 !== "function") r3 = g;
              if (n2.ended) m(this, r3);
              else if (o2 || w(this, n2, e4, r3)) {
                n2.pendingcb++;
                i2 = C(this, n2, o2, e4, t3, r3);
              }
              return i2;
            };
            b.prototype.cork = function () {
              var e4 = this._writableState;
              e4.corked++;
            };
            b.prototype.uncork = function () {
              var e4 = this._writableState;
              if (e4.corked) {
                e4.corked--;
                if (!e4.writing && !e4.corked && !e4.finished && !e4.bufferProcessing && e4.bufferedRequest) x(this, e4);
              }
            };
            b.prototype.setDefaultEncoding = function e4 (t3) {
              if (typeof t3 === "string") t3 = t3.toLowerCase();
              if (!(["hex", "utf8", "utf-8", "ascii", "binary", "base64", "ucs2", "ucs-2", "utf16le", "utf-16le", "raw"].indexOf((t3 + "").toLowerCase()) > -1)) throw new TypeError("Unknown encoding: " + t3);
              this._writableState.defaultEncoding = t3;
              return this;
            };
            function _ (e4, t3, r3) {
              if (!e4.objectMode && e4.decodeStrings !== false && typeof t3 === "string") {
                t3 = u.from(t3, r3);
              }
              return t3;
            }
            Object.defineProperty(b.prototype, "writableHighWaterMark", { enumerable: false, get: function () {
              return this._writableState.highWaterMark;
            } });
            function C (e4, t3, r3, n2, i2, o2) {
              if (!r3) {
                var a2 = _(t3, n2, i2);
                if (n2 !== a2) {
                  r3 = true;
                  i2 = "buffer";
                  n2 = a2;
                }
              }
              var s2 = t3.objectMode ? 1 : n2.length;
              t3.length += s2;
              var f2 = t3.length < t3.highWaterMark;
              if (!f2) t3.needDrain = true;
              if (t3.writing || t3.corked) {
                var u2 = t3.lastBufferedRequest;
                t3.lastBufferedRequest = { chunk: n2, encoding: i2, isBuf: r3, callback: o2, next: null };
                if (u2) {
                  u2.next = t3.lastBufferedRequest;
                } else {
                  t3.bufferedRequest = t3.lastBufferedRequest;
                }
                t3.bufferedRequestCount += 1;
              } else {
                E(e4, t3, false, s2, n2, i2, o2);
              }
              return f2;
            }
            function E (e4, t3, r3, n2, i2, o2, a2) {
              t3.writelen = n2;
              t3.writecb = a2;
              t3.writing = true;
              t3.sync = true;
              if (r3) e4._writev(i2, t3.onwrite);
              else e4._write(i2, o2, t3.onwrite);
              t3.sync = false;
            }
            function S (e4, t3, r3, n2, i2) {
              --t3.pendingcb;
              if (r3) {
                a.nextTick(i2, n2);
                a.nextTick(B, e4, t3);
                e4._writableState.errorEmitted = true;
                e4.emit("error", n2);
              } else {
                i2(n2);
                e4._writableState.errorEmitted = true;
                e4.emit("error", n2);
                B(e4, t3);
              }
            }
            function T (e4) {
              e4.writing = false;
              e4.writecb = null;
              e4.length -= e4.writelen;
              e4.writelen = 0;
            }
            function k (e4, t3) {
              var r3 = e4._writableState;
              var n2 = r3.sync;
              var i2 = r3.writecb;
              T(r3);
              if (t3) S(e4, r3, n2, t3, i2);
              else {
                var o2 = L(r3);
                if (!o2 && !r3.corked && !r3.bufferProcessing && r3.bufferedRequest) {
                  x(e4, r3);
                }
                if (n2) {
                  s(R, e4, r3, o2, i2);
                } else {
                  R(e4, r3, o2, i2);
                }
              }
            }
            function R (e4, t3, r3, n2) {
              if (!r3) A(e4, t3);
              t3.pendingcb--;
              n2();
              B(e4, t3);
            }
            function A (e4, t3) {
              if (t3.length === 0 && t3.needDrain) {
                t3.needDrain = false;
                e4.emit("drain");
              }
            }
            function x (e4, t3) {
              t3.bufferProcessing = true;
              var r3 = t3.bufferedRequest;
              if (e4._writev && r3 && r3.next) {
                var n2 = t3.bufferedRequestCount;
                var i2 = new Array(n2);
                var o2 = t3.corkedRequestsFree;
                o2.entry = r3;
                var a2 = 0;
                var s2 = true;
                while (r3) {
                  i2[a2] = r3;
                  if (!r3.isBuf) s2 = false;
                  r3 = r3.next;
                  a2 += 1;
                }
                i2.allBuffers = s2;
                E(e4, t3, true, t3.length, i2, "", o2.finish);
                t3.pendingcb++;
                t3.lastBufferedRequest = null;
                if (o2.next) {
                  t3.corkedRequestsFree = o2.next;
                  o2.next = null;
                } else {
                  t3.corkedRequestsFree = new h(t3);
                }
                t3.bufferedRequestCount = 0;
              } else {
                while (r3) {
                  var f2 = r3.chunk;
                  var u2 = r3.encoding;
                  var l2 = r3.callback;
                  var c2 = t3.objectMode ? 1 : f2.length;
                  E(e4, t3, false, c2, f2, u2, l2);
                  r3 = r3.next;
                  t3.bufferedRequestCount--;
                  if (t3.writing) {
                    break;
                  }
                }
                if (r3 === null) t3.lastBufferedRequest = null;
              }
              t3.bufferedRequest = r3;
              t3.bufferProcessing = false;
            }
            b.prototype._write = function (e4, t3, r3) {
              r3(new Error("_write() is not implemented"));
            };
            b.prototype._writev = null;
            b.prototype.end = function (e4, t3, r3) {
              var n2 = this._writableState;
              if (typeof e4 === "function") {
                r3 = e4;
                e4 = null;
                t3 = null;
              } else if (typeof t3 === "function") {
                r3 = t3;
                t3 = null;
              }
              if (e4 !== null && e4 !== void 0) this.write(e4, t3);
              if (n2.corked) {
                n2.corked = 1;
                this.uncork();
              }
              if (!n2.ending && !n2.finished) F(this, n2, r3);
            };
            function L (e4) {
              return e4.ending && e4.length === 0 && e4.bufferedRequest === null && !e4.finished && !e4.writing;
            }
            function M (t3, r3) {
              t3._final(function (e4) {
                r3.pendingcb--;
                if (e4) {
                  t3.emit("error", e4);
                }
                r3.prefinished = true;
                t3.emit("prefinish");
                B(t3, r3);
              });
            }
            function N (e4, t3) {
              if (!t3.prefinished && !t3.finalCalled) {
                if (typeof e4._final === "function") {
                  t3.pendingcb++;
                  t3.finalCalled = true;
                  a.nextTick(M, e4, t3);
                } else {
                  t3.prefinished = true;
                  e4.emit("prefinish");
                }
              }
            }
            function B (e4, t3) {
              var r3 = L(t3);
              if (r3) {
                N(e4, t3);
                if (t3.pendingcb === 0) {
                  t3.finished = true;
                  e4.emit("finish");
                }
              }
              return r3;
            }
            function F (e4, t3, r3) {
              t3.ending = true;
              B(e4, t3);
              if (r3) {
                if (t3.finished) a.nextTick(r3);
                else e4.once("finish", r3);
              }
              t3.ended = true;
              e4.writable = false;
            }
            function I (e4, t3, r3) {
              var n2 = e4.entry;
              e4.entry = null;
              while (n2) {
                var i2 = n2.callback;
                t3.pendingcb--;
                i2(r3);
                n2 = n2.next;
              }
              if (t3.corkedRequestsFree) {
                t3.corkedRequestsFree.next = e4;
              } else {
                t3.corkedRequestsFree = e4;
              }
            }
            Object.defineProperty(b.prototype, "destroyed", { get: function () {
              if (this._writableState === void 0) {
                return false;
              }
              return this._writableState.destroyed;
            }, set: function (e4) {
              if (!this._writableState) {
                return;
              }
              this._writableState.destroyed = e4;
            } });
            b.prototype.destroy = p.destroy;
            b.prototype._undestroy = p.undestroy;
            b.prototype._destroy = function (e4, t3) {
              this.end();
              t3(e4);
            };
          }).call(this, O("_process"), typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {});
        }, { "./_stream_duplex": 17, "./internal/streams/destroy": 23, "./internal/streams/stream": 24, _process: 15, "core-util-is": 5, inherits: 10, "process-nextick-args": 14, "safe-buffer": 26, "util-deprecate": 28 }], 22: [function (e2, t2, r2) {
          "use strict";
          function n (e3, t3) {
            if (!(e3 instanceof t3)) {
              throw new TypeError("Cannot call a class as a function");
            }
          }
          var o = e2("safe-buffer").Buffer;
          var i = e2("util");
          function a (e3, t3, r3) {
            e3.copy(t3, r3);
          }
          t2.exports = function () {
            function e3 () {
              n(this, e3);
              this.head = null;
              this.tail = null;
              this.length = 0;
            }
            e3.prototype.push = function e4 (t3) {
              var r3 = { data: t3, next: null };
              if (this.length > 0) this.tail.next = r3;
              else this.head = r3;
              this.tail = r3;
              ++this.length;
            };
            e3.prototype.unshift = function e4 (t3) {
              var r3 = { data: t3, next: this.head };
              if (this.length === 0) this.tail = r3;
              this.head = r3;
              ++this.length;
            };
            e3.prototype.shift = function e4 () {
              if (this.length === 0) return;
              var t3 = this.head.data;
              if (this.length === 1) this.head = this.tail = null;
              else this.head = this.head.next;
              --this.length;
              return t3;
            };
            e3.prototype.clear = function e4 () {
              this.head = this.tail = null;
              this.length = 0;
            };
            e3.prototype.join = function e4 (t3) {
              if (this.length === 0) return "";
              var r3 = this.head;
              var n2 = "" + r3.data;
              while (r3 = r3.next) {
                n2 += t3 + r3.data;
              }
              return n2;
            };
            e3.prototype.concat = function e4 (t3) {
              if (this.length === 0) return o.alloc(0);
              if (this.length === 1) return this.head.data;
              var r3 = o.allocUnsafe(t3 >>> 0);
              var n2 = this.head;
              var i2 = 0;
              while (n2) {
                a(n2.data, r3, i2);
                i2 += n2.data.length;
                n2 = n2.next;
              }
              return r3;
            };
            return e3;
          }();
          if (i && i.inspect && i.inspect.custom) {
            t2.exports.prototype[i.inspect.custom] = function () {
              var e3 = i.inspect({ length: this.length });
              return this.constructor.name + " " + e3;
            };
          }
        }, { "safe-buffer": 26, util: 2 }], 23: [function (e2, t2, r2) {
          "use strict";
          var o = e2("process-nextick-args");
          function n (e3, t3) {
            var r3 = this;
            var n2 = this._readableState && this._readableState.destroyed;
            var i2 = this._writableState && this._writableState.destroyed;
            if (n2 || i2) {
              if (t3) {
                t3(e3);
              } else if (e3 && (!this._writableState || !this._writableState.errorEmitted)) {
                o.nextTick(a, this, e3);
              }
              return this;
            }
            if (this._readableState) {
              this._readableState.destroyed = true;
            }
            if (this._writableState) {
              this._writableState.destroyed = true;
            }
            this._destroy(e3 || null, function (e4) {
              if (!t3 && e4) {
                o.nextTick(a, r3, e4);
                if (r3._writableState) {
                  r3._writableState.errorEmitted = true;
                }
              } else if (t3) {
                t3(e4);
              }
            });
            return this;
          }
          function i () {
            if (this._readableState) {
              this._readableState.destroyed = false;
              this._readableState.reading = false;
              this._readableState.ended = false;
              this._readableState.endEmitted = false;
            }
            if (this._writableState) {
              this._writableState.destroyed = false;
              this._writableState.ended = false;
              this._writableState.ending = false;
              this._writableState.finished = false;
              this._writableState.errorEmitted = false;
            }
          }
          function a (e3, t3) {
            e3.emit("error", t3);
          }
          t2.exports = { destroy: n, undestroy: i };
        }, { "process-nextick-args": 14 }], 24: [function (e2, t2, r2) {
          t2.exports = e2("events").EventEmitter;
        }, { events: 4 }], 25: [function (e2, t2, r2) {
          r2 = t2.exports = e2("./lib/_stream_readable.js");
          r2.Stream = r2;
          r2.Readable = r2;
          r2.Writable = e2("./lib/_stream_writable.js");
          r2.Duplex = e2("./lib/_stream_duplex.js");
          r2.Transform = e2("./lib/_stream_transform.js");
          r2.PassThrough = e2("./lib/_stream_passthrough.js");
        }, { "./lib/_stream_duplex.js": 17, "./lib/_stream_passthrough.js": 18, "./lib/_stream_readable.js": 19, "./lib/_stream_transform.js": 20, "./lib/_stream_writable.js": 21 }], 26: [function (e2, t2, r2) {
          var n = e2("buffer");
          var i = n.Buffer;
          function o (e3, t3) {
            for (var r3 in e3) {
              t3[r3] = e3[r3];
            }
          }
          if (i.from && i.alloc && i.allocUnsafe && i.allocUnsafeSlow) {
            t2.exports = n;
          } else {
            o(n, r2);
            r2.Buffer = a;
          }
          function a (e3, t3, r3) {
            return i(e3, t3, r3);
          }
          o(i, a);
          a.from = function (e3, t3, r3) {
            if (typeof e3 === "number") {
              throw new TypeError("Argument must not be a number");
            }
            return i(e3, t3, r3);
          };
          a.alloc = function (e3, t3, r3) {
            if (typeof e3 !== "number") {
              throw new TypeError("Argument must be a number");
            }
            var n2 = i(e3);
            if (t3 !== void 0) {
              if (typeof r3 === "string") {
                n2.fill(t3, r3);
              } else {
                n2.fill(t3);
              }
            } else {
              n2.fill(0);
            }
            return n2;
          };
          a.allocUnsafe = function (e3) {
            if (typeof e3 !== "number") {
              throw new TypeError("Argument must be a number");
            }
            return i(e3);
          };
          a.allocUnsafeSlow = function (e3) {
            if (typeof e3 !== "number") {
              throw new TypeError("Argument must be a number");
            }
            return n.SlowBuffer(e3);
          };
        }, { buffer: 3 }], 27: [function (e2, t2, r2) {
          "use strict";
          var n = e2("safe-buffer").Buffer;
          var i = n.isEncoding || function (e3) {
            e3 = "" + e3;
            switch (e3 && e3.toLowerCase()) {
              case "hex":
              case "utf8":
              case "utf-8":
              case "ascii":
              case "binary":
              case "base64":
              case "ucs2":
              case "ucs-2":
              case "utf16le":
              case "utf-16le":
              case "raw":
                return true;
              default:
                return false;
            }
          };
          function o (e3) {
            if (!e3) return "utf8";
            var t3;
            while (true) {
              switch (e3) {
                case "utf8":
                case "utf-8":
                  return "utf8";
                case "ucs2":
                case "ucs-2":
                case "utf16le":
                case "utf-16le":
                  return "utf16le";
                case "latin1":
                case "binary":
                  return "latin1";
                case "base64":
                case "ascii":
                case "hex":
                  return e3;
                default:
                  if (t3) return;
                  e3 = ("" + e3).toLowerCase();
                  t3 = true;
              }
            }
          }
          function a (e3) {
            var t3 = o(e3);
            if (typeof t3 !== "string" && (n.isEncoding === i || !i(e3))) throw new Error("Unknown encoding: " + e3);
            return t3 || e3;
          }
          r2.StringDecoder = s;
          function s (e3) {
            this.encoding = a(e3);
            var t3;
            switch (this.encoding) {
              case "utf16le":
                this.text = p;
                this.end = g;
                t3 = 4;
                break;
              case "utf8":
                this.fillLast = c;
                t3 = 4;
                break;
              case "base64":
                this.text = y;
                this.end = v;
                t3 = 3;
                break;
              default:
                this.write = b;
                this.end = m;
                return;
            }
            this.lastNeed = 0;
            this.lastTotal = 0;
            this.lastChar = n.allocUnsafe(t3);
          }
          s.prototype.write = function (e3) {
            if (e3.length === 0) return "";
            var t3;
            var r3;
            if (this.lastNeed) {
              t3 = this.fillLast(e3);
              if (t3 === void 0) return "";
              r3 = this.lastNeed;
              this.lastNeed = 0;
            } else {
              r3 = 0;
            }
            if (r3 < e3.length) return t3 ? t3 + this.text(e3, r3) : this.text(e3, r3);
            return t3 || "";
          };
          s.prototype.end = d;
          s.prototype.text = h;
          s.prototype.fillLast = function (e3) {
            if (this.lastNeed <= e3.length) {
              e3.copy(this.lastChar, this.lastTotal - this.lastNeed, 0, this.lastNeed);
              return this.lastChar.toString(this.encoding, 0, this.lastTotal);
            }
            e3.copy(this.lastChar, this.lastTotal - this.lastNeed, 0, e3.length);
            this.lastNeed -= e3.length;
          };
          function f (e3) {
            if (e3 <= 127) return 0;
            else if (e3 >> 5 === 6) return 2;
            else if (e3 >> 4 === 14) return 3;
            else if (e3 >> 3 === 30) return 4;
            return e3 >> 6 === 2 ? -1 : -2;
          }
          function u (e3, t3, r3) {
            var n2 = t3.length - 1;
            if (n2 < r3) return 0;
            var i2 = f(t3[n2]);
            if (i2 >= 0) {
              if (i2 > 0) e3.lastNeed = i2 - 1;
              return i2;
            }
            if (--n2 < r3 || i2 === -2) return 0;
            i2 = f(t3[n2]);
            if (i2 >= 0) {
              if (i2 > 0) e3.lastNeed = i2 - 2;
              return i2;
            }
            if (--n2 < r3 || i2 === -2) return 0;
            i2 = f(t3[n2]);
            if (i2 >= 0) {
              if (i2 > 0) {
                if (i2 === 2) i2 = 0;
                else e3.lastNeed = i2 - 3;
              }
              return i2;
            }
            return 0;
          }
          function l (e3, t3, r3) {
            if ((t3[0] & 192) !== 128) {
              e3.lastNeed = 0;
              return "\xEF\xBF\xBD";
            }
            if (e3.lastNeed > 1 && t3.length > 1) {
              if ((t3[1] & 192) !== 128) {
                e3.lastNeed = 1;
                return "\xEF\xBF\xBD";
              }
              if (e3.lastNeed > 2 && t3.length > 2) {
                if ((t3[2] & 192) !== 128) {
                  e3.lastNeed = 2;
                  return "\xEF\xBF\xBD";
                }
              }
            }
          }
          function c (e3) {
            var t3 = this.lastTotal - this.lastNeed;
            var r3 = l(this, e3, t3);
            if (r3 !== void 0) return r3;
            if (this.lastNeed <= e3.length) {
              e3.copy(this.lastChar, t3, 0, this.lastNeed);
              return this.lastChar.toString(this.encoding, 0, this.lastTotal);
            }
            e3.copy(this.lastChar, t3, 0, e3.length);
            this.lastNeed -= e3.length;
          }
          function h (e3, t3) {
            var r3 = u(this, e3, t3);
            if (!this.lastNeed) return e3.toString("utf8", t3);
            this.lastTotal = r3;
            var n2 = e3.length - (r3 - this.lastNeed);
            e3.copy(this.lastChar, 0, n2);
            return e3.toString("utf8", t3, n2);
          }
          function d (e3) {
            var t3 = e3 && e3.length ? this.write(e3) : "";
            if (this.lastNeed) return t3 + "\xEF\xBF\xBD";
            return t3;
          }
          function p (e3, t3) {
            if ((e3.length - t3) % 2 === 0) {
              var r3 = e3.toString("utf16le", t3);
              if (r3) {
                var n2 = r3.charCodeAt(r3.length - 1);
                if (n2 >= 55296 && n2 <= 56319) {
                  this.lastNeed = 2;
                  this.lastTotal = 4;
                  this.lastChar[0] = e3[e3.length - 2];
                  this.lastChar[1] = e3[e3.length - 1];
                  return r3.slice(0, -1);
                }
              }
              return r3;
            }
            this.lastNeed = 1;
            this.lastTotal = 2;
            this.lastChar[0] = e3[e3.length - 1];
            return e3.toString("utf16le", t3, e3.length - 1);
          }
          function g (e3) {
            var t3 = e3 && e3.length ? this.write(e3) : "";
            if (this.lastNeed) {
              var r3 = this.lastTotal - this.lastNeed;
              return t3 + this.lastChar.toString("utf16le", 0, r3);
            }
            return t3;
          }
          function y (e3, t3) {
            var r3 = (e3.length - t3) % 3;
            if (r3 === 0) return e3.toString("base64", t3);
            this.lastNeed = 3 - r3;
            this.lastTotal = 3;
            if (r3 === 1) {
              this.lastChar[0] = e3[e3.length - 1];
            } else {
              this.lastChar[0] = e3[e3.length - 2];
              this.lastChar[1] = e3[e3.length - 1];
            }
            return e3.toString("base64", t3, e3.length - r3);
          }
          function v (e3) {
            var t3 = e3 && e3.length ? this.write(e3) : "";
            if (this.lastNeed) return t3 + this.lastChar.toString("base64", 0, 3 - this.lastNeed);
            return t3;
          }
          function b (e3) {
            return e3.toString(this.encoding);
          }
          function m (e3) {
            return e3 && e3.length ? this.write(e3) : "";
          }
        }, { "safe-buffer": 26 }], 28: [function (e2, t2, r2) {
          (function (r3) {
            t2.exports = e3;
            function e3 (e4, t3) {
              if (i("noDeprecation")) {
                return e4;
              }
              var r4 = false;
              function n () {
                if (!r4) {
                  if (i("throwDeprecation")) {
                    throw new Error(t3);
                  } else if (i("traceDeprecation")) {
                    console.trace(t3);
                  } else {
                    console.warn(t3);
                  }
                  r4 = true;
                }
                return e4.apply(this, arguments);
              }
              return n;
            }
            function i (e4) {
              try {
                if (!r3.localStorage) return false;
              } catch (e5) {
                return false;
              }
              var t3 = r3.localStorage[e4];
              if (null == t3) return false;
              return String(t3).toLowerCase() === "true";
            }
          }).call(this, typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {});
        }, {}], "/": [function (t2, c, e2) {
          (function (n) {
            c.exports = f;
            var r2 = t2("debug")("simple-peer");
            var i = t2("get-browser-rtc");
            var e3 = t2("inherits");
            var o = t2("randombytes");
            var a = t2("readable-stream");
            var s = 64 * 1024;
            e3(f, a.Duplex);
            function f (e4) {
              var t3 = this;
              if (!(t3 instanceof f)) return new f(e4);
              t3._id = o(4).toString("hex").slice(0, 7);
              t3._debug("new peer %o", e4);
              e4 = Object.assign({ allowHalfOpen: false }, e4);
              a.Duplex.call(t3, e4);
              t3.channelName = e4.initiator ? e4.channelName || o(20).toString("hex") : null;
              t3._isChromium = typeof window !== "undefined" && !!window.webkitRTCPeerConnection;
              t3.initiator = e4.initiator || false;
              t3.channelConfig = e4.channelConfig || f.channelConfig;
              t3.config = e4.config || f.config;
              t3.constraints = t3._transformConstraints(e4.constraints || f.constraints);
              t3.offerConstraints = t3._transformConstraints(e4.offerConstraints || {});
              t3.answerConstraints = t3._transformConstraints(e4.answerConstraints || {});
              t3.reconnectTimer = e4.reconnectTimer || false;
              t3.sdpTransform = e4.sdpTransform || function (e5) {
                return e5;
              };
              t3.streams = e4.streams || (e4.stream ? [e4.stream] : []);
              t3.trickle = e4.trickle !== void 0 ? e4.trickle : true;
              t3.destroyed = false;
              t3.connected = false;
              t3.remoteAddress = void 0;
              t3.remoteFamily = void 0;
              t3.remotePort = void 0;
              t3.localAddress = void 0;
              t3.localPort = void 0;
              t3._wrtc = e4.wrtc && typeof e4.wrtc === "object" ? e4.wrtc : i();
              if (!t3._wrtc) {
                if (typeof window === "undefined") {
                  throw l("No WebRTC support: Specify `opts.wrtc` option in this environment", "ERR_WEBRTC_SUPPORT");
                } else {
                  throw l("No WebRTC support: Not a supported browser", "ERR_WEBRTC_SUPPORT");
                }
              }
              t3._pcReady = false;
              t3._channelReady = false;
              t3._iceComplete = false;
              t3._channel = null;
              t3._pendingCandidates = [];
              t3._isNegotiating = false;
              t3._batchedNegotiation = false;
              t3._queuedNegotiation = false;
              t3._sendersAwaitingStable = [];
              t3._senderMap = /* @__PURE__ */ new WeakMap();
              t3._remoteTracks = [];
              t3._remoteStreams = [];
              t3._chunk = null;
              t3._cb = null;
              t3._interval = null;
              t3._reconnectTimeout = null;
              t3._pc = new t3._wrtc.RTCPeerConnection(t3.config, t3.constraints);
              t3._isReactNativeWebrtc = typeof t3._pc._peerConnectionId === "number";
              t3._pc.oniceconnectionstatechange = function () {
                t3._onIceStateChange();
              };
              t3._pc.onicegatheringstatechange = function () {
                t3._onIceStateChange();
              };
              t3._pc.onsignalingstatechange = function () {
                t3._onSignalingStateChange();
              };
              t3._pc.onicecandidate = function (e5) {
                t3._onIceCandidate(e5);
              };
              if (t3.initiator) {
                t3._setupData({ channel: t3._pc.createDataChannel(t3.channelName, t3.channelConfig) });
              } else {
                t3._pc.ondatachannel = function (e5) {
                  t3._setupData(e5);
                };
              }
              if ("addTrack" in t3._pc) {
                if (t3.streams) {
                  t3.streams.forEach(function (e5) {
                    t3.addStream(e5);
                  });
                }
                t3._pc.ontrack = function (e5) {
                  t3._onTrack(e5);
                };
              }
              if (t3.initiator) {
                t3._needsNegotiation();
              }
              t3._onFinishBound = function () {
                t3._onFinish();
              };
              t3.once("finish", t3._onFinishBound);
            }
            f.WEBRTC_SUPPORT = !!i();
            f.config = { iceServers: [{ urls: "stun:stun.l.google.com:19302" }, { urls: "stun:global.stun.twilio.com:3478?transport=udp" }] };
            f.constraints = {};
            f.channelConfig = {};
            Object.defineProperty(f.prototype, "bufferSize", { get: function () {
              var e4 = this;
              return e4._channel && e4._channel.bufferedAmount || 0;
            } });
            f.prototype.address = function () {
              var e4 = this;
              return { port: e4.localPort, family: "IPv4", address: e4.localAddress };
            };
            f.prototype.signal = function (t3) {
              var r3 = this;
              if (r3.destroyed) throw l("cannot signal after peer is destroyed", "ERR_SIGNALING");
              if (typeof t3 === "string") {
                try {
                  t3 = JSON.parse(t3);
                } catch (e4) {
                  t3 = {};
                }
              }
              r3._debug("signal()");
              if (t3.renegotiate) {
                r3._debug("got request to renegotiate");
                r3._needsNegotiation();
              }
              if (t3.candidate) {
                if (r3._pc.remoteDescription && r3._pc.remoteDescription.type) r3._addIceCandidate(t3.candidate);
                else r3._pendingCandidates.push(t3.candidate);
              }
              if (t3.sdp) {
                r3._pc.setRemoteDescription(new r3._wrtc.RTCSessionDescription(t3), function () {
                  if (r3.destroyed) return;
                  r3._pendingCandidates.forEach(function (e4) {
                    r3._addIceCandidate(e4);
                  });
                  r3._pendingCandidates = [];
                  if (r3._pc.remoteDescription.type === "offer") r3._createAnswer();
                }, function (e4) {
                  r3.destroy(l(e4, "ERR_SET_REMOTE_DESCRIPTION"));
                });
              }
              if (!t3.sdp && !t3.candidate && !t3.renegotiate) {
                r3.destroy(l("signal() called with invalid signal data", "ERR_SIGNALING"));
              }
            };
            f.prototype._addIceCandidate = function (e4) {
              var t3 = this;
              try {
                t3._pc.addIceCandidate(new t3._wrtc.RTCIceCandidate(e4), u, function (e5) {
                  t3.destroy(l(e5, "ERR_ADD_ICE_CANDIDATE"));
                });
              } catch (e5) {
                t3.destroy(l("error adding candidate: " + e5.message, "ERR_ADD_ICE_CANDIDATE"));
              }
            };
            f.prototype.send = function (e4) {
              var t3 = this;
              t3._channel.send(e4);
            };
            f.prototype.addStream = function (t3) {
              var r3 = this;
              r3._debug("addStream()");
              t3.getTracks().forEach(function (e4) {
                r3.addTrack(e4, t3);
              });
            };
            f.prototype.addTrack = function (e4, t3) {
              var r3 = this;
              r3._debug("addTrack()");
              var n2 = r3._pc.addTrack(e4, t3);
              var i2 = r3._senderMap.get(e4) || /* @__PURE__ */ new WeakMap();
              i2.set(t3, n2);
              r3._senderMap.set(e4, i2);
              r3._needsNegotiation();
            };
            f.prototype.removeTrack = function (e4, t3) {
              var r3 = this;
              r3._debug("removeSender()");
              var n2 = r3._senderMap.get(e4);
              var i2 = n2 ? n2.get(t3) : null;
              if (!i2) {
                r3.destroy(new Error("Cannot remove track that was never added."));
              }
              try {
                r3._pc.removeTrack(i2);
              } catch (e5) {
                if (e5.name === "NS_ERROR_UNEXPECTED") {
                  r3._sendersAwaitingStable.push(i2);
                } else {
                  r3.destroy(e5);
                }
              }
            };
            f.prototype.removeStream = function (t3) {
              var r3 = this;
              r3._debug("removeSenders()");
              t3.getTracks().forEach(function (e4) {
                r3.removeTrack(e4, t3);
              });
            };
            f.prototype._needsNegotiation = function () {
              var e4 = this;
              e4._debug("_needsNegotiation");
              if (e4._batchedNegotiation) return;
              e4._batchedNegotiation = true;
              setTimeout(function () {
                e4._batchedNegotiation = false;
                e4._debug("starting batched negotiation");
                e4.negotiate();
              }, 0);
            };
            f.prototype.negotiate = function () {
              var e4 = this;
              if (e4.initiator) {
                if (e4._isNegotiating) {
                  e4._queuedNegotiation = true;
                  e4._debug("already negotiating, queueing");
                } else {
                  e4._debug("start negotiation");
                  e4._createOffer();
                }
              } else {
                e4._debug("requesting negotiation from initiator");
                e4.emit("signal", { renegotiate: true });
              }
              e4._isNegotiating = true;
            };
            f.prototype.destroy = function (e4) {
              var t3 = this;
              t3._destroy(e4, function () {
              });
            };
            f.prototype._destroy = function (e4, t3) {
              var r3 = this;
              if (r3.destroyed) return;
              r3._debug("destroy (error: %s)", e4 && (e4.message || e4));
              r3.readable = r3.writable = false;
              if (!r3._readableState.ended) r3.push(null);
              if (!r3._writableState.finished) r3.end();
              r3.destroyed = true;
              r3.connected = false;
              r3._pcReady = false;
              r3._channelReady = false;
              r3._remoteTracks = null;
              r3._remoteStreams = null;
              r3._senderMap = null;
              clearInterval(r3._interval);
              clearTimeout(r3._reconnectTimeout);
              r3._interval = null;
              r3._reconnectTimeout = null;
              r3._chunk = null;
              r3._cb = null;
              if (r3._onFinishBound) r3.removeListener("finish", r3._onFinishBound);
              r3._onFinishBound = null;
              if (r3._channel) {
                try {
                  r3._channel.close();
                } catch (e5) {
                }
                r3._channel.onmessage = null;
                r3._channel.onopen = null;
                r3._channel.onclose = null;
                r3._channel.onerror = null;
              }
              if (r3._pc) {
                try {
                  r3._pc.close();
                } catch (e5) {
                }
                r3._pc.oniceconnectionstatechange = null;
                r3._pc.onicegatheringstatechange = null;
                r3._pc.onsignalingstatechange = null;
                r3._pc.onicecandidate = null;
                if ("addTrack" in r3._pc) {
                  r3._pc.ontrack = null;
                }
                r3._pc.ondatachannel = null;
              }
              r3._pc = null;
              r3._channel = null;
              if (e4) r3.emit("error", e4);
              r3.emit("close");
              t3();
            };
            f.prototype._setupData = function (e4) {
              var t3 = this;
              if (!e4.channel) {
                return t3.destroy(l("Data channel event is missing `channel` property", "ERR_DATA_CHANNEL"));
              }
              t3._channel = e4.channel;
              t3._channel.binaryType = "arraybuffer";
              if (typeof t3._channel.bufferedAmountLowThreshold === "number") {
                t3._channel.bufferedAmountLowThreshold = s;
              }
              t3.channelName = t3._channel.label;
              t3._channel.onmessage = function (e5) {
                t3._onChannelMessage(e5);
              };
              t3._channel.onbufferedamountlow = function () {
                t3._onChannelBufferedAmountLow();
              };
              t3._channel.onopen = function () {
                t3._onChannelOpen();
              };
              t3._channel.onclose = function () {
                t3._onChannelClose();
              };
              t3._channel.onerror = function (e5) {
                t3.destroy(l(e5, "ERR_DATA_CHANNEL"));
              };
            };
            f.prototype._read = function () {
            };
            f.prototype._write = function (e4, t3, r3) {
              var n2 = this;
              if (n2.destroyed) return r3(l("cannot write after peer is destroyed", "ERR_DATA_CHANNEL"));
              if (n2.connected) {
                try {
                  n2.send(e4);
                } catch (e5) {
                  return n2.destroy(l(e5, "ERR_DATA_CHANNEL"));
                }
                if (n2._channel.bufferedAmount > s) {
                  n2._debug("start backpressure: bufferedAmount %d", n2._channel.bufferedAmount);
                  n2._cb = r3;
                } else {
                  r3(null);
                }
              } else {
                n2._debug("write before connect");
                n2._chunk = e4;
                n2._cb = r3;
              }
            };
            f.prototype._onFinish = function () {
              var e4 = this;
              if (e4.destroyed) return;
              if (e4.connected) {
                t3();
              } else {
                e4.once("connect", t3);
              }
              function t3 () {
                setTimeout(function () {
                  e4.destroy();
                }, 1e3);
              }
            };
            f.prototype._createOffer = function () {
              var i2 = this;
              if (i2.destroyed) return;
              i2._pc.createOffer(function (t3) {
                if (i2.destroyed) return;
                t3.sdp = i2.sdpTransform(t3.sdp);
                i2._pc.setLocalDescription(t3, e4, r3);
                function e4 () {
                  i2._debug("createOffer success");
                  if (i2.destroyed) return;
                  if (i2.trickle || i2._iceComplete) n2();
                  else i2.once("_iceComplete", n2);
                }
                function r3 (e5) {
                  i2.destroy(l(e5, "ERR_SET_LOCAL_DESCRIPTION"));
                }
                function n2 () {
                  var e5 = i2._pc.localDescription || t3;
                  i2._debug("signal");
                  i2.emit("signal", { type: e5.type, sdp: e5.sdp });
                }
              }, function (e4) {
                i2.destroy(l(e4, "ERR_CREATE_OFFER"));
              }, i2.offerConstraints);
            };
            f.prototype._createAnswer = function () {
              var i2 = this;
              if (i2.destroyed) return;
              i2._pc.createAnswer(function (t3) {
                if (i2.destroyed) return;
                t3.sdp = i2.sdpTransform(t3.sdp);
                i2._pc.setLocalDescription(t3, e4, r3);
                function e4 () {
                  if (i2.destroyed) return;
                  if (i2.trickle || i2._iceComplete) n2();
                  else i2.once("_iceComplete", n2);
                }
                function r3 (e5) {
                  i2.destroy(l(e5, "ERR_SET_LOCAL_DESCRIPTION"));
                }
                function n2 () {
                  var e5 = i2._pc.localDescription || t3;
                  i2._debug("signal");
                  i2.emit("signal", { type: e5.type, sdp: e5.sdp });
                }
              }, function (e4) {
                i2.destroy(l(e4, "ERR_CREATE_ANSWER"));
              }, i2.answerConstraints);
            };
            f.prototype._onIceStateChange = function () {
              var e4 = this;
              if (e4.destroyed) return;
              var t3 = e4._pc.iceConnectionState;
              var r3 = e4._pc.iceGatheringState;
              e4._debug("iceStateChange (connection: %s) (gathering: %s)", t3, r3);
              e4.emit("iceStateChange", t3, r3);
              if (t3 === "connected" || t3 === "completed") {
                clearTimeout(e4._reconnectTimeout);
                e4._pcReady = true;
                e4._maybeReady();
              }
              if (t3 === "failed") {
                e4.destroy(l("Ice connection failed.", "ERR_ICE_CONNECTION_FAILURE"));
              }
              if (t3 === "closed") {
                e4.destroy(new Error("Ice connection closed."));
              }
            };
            f.prototype.getStats = function (r3) {
              var t3 = this;
              if (t3._pc.getStats.length === 0) {
                t3._pc.getStats().then(function (e4) {
                  var t4 = [];
                  e4.forEach(function (e5) {
                    t4.push(e5);
                  });
                  r3(null, t4);
                }, function (e4) {
                  r3(e4);
                });
              } else if (t3._isReactNativeWebrtc) {
                t3._pc.getStats(null, function (e4) {
                  var t4 = [];
                  e4.forEach(function (e5) {
                    t4.push(e5);
                  });
                  r3(null, t4);
                }, function (e4) {
                  r3(e4);
                });
              } else if (t3._pc.getStats.length > 0) {
                t3._pc.getStats(function (e4) {
                  if (t3.destroyed) return;
                  var n2 = [];
                  e4.result().forEach(function (t4) {
                    var r4 = {};
                    t4.names().forEach(function (e5) {
                      r4[e5] = t4.stat(e5);
                    });
                    r4.id = t4.id;
                    r4.type = t4.type;
                    r4.timestamp = t4.timestamp;
                    n2.push(r4);
                  });
                  r3(null, n2);
                }, function (e4) {
                  r3(e4);
                });
              } else {
                r3(null, []);
              }
            };
            f.prototype._maybeReady = function () {
              var f2 = this;
              f2._debug("maybeReady pc %s channel %s", f2._pcReady, f2._channelReady);
              if (f2.connected || f2._connecting || !f2._pcReady || !f2._channelReady) return;
              f2._connecting = true;
              function u2 () {
                if (f2.destroyed) return;
                f2.getStats(function (e4, t3) {
                  if (f2.destroyed) return;
                  if (e4) t3 = [];
                  var n2 = {};
                  var i2 = {};
                  var r3 = {};
                  var o2 = false;
                  t3.forEach(function (e5) {
                    if (e5.type === "remotecandidate" || e5.type === "remote-candidate") {
                      n2[e5.id] = e5;
                    }
                    if (e5.type === "localcandidate" || e5.type === "local-candidate") {
                      i2[e5.id] = e5;
                    }
                    if (e5.type === "candidatepair" || e5.type === "candidate-pair") {
                      r3[e5.id] = e5;
                    }
                  });
                  t3.forEach(function (e5) {
                    if (e5.type === "transport" && e5.selectedCandidatePairId) {
                      a2(r3[e5.selectedCandidatePairId]);
                    }
                    if (e5.type === "googCandidatePair" && e5.googActiveConnection === "true" || (e5.type === "candidatepair" || e5.type === "candidate-pair") && e5.selected) {
                      a2(e5);
                    }
                  });
                  function a2 (e5) {
                    o2 = true;
                    var t4 = i2[e5.localCandidateId];
                    if (t4 && t4.ip) {
                      f2.localAddress = t4.ip;
                      f2.localPort = Number(t4.port);
                    } else if (t4 && t4.ipAddress) {
                      f2.localAddress = t4.ipAddress;
                      f2.localPort = Number(t4.portNumber);
                    } else if (typeof e5.googLocalAddress === "string") {
                      t4 = e5.googLocalAddress.split(":");
                      f2.localAddress = t4[0];
                      f2.localPort = Number(t4[1]);
                    }
                    var r4 = n2[e5.remoteCandidateId];
                    if (r4 && r4.ip) {
                      f2.remoteAddress = r4.ip;
                      f2.remotePort = Number(r4.port);
                    } else if (r4 && r4.ipAddress) {
                      f2.remoteAddress = r4.ipAddress;
                      f2.remotePort = Number(r4.portNumber);
                    } else if (typeof e5.googRemoteAddress === "string") {
                      r4 = e5.googRemoteAddress.split(":");
                      f2.remoteAddress = r4[0];
                      f2.remotePort = Number(r4[1]);
                    }
                    f2.remoteFamily = "IPv4";
                    f2._debug("connect local: %s:%s remote: %s:%s", f2.localAddress, f2.localPort, f2.remoteAddress, f2.remotePort);
                  }
                  if (!o2 && (!Object.keys(r3).length || Object.keys(i2).length)) {
                    setTimeout(u2, 100);
                    return;
                  } else {
                    f2._connecting = false;
                    f2.connected = true;
                  }
                  if (f2._chunk) {
                    try {
                      f2.send(f2._chunk);
                    } catch (e5) {
                      return f2.destroy(l(e5, "ERR_DATA_CHANNEL"));
                    }
                    f2._chunk = null;
                    f2._debug('sent chunk from "write before connect"');
                    var s2 = f2._cb;
                    f2._cb = null;
                    s2(null);
                  }
                  if (typeof f2._channel.bufferedAmountLowThreshold !== "number") {
                    f2._interval = setInterval(function () {
                      f2._onInterval();
                    }, 150);
                    if (f2._interval.unref) f2._interval.unref();
                  }
                  f2._debug("connect");
                  f2.emit("connect");
                });
              }
              u2();
            };
            f.prototype._onInterval = function () {
              var e4 = this;
              if (!e4._cb || !e4._channel || e4._channel.bufferedAmount > s) {
                return;
              }
              e4._onChannelBufferedAmountLow();
            };
            f.prototype._onSignalingStateChange = function () {
              var t3 = this;
              if (t3.destroyed) return;
              if (t3._pc.signalingState === "stable") {
                t3._isNegotiating = false;
                t3._debug("flushing sender queue", t3._sendersAwaitingStable);
                t3._sendersAwaitingStable.forEach(function (e4) {
                  t3.removeTrack(e4);
                  t3._queuedNegotiation = true;
                });
                t3._sendersAwaitingStable = [];
                if (t3._queuedNegotiation) {
                  t3._debug("flushing negotiation queue");
                  t3._queuedNegotiation = false;
                  t3._needsNegotiation();
                }
                t3._debug("negotiate");
                t3.emit("negotiate");
              }
              t3._debug("signalingStateChange %s", t3._pc.signalingState);
              t3.emit("signalingStateChange", t3._pc.signalingState);
            };
            f.prototype._onIceCandidate = function (e4) {
              var t3 = this;
              if (t3.destroyed) return;
              if (e4.candidate && t3.trickle) {
                t3.emit("signal", { candidate: { candidate: e4.candidate.candidate, sdpMLineIndex: e4.candidate.sdpMLineIndex, sdpMid: e4.candidate.sdpMid } });
              } else if (!e4.candidate) {
                t3._iceComplete = true;
                t3.emit("_iceComplete");
              }
            };
            f.prototype._onChannelMessage = function (e4) {
              var t3 = this;
              if (t3.destroyed) return;
              var r3 = e4.data;
              if (r3 instanceof ArrayBuffer) r3 = n.from(r3);
              t3.push(r3);
            };
            f.prototype._onChannelBufferedAmountLow = function () {
              var e4 = this;
              if (e4.destroyed || !e4._cb) return;
              e4._debug("ending backpressure: bufferedAmount %d", e4._channel.bufferedAmount);
              var t3 = e4._cb;
              e4._cb = null;
              t3(null);
            };
            f.prototype._onChannelOpen = function () {
              var e4 = this;
              if (e4.connected || e4.destroyed) return;
              e4._debug("on channel open");
              e4._channelReady = true;
              e4._maybeReady();
            };
            f.prototype._onChannelClose = function () {
              var e4 = this;
              if (e4.destroyed) return;
              e4._debug("on channel close");
              e4.destroy();
            };
            f.prototype._onTrack = function (e4) {
              var r3 = this;
              if (r3.destroyed) return;
              e4.streams.forEach(function (t3) {
                r3._debug("on track");
                r3.emit("track", e4.track, t3);
                r3._remoteTracks.push({ track: e4.track, stream: t3 });
                if (r3._remoteStreams.some(function (e5) {
                  return e5.id === t3.id;
                })) return;
                r3._remoteStreams.push(t3);
                setTimeout(function () {
                  r3.emit("stream", t3);
                }, 0);
              });
            };
            f.prototype._debug = function () {
              var e4 = this;
              var t3 = [].slice.call(arguments);
              t3[0] = "[" + e4._id + "] " + t3[0];
              r2.apply(null, t3);
            };
            f.prototype._transformConstraints = function (e4) {
              var t3 = this;
              if (Object.keys(e4).length === 0) {
                return e4;
              }
              if ((e4.mandatory || e4.optional) && !t3._isChromium) {
                var r3 = Object.assign({}, e4.optional, e4.mandatory);
                if (r3.OfferToReceiveVideo !== void 0) {
                  r3.offerToReceiveVideo = r3.OfferToReceiveVideo;
                  delete r3["OfferToReceiveVideo"];
                }
                if (r3.OfferToReceiveAudio !== void 0) {
                  r3.offerToReceiveAudio = r3.OfferToReceiveAudio;
                  delete r3["OfferToReceiveAudio"];
                }
                return r3;
              } else if (!e4.mandatory && !e4.optional && t3._isChromium) {
                if (e4.offerToReceiveVideo !== void 0) {
                  e4.OfferToReceiveVideo = e4.offerToReceiveVideo;
                  delete e4["offerToReceiveVideo"];
                }
                if (e4.offerToReceiveAudio !== void 0) {
                  e4.OfferToReceiveAudio = e4.offerToReceiveAudio;
                  delete e4["offerToReceiveAudio"];
                }
                return { mandatory: e4 };
              }
              return e4;
            };
            function l (e4, t3) {
              var r3 = new Error(e4);
              r3.code = t3;
              return r3;
            }
            function u () {
            }
          }).call(this, t2("buffer").Buffer);
        }, { buffer: 3, debug: 6, "get-browser-rtc": 8, inherits: 10, randombytes: 16, "readable-stream": 25 }] }, {}, [])("/");
      });
    }
  });
  require_simplepeer_min();
})();
