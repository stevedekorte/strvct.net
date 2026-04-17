"use strict";

/**
    * @module library.services.DeepSeek
    */

/**
    * @class SvDeepSeekRequest
    * @extends SvOpenAiRequest
    * @classdesc
    * SvDeepSeekRequest class for handling API requests to DeepSeek.
    *
    * Example request:
    *
    * curl -X POST "https://api.groq.com/openai/v1/chat/completions" \
    *  -H "Authorization: Bearer $GROQ_API_KEY" \
    *  -H "Content-Type: application/json" \
    *  -d '{"messages": [{"role": "user", "content": "Explain the importance of low latency LLMs"}], "model": "mixtral-8x7b-32768"}'
    */
(class SvDeepSeekRequest extends SvOpenAiRequest {

    /**
            * @description Initializes prototype slots for the SvDeepSeekRequest class.
            * @category Initialization
            */
    initPrototypeSlots () {
    }

    /**
            * @description Initializes the SvDeepSeekRequest instance.
            * @category Initialization
            */
    init () {
        super.init();
        this.setIsDebugging(true);
    }

    /**
            * @description Retrieves the API key for DeepSeek service.
            * @returns {string} The API key for DeepSeek service.
            * @category Authentication
            */
    apiKey () {
        return SvDeepSeekService.shared().apiKeyOrUserAuthToken();
    }

    /**
            * @description Sets up the request for streaming.
            * @returns {SvDeepSeekRequest} The current SvDeepSeekRequest instance.
            * @category Configuration
            */
    setupForStreaming () {
        // subclasses should override this method to set up the request for streaming
        const body = this.bodyJson();
        body.stream = true;
        body.max_tokens = this.chatModel().outputTokenLimit(); // current max output tokens allowed by Groq
        return this;
    }

}).initThisClass();
