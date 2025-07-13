(() => {
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __commonJS = (cb, mod) => function __require () {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  };

  // json/clarinet/clarinet.js
  var require_clarinet = __commonJS({
    "json/clarinet/clarinet.js" (exports) {
      SvGlobals.globals().clarinet = {};
      var exports = clarinet;
      (function (clarinet2) {
        "use strict";
        var env = typeof process === "object" && process.env ? process.env : self;
        clarinet2.parser = function (opt) {
          return new CParser(opt);
        };
        clarinet2.CParser = CParser;
        clarinet2.CStream = CStream;
        clarinet2.createStream = createStream;
        clarinet2.MAX_BUFFER_LENGTH = 64 * 1024;
        clarinet2.DEBUG = env.CDEBUG === "debug";
        clarinet2.INFO = env.CDEBUG === "debug" || env.CDEBUG === "info";
        clarinet2.EVENTS = [
          "value",
          "string",
          "key",
          "openobject",
          "closeobject",
          "openarray",
          "closearray",
          "error",
          "end",
          "ready"
        ];
        var buffers = {
          textNode: void 0,
          numberNode: ""
        }, streamWraps = clarinet2.EVENTS.filter(function (ev) {
          return ev !== "error" && ev !== "end";
        }), S = 0, Stream;
        clarinet2.STATE = {
          BEGIN: S++,
          VALUE: S++,
          OPEN_OBJECT: S++,
          CLOSE_OBJECT: S++,
          OPEN_ARRAY: S++,
          CLOSE_ARRAY: S++,
          TEXT_ESCAPE: S++,
          STRING: S++,
          BACKSLASH: S++,
          END: S++,
          OPEN_KEY: S++,
          CLOSE_KEY: S++,
          TRUE: S++,
          TRUE2: S++,
          TRUE3: S++,
          FALSE: S++,
          FALSE2: S++,
          FALSE3: S++,
          FALSE4: S++,
          NULL: S++,
          NULL2: S++,
          NULL3: S++,
          NUMBER_DECIMAL_POINT: S++,
          NUMBER_DIGIT: S++
          // [0-9]
        };
        for (var s_ in clarinet2.STATE) clarinet2.STATE[clarinet2.STATE[s_]] = s_;
        S = clarinet2.STATE;
        const Char = {
          tab: 9,
          // \t
          lineFeed: 10,
          // \n
          carriageReturn: 13,
          // \r
          space: 32,
          // " "
          doubleQuote: 34,
          // "
          plus: 43,
          // +
          comma: 44,
          // ,
          minus: 45,
          // -
          period: 46,
          // .
          _0: 48,
          // 0
          _9: 57,
          // 9
          colon: 58,
          // :
          E: 69,
          // E
          openBracket: 91,
          // [
          backslash: 92,
          // \
          closeBracket: 93,
          // ]
          a: 97,
          // a
          b: 98,
          // b
          e: 101,
          // e 
          f: 102,
          // f
          l: 108,
          // l
          n: 110,
          // n
          r: 114,
          // r
          s: 115,
          // s
          t: 116,
          // t
          u: 117,
          // u
          openBrace: 123,
          // {
          closeBrace: 125
          // }
        };
        if (!Object.create) {
          Object.create = function (o) {
            function f () {
              this["__proto__"] = o;
            }
            f.prototype = o;
            return new f();
          };
        }
        if (!Object.getPrototypeOf) {
          Object.getPrototypeOf = function (o) {
            return o["__proto__"];
          };
        }
        if (!Object.keys) {
          Object.keys = function (o) {
            var a = [];
            for (var i in o) if (o.hasOwnProperty(i)) a.push(i);
            return a;
          };
        }
        function checkBufferLength (parser) {
          var maxAllowed = Math.max(clarinet2.MAX_BUFFER_LENGTH, 10), maxActual = 0;
          for (var buffer in buffers) {
            var len = parser[buffer] === void 0 ? 0 : parser[buffer].length;
            if (len > maxAllowed) {
              switch (buffer) {
                case "text":
                  closeText(parser);
                  break;
                default:
                  error(parser, "Max buffer length exceeded: " + buffer);
              }
            }
            maxActual = Math.max(maxActual, len);
          }
          parser.bufferCheckPosition = clarinet2.MAX_BUFFER_LENGTH - maxActual + parser.position;
        }
        function clearBuffers (parser) {
          for (var buffer in buffers) {
            parser[buffer] = buffers[buffer];
          }
        }
        var stringTokenPattern = /[\\"\n]/g;
        function CParser (opt) {
          if (!(this instanceof CParser)) return new CParser(opt);
          var parser = this;
          clearBuffers(parser);
          parser.bufferCheckPosition = clarinet2.MAX_BUFFER_LENGTH;
          parser.q = parser.c = parser.p = "";
          parser.opt = opt || {};
          parser.closed = parser.closedRoot = parser.sawRoot = false;
          parser.tag = parser.error = null;
          parser.state = S.BEGIN;
          parser.stack = new Array();
          parser.position = parser.column = 0;
          parser.line = 1;
          parser.slashed = false;
          parser.unicodeI = 0;
          parser.unicodeS = null;
          parser.depth = 0;
          emit(parser, "onready");
        }
        CParser.prototype = {
          end: function () {
            end(this);
          },
          write,
          resume: function () {
            this.error = null;
            return this;
          },
          close: function () {
            return this.write(null);
          }
        };
        Stream = function () {
        };
        function createStream (opt) {
          return new CStream(opt);
        }
        function CStream (opt) {
          if (!(this instanceof CStream)) return new CStream(opt);
          this._parser = new CParser(opt);
          this.writable = true;
          this.readable = true;
          this.bytes_remaining = 0;
          this.bytes_in_sequence = 0;
          this.temp_buffs = { "2": new Buffer(2), "3": new Buffer(3), "4": new Buffer(4) };
          this.string = "";
          var me = this;
          Stream.apply(me);
          this._parser.onend = function () {
            me.emit("end");
          };
          this._parser.onerror = function (er) {
            me.emit("error", er);
            me._parser.error = null;
          };
          streamWraps.forEach(function (ev) {
            Object.defineProperty(
              me,
              "on" + ev,
              {
                get: function () {
                  return me._parser["on" + ev];
                },
                set: function (h) {
                  if (!h) {
                    me.removeAllListeners(ev);
                    me._parser["on" + ev] = h;
                    return h;
                  }
                  me.on(ev, h);
                },
                enumerable: true,
                configurable: false
              }
            );
          });
        }
        CStream.prototype = Object.create(
          Stream.prototype,
          { constructor: { value: CStream } }
        );
        CStream.prototype.write = function (data) {
          data = new Buffer(data);
          for (var i = 0; i < data.length; i++) {
            var n = data[i];
            if (this.bytes_remaining > 0) {
              for (var j = 0; j < this.bytes_remaining; j++) {
                this.temp_buffs[this.bytes_in_sequence][this.bytes_in_sequence - this.bytes_remaining + j] = data[j];
              }
              this.string = this.temp_buffs[this.bytes_in_sequence].toString();
              this.bytes_in_sequence = this.bytes_remaining = 0;
              i = i + j - 1;
              this._parser.write(this.string);
              this.emit("data", this.string);
              continue;
            }
            if (this.bytes_remaining === 0 && n >= 128) {
              if (n >= 194 && n <= 223) this.bytes_in_sequence = 2;
              if (n >= 224 && n <= 239) this.bytes_in_sequence = 3;
              if (n >= 240 && n <= 244) this.bytes_in_sequence = 4;
              if (this.bytes_in_sequence + i > data.length) {
                for (var k = 0; k <= data.length - 1 - i; k++) {
                  this.temp_buffs[this.bytes_in_sequence][k] = data[i + k];
                }
                this.bytes_remaining = i + this.bytes_in_sequence - data.length;
                return true;
              } else {
                this.string = data.slice(i, i + this.bytes_in_sequence).toString();
                i = i + this.bytes_in_sequence - 1;
                this._parser.write(this.string);
                this.emit("data", this.string);
                continue;
              }
            }
            for (var p = i; p < data.length; p++) {
              if (data[p] >= 128) break;
            }
            this.string = data.slice(i, p).toString();
            this._parser.write(this.string);
            this.emit("data", this.string);
            i = p - 1;
            continue;
          }
        };
        CStream.prototype.end = function (chunk) {
          if (chunk && chunk.length) this._parser.write(chunk.toString());
          this._parser.end();
          return true;
        };
        CStream.prototype.on = function (ev, handler) {
          var me = this;
          if (!me._parser["on" + ev] && streamWraps.indexOf(ev) !== -1) {
            me._parser["on" + ev] = function () {
              var args = arguments.length === 1 ? [arguments[0]] : Array.apply(null, arguments);
              args.splice(0, 0, ev);
              me.emit.apply(me, args);
            };
          }
          return Stream.prototype.on.call(me, ev, handler);
        };
        CStream.prototype.destroy = function () {
          clearBuffers(this._parser);
          this.emit("close");
        };
        function emit (parser, event, data) {
          if (clarinet2.INFO) console.log("-- emit", event, data);
          if (parser[event]) parser[event](data);
        }
        function emitNode (parser, event, data) {
          closeValue(parser);
          emit(parser, event, data);
        }
        function closeValue (parser, event) {
          parser.textNode = textopts(parser.opt, parser.textNode);
          if (parser.textNode !== void 0) {
            emit(parser, event ? event : "onvalue", parser.textNode);
          }
          parser.textNode = void 0;
        }
        function closeNumber (parser) {
          if (parser.numberNode)
            emit(parser, "onvalue", parseFloat(parser.numberNode));
          parser.numberNode = "";
        }
        function textopts (opt, text) {
          if (text === void 0) {
            return text;
          }
          if (opt.trim) text = text.trim();
          if (opt.normalize) text = text.replace(/\s+/g, " ");
          return text;
        }
        function error (parser, er) {
          closeValue(parser);
          er += "\nLine: " + parser.line + "\nColumn: " + parser.column + "\nChar: " + parser.c;
          er = new Error(er);
          parser.error = er;
          emit(parser, "onerror", er);
          return parser;
        }
        function end (parser) {
          if (parser.state !== S.VALUE || parser.depth !== 0)
            error(parser, "Unexpected end");
          closeValue(parser);
          parser.c = "";
          parser.closed = true;
          emit(parser, "onend");
          CParser.call(parser, parser.opt);
          return parser;
        }
        function isWhitespace (c) {
          return c === Char.carriageReturn || c === Char.lineFeed || c === Char.space || c === Char.tab;
        }
        function write (chunk) {
          var parser = this;
          if (this.error) throw this.error;
          if (parser.closed) return error(
            parser,
            "Cannot write after close. Assign an onready handler."
          );
          if (chunk === null) return end(parser);
          var i = 0, c = chunk.charCodeAt(0), p = parser.p;
          var lockIncrements = false;
          if (clarinet2.DEBUG) console.log("write -> [" + chunk + "]");
          while (c) {
            p = c;
            parser.c = c = chunk.charCodeAt(i++);
            if (p !== c) parser.p = p;
            else p = parser.p;
            if (!c) break;
            if (clarinet2.DEBUG) console.log(i, c, clarinet2.STATE[parser.state]);
            if (!lockIncrements) {
              parser.position++;
              if (c === Char.lineFeed) {
                parser.line++;
                parser.column = 0;
              } else parser.column++;
            } else {
              lockIncrements = false;
            }
            switch (parser.state) {
              case S.BEGIN:
                if (c === Char.openBrace) parser.state = S.OPEN_OBJECT;
                else if (c === Char.openBracket) parser.state = S.OPEN_ARRAY;
                else if (!isWhitespace(c))
                  error(parser, "Non-whitespace before {[.");
                continue;
              case S.OPEN_KEY:
              case S.OPEN_OBJECT:
                if (isWhitespace(c)) continue;
                if (parser.state === S.OPEN_KEY) parser.stack.push(S.CLOSE_KEY);
                else {
                  if (c === Char.closeBrace) {
                    emit(parser, "onopenobject");
                    this.depth++;
                    emit(parser, "oncloseobject");
                    this.depth--;
                    parser.state = parser.stack.pop() || S.VALUE;
                    continue;
                  } else parser.stack.push(S.CLOSE_OBJECT);
                }
                if (c === Char.doubleQuote) parser.state = S.STRING;
                else error(parser, 'Malformed object key should start with "');
                continue;
              case S.CLOSE_KEY:
              case S.CLOSE_OBJECT:
                if (isWhitespace(c)) continue;
                var event = parser.state === S.CLOSE_KEY ? "key" : "object";
                if (c === Char.colon) {
                  if (parser.state === S.CLOSE_OBJECT) {
                    parser.stack.push(S.CLOSE_OBJECT);
                    closeValue(parser, "onopenobject");
                    this.depth++;
                  } else closeValue(parser, "onkey");
                  parser.state = S.VALUE;
                } else if (c === Char.closeBrace) {
                  emitNode(parser, "oncloseobject");
                  this.depth--;
                  parser.state = parser.stack.pop() || S.VALUE;
                } else if (c === Char.comma) {
                  if (parser.state === S.CLOSE_OBJECT)
                    parser.stack.push(S.CLOSE_OBJECT);
                  closeValue(parser);
                  parser.state = S.OPEN_KEY;
                } else error(parser, "Bad object");
                continue;
              case S.OPEN_ARRAY:
              // after an array there always a value
              case S.VALUE:
                if (isWhitespace(c)) continue;
                if (parser.state === S.OPEN_ARRAY) {
                  emit(parser, "onopenarray");
                  this.depth++;
                  parser.state = S.VALUE;
                  if (c === Char.closeBracket) {
                    emit(parser, "onclosearray");
                    this.depth--;
                    parser.state = parser.stack.pop() || S.VALUE;
                    continue;
                  } else {
                    parser.stack.push(S.CLOSE_ARRAY);
                  }
                }
                if (c === Char.doubleQuote) parser.state = S.STRING;
                else if (c === Char.openBrace) parser.state = S.OPEN_OBJECT;
                else if (c === Char.openBracket) parser.state = S.OPEN_ARRAY;
                else if (c === Char.t) parser.state = S.TRUE;
                else if (c === Char.f) parser.state = S.FALSE;
                else if (c === Char.n) parser.state = S.NULL;
                else if (c === Char.minus) {
                  parser.numberNode += "-";
                } else if (Char._0 <= c && c <= Char._9) {
                  parser.numberNode += String.fromCharCode(c);
                  parser.state = S.NUMBER_DIGIT;
                } else error(parser, "Bad value");
                continue;
              case S.CLOSE_ARRAY:
                if (c === Char.comma) {
                  parser.stack.push(S.CLOSE_ARRAY);
                  closeValue(parser, "onvalue");
                  parser.state = S.VALUE;
                } else if (c === Char.closeBracket) {
                  emitNode(parser, "onclosearray");
                  this.depth--;
                  parser.state = parser.stack.pop() || S.VALUE;
                } else if (isWhitespace(c))
                  continue;
                else error(parser, "Bad array");
                continue;
              case S.STRING:
                if (parser.textNode === void 0) {
                  parser.textNode = "";
                }
                var starti = i - 1, slashed = parser.slashed, unicodeI = parser.unicodeI;
                STRING_BIGLOOP: while (true) {
                  if (clarinet2.DEBUG)
                    console.log(
                      i,
                      c,
                      clarinet2.STATE[parser.state],
                      slashed
                    );
                  while (unicodeI > 0) {
                    parser.unicodeS += String.fromCharCode(c);
                    c = chunk.charCodeAt(i++);
                    parser.position++;
                    if (unicodeI === 4) {
                      parser.textNode += String.fromCharCode(parseInt(parser.unicodeS, 16));
                      unicodeI = 0;
                      starti = i - 1;
                    } else {
                      unicodeI++;
                    }
                    if (!c) break STRING_BIGLOOP;
                  }
                  if (c === Char.doubleQuote && !slashed) {
                    parser.state = parser.stack.pop() || S.VALUE;
                    parser.textNode += chunk.substring(starti, i - 1);
                    parser.position += i - 1 - starti;
                    break;
                  }
                  if (c === Char.backslash && !slashed) {
                    slashed = true;
                    parser.textNode += chunk.substring(starti, i - 1);
                    parser.position += i - 1 - starti;
                    c = chunk.charCodeAt(i++);
                    parser.position++;
                    if (!c) break;
                  }
                  if (slashed) {
                    slashed = false;
                    if (c === Char.n) {
                      parser.textNode += "\n";
                    } else if (c === Char.r) {
                      parser.textNode += "\r";
                    } else if (c === Char.t) {
                      parser.textNode += "	";
                    } else if (c === Char.f) {
                      parser.textNode += "\f";
                    } else if (c === Char.b) {
                      parser.textNode += "\b";
                    } else if (c === Char.u) {
                      unicodeI = 1;
                      parser.unicodeS = "";
                    } else {
                      parser.textNode += String.fromCharCode(c);
                    }
                    c = chunk.charCodeAt(i++);
                    parser.position++;
                    starti = i - 1;
                    if (!c) break;
                    else continue;
                  }
                  stringTokenPattern.lastIndex = i;
                  var reResult = stringTokenPattern.exec(chunk);
                  if (reResult === null) {
                    i = chunk.length + 1;
                    parser.textNode += chunk.substring(starti, i - 1);
                    parser.position += i - 1 - starti;
                    break;
                  }
                  i = reResult.index + 1;
                  c = chunk.charCodeAt(reResult.index);
                  if (!c) {
                    parser.textNode += chunk.substring(starti, i - 1);
                    parser.position += i - 1 - starti;
                    break;
                  }
                }
                parser.slashed = slashed;
                parser.unicodeI = unicodeI;
                continue;
              case S.TRUE:
                if (c === Char.r) parser.state = S.TRUE2;
                else error(parser, "Invalid true started with t" + c);
                continue;
              case S.TRUE2:
                if (c === Char.u) parser.state = S.TRUE3;
                else error(parser, "Invalid true started with tr" + c);
                continue;
              case S.TRUE3:
                if (c === Char.e) {
                  emit(parser, "onvalue", true);
                  parser.state = parser.stack.pop() || S.VALUE;
                } else error(parser, "Invalid true started with tru" + c);
                continue;
              case S.FALSE:
                if (c === Char.a) parser.state = S.FALSE2;
                else error(parser, "Invalid false started with f" + c);
                continue;
              case S.FALSE2:
                if (c === Char.l) parser.state = S.FALSE3;
                else error(parser, "Invalid false started with fa" + c);
                continue;
              case S.FALSE3:
                if (c === Char.s) parser.state = S.FALSE4;
                else error(parser, "Invalid false started with fal" + c);
                continue;
              case S.FALSE4:
                if (c === Char.e) {
                  emit(parser, "onvalue", false);
                  parser.state = parser.stack.pop() || S.VALUE;
                } else error(parser, "Invalid false started with fals" + c);
                continue;
              case S.NULL:
                if (c === Char.u) parser.state = S.NULL2;
                else error(parser, "Invalid null started with n" + c);
                continue;
              case S.NULL2:
                if (c === Char.l) parser.state = S.NULL3;
                else error(parser, "Invalid null started with nu" + c);
                continue;
              case S.NULL3:
                if (c === Char.l) {
                  emit(parser, "onvalue", null);
                  parser.state = parser.stack.pop() || S.VALUE;
                } else error(parser, "Invalid null started with nul" + c);
                continue;
              case S.NUMBER_DECIMAL_POINT:
                if (c === Char.period) {
                  parser.numberNode += ".";
                  parser.state = S.NUMBER_DIGIT;
                } else error(parser, "Leading zero not followed by .");
                continue;
              case S.NUMBER_DIGIT:
                if (Char._0 <= c && c <= Char._9) parser.numberNode += String.fromCharCode(c);
                else if (c === Char.period) {
                  if (parser.numberNode.indexOf(".") !== -1)
                    error(parser, "Invalid number has two dots");
                  parser.numberNode += ".";
                } else if (c === Char.e || c === Char.E) {
                  if (parser.numberNode.indexOf("e") !== -1 || parser.numberNode.indexOf("E") !== -1)
                    error(parser, "Invalid number has two exponential");
                  parser.numberNode += "e";
                } else if (c === Char.plus || c === Char.minus) {
                  if (!(p === Char.e || p === Char.E))
                    error(parser, "Invalid symbol in number");
                  parser.numberNode += String.fromCharCode(c);
                } else {
                  closeNumber(parser);
                  i--;
                  lockIncrements = true;
                  parser.state = parser.stack.pop() || S.VALUE;
                }
                continue;
              default:
                error(parser, "Unknown state: " + parser.state);
            }
          }
          if (parser.position >= parser.bufferCheckPosition)
            checkBufferLength(parser);
          return parser;
        }
      })(false ? 0 : exports);
    }
  });
  require_clarinet();
})();
