"use strict";

/*
    GeminiVideoPrompt
    
    A class to handle calls to Google's Gemini Text to Video API (Veo)
    for generating videos from text prompts.
*/

(class GeminiVideoPrompt extends SvSummaryNode {

    initPrototypeSlots () {

        {
            const slot = this.newSlot("videoData", null);
            slot.setSlotType("String");
            slot.setDescription("Optional reference image data or initial frame in the form of a base64 encoded string or a URL");
        }

        {
            const slot = this.newSlot("prompt", "a cat walking on a beach");
            slot.setSlotType("String");
            slot.setDescription("The text prompt to use for generating the video");
            slot.setIsSubnodeField(true);
        }

        {
            const slot = this.newSlot("duration", 5);
            slot.setSlotType("Number");
            slot.setDescription("The duration of the video in seconds");
            slot.setIsSubnodeField(true);
            slot.setValidValues([5, 6, 7, 8]);
        }

        /*
        {
            const slot = this.newSlot("width", 1280);
            slot.setSlotType("Number");
            slot.setDescription("The width of the video in pixels");
            slot.setIsSubnodeField(true);
        }

        {
            const slot = this.newSlot("height", 1080);
            slot.setSlotType("Number");
            slot.setDescription("The height of the video in pixels");
            slot.setIsSubnodeField(true);
        }

        {
            const slot = this.newSlot("frameRate", 24);
            slot.setSlotType("Number");
            slot.setDescription("The frame rate of the video in frames per second");
            slot.setIsSubnodeField(true);
            slot.setValidValues([24]);
        }
        */

        {
            const slot = this.newSlot("model", "veo-2.0-generate-001");
            slot.setSlotType("String");
            slot.setDescription("The Gemini model to use for video generation via Veo");
        }

        {
            const slot = this.newSlot("response", null);
            slot.setSlotType("Object");
            slot.setDescription("The response from the Gemini API");
        }

        // waiting for completion uses this
        {
            const slot = this.newSlot("operationId", null);
            slot.setSlotType("String");
            slot.setDescription("The operation ID for the Gemini API");
            slot.setIsSubnodeField(true);
            slot.setShouldStoreSlot(true);
        }

        {
            const slot = this.newSlot("checkIntervalMs", 10000);
            slot.setSlotType("Number");
            slot.setDescription("The interval in milliseconds to check the status of the operation");
            slot.setIsSubnodeField(true);
            slot.setShouldStoreSlot(false);
        }

        {
            const slot = this.newSlot("maxAttempts", 12);
            slot.setSlotType("Number");
            slot.setDescription("The maximum number of attempts to check the status of the operation");
            slot.setIsSubnodeField(true);
            slot.setShouldStoreSlot(false);
        }

        {
            const slot = this.newSlot("attempts", 0);
            slot.setSlotType("Number");
            slot.setDescription("The number of attempts to check the status of the operation");
            slot.setIsSubnodeField(true);
            slot.setShouldStoreSlot(false);
        }

        {
            const slot = this.newSlot("fetchOptionsString", null);
            slot.setLabel("");
            slot.setInspectorPath("Fetch Options");
            slot.setSlotType("String");
            slot.setDescription("The fetch options as a string");
            slot.setIsSubnodeField(true);
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
        const model = this.model();
        const status = this.status();
    
        let s = `${prompt}\n${duration}seconds, ${model}`;
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

        return `https://${this.locationId()}-aiplatform.googleapis.com/v1/projects/${this.projectId()}/locations/${this.locationId()}/publishers/google/models/${this.model()}:predictLongRunning`;
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
        const endpoint = this.apiUrl().split("/v1")[1]
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

    // Step 1: Start the video generation process
    async startGeneration () {
        this.setStatus("Preparing to generate video...");
        this.setError(null); // Clear any previous errors

        // For this API, we just need a text prompt - image data is optional
        
        this.setStatus("Building request payload...");
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

            this.setFetchOptionsString(["url:", apiUrl, "headers:", JSON.stringify(fetchOptions.headers, null, 2), "body:", JSON.stringify(body, null, 2)].join("\n\n"));

            if (this.isDebugging()) {
                console.log("GeminiVideoPrompt: Initiating video generation at", apiUrl);
                // Log the body without the actual video data for debugging
                const debugBody = JSON.parse(JSON.stringify(body));
                if (debugBody.instances && debugBody.instances[0]) {
                    if (debugBody.instances[0].image_bytes) {
                        debugBody.instances[0].image_bytes = "[BASE64_IMAGE_DATA]";
                    }
                }
                console.log("Request body:", JSON.stringify(debugBody, null, 2));
            }

            // Make the initial request to start the generation process
            this.setStatus("Connecting to Gemini API...");
            const response = await fetch(apiUrl, fetchOptions);
            
            if (!response.ok) {
                const errorText = await response.text();
                const errorMessage = `API error: ${response.status} ${response.statusText} - ${errorText}`;
                this.setStatus("API request failed");
                this.setError(errorMessage);
                return null;
            }
            
            // Parse the operation response
            this.setStatus("Processing API response...");
            const operationData = await response.json();
            this.setResponse(operationData);
            
            if (this.isDebugging()) {
                console.log("Operation started:", operationData.name);
            }
            
            this.setStatus("Video generation started. Operation ID: " + operationData.name);

            this.setOperationId(operationData.name);
            return await this.waitForVideoCompletion();

        } catch (error) {
            const errorMessage = `API request error: ${error.message}`;
            this.setStatus("Request failed");
            this.setError(errorMessage);
            console.error("GeminiVideoPrompt generation error:", error);
            return null;
        }
    }
    
    // Legacy method for compatibility
    async sendRequest () {
        return this.startGeneration();
    }

    // Check the status of a long-running operation
    async checkOperationStatus () {
        const projectId = this.projectId();
        const locationId = this.locationId();
        const apiUrl = `https://${locationId}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${locationId}/operations/${this.operationId()}`;
        const proxyApiUrl = ProxyServers.shared().defaultServer().proxyUrlForUrl(apiUrl);

        //this.setStatus(`Checking status of operation ${operationName}...`);
        
        try {
            const response = await fetch(proxyApiUrl, {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${this.apiKey()}`
                }
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                const errorMessage = `API error: ${response.status} ${response.statusText} - ${errorText}`;
                this.setStatus("Status check failed");
                this.setError(errorMessage);
                return null;
            }
            
            const data = await response.json();
            this.setResponse(data);
            
            // Check for percentage completion if available in metadata
            if (data.metadata && data.metadata.progressPercentage) {
                this.setStatus(`Video generation: ${data.metadata.progressPercentage}% complete`);
            } else if (data.done) {
                this.setStatus("Video generation complete");
            } else {
                this.setStatus("Video generation in progress");
            }
            
            return {
                done: data.done || false,
                result: data.result || null,
                error: data.error || null,
                metadata: data.metadata || null
            };
        } catch (error) {
            const errorMessage = `Operation status check error: ${error.message}`;
            this.setStatus("Status check failed");
            this.setError(errorMessage);
            console.error("GeminiVideoPrompt operation status error:", error);
            return null;
        }
    }
    
    // Step 2: Get the final result by waiting for the operation to complete
    async waitForVideoCompletion () {
        const checkIntervalMs = this.checkIntervalMs();
        const maxAttempts = this.maxAttempts();
        const operationId = this.operationId();
        this.setStatus("Waiting for video generation to complete...");
        
        //this.setStatus(`Monitoring generation progress (poll interval: ${checkIntervalMs/1000}s)`);
        
        while (maxAttempts === null || this.attempts() < maxAttempts) {
            this.setAttempts(this.attempts() + 1);
            
            this.setStatus(`Checking progress (attempt ${this.attempts()}${maxAttempts ? '/' + maxAttempts : ''})...`);
            const status = await this.checkOperationStatus(operationId);
            
            if (!status) {
                // Error checking status - the checkOperationStatus method will have set the error
                this.setStatus("Failed to check operation status");
                return null;
            }
            
            if (status.done) {
                // Operation completed
                if (status.error) {
                    const errorMessage = `Operation failed: ${status.error.message || JSON.stringify(status.error)}`;
                    this.setStatus("Video generation failed");
                    this.setError(errorMessage);
                    return null;
                }
                
                this.setStatus("Video generation successfully completed");
                return status;
            }
            
            // Status message updated in checkOperationStatus
            
            // Operation still in progress, wait before checking again
            if (maxAttempts === null || attempts < maxAttempts) {
                this.setStatus(`Waiting ${checkIntervalMs/1000}s before next status check...`);
                await new Promise(resolve => setTimeout(resolve, checkIntervalMs));
            }
        }
        
        const errorMessage = `Operation did not complete after ${attempts} attempts`;
        this.setStatus("Generation timed out");
        this.setError(errorMessage);
        return null;
    }
    
    /*
    // Convenience method that combines generation and waiting
    async generateAndWaitForVideo (promptText, checkIntervalMs = 10000, maxAttempts = null) {
        this.setStatus("Starting end-to-end video generation process");
        const operation = await this.generateVideo(promptText);
        if (!operation) {
            this.setStatus("Failed to start generation process");
            return null;
        }
        
        this.setStatus("Generation started, now waiting for completion");
        return this.waitForVideoCompletion(operation, checkIntervalMs, maxAttempts);
    }
    
    // Convenience method that combines generation with image and waiting
    async generateWithImageAndWait (imageUrlOrBlob, promptText, checkIntervalMs = 10000, maxAttempts = null) {
        this.setStatus("Starting end-to-end image-to-video generation process");
        const operation = await this.generateVideoWithImage(imageUrlOrBlob, promptText);
        if (!operation) {
            this.setStatus("Failed to start image-to-video generation");
            return null;
        }
        
        this.setStatus("Image-to-video generation started, now waiting for completion");
        return this.waitForVideoCompletion(operation, checkIntervalMs, maxAttempts);
    }
    */

}.initThisClass());