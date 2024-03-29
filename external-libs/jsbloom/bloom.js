"use strict";

var globalsRoot = function () {
    if (typeof(window) === "undefined") {
        return global
    }
    return window
}

globalsRoot().JSBloom = {};

JSBloom.filter = function (items, target_prob) {

    if (typeof items !== "number" || typeof target_prob !== "number" || target_prob >= 1) {
        throw Error("Usage: new JSBloom.filter(items, target_probability)");
    };

    var BUFFER_LEN = (function () {
            var buffer = Math.ceil((items * Math.log(target_prob)) / Math.log(1.0 / (Math.pow(2.0, Math.log(2.0)))));

            if ((buffer % 8) !== 0) {
                buffer += 8 - (buffer % 8);
            };

            return buffer;
        })(),
        HASH_ROUNDS = Math.round(Math.log(2.0) * BUFFER_LEN / items),
        LZString = function () {
            function o(o, r) {
                if (!t[o]) {
                    t[o] = {};
                    for (var n = 0; n < o.length; n++) t[o][o.charAt(n)] = n
                }
                return t[o][r]
            }
            var r = String.fromCharCode,
                n = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",
                e = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+-$",
                t = {},
                i = {
                    compressToBase64: function (o) {
                        if (null == o) return "";
                        var r = i._compress(o, 6, function (o) {
                            return n.charAt(o)
                        });
                        switch (r.length % 4) {
                        default:
                        case 0:
                            return r;
                        case 1:
                            return r + "===";
                        case 2:
                            return r + "==";
                        case 3:
                            return r + "="
                        }
                    },
                    decompressFromBase64: function (r) {
                        return null == r ? "" : "" == r ? null : i._decompress(r.length, 32, function (e) {
                            return o(n, r.charAt(e))
                        })
                    },
                    compressToUTF16: function (o) {
                        return null == o ? "" : i._compress(o, 15, function (o) {
                            return r(o + 32)
                        }) + " "
                    },
                    decompressFromUTF16: function (o) {
                        return null == o ? "" : "" == o ? null : i._decompress(o.length, 16384, function (r) {
                            return o.charCodeAt(r) - 32
                        })
                    },
                    compressToUint8Array: function (o) {
                        for (var r = i.compress(o), n = new Uint8Array(2 * r.length), e = 0, t = r.length; t > e; e++) {
                            var s = r.charCodeAt(e);
                            n[2 * e] = s >>> 8, n[2 * e + 1] = s % 256
                        }
                        return n
                    },
                    decompressFromUint8Array: function (o) {
                        if (null === o || void 0 === o) return i.decompress(o);
                        for (var n = new Array(o.length / 2), e = 0, t = n.length; t > e; e++) n[e] = 256 * o[2 * e] + o[2 * e + 1];
                        var s = [];
                        return n.forEach(function (o) {
                            s.push(r(o))
                        }), i.decompress(s.join(""))
                    },
                    compressToEncodedURIComponent: function (o) {
                        return null == o ? "" : i._compress(o, 6, function (o) {
                            return e.charAt(o)
                        })
                    },
                    decompressFromEncodedURIComponent: function (r) {
                        return null == r ? "" : "" == r ? null : (r = r.replace(/ /g, "+"), i._decompress(r.length, 32, function (n) {
                            return o(e, r.charAt(n))
                        }))
                    },
                    compress: function (o) {
                        return i._compress(o, 16, function (o) {
                            return r(o)
                        })
                    },
                    _compress: function (o, r, n) {
                        if (null == o) return "";
                        var e, t, i, s = {},
                            p = {},
                            u = "",
                            c = "",
                            a = "",
                            l = 2,
                            f = 3,
                            h = 2,
                            d = [],
                            m = 0,
                            v = 0;
                        for (i = 0; i < o.length; i += 1)
                            if (u = o.charAt(i), Object.prototype.hasOwnProperty.call(s, u) || (s[u] = f++ , p[u] = !0), c = a + u, Object.prototype.hasOwnProperty.call(s, c)) a = c;
                            else {
                                if (Object.prototype.hasOwnProperty.call(p, a)) {
                                    if (a.charCodeAt(0) < 256) {
                                        for (e = 0; h > e; e++) m <<= 1, v == r - 1 ? (v = 0, d.push(n(m)), m = 0) : v++;
                                        for (t = a.charCodeAt(0), e = 0; 8 > e; e++) m = m << 1 | 1 & t, v == r - 1 ? (v = 0, d.push(n(m)), m = 0) : v++ , t >>= 1
                                    } else {
                                        for (t = 1, e = 0; h > e; e++) m = m << 1 | t, v == r - 1 ? (v = 0, d.push(n(m)), m = 0) : v++ , t = 0;
                                        for (t = a.charCodeAt(0), e = 0; 16 > e; e++) m = m << 1 | 1 & t, v == r - 1 ? (v = 0, d.push(n(m)), m = 0) : v++ , t >>= 1
                                    }
                                    l-- , 0 == l && (l = Math.pow(2, h), h++), delete p[a]
                                } else
                                    for (t = s[a], e = 0; h > e; e++) m = m << 1 | 1 & t, v == r - 1 ? (v = 0, d.push(n(m)), m = 0) : v++ , t >>= 1;
                                l-- , 0 == l && (l = Math.pow(2, h), h++), s[c] = f++ , a = String(u)
                            }
                        if ("" !== a) {
                            if (Object.prototype.hasOwnProperty.call(p, a)) {
                                if (a.charCodeAt(0) < 256) {
                                    for (e = 0; h > e; e++) m <<= 1, v == r - 1 ? (v = 0, d.push(n(m)), m = 0) : v++;
                                    for (t = a.charCodeAt(0), e = 0; 8 > e; e++) m = m << 1 | 1 & t, v == r - 1 ? (v = 0, d.push(n(m)), m = 0) : v++ , t >>= 1
                                } else {
                                    for (t = 1, e = 0; h > e; e++) m = m << 1 | t, v == r - 1 ? (v = 0, d.push(n(m)), m = 0) : v++ , t = 0;
                                    for (t = a.charCodeAt(0), e = 0; 16 > e; e++) m = m << 1 | 1 & t, v == r - 1 ? (v = 0, d.push(n(m)), m = 0) : v++ , t >>= 1
                                }
                                l-- , 0 == l && (l = Math.pow(2, h), h++), delete p[a]
                            } else
                                for (t = s[a], e = 0; h > e; e++) m = m << 1 | 1 & t, v == r - 1 ? (v = 0, d.push(n(m)), m = 0) : v++ , t >>= 1;
                            l-- , 0 == l && (l = Math.pow(2, h), h++)
                        }
                        for (t = 2, e = 0; h > e; e++) m = m << 1 | 1 & t, v == r - 1 ? (v = 0, d.push(n(m)), m = 0) : v++ , t >>= 1;
                        for (; ;) {
                            if (m <<= 1, v == r - 1) {
                                d.push(n(m));
                                break
                            }
                            v++
                        }
                        return d.join("")
                    },
                    decompress: function (o) {
                        return null == o ? "" : "" == o ? null : i._decompress(o.length, 32768, function (r) {
                            return o.charCodeAt(r)
                        })
                    },
                    _decompress: function (o, n, e) {
                        var t, i, s, p, u, c, a, l, f = [],
                            h = 4,
                            d = 4,
                            m = 3,
                            v = "",
                            w = [],
                            A = {
                                val: e(0),
                                position: n,
                                index: 1
                            };
                        for (i = 0; 3 > i; i += 1) f[i] = i;
                        for (p = 0, c = Math.pow(2, 2), a = 1; a != c;) u = A.val & A.position, A.position >>= 1, 0 == A.position && (A.position = n, A.val = e(A.index++)), p |= (u > 0 ? 1 : 0) * a, a <<= 1;
                        switch (t = p) {
                        case 0:
                            for (p = 0, c = Math.pow(2, 8), a = 1; a != c;) u = A.val & A.position, A.position >>= 1, 0 == A.position && (A.position = n, A.val = e(A.index++)), p |= (u > 0 ? 1 : 0) * a, a <<= 1;
                            l = r(p);
                            break;
                        case 1:
                            for (p = 0, c = Math.pow(2, 16), a = 1; a != c;) u = A.val & A.position, A.position >>= 1, 0 == A.position && (A.position = n, A.val = e(A.index++)), p |= (u > 0 ? 1 : 0) * a, a <<= 1;
                            l = r(p);
                            break;
                        case 2:
                            return ""
                        }
                        for (f[3] = l, s = l, w.push(l); ;) {
                            if (A.index > o) return "";
                            for (p = 0, c = Math.pow(2, m), a = 1; a != c;) u = A.val & A.position, A.position >>= 1, 0 == A.position && (A.position = n, A.val = e(A.index++)), p |= (u > 0 ? 1 : 0) * a, a <<= 1;
                            switch (l = p) {
                            case 0:
                                for (p = 0, c = Math.pow(2, 8), a = 1; a != c;) u = A.val & A.position, A.position >>= 1, 0 == A.position && (A.position = n, A.val = e(A.index++)), p |= (u > 0 ? 1 : 0) * a, a <<= 1;
                                f[d++] = r(p), l = d - 1, h--;
                                break;
                            case 1:
                                for (p = 0, c = Math.pow(2, 16), a = 1; a != c;) u = A.val & A.position, A.position >>= 1, 0 == A.position && (A.position = n, A.val = e(A.index++)), p |= (u > 0 ? 1 : 0) * a, a <<= 1;
                                f[d++] = r(p), l = d - 1, h--;
                                break;
                            case 2:
                                return w.join("")
                            }
                            if (0 == h && (h = Math.pow(2, m), m++), f[l]) v = f[l];
                            else {
                                if (l !== d) return null;
                                v = s + s.charAt(0)
                            }
                            w.push(v), f[d++] = s + v.charAt(0), h-- , s = v, 0 == h && (h = Math.pow(2, m), m++)
                        }
                    }
                };
            return i
        }();
    /*
        "function" == typeof define && define.amd ? define(function() {
                return LZString
            }) : "undefined" != typeof module && null != module && (module.exports = LZString),
    */
    var bVector = new Uint8Array(BUFFER_LEN / 8);

    var hashes = {
        djb2: function (str) {
            var hash = 5381;

            for (var len = str.length, count = 0; count < len; count++) {
                hash = hash * 33 ^ str.charCodeAt(count);
            };

            return (hash >>> 0) % BUFFER_LEN;
        },
        sdbm: function (str) {
            var hash = 0;

            for (var len = str.length, count = 0; count < len; count++) {
                hash = str.charCodeAt(count) + (hash << 6) + (hash << 16) - hash;
            };

            return (hash >>> 0) % BUFFER_LEN;
        }
    }

    var addEntry = function (str) {

        var h1 = hashes.djb2(str)
        var h2 = hashes.sdbm(str)
        var added = false
        for (var round = 0; round <= HASH_ROUNDS; round++) {
            var new_hash = round == 0 ? h1 :
                round == 1 ? h2 :
                    (h1 + (round * h2) + (round ^ 2)) % BUFFER_LEN;

            var extra_indices = new_hash % 8,
                index = ((new_hash - extra_indices) / 8);

            if (extra_indices != 0 && (bVector[index] & (128 >> (extra_indices - 1))) == 0) {
                bVector[index] ^= (128 >> extra_indices - 1);
                added = true;
            } else if (extra_indices == 0 && (bVector[index] & 1) == 0) {
                bVector[index] ^= 1;
                added = true;
            }

        };

        return added;
    }

    var addEntries = function (arr) {
        for (var i = arr.length - 1; i >= 0; i--) {

            addEntry(arr[i]);

        };

        return true;
    }

    var checkEntry = function (str) {
        var index, extra_indices
        var h1 = hashes.djb2(str)

        extra_indices = h1 % 8;
        index = ((h1 - extra_indices) / 8);

        if (extra_indices != 0 && (bVector[index] & (128 >> (extra_indices - 1))) == 0) {
            return false;
        } else if (extra_indices == 0 && (bVector[index] & 1) == 0) {
            return false;
        }

        var h2 = hashes.sdbm(str)
        extra_indices = h2 % 8;
        index = ((h2 - extra_indices) / 8);

        if (extra_indices != 0 && (bVector[index] & (128 >> (extra_indices - 1))) == 0) {
            return false;
        } else if (extra_indices == 0 && (bVector[index] & 1) == 0) {
            return false;
        }

        for (var round = 2; round <= HASH_ROUNDS; round++) {
            var new_hash = round == 0 ? h1 : round == 1 ? h2 : (h1 + (round * h2) + (round ^ 2)) % BUFFER_LEN;
            var extra_indices = new_hash % 8,
                index = ((new_hash - extra_indices) / 8);

            if (extra_indices != 0 && (bVector[index] & (128 >> (extra_indices - 1))) == 0) {
                return false;
            } else if (extra_indices == 0 && (bVector[index] & 1) == 0) {
                return false;
            }
        };

        return true;
    }

    var importData = function (lzData, k) {

        var raw_data = LZString.decompressFromBase64(lzData),
            data = raw_data.split(',');

        BUFFER_LEN = data.length * 8;
        HASH_ROUNDS = (typeof k !== "undefined") ? k : HASH_ROUNDS;

        bVector = new Uint8Array(data)

    }

    var exportData = function (callback) {

        switch (typeof callback) {
        case "function":
            callback(LZString.compressToBase64(bVector.toString()));
            break;
        default:
            return LZString.compressToBase64(bVector.toString());
        }


    }

    return {
        info: {
            type: "regular",
            buffer: BUFFER_LEN,
            hashes: HASH_ROUNDS,
            raw_buffer: bVector
        },
        hashes: hashes,
        addEntry: addEntry,
        addEntries: addEntries,
        checkEntry: checkEntry,
        importData: importData,
        exportData: exportData
    };
};

if (typeof exports !== "undefined") {
    exports.filter = JSBloom.filter;
};