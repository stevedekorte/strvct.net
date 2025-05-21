"use strict";

/*
    GeminiVideoPrompt
    
    A class to handle calls to Google's Gemini Text to Video API (Veo)
    for generating videos from text prompts.
*/

(class GeminiVideoPrompt extends SvSummaryNode {

    initPrototypeSlots () {

        /*
        {
            const slot = this.newSlot("service", null);
            slot.setSlotType("AiService");
            slot.setDescription("The Gemini service to use for video generation");
        }
        */

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
            "resolution": {
                "presets": {
                    "720p": {
                    "width": 1280,
                    "height": 720
                    },
                    "1080p": {
                    "width": 1920,
                    "height": 1080
                    }
                },
      */
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

        {
            const slot = this.newSlot("model", "videomaker");
            slot.setSlotType("String");
            slot.setDescription("The Gemini model to use for video generation via Veo");
        }

        {
            const slot = this.newSlot("response", null);
            slot.setSlotType("Object");
            slot.setDescription("The response from the Gemini API");
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
        const width = this.width();
        const height = this.height();
        const frameRate = this.frameRate();
        const model = this.model();
        const status = this.status();
    
        let s = `${prompt}\n${duration}s ${width}x${height} ${frameRate}fps\n${model}`;
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

        return `https://${this.locationId()}-aiplatform.googleapis.com/v1/projects/${this.projectId()}/locations/${this.locationId()}/publishers/google/models/veo-3.0-generate-preview:predict`;
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
        const body = {
            contents: [
              {
                role: 'user',
                parts: [
                  {
                    text: this.prompt()
                  }
                ]
              }
            ],
            generation_config: {
              duration: this.duration(),
              // Optional parameters
              video_resolution: {
                width: this.width(),
                height: this.height()
              },
              frame_rate: this.frameRate()
              // Add other parameters as needed
              //sampleCount: 1
              //enhancePrompt: true
            }
          };

        // Add reference image/video data if provided
        if (this.videoData()) {
            const videoPart = this.prepareVideoPart();
            if (videoPart) {
                if (videoPart.image.uri) {
                    body.instances[0].image_url = videoPart.image.uri;
                } else if (videoPart.image.data) {
                    body.instances[0].image_bytes = videoPart.image.data;
                }
            }
        }

        return body;
    }

    // Prepare the video/image part of the request
    prepareVideoPart () {
        const videoData = this.videoData();
        
        if (!videoData) {
            return null; // Video/image data is optional
        }

        // Handle URL or base64 encoded data
        if (videoData.startsWith("http")) {
            return {
                image: {
                    uri: videoData
                }
            };
        } else {
            // Assume it's base64 encoded data
            // Check if it has the data URL prefix and remove it if needed
            let base64Data = videoData;
            const dataUrlPrefixes = ["data:image/", "data:video/"];
            
            for (const prefix of dataUrlPrefixes) {
                if (base64Data.startsWith(prefix)) {
                    const commaIndex = base64Data.indexOf(",");
                    if (commaIndex !== -1) {
                        base64Data = base64Data.substring(commaIndex + 1);
                        break;
                    }
                }
            }

            return {
                image: {
                    data: base64Data
                }
            };
        }
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
            return operationData;
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


    // Helper method to extract text content from the response
    extractText () {
        if (!this.response()) {
            return "";
        }

        try {
            // For Vertex AI LLM API responses
            if (this.response().predictions && this.response().predictions.length > 0) {
                const prediction = this.response().predictions[0];
                if (prediction.content && prediction.content.text) {
                    return prediction.content.text;
                }
            }
            
            // For completed long-running operations
            if (this.response().result && this.response().result.predictions) {
                const predictions = this.response().result.predictions;
                if (predictions && predictions.length > 0 && predictions[0].content) {
                    return predictions[0].content.text || "";
                }
            }
            
            // Fall back to original format if still using it
            const candidates = this.response().candidates;
            if (candidates && candidates.length > 0) {
                const content = candidates[0].content;
                if (content && content.parts) {
                    let result = "";
                    for (const part of content.parts) {
                        if (part.text) {
                            result += part.text;
                        }
                    }
                    return result;
                }
            }

            return "";
        } catch (error) {
            console.error("Error extracting text from response:", error);
            return "";
        }
    }
    
    // Check the status of a long-running operation
    async checkOperationStatus (operationId) {
        this.setStatus("Checking operation status...");
        
        // No need to call setupApiKey as we're getting the API key from the service
        // method directly through the apiKey() method
        
        if (!this.apiKey()) {
            this.setStatus("Authentication error");
            this.setError("No API key available");
            return null;
        }
        
        const projectId = this.projectId();
        const locationId = this.locationId();
        
        if (!projectId) {
            this.setStatus("Configuration error");
            this.setError("No project ID available. Please check GeminiService configuration.");
            return null;
        }
        
        // Operation name is often returned as a full path, so extract just the ID if needed
        let operationName = operationId;
        if (operationId.includes('/')) {
            operationName = operationId.split('/').pop();
        }
        
        const apiUrl = `https://${locationId}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${locationId}/operations/${operationName}`;
        this.setStatus(`Checking status of operation ${operationName}...`);
        
        try {
            const response = await fetch(apiUrl, {
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
    
    // Helper method to extract video URL from the response
    extractVideoUrl () {
        if (!this.response()) {
            return null;
        }

        try {
            // Check for long-running operation response format
            if (this.response().name) {
                // This is the initial response with an operation ID
                const operationId = this.response().name;
                console.log("Long-running operation started:", operationId);
                return `Operation ID: ${operationId} - Check status with getOperation API`;
            }
            
            // If the response has predictions, look for video URL there
            if (this.response().predictions && this.response().predictions.length > 0) {
                const prediction = this.response().predictions[0];
                
                // Check for video URLs in the prediction
                if (prediction.videoUrl) {
                    return prediction.videoUrl;
                }
                
                if (prediction.content && prediction.content.video && prediction.content.video.uri) {
                    return prediction.content.video.uri;
                }
                
                // Look for URLs in the text content
                if (prediction.content && prediction.content.text) {
                    const urlPattern = /(https?:\/\/[^\s]+)/g;
                    const matches = prediction.content.text.match(urlPattern);
                    if (matches && matches.length > 0) {
                        return matches[0]; // Return the first URL found
                    }
                }
            }
            
            // For complete operations
            if (this.response().result && this.response().result.predictions) {
                const predictions = this.response().result.predictions;
                if (predictions && predictions.length > 0) {
                    // Same checks as above for the completed operation
                    const prediction = predictions[0];
                    
                    if (prediction.videoUrl) {
                        return prediction.videoUrl;
                    }
                    
                    if (prediction.content && prediction.content.video && prediction.content.video.uri) {
                        return prediction.content.video.uri;
                    }
                    
                    if (prediction.content && prediction.content.text) {
                        const urlPattern = /(https?:\/\/[^\s]+)/g;
                        const matches = prediction.content.text.match(urlPattern);
                        if (matches && matches.length > 0) {
                            return matches[0];
                        }
                    }
                }
            }

            return null;
        } catch (error) {
            console.error("Error extracting video URL from response:", error);
            return null;
        }
    }

    // Step 1a: Start video generation from a text prompt
    async generateVideo (promptText) {
        this.setStatus("Initializing text-to-video generation...");
        this.setVideoData(null); // No reference image for basic generation
        this.setPrompt(promptText || "Create a short video of a sunset over mountains.");
        this.setStatus(`Preparing to generate video: "${this.prompt().slice(0, 30)}..."`);
        return await this.startGeneration();
    }

    // Step 1b: Start video generation with a reference image
    async generateVideoWithImage (imageUrlOrBlob, promptText) {
        this.setStatus("Initializing image-to-video generation...");
        
        if (typeof imageUrlOrBlob === 'string' && imageUrlOrBlob.startsWith('http')) {
            // It's a URL
            this.setStatus("Using reference image from URL");
            this.setVideoData(imageUrlOrBlob);
            this.setPrompt(promptText || "Create a video based on this reference image.");
            this.setStatus(`Preparing image-to-video with prompt: "${this.prompt().slice(0, 30)}..."`);
            return await this.startGeneration();
        } else {
            // It's a blob/file
            this.setStatus("Processing reference image file...");
            
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                
                reader.onload = async (event) => {
                    this.setStatus("Reference image loaded successfully");
                    this.setVideoData(event.target.result);
                    this.setPrompt(promptText || "Create a video based on this reference image.");
                    this.setStatus(`Preparing image-to-video with prompt: "${this.prompt().slice(0, 30)}..."`);
                    const result = await this.startGeneration();
                    resolve(result);
                };
                
                reader.onerror = (error) => {
                    const errorMessage = `Error reading image file: ${error}`;
                    this.setStatus("Failed to load reference image");
                    this.setError(errorMessage);
                    reject(error);
                };
                
                this.setStatus("Reading image data...");
                reader.readAsDataURL(imageUrlOrBlob);
            });
        }
    }
    
    // Step 2: Get the final result by waiting for the operation to complete
    async waitForVideoCompletion (operation, checkIntervalMs = 10000, maxAttempts = null) {
        this.setStatus("Waiting for video generation to complete...");
        const operationId = typeof operation === 'string' ? operation : operation?.name;
        
        if (!operationId) {
            this.setStatus("Invalid operation");
            this.setError("Invalid operation ID");
            return null;
        }
        
        let attempts = 0;
        this.setStatus(`Monitoring generation progress (poll interval: ${checkIntervalMs/1000}s)`);
        
        while (maxAttempts === null || attempts < maxAttempts) {
            attempts++;
            
            this.setStatus(`Checking progress (attempt ${attempts}${maxAttempts ? '/' + maxAttempts : ''})...`);
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

    // Show a demonstration of how to use this class
    static example () {
        console.log("To use GeminiVideoPrompt:");
        console.log(`
// Create a new instance
const videoPrompt = GeminiVideoPrompt.clone();

// APPROACH 1: Explicit two-step process with manual polling
// Step 1: Start the video generation process
videoPrompt.generateVideo("Create a cinematic video of a spaceship flying through an asteroid field")
    .then(operation => {
        // The operation contains an ID for the long-running process
        const operationId = operation.name;
        console.log("Generation started:", operationId);
        
        // Step 2: Poll for the operation status
        const checkStatus = () => {
            videoPrompt.checkOperationStatus(operationId)
                .then(status => {
                    if (status.done) {
                        console.log("Video generation complete!");
                        const videoUrl = videoPrompt.extractVideoUrl();
                        console.log("Generated video URL:", videoUrl);
                        
                        // Do something with the URL, like displaying the video
                        document.getElementById('resultVideo').src = videoUrl;
                    } else {
                        console.log("Still processing... will check again in 10 seconds");
                        setTimeout(checkStatus, 10000);
                    }
                })
                .catch(error => {
                    console.error("Status check error:", error);
                });
        };
        
        // Start polling after a short delay
        setTimeout(checkStatus, 5000);
    })
    .catch(error => {
        console.error("Error:", error);
    });

// APPROACH 2: Using the built-in wait method
videoPrompt.generateVideo("Create a sci-fi cityscape at night with flying cars")
    .then(operation => {
        console.log("Generation started with operation ID:", operation.name);
        
        // Wait for completion with the helper method
        return videoPrompt.waitForVideoCompletion(operation, 10000);
    })
    .then(result => {
        if (result) {
            const videoUrl = videoPrompt.extractVideoUrl();
            console.log("Generation complete! Video URL:", videoUrl);
        }
    })
    .catch(error => {
        console.error("Error:", error);
    });

// APPROACH 3: Using a reference image with the convenience method
// Assuming you have an image input element with id "imageInput"
document.getElementById("imageInput").addEventListener("change", (event) => {
    const file = event.target.files[0];
    if (file) {
        videoPrompt.generateWithImageAndWait(
            file, 
            "Create a video that starts with this image and shows it coming to life",
            10000  // Check every 10 seconds
        )
        .then(result => {
            if (result) {
                const videoUrl = videoPrompt.extractVideoUrl();
                console.log("Video generated from image! URL:", videoUrl);
            }
        })
        .catch(error => {
            console.error("Error:", error);
        });
    }
});

// APPROACH 4: All-in-one method
// This combines the entire process into one convenient method call
videoPrompt.generateAndWaitForVideo(
    "Create a whimsical animation of floating lanterns rising into a night sky",
    15000, // Check every 15 seconds
    12     // Max of 12 attempts (3 minutes total)
)
.then(result => {
    if (result) {
        const videoUrl = videoPrompt.extractVideoUrl();
        console.log("Video ready:", videoUrl);
        
        // Display the video
        const videoElement = document.createElement('video');
        videoElement.src = videoUrl;
        videoElement.controls = true;
        document.body.appendChild(videoElement);
    }
})
.catch(error => {
    console.error("Process failed:", error);
});

// Advanced example with async/await
async function generateCustomVideo() {
    try {
        // Step 1: Start the operation
        const operation = await videoPrompt.generateVideo(
            "Create a photorealistic video of ocean waves crashing on a beach at sunset"
        );
        
        if (!operation) {
            throw new Error("Failed to start video generation");
        }
        
        console.log("Operation started:", operation.name);
        
        // Step 2: Wait for completion with progress updates
        let attempts = 0;
        let complete = false;
        
        while (!complete && attempts < 30) { // Max 5 minutes at 10s intervals
            attempts++;
            
            await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds
            
            const status = await videoPrompt.checkOperationStatus(operation.name);
            
            if (!status) {
                console.error("Failed to check operation status");
                break;
            }
            
            if (status.done) {
                complete = true;
                const videoUrl = videoPrompt.extractVideoUrl();
                console.log("Generation complete after", attempts, "attempts!");
                console.log("Video URL:", videoUrl);
                
                // Return the URL for further processing
                return videoUrl;
            } else {
                console.log("Progress update:", attempts, "checks completed...");
                
                // You can report progress percentage if the API provides it
                if (status.metadata && status.metadata.progressPercentage) {
                    console.log("Progress:", status.metadata.progressPercentage, "%");
                }
            }
        }
        
        if (!complete) {
            throw new Error("Operation timed out");
        }
    } catch (error) {
        console.error("Error generating video:", error);
        throw error;
    }
}
`);
    }

}.initThisClass());