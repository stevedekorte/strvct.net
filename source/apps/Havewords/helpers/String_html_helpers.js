"use strict";

// --- String HTML validation ----------------------------------------

Object.defineSlot(String.prototype, "isValidHtml", function() {
  return this.simpleValidateHtml() === true;
});

Object.defineSlot(String.prototype, "validatedHtml", function() {
  const v = this.simpleValidateHtml();
  if (v === true) {
    return this;
  }
  return v;
});

Object.defineSlot(String.prototype, "simpleValidateHtml", function(strictBoolean) {
  const htmlStr = this;

  const validateHtmlTag = new RegExp("<[a-z]+(\s+|\"[^\"]*\"\s?|'[^']*'\s?|[^'\">])*>","igm");
  
  const sdom = document.createElement('div');
  
  const noSrcNoAmpHtmlStr = htmlStr
      .replace(/ src=/," svhs___src=")
      .replace(/&amp;/igm,"#svhs#amp##");

  const noSrcNoAmpIgnoreScriptContentHtmlStr=noSrcNoAmpHtmlStr
      .replace(/\n\r?/igm,"#svhs#nl##") // temporarily remove line breaks
      .replace(/(<script[^>]*>)(.*?)(<\/script>)/igm,"$1$3")
      .replace(/#svhs#nl##/igm,"\n\r");  // re-add line breaks

  const htmlTags = noSrcNoAmpIgnoreScriptContentHtmlStr.match(/<[a-z]+[^>]*>/igm);
  
  const htmlTagsCount = htmlTags? htmlTags.length : 0;

  //console.log(noSrcNoAmpHtmlStr,noSrcNoAmpIgnoreScriptContentHtmlStr,htmlTags);

  if(!strictBoolean) {
    // ignore <br/> conversions
    noSrcNoAmpHtmlStr = noSrcNoAmpHtmlStr.replace(/<br\s*\/>/,"<br>")
  }

  if(htmlTagsCount) {
    const tagsAreValid = htmlTags.reduce(function(isValid,tagStr) {
      return isValid && tagStr.match(validateHtmlTag);
    },true);

    if(!tagsAreValid) {
      return false;
    }
  }

  try {
    sdom.innerHTML = noSrcNoAmpHtmlStr;
  } catch(err) {
    return false;
  }

  if(sdom.querySelectorAll("*").length!==htmlTagsCount) {
    return false;
  }

  let resHtmlStr = sdom.innerHTML.replace(/&amp;/igm,"&"); // undo '&' encoding

  if(!strictBoolean) {
    // ignore empty attribute normalizations
    resHtmlStr = resHtmlStr.replace(/=""/,"")
  }

  // compare html strings while ignoring case, quote-changes, trailing spaces
  let simpleIn = noSrcNoAmpHtmlStr.replace(/["']/igm,"").replace(/\s+/igm," ").toLowerCase().trim(),
    simpleOut = resHtmlStr.replace(/["']/igm,"").replace(/\s+/igm," ").toLowerCase().trim();

  if (simpleIn === simpleOut) {
    return true;
  }

  //console.log(simpleIn,simpleOut);

  return resHtmlStr.replace(/ svhs___src=/igm," src=").replace(/#svhs#amp##/,"&amp;");
})



// HTML word wrapping

/*
function Element_asJson(element) {
  const nodes = Array.from(element.childNodes);
  const json = []
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];

    if (node.nodeType === Node.TEXT_NODE) {
      json.push(node.textContent);
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      json.push({ type: node.className, children: Element_asJson(node) });
    } else {
      json.push(null);
    }
  }
  return json;
}
*/

function Element_wrapWordsWithSpanClassName (element, className) {
  const nodes = Array.from(element.childNodes);

  for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      if (node.nodeType === Node.TEXT_NODE) {
          const span = document.createElement('span');
          span.className = className;
          //span.nodeValue = node.nodeValue;
          span.textContent = node.textContent;
          //debugger;
          element.replaceChild(span, node);
      } else if (node.nodeType === Node.ELEMENT_NODE) {
          Element_wrapWordsWithSpanClassName(node, className);
      }
  }
}

Object.defineSlot(String.prototype, "wrapHtmlWordsWithSpanClass", function (className) {
  const s = "<!DOCTYPE html><head><body>" + this + "</body></html>"
  //console.log("wrapHtmlWordsWithSpanClass [[" + s + "]]");
  const parser = new DOMParser();
  const doc = parser.parseFromString(s, 'text/html');
  //console.log("wrapping doc: ", JSON.stringify(Element_asJson(doc), 2, 2));
  Element_wrapWordsWithSpanClassName(doc.body, className);
  //console.log("after doc: ",  JSON.stringify(Element_asJson(doc), 2, 2));
  return doc.body.innerHTML;
});


// --- String HTML methods ---

Object.defineSlot(String.prototype, "removedHtmlTags", function () {
  return this.replace(/<[^>]*>/g, '');
});

Object.defineSlot(String.prototype, "stripHtml", function () {
  const parser = new DOMParser();
  const doc = parser.parseFromString(this, 'text/html');
  return doc.body.textContent || "";
});
