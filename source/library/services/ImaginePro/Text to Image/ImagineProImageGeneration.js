/**
 * @module library.services.ImaginePro.Text_to_Image
 */

/**
 * @class ImagineProImageGeneration
 * @extends SvSummaryNode
 * @classdesc Represents an ImaginePro image generation task that polls for completion.
 */
"use strict";

(class ImagineProImageGeneration extends SvSummaryNode {
  
  /**
   * @description Initializes the prototype slots for the class.
   * @category Initialization
   */
  initPrototypeSlots () {

    /**
     * @member {string} taskId
     * @description The task ID for tracking the generation.
     * @category Status
     */
    {
        const slot = this.newSlot("taskId", "");
        slot.setShouldStoreSlot(true);
        slot.setSyncsToView(true);
        slot.setSlotType("String");
        slot.setIsSubnodeField(true);
        slot.setCanInspect(true);
    }

    /**
     * @member {string} status
     * @description The current status of the generation.
     * @category Status
     */
    {
      const slot = this.newSlot("status", "pending");
      slot.setShouldStoreSlot(true);
      slot.setSyncsToView(true);
      slot.setSlotType("String");
      slot.setIsSubnodeField(true);
      slot.setCanInspect(true);
    }

    /**
     * @member {string} error
     * @description Any error from the generation.
     * @category Status
     */
    {
      const slot = this.newSlot("error", null);
      slot.setAllowsNullValue(true);
      slot.setShouldStoreSlot(true);
      slot.setSyncsToView(true);
      slot.setSlotType("Error");
      slot.setCanInspect(true);
    }

    /**
     * @member {ImagineProImages} images
     * @description The generated images.
     * @category Output
     */
    {
      const slot = this.newSlot("images", null);
      slot.setFinalInitProto(FilesToDownload);
      slot.setShouldStoreSlot(true);
      slot.setIsSubnode(true);
      slot.setSlotType("FilesToDownload");
      slot.setCanInspect(true);
    }

    /**
     * @member {Object} delegate
     * @description The delegate for handling events.
     * @category Delegation
     */
    {
      const slot = this.newSlot("delegate", null);
      slot.setShouldStoreSlot(true);
      slot.setSlotType("Object");
      slot.setCanInspect(true);
    }

    /**
     * @member {number} pollInterval
     * @description The interval in milliseconds between polls.
     * @category Configuration
     */
    {
      const slot = this.newSlot("pollInterval", 2000);
      slot.setSlotType("Number");
      slot.setShouldStoreSlot(true);
      slot.setCanInspect(true);
    }

    /**
     * @member {number} maxPollAttempts
     * @description The maximum number of poll attempts.
     * @category Configuration
     */
    {
      const slot = this.newSlot("maxPollAttempts", 60);
      slot.setSlotType("Number");
      slot.setShouldStoreSlot(true);
      slot.setCanInspect(true);
    }

    /**
     * @member {number} pollAttempts
     * @description The current number of poll attempts.
     * @category Status
     */
    {
      const slot = this.newSlot("pollAttempts", 0);
      slot.setSlotType("Number");
      slot.setShouldStoreSlot(true);
      slot.setCanInspect(true);
    }

    /**
     * @member {Object} pollTimeoutId
     * @description The timeout ID for the polling interval.
     * @category Internal
     */
    {
      const slot = this.newSlot("pollTimeoutId", null);
      slot.setSlotType("Object");
      slot.setCanInspect(true);
    }

    this.setShouldStore(true);
    this.setShouldStoreSubnodes(false);
    this.setCanDelete(true);
  }

  /**
   * @description Gets the title for the generation.
   * @returns {string} The title.
   * @category Metadata
   */
  title () {
    return `Generation ${this.taskId().slice(0, 8)}...`;
  }

  /**
   * @description Gets the subtitle for the generation.
   * @returns {string} The subtitle.
   * @category Metadata
   */
  subtitle () {
    return this.status();
  }

  /**
   * @description Gets the ImaginePro service.
   * @returns {Object} The ImaginePro service.
   * @category Service
   */
  service () {
    return ImagineProService.shared();
  }

  /**
   * @description Starts polling for the task status.
   * @category Process
   */
  startPolling () {
    this.setPollAttempts(0);
    this.setStatus("preparing to poll for task status...");
    this.sendDelegate("onImageGenerationStart", [this]);
    
    // Add initial delay before first poll to avoid race condition
    // ImaginePro needs a moment to register the task before we can poll it
    setTimeout(() => {
      this.setStatus("polling for task status...");
      this.pollTaskStatus();
    }, 3000); // Wait 3 seconds before first poll
  }

  /**
   * @description Stops polling for the task status.
   * @category Process
   */
  stopPolling () {
    if (this.pollTimeoutId()) {
      clearTimeout(this.pollTimeoutId());
      this.setPollTimeoutId(null);
    }
  }

  /**
   * @description Polls the task status from the API.
   * @category Process
   */
  async pollTaskStatus () {
    try {
      const apiKey = await this.service().apiKeyOrUserAuthToken();
      // ImaginePro uses /message/{messageId} endpoint, not /task/{taskId}/fetch
      const endpoint = `https://api.imaginepro.ai/api/v1/midjourney/message/${this.taskId()}`;
      // IMPORTANT: Use proxy for polling requests too (accounting & CORS)
      const proxyEndpoint = ProxyServers.shared().defaultServer().proxyUrlForUrl(endpoint);

      const request = SvXhrRequest.clone();
      request.setUrl(proxyEndpoint);
      request.setMethod("GET");
      request.setHeaders({
        'Authorization': `Bearer ${apiKey}`
        // Don't send Content-Type for GET requests - it causes Firebase to return 400
      });

      await request.asyncSend();

      if (request.isSuccess()) {
        const responseText = request.responseText();
        const response = JSON.parse(responseText);
        
        this.handlePollResponse(response);
      } else {
        // Log the error response for debugging
        console.error("ImaginePro poll request failed:", {
          status: request.status(),
          statusText: request.statusText(),
          responseText: request.responseText(),
          url: endpoint
        });
        
        // If it's a 400 error, the message ID might be invalid
        if (request.status() === 400) {
          const errorMsg = "Invalid message ID or request - stopping polling";
          this.setStatus("failed");
          this.setError(new Error(errorMsg));
          this.stopPolling();
          this.sendDelegate("onImageGenerationError", [this]);
        } else {
          // Other errors, keep polling
          this.schedulePoll();
        }
      }
    } catch (error) {
      console.error("Poll error:", error);
      this.schedulePoll();
    }
  }

  /**
   * @description Handles the poll response from the API.
   * @param {Object} response - The response from the API.
   * @category Process
   */
  handlePollResponse (response) {
    const status = response.status;
    
    // ImaginePro returns "DONE" when completed
    if (status === "DONE" || status === "completed" || status === "success") {
      this.setStatus("completed");
      
      // ImaginePro returns images directly in response.images
      if (response.images && response.images.length > 0) {
        response.images.forEach((imageUrl, index) => {
          const image = this.images().add();
          image.setTitle(`image ${index + 1}`);
          image.setUrl(imageUrl);
          image.setDelegate(this);
          // Don't await fetch - let it run asynchronously
          // Errors are handled via delegate callbacks
          image.fetch().catch(error => {
            // Catch any errors to prevent unhandled promise rejections
            console.error("Error fetching image:", error);
            // The error is already handled in the image's error handler
          });
        });
      }
      
      this.stopPolling();
      this.sendDelegate("onImageGenerationEnd", [this]);
      
    } else if (status === "failed" || status === "error" || status === "FAIL") {
      this.setStatus("failed");
      
      // Log the full response to understand the error structure
      console.error("ImaginePro task failed with response:", response);
      
      // Extract error message from various possible locations
      const errorMsg = response.error || response.message || response.errorMessage || 
                      response.failureReason || response.reason || "Task failed";
      this.setError(new Error(errorMsg));
      this.stopPolling();
      this.sendDelegate("onImageGenerationError", [this]);
      
    } else if (status === "pending" || status === "processing" || status === "PROCESSING" || status === "in_progress") {
      // Task is still processing, continue polling
      this.setStatus(`processing... (attempt ${this.pollAttempts() + 1}/${this.maxPollAttempts()})`);
      this.schedulePoll();
      
    } else {
      // Unknown status, continue polling
      console.log("Unknown task status:", status);
      this.schedulePoll();
    }
  }

  /**
   * @description Schedules the next poll.
   * @category Process
   */
  schedulePoll () {
    this.setPollAttempts(this.pollAttempts() + 1);
    
    if (this.pollAttempts() >= this.maxPollAttempts()) {
      this.setStatus("timeout");
      this.setError(new Error("Task timed out after " + this.maxPollAttempts() + " attempts"));
      this.stopPolling();
      this.sendDelegate("onImageGenerationError", [this]);
    } else {
      const timeoutId = setTimeout(() => this.pollTaskStatus(), this.pollInterval());
      this.setPollTimeoutId(timeoutId);
    }
  }

  /**
   * @description Handles successful image loading.
   * @param {Object} aiImage - The loaded AI image object.
   * @category Delegation
   */
  onImageLoaded (aiImage) {
    this.sendDelegate("onImageGenerationImageLoaded", [this, aiImage]);
  }

  /**
   * @description Handles errors during image loading.
   * @param {Object} aiImage - The AI image object that failed to load.
   * @category Delegation
   */
  onImageError (aiImage) {
    this.sendDelegate("onImageGenerationImageError", [this, aiImage]);
  }

  /**
   * @description Sends a delegate method call.
   * @param {string} methodName - The name of the method to call.
   * @param {Array} args - The arguments to pass to the method.
   * @returns {boolean} True if the delegate method was called, false otherwise.
   * @category Delegation
   */
  sendDelegate (methodName, args = [this]) {
    const d = this.delegate();
    if (d) {
      const f = d[methodName];
      if (f) {
        f.apply(d, args);
        return true;
      }
    }
    return false;
  }

  /**
   * @description Shuts down the generation and stops polling.
   * @returns {ImagineProImageGeneration} The current instance.
   * @category Lifecycle
   */
  shutdown () {
    this.stopPolling();
    this.images().subnodes().forEach(image => image.shutdown());
    return this;
  }

}.initThisClass());