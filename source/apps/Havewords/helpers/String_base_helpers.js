"use strict";


// String and ArrayBuffer Base32Hex and Base64 character set

Object.defineSlot(String.prototype, "stringToBase32Hex", function() {
  const base32HexChars = '0123456789ABCDEFGHIJKLMNOPQRSTUV';
  let output = '';
  for (let i = 0; i < this.length; i++) {
    const charCode = this.charCodeAt(i);
    const index1 = (charCode >> 4) & 0x0f; // Get the first 4 bits
    const index2 = charCode & 0x0f; // Get the last 4 bits
    output += base32HexChars[index1] + base32HexChars[index2];
  }
  return output;
});

Object.defineSlot(String.prototype, "base32HexToString", function() {
  const base32HexChars = '0123456789ABCDEFGHIJKLMNOPQRSTUV';
  let output = '';
  for (let i = 0; i < this.length; i += 2) {
    const index1 = base32HexChars.indexOf(this[i]);
    const index2 = base32HexChars.indexOf(this[i + 1]);
    const charCode = (index1 << 4) + index2;
    output += String.fromCharCode(charCode);
  }
  return output;
});

Object.defineSlot(String.prototype, "base32HexToArrayBuffer", function() {
  const base32HexString = this;
  const base32Alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  const paddingChar = '=';

  const base32BitsPerChar = 5;
  const base32HexBitsPerChar = 4;

  let binaryString = '';
  for (let i = 0; i < base32HexString.length; i++) {
    const char = base32HexString.charAt(i);
    if (char !== paddingChar) {
      const base32Value = base32Alphabet.indexOf(char);
      binaryString += ('00000' + base32Value.toString(2)).slice(-base32BitsPerChar);
    }
  }

  const bufferLength = Math.floor(binaryString.length / base32HexBitsPerChar);
  const arrayBuffer = new ArrayBuffer(bufferLength);
  const uint8Array = new Uint8Array(arrayBuffer);

  for (var i = 0; i < bufferLength; i++) {
    const start = i * base32HexBitsPerChar;
    const end = start + base32HexBitsPerChar;
    const bits = binaryString.slice(start, end);
    uint8Array[i] = parseInt(bits, 2);
  }

  return arrayBuffer;
});

Object.defineSlot(ArrayBuffer.prototype, "toBase64EncodedString", function() {
  const uint8Array = new Uint8Array(this);
  const base64String = btoa(String.fromCharCode.apply(null, uint8Array));
  return base64String;
});

Object.defineSlot(String.prototype, "base64ToArrayBuffer", function() {
  const binaryString = atob(this);
  const length = binaryString.length;
  const bytes = new Uint8Array(length);

  for (let i = 0; i < length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  return bytes.buffer;
});

Object.defineSlot(String.prototype, "stringToUint8Array", function() {
  const bytes = new Uint8Array(this.length);

  for (let i = 0; i < this.length; i++) {
    bytes[i] = this.charCodeAt(i);
  }

  return bytes;
});


// --- Uint8Array ---

Object.defineSlot(Uint8Array.prototype, "base64encoded", function() {
  // Convert the byte array to a string with Latin-1 encoding
  const latin1String = new TextDecoder('iso-8859-1').decode(this);
  // Encode the Latin-1 string to a base64 string
  const base64String = btoa(latin1String);
  return base64String;
});

