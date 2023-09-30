"use strict";

/* 

    helpers

    utility methods and functions

*/

// --- String ---

Object.defineSlot(String.prototype, "convertToParagraphs", function() {
  // Split the text into paragraphs using double newline characters
  const paragraphs = this.split(/\n{2,}/g);

  // Wrap each paragraph in a <p> tag
  const html = paragraphs
    .map((paragraph) => `<p>${paragraph.replace(/\n/g, "<br>")}</p>`)
    .join("");

  return html;
});

/*
already in ideal

Object.defineSlot(String.prototype, "after", function(s) {
  const i = this.indexOf(s);
  if (i === -1) {
    return "";
  }
  return this.substr(i + s.length);
});
*/

Object.defineSlot(String.prototype, "isValidJSON", function() {
  try {
    const parsedJSON = JSON.parse(this);
    return true;
  } catch (error) {
    return false;
  }
});

Object.defineSlot(String.prototype, "isValidXml", function() {
  const parser = new DOMParser();
  const doc = parser.parseFromString(this, "text/xml");
  const errorNode = doc.querySelector("parsererror");
  return errorNode ? false : true;
});

Object.defineSlot(String.prototype, "removeWhitespace", function() {
  try {
    const parsedJSON = JSON.parse(this);
    const cleanedJSONString = JSON.stringify(parsedJSON);
    return cleanedJSONString;
  } catch (error) {
    console.error("Error while removing whitespace from JSON:", error);
    return jsonString;
  }
});

Object.defineSlot(String.prototype, "copyToClipboard", function() {
  // not the right place for this method, but ok for now
  if (navigator && navigator.clipboard && navigator.clipboard.writeText) {
    return navigator.clipboard.writeText(this);
  }
  return Promise.reject("The Clipboard API is not available.");
});

Object.defineSlot(String.prototype, "isHexadecimal", function() {
  const regexp = /^[0-9a-fA-F]+$/;
  return regexp.test(this);
});