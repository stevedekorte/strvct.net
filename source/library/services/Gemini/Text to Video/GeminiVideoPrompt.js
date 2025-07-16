"use strict";

/*
    GeminiVideoPrompt
    
    A class to handle calls to Google's Gemini Text to Video API (Veo 3)
    for generating videos from text prompts.
*/

(class GeminiVideoPrompt extends SvSummaryNode {

    initPrototypeSlots () {

        {
            const slot = this.newSlot("videoDataUrl", null);
            slot.setDescription("The output video data");

            slot.setShouldJsonArchive(true);
            slot.setInspectorPath("");
            slot.setLabel("video");
            slot.setShouldStoreSlot(true);
            slot.setSyncsToView(true);
            slot.setDuplicateOp("duplicate");
            slot.setSlotType("String");
            slot.setIsSubnodeField(true);
            slot.setCanEditInspection(false);
            slot.setFieldInspectorViewClassName("SvVideoWellField"); // field inspector view class

        }

        {
            const slot = this.newSlot("prompt", "a cat walking on a beach");
            slot.setSlotType("String");
            slot.setDescription("The text prompt to use for generating the video");
            slot.setIsSubnodeField(true);
            slot.setShouldStoreSlot(true);
        }

        {
            const slot = this.newSlot("duration", 5);
            slot.setSlotType("Number");
            slot.setDescription("The duration of the video in seconds");
            slot.setIsSubnodeField(true);
            slot.setValidValues([5, 6, 7, 8]);
            slot.setShouldStoreSlot(true);
        }

        {
            const slot = this.newSlot("ttvModel", "veo-3.0-generate-001");
            slot.setSlotType("String");
            slot.setDescription("The Gemini model to use for text to video generation via Veo");
            slot.setValidValues(["veo-3.0-generate-001"]);
            slot.setIsSubnodeField(true);
            slot.setShouldStoreSlot(true);
        }

        // waiting for completion uses this
        {
            const slot = this.newSlot("operationId", null);
            slot.setSlotType("String");
            slot.setDescription("The operation ID for the Gemini API");
            slot.setIsSubnodeField(false);
            slot.setShouldStoreSlot(true);
        }

        {
            const slot = this.newSlot("checkIntervalMs", 10000);
            slot.setSlotType("Number");
            slot.setDescription("The interval in milliseconds to check the status of the operation");
            slot.setIsSubnodeField(false);
            slot.setShouldStoreSlot(false);
        }

        {
            const slot = this.newSlot("maxAttempts", 12);
            slot.setSlotType("Number");
            slot.setDescription("The maximum number of attempts to check the status of the operation");
            slot.setIsSubnodeField(false);
            slot.setShouldStoreSlot(false);
        }

        {
            const slot = this.newSlot("attempts", 0);
            slot.setSlotType("Number");
            slot.setDescription("The number of attempts to check the status of the operation");
            slot.setIsSubnodeField(false);
            slot.setShouldStoreSlot(false);
        }

        {
            const slot = this.newSlot("fetchOptionsString", null);
            slot.setLabel("");
            slot.setInspectorPath("Fetch Options");
            slot.setSlotType("String");
            slot.setDescription("The fetch options as a string");
            slot.setIsSubnodeField(false);
            slot.setCanEditInspection(false);
            slot.setSyncsToView(true);
        }

        {
            const slot = this.newSlot("status", "");
            slot.setSlotType("String");
            slot.setDescription("The status of the video generation");
            slot.setIsSubnodeField(true);
            slot.setCanEditInspection(false);
            slot.setSyncsToView(true);
        }

        {
            const slot = this.newSlot("error", null);
            slot.setSlotType("String");
            slot.setDescription("Any error that occurred during the API call");
        }

        {
            const slot = this.newSlot("delegate", null);
            slot.setSlotType("Object");
            slot.setDescription("The delegate object for handling various events");
        }

        // add an action slot

        {
            const slot = this.newSlot("generateAction", null);
            slot.setLabel("Generate");
            slot.setSyncsToView(true);
            slot.setDuplicateOp("duplicate");
            slot.setSlotType("Action");
            slot.setIsSubnodeField(true);
            slot.setActionMethodName("startGeneration");
        }

        {
            const slot = this.newSlot("checkAction", null);
            slot.setLabel("Check");
            slot.setSyncsToView(true);
            slot.setDuplicateOp("duplicate");
            slot.setSlotType("Action");
            slot.setIsSubnodeField(true);
            slot.setActionMethodName("checkOperationStatus");
        }
    }

    initPrototype () {
        this.setIsDebugging(true);
        this.setCanDelete(true);
        this.setShouldStore(true);
        this.setShouldStoreSubnodes(false);
        this.setTitle("Text to Video");
    }

    finalInit () {
        super.finalInit();
        this.initPrototype();
    }

    subtitle () {
        const prompt = this.prompt().length > 0 ? this.prompt().slice(0, 40) + "..." : "No prompt yet";
        const duration = this.duration();
        /*
        const width = this.width();
        const height = this.height();
        const frameRate = this.frameRate();
        */
        const status = this.status();
    
        let s = `${prompt}\n${duration}s, ${this.ttvModel()}`;
        if (status.length > 0) {
            s += `\n${status}`;
        }
        if (this.error()) {
            s += `\nERROR: ${this.error()}`;
        }
        return s;
    }

    service () {
        return GeminiService.shared();
    }

    apiKey () {
        return this.service().apiKeyOrUserAuthToken();
    }
    
    // Get project ID from the Gemini service
    projectId () {
        return this.service().projectId();
    }
    
    // Get location ID (region) from the Gemini service
    locationId () {
        return this.service().locationId();
    }

    needsProxy () {
        return true;
    }

    apiUrl () {        
        if (!this.projectId()) {
            this.setStatus("Configuration error");
            this.setError("No project ID available. Please check GeminiService configuration.");
            return null;
        }

        return `https://${this.locationId()}-aiplatform.googleapis.com/v1/projects/${this.projectId()}/locations/${this.locationId()}/publishers/google/models/${this.ttvModel()}:predictLongRunning`;
    }

    activeApiUrl () {
        let url = this.apiUrl();
        if (this.needsProxy()) {
          url = ProxyServers.shared().defaultServer().proxyUrlForUrl(url);
        }
        return url;
      }

    // Build the request body for the Gemini Video API
    requestBody () {
        // Base structure for Vertex AI LLM API
        const endpoint = `projects/${this.projectId()}/locations/${this.locationId()}/publishers/google/models/${this.ttvModel()}`
        const body = {
            "endpoint": endpoint,
            "instances": [
                {
                "prompt": this.prompt()
                }
            ],
            "parameters": {
                "aspectRatio": "16:9",
                "sampleCount": 1,
                "durationSeconds": this.duration(),
                "fps": "",
                "personGeneration": "allow_adult",
                "enablePromptRewriting": true,
                "addWatermark": true,
                "includeRaiReason": true,
            }
        };

        // TODO: Add reference image/video data if provided
        // looks like it should go in instances info
            

        return body;
    }

    clearStatus () {
        this.setAttempts(0);
        this.setOperationId(null);
        this.setVideoDataUrl(null);
        this.setStatus("");
        this.setError(null);
    }

    // Step 1: Start the video generation process
    async startGeneration () {
        this.clearStatus();
        
        this.setStatus("Requesting generation...");
        this.setError(null); // Clear any previous errors
        this.sendDelegate("onVideoPromptStart", [this]);

        // For this API, we just need a text prompt - image data is optional
        
        const body = this.requestBody();

        const apiUrl = this.activeApiUrl();

        try {
            const fetchOptions = {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${this.apiKey()}`
                },
                body: JSON.stringify(body)
            };

            this.setFetchOptionsString([
                "url:", apiUrl, 
                "headers:", JSON.stringify(fetchOptions.headers, null, 2), 
                "body:", JSON.stringify(body, null, 2)].join("\n\n")
            );

            // Make the initial request to start the generation process
            const response = await fetch(apiUrl, fetchOptions);
            
            if (!response.ok) {
                const errorText = await response.text();
                const errorMessage = `API error: ${response.status} ${response.statusText} - ${errorText}`;
                this.setStatus("API request failed");
                this.setError(errorMessage);
                this.sendDelegate("onVideoPromptError", [this]);
                return null;
            }
            
            // Parse the operation response
            //this.setStatus("Getting Operation ID...");
            const operationData = await response.json();                
            //this.setStatus("Got operation ID: " + operationData.name.slice(0, 8) + "...");
            this.setStatus("Generating...");

            this.setOperationId(operationData.name);
            return await this.checkOperationStatus();

        } catch (error) {
            const errorMessage = `API request error: ${error.message}`;
            this.setStatus("Request failed");
            this.setError(errorMessage);
            this.sendDelegate("onVideoPromptError", [this]);
            console.error("GeminiVideoPrompt generation error:", error);
            return null;
        }
    }
    
    // Legacy method for compatibility
    async sendRequest () {
        return this.startGeneration();
    }

    host () {
        return `${this.locationId()}-aiplatform.googleapis.com`
    }

    // Check the status of a long-running operation
    async checkOperationStatus () {
        this.setAttempts(this.attempts() + 1);
        this.setStatus(`Fetch attempt ${this.attempts()} of ${this.maxAttempts()}...`);

        // Use the correct API endpoint pattern that matches the working veo.js
        const apiUrl = `https://${this.host()}/v1/projects/${this.projectId()}/locations/${this.locationId()}/publishers/google/models/${this.ttvModel()}:fetchPredictOperation`;
        const proxyApiUrl = ProxyServers.shared().defaultServer().proxyUrlForUrl(apiUrl);

        try {
            const options = {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${this.apiKey()}`
                },
                body: JSON.stringify({ operationName: this.operationId() })
            };

            console.log("GeminiVideoPrompt: checking operation status at:\n[", proxyApiUrl, "]\nwith options: ", JSON.stringify(options, null, 2));

            const response = await fetch(proxyApiUrl, options);
            this.setStatus(`Completed fetch attempt ${this.attempts()} of ${this.maxAttempts()}...`);

            if (!response.ok) {
                const errorText = await response.text();
                const errorMessage = `API error: ${response.status} ${response.statusText} - ${errorText}`;
                this.setStatus("Status check failed");
                this.setError(errorMessage);
                this.sendDelegate("onVideoPromptError", [this]);
                return null;
            }
            
            const data = await response.json();
            
            // Check for percentage completion if available in metadata
            if (data.done) {

                /*
                example response:
                {
                    "name": "projects/precise-blend-419917/locations/us-central1/publishers/google/models/veo-3.0-generate-001/operations/5f0489e6-17a3-4052-ade1-57117ab607a4",
                    "done": true,
                    "response": {
                    "@type": "type.googleapis.com/cloud.ai.large_models.vision.GenerateVideoResponse",
                    "raiMediaFilteredCount": 0,
                    "videos": [
                        {
                        "bytesBase64Encoded": "{data}"
                        }
                    ]
                    }
                }
                */

                // do we need to convert it to a data url?
                const dataUrl = "data:video/mp4;base64," + data.response.videos[0].bytesBase64Encoded;
                console.log("GeminiVideoPrompt: video data url:" + dataUrl.length + " bytes");
                this.setVideoDataUrl(dataUrl);

                this.setStatus("Complete");
                this.sendDelegate("onVideoPromptVideoLoaded", [this]);
            } else {
                if (data.metadata && data.metadata.progressPercentage) {
                    this.setStatus(`Video generation: ${data.metadata.progressPercentage}% complete`);
                } else {
                    this.setStatus("In progress...");
                }
                this.waitAndCheckAgainIfNeeded();
            }
            
        } catch (error) {
            const errorMessage = `Operation error: ${error.message}`;
            this.setStatus("Status check failed");
            this.setError(errorMessage);
            this.sendDelegate("onVideoPromptError", [this]);
            console.error("GeminiVideoPrompt operation status error:", error);
            return false;
        }
    }

    waitAndCheckAgainIfNeeded () {
        if (this.videoDataUrl() || this.error()) {
            return;
        }
        
        if (this.attempts() < this.maxAttempts()) {
            setTimeout(() => {
                this.checkOperationStatus();
            }, this.checkIntervalMs());
        } else {
            const errorMessage = `Operation did not complete after ${attempts} attempts`;
            this.setStatus("Generation timed out");
            this.setError(errorMessage);
            this.sendDelegate("onVideoPromptError", [this]);
        }
        return null;
    }

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

    shutdown () {
        // Override to provide shutdown functionality if needed
        return this;
    }

}.initThisClass());