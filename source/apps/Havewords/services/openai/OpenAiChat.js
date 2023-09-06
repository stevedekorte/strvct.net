"use strict";

/* 
    OpenAiChat

*/

(class OpenAiChat extends BMStorableNode {
  initPrototypeSlots() {
    this.newSlot("conversationHistory", null);
    this.newSlot("tokenBuffer", 400); // Buffer to ensure approximation doesn't exceed limit
    this.newSlot("initialMessagesCount", 3); // Number of initial messages to always keep
    this.newSlot("models", null);
    this.newSlot("didModelCheck", false);
  }

  init() {
    super.init();
    this.setConversationHistory([]);
    const models = this.allModelNames().map(name => OpenAiChatModel.clone().setName(name));
    this.setModels(models);
  }

  validRoles () {
    /* 
      high-level instructions to guide the model's behavior throughout the conversation. 
      User role represents the user or the person initiating the conversation. You provide user messages or prompts in this role to instruct the model.
      assistant role represents the AI model or the assistant. 
      The model generates responses in this role based on the user's prompts and the conversation history.
    */
   
    return [
      "system", 
      "user",
      "assistant" 
    ];
  }

  // --- accessible models ---

  clearAvailableModelNames () {
    this.setAvailableModelNames(null);
    return this;
  }

  setAvailableModelNames (modelNamesArray) { /* or pass in null to clear the list */
    localStorage.setItem("openai_available_models", JSON.stringify(modelNamesArray));
    return this;
  }

  availableModelNames () {
    const s = localStorage.getItem("openai_available_models");
    try {
      return s ? JSON.parse(s) : null;
    } catch (e) {
      console.log(e);
      return null;
    }
  }

  async asyncCheckModelsAvailability () {
    const names = this.availableModelNames();
    if (this.apiKey() && names === null || (names && names.length === 0)) {
      for (const model of this.models()) { 
        await model.asyncCheckAvailability();
      }
      this.setAvailableModelNames(this.calcAvailableModelNames());
    }
  }

  calcAvailableModelNames () {
    return this.models().filter(model => model.isAvailable()).map(model => model.name());
  }

  allModelNames () {
    // model names with versions numbers are ones soon to be depricated, 
    // so we don't include those.
    return [
      "gpt-4", 
      "gpt-4-32k", 
      "gpt-3.5-turbo", 
    ];
  }

  // ----------------------------

  // Function to approximate token count
  approximateTokens (message) {
    return Math.ceil(message.length / 4);
  }

  addToConversation (json) {
    assert(this.validRoles().indexOf(json.role) !== -1);

    // Check if conversation length exceeds limit
    let currentTokenCount = this.conversationHistory().reduce((count, message) => {
      return count + this.approximateTokens(message.content);
    }, 0);

    const newMessageTokenCount = this.approximateTokens(json.content);

    // If new message would cause token count to exceed limit, remove old messages
    while (this.conversationHistory().length > this.initialMessagesCount() &&
      currentTokenCount + newMessageTokenCount + this.tokenBuffer() > 4096) {
      // Remove the oldest non-initial message
      const removedMessage = this.conversationHistory().splice(this.initialMessagesCount(), 1)[0];
      currentTokenCount -= this.approximateTokens(removedMessage.content);
    }

    this.conversationHistory().push(json);
    return this;
  }

  clearConversationHistory() {
    this.setConversationHistory([]);
    return this;
  }

  newRequest() {
    const request = OpenAiRequest.clone();
    request.setApiUrl("https://api.openai.com/v1/chat/completions");
    request.setApiKey(this.apiKey());
    //this.activeRequests().push(request)
    request.setService(this)
    return request;
  }

  newRequestForPrompt (prompt, role) {
    const selectedModel = SessionOptionsView.shared().aiModel();
    assert(this.allModelNames().includes(selectedModel));

    this.addToConversation({
      role: role,
      content: prompt,
    });

    const request = this.newRequest().setBodyJson({
      model: selectedModel,
      messages: this.conversationHistory(),
      temperature: 0.7, // more creative
      top_p: 0.9 // more diverse
    });
    return request
  }

  async asyncFetch (prompt, role="user") {
    const request = this.newRequestForPrompt(prompt, role);

    let json = undefined;
    try {
      json = await request.asyncSend();
    } catch (error) {
      debugger;
      console.error("Error fetching AI response:", error);
      AiChatColumn.shared().addMessage(
        "systemMessage",
        "Error fetching AI response. Make sure the model is selected and the API key is correct.",
        "Host",
        LocalUser.shared().id()
      );
      return undefined
    }

    if (json.error) {
      const errorMessage = this.type() + " fetch ERROR: " + json.error.message;
      console.warn(errorMessage);
      AiChatColumn.shared().addMessage(
        "systemMessage",
        errorMessage,
        "Host",
        LocalUser.shared().id()
      );
      return undefined
    }

    const aiResponse = json.choices[0].message.content;
    this.addResponseText(aiResponse);

    return aiResponse;
  }

  onRequestComplete (request) {
    this.addResponseText(request.fullContent());
  }

  addResponseText (text) {
    // Add the assistant's response to the conversation history
    this.addToConversation({
      role: "assistant",
      content: text,
    });

    // Save the conversation history to local storage
    Session.shared().addToHistory({
      type: "aiResponse",
      data: text,
      id: LocalUser.shared().id(),
      nickname: SessionOptionsView.shared().selectedModelNickname(),
    });
    return this;
  }

}.initThisClass());
