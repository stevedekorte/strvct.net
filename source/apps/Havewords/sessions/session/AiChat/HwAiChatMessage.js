"use strict";

/*

    HwAiChatMessage

*/

(class HwAiChatMessage extends OpenAiMessage {

  initPrototypeSlots () {
    {
      const slot = this.newSlot("hasProcessed", false);
    }
    
    {
      const slot = this.newSlot("handleAnyDataRequestsAction", null);
      slot.setInspectorPath("");
      slot.setLabel("Handle Data Requests");
      slot.setSyncsToView(true);
      slot.setDuplicateOp("duplicate");
      slot.setSlotType("Action");
      //slot.setIsSubnodeField(true);
      slot.setCanInspect(true)
      slot.setActionMethodName("handleAnyDataRequests");
    }
    
  }

  init () {
    super.init();
  }

  finalInit () {
    super.finalInit();

  }

  isVisible () {
    return this.role() !== "system"
  }


  /*
  // code to do fading in of words

  usableStringFromString (s) {
    //indexOfEndOfLastFullWordOnString
    let l = s.length - 1;
    while (l) {
      const c = s.substr(l, 1);
      if ([" ", ".", "\n"].indexOf(c) !== -1) {
        break;
      }
      l --;
    }
    return s.substr(0, l);
  }

  onStreamData (request, newContent) {
    let fullContent = request.fullContent();

    if (fullContent.isValidHtml()) {
      const usableString = this.usableStringFromString(fullContent);
      //console.log("usableString [" + usableString + "]");

      const lastContent = request.lastContent();
      const newContent = usableString.substr(lastContent.length);
      if (newContent.length) {
        const wrappedNewContent = newContent.wrapHtmlWordsWithSpanClass("fadeInWord");
        //console.log("---\n" + wrappedNewContent + "\n---");
        const sendContent = lastContent + wrappedNewContent;
        request.setLastContent(usableString);
        //this.shareUpdate(request, sendContent);
        this.conversation().onUpdateMessage(this)
        this.setContent(sendContent)
      }
    }

    //this.setContent(request.fullContent())
  }
  */

  onRequestComplete (aRequest) {
    super.onRequestComplete(aRequest)
    this.handleAnyDataRequests()
  }

  session () {
    return this.conversation().session()
  }

  handleAnyDataRequests () {
    this.handlePlayerUpdates()
    this.handleSceneSummary()
    return this
  }

  handlePlayerUpdates () {
    this.playerInfos().forEach(playerInfoString => {
      const json = JSON.parse(playerInfoString)
      this.session().players().onUpdatePlayerJson(json)
    })
  }

  handleSceneSummary () {
    const s = this.sceneSummary()
    if (s) {
      const imagePrompt = this.session().settings().promptComposer().imagePromptForSceneSummary(s);
      console.log("handleSceneSummary imagePrompt: ", imagePrompt);
      /*
      const msg = this.conversation().newImageMessage()
      msg.setPrompt(imagePrompt).send()
      */
    }
  }

  contentOfFirstElementOfClass (className) {
    const matches = this.contentOfElementsOfClass(className)
    return matches.first();
  }

  // --- handleAnyDataRequests -------------------------

  contentOfElementsOfClass (className) {
    const el = document.createElement("div")
    el.innerHTML = this.content()
    const matches = el.querySelectorAll('.' + className); 
    const results = [];
    matches.forEach(e => results.push(e.innerHTML));
    return results;
  }

  // --- helpers to get bits of tagged content ---

  /*

  chapterNumber () {
    return this.contentOfFirstElementOfClass('chapterNumber'); 
  }

  chapterTitle () {
    return this.contentOfFirstElementOfClass('chapterTitle'); 
  }

  bookTitle () {
    return this.contentOfFirstElementOfClass('bookTitle'); 
  }
  */

  playerInfos () {
    return this.contentOfElementsOfClass('playerInfo'); 
  }

  sceneSummary () {
    return this.contentOfFirstElementOfClass('sceneSummary'); 
  }
  

}).initThisClass();
