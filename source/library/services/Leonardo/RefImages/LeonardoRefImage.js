"use strict";

/**
 * @module library.services.Leonardo.RefImages
 */

/**
 * @class LeonardoRefImage
 * @extends SvSummaryNode
 * @classdesc Represents a reference image (to be) uploaded to Leonardo's text-to-image service.
 * 
 *  API notes:
  
 1) POST /init-image
   Purpose: obtain a presigned S3 URL plus initImageId.

   Request body:
   {
     "extension": "jpg",
     "width": 768,
     "height": 512
   }

   Minimal success response:
   {
     "uploadInitImage": {
       "id": "13b14ba1-0c33-4bc8-9b8f-1d2d2df96a8c",
       "uploadUrl": "https://leonardo-prod-init-images.s3.amazonaws.com/",
       "fields": {
         "key": "init-images/13b14ba1-...jpg",
         "policy": "eyJleHBpcmF0aW9uIjoi...",
         "signature": "Q1FZ..."
       }
     }
   }

   2) PUT {uploadUrl}
   Purpose: upload the binary file (multipart/form-data) to S3.


*/


(class LeonardoRefImage extends SvSummaryNode {
  /**
   * @description Initializes the prototype slots for the LeonardoRefImage class.
   */
  initPrototypeSlots () {

    // and an imageLabel
    {
      const slot = this.newSlot("imageLabel", "");
      slot.setSlotType("String");
      slot.setShouldJsonArchive(true);
      slot.setInspectorPath("");
      slot.setShouldStoreSlot(true);
      slot.setSyncsToView(true);
      slot.setDuplicateOp("duplicate");
      slot.setCanEditInspection(true);
      slot.setIsSubnodeField(true);
    }

    // add a hasUploaded slot
    {
      const slot = this.newSlot("hasUploaded", false);
      slot.setSlotType("Boolean");
      slot.setShouldJsonArchive(true);
      slot.setInspectorPath("");
      slot.setShouldStoreSlot(true);
      slot.setSyncsToView(true);
      slot.setDuplicateOp("duplicate");
    } 
  
    /**
     * @member {string} dataUrl - The URL of the generated image.
     * @category Image Data
     */
    {
      const slot = this.newSlot("dataUrl", null);
      slot.setCanEditInspection(true);
      slot.setShouldJsonArchive(true);
      slot.setInspectorPath("");
      slot.setLabel("image");
      slot.setShouldStoreSlot(true);
      slot.setSyncsToView(true);
      slot.setDuplicateOp("duplicate");
      slot.setSlotType("String");
      slot.setIsSubnodeField(true);
      slot.setFieldInspectorViewClassName("SvImageWellField"); // field inspector view class
    }

    /**
     * @member {string} url - The URL of the image.
     * @category Image Data
     */
    {
      const slot = this.newSlot("initImageDict", null);
      slot.setShouldJsonArchive(true);
      slot.setInspectorPath("");
      slot.setShouldStoreSlot(true);
      slot.setSyncsToView(true);
      slot.setDuplicateOp("duplicate");
      slot.setSlotType("JSON Object");
      slot.setIsSubnodeField(false);
      slot.setCanEditInspection(false);
    }

    // special field for the init image id
    // we'll override the initImageId() method to return the id from the initImageDict()
    {
      const slot = this.newSlot("initImageId", null);
      slot.setShouldJsonArchive(true);
      slot.setInspectorPath("");
      slot.setShouldStoreSlot(true);
      slot.setSyncsToView(true);
      slot.setDuplicateOp("duplicate");
      slot.setSlotType("String");
      slot.setIsSubnodeField(true);
      slot.setCanEditInspection(false);
    }

    // need a slot for the date when the init image id was obtained
    // as we only have 2 minutes to upload the image
    {
      const slot = this.newSlot("idObtainedDate", null);
      slot.setShouldJsonArchive(true);
      slot.setInspectorPath("");
      slot.setShouldStoreSlot(true);
      slot.setSyncsToView(true);
      slot.setSlotType("Date");
      slot.setIsSubnodeField(true);
      slot.setCanEditInspection(false);
    }

    {
      const slot = this.newSlot("updloadedDate", null);
      slot.setShouldJsonArchive(true);
      slot.setInspectorPath("");
      slot.setShouldStoreSlot(true);
      slot.setSyncsToView(true);
      slot.setSlotType("Date");
      slot.setIsSubnodeField(true);
      slot.setCanEditInspection(false);
    }


    /**
     * @member {SvXhrRequest} xhrRequest - The XHR request for the image.
     * @category Networking
     */
    {
      const slot = this.newSlot("xhrRequest", null);
      slot.setShouldJsonArchive(true);
      slot.setInspectorPath("");
      slot.setLabel("xhr request");
      slot.setShouldStoreSlot(true);
      slot.setSyncsToView(true);
      slot.setSlotType("SvXhrRequest");
      slot.setIsSubnodeField(false)
      slot.setCanEditInspection(false)
    }

    /**
     * @member {Action} fetchAction - The action to fetch the image.
     * @category Actions
     */
    {
      const slot = this.newSlot("getInitImageIdAction", null);
      slot.setInspectorPath("");
      slot.setLabel("Get Init Image ID");
      //slot.setShouldStoreSlot(true)
      slot.setSyncsToView(true);
      slot.setDuplicateOp("duplicate");
      slot.setSlotType("Action");
      slot.setIsSubnodeField(true);
      slot.setActionMethodName("getInitImageId");
    }

    /**
 * @member {Action} fetchAction - The action to fetch the image.
 * @category Actions
 */
    {
      const slot = this.newSlot("uploadInitImageToS3Action", null);
      slot.setInspectorPath("");
      slot.setLabel("Upload");
      //slot.setShouldStoreSlot(true)
      slot.setSyncsToView(true);
      slot.setDuplicateOp("duplicate");
      slot.setSlotType("Action");
      slot.setIsSubnodeField(true);
      slot.setActionMethodName("uploadInitImageToS3");
    }

    /**
     * @member {string} error - Error message if any.
     * @category Error Handling
     */
    {
      const slot = this.newSlot("error", ""); // String
      slot.setInspectorPath("");
      slot.setShouldStoreSlot(true);
      slot.setSyncsToView(true);
      slot.setDuplicateOp("duplicate");
      slot.setSlotType("String");
      slot.setIsSubnodeField(true);
      slot.setCanEditInspection(false);
    }

    /**
     * @member {string} status - Current status of the image.
     * @category Status
     */
    {
      const slot = this.newSlot("status", ""); // String
      slot.setInspectorPath("");
      slot.setShouldStoreSlot(true);
      slot.setSyncsToView(true);
      slot.setDuplicateOp("duplicate");
      slot.setSlotType("String");
      slot.setIsSubnodeField(true);
      slot.setCanEditInspection(false);
    }

    {
      const slot = this.newSlot("copyErrorToClipboardAction", null);
      slot.setInspectorPath("");
      slot.setLabel("Copy Error to Clipboard");
      //slot.setShouldStoreSlot(true)
      slot.setSyncsToView(true);
      slot.setDuplicateOp("duplicate");
      slot.setSlotType("Action");
      slot.setIsSubnodeField(true);
      slot.setActionMethodName("copyErrorToClipboard");
    }

    // add a delegate slot
    {
      const slot = this.newSlot("delegate", null);
      slot.setSlotType("Object");
      //slot.setIsSubnodeField(true);
      slot.setShouldStoreSlot(true);

    }
  }

  initPrototype () {
    this.setTitle("Reference Image");
    this.setShouldStore(true);
    this.setShouldStoreSubnodes(false);
    this.setSubnodeClasses([]);
    this.setNodeCanAddSubnode(false);
    this.setNodeCanReorderSubnodes(false);
    this.setCanDelete(true);
    this.setNodeFillsRemainingWidth(true);
  }

  /*
  setDataUrl (dataUrl) {
    debugger;
    this._dataUrl = dataUrl;
    return this;
  }
  */

  /**
   * @description Gets the subtitle for the image.
   * @returns {string} The status of the image.
   * @category UI
   */
  subtitle () {
    if (this.hasUploaded()) {
      return `uploaded`;
    }

    if (this.hasInitImageId()) {
      return "got id";
    }

    if (this.hasDataUrl()) {
      return "has image";
    }

    return "no image";
  }


  /**
   * @description Gets the service used for image generation.
   * @returns {Object} The service.
   * @category Service
   */
  service () {
    return LeonardoService.shared();
  }

  /**
   * @description Checks if there's an error.
   * @returns {boolean} True if there's an error, false otherwise.
   * @category Error Handling
   */
  hasError () {
    return this.error() !== "" && this.error() !== null;
  }

  hasDataUrl () {
    return Type.isString(this.dataUrl()) && this.dataUrl().length > 0;
  }

  hasUploaded () {
    return this.updloadedDate() !== null;
  }

  hasInitImageId () {
    return this.initImageId() !== null;
  }

  /**
   * @description Checks if the image can be uploaded to S3.
   * @returns {boolean} True if the image can be uploaded to S3, false otherwise.
   * @category Actions
   */
  canUploadInitImageToS3 () {
    if (this.hasUploaded()) {
      return false;
    } else {
      return !this.uploadTimeIsExpired() && this.hasInitImageId() && this.hasDataUrl();
    }
  }

  /**
   * @description Gets the fetch action information.
   * @returns {Object} An object containing fetch action information.
   * @category Actions
   */
  uploadInitImageToS3ActionInfo () {
    return {
        isEnabled: this.canUploadInitImageToS3(),
        //title: this.title(),
        isVisible: true
    };
  }

  /**
   * @description Gets the proxy URL for the image.
   * @returns {string} The proxy URL.
   * @category Networking
   */
  getProxyUrl () {
    return ProxyServers.shared().defaultServer().proxyUrlForUrl(this.url());
  }


  async asynInitRequestBodyJson () {
    const dataUrl = this.dataUrl();
    return new Promise((resolve, reject) => {
      const m = dataUrl.match(/^data:([^;,]+)?(?:;[^,]+)?,/);
      if (!m) return reject(new Error("Not a valid data-URL"));
  
      // derive file extension from MIME type
      let ext = (m[1] || "").split("/").pop().toLowerCase();
      if (ext === "jpeg") ext = "jpg";          // normalize common case
  
      const img = new Image();
      img.onload  = () =>
        resolve({ extension: ext || "bin" });
      //resolve({ extension: ext || "bin", width: img.naturalWidth, height: img.naturalHeight });
      img.onerror = () => reject(new Error("Image failed to load"));
      img.src = dataUrl;
    });
  }


  async getIdAndUpload () {
    await this.getInitImageId();
    await this.uploadInitImageToS3();
  }

  /**
   * @description Fetches the image.
   * @returns {Promise<void>}
   * @category Actions
   */
  async upload () {
    await this.getInitImageId();
    await this.uploadInitImageToS3();
  }

  hasExpiredId () {
    return this.idObtainedDate() === null || this.uploadTimeIsExpired();
  }

  canGetInitImageId () {
    if (!this.hasDataUrl()) {
      return false;
    } 
    
    if (this.hasUploaded()) {
      return false;
    } 

    if (this.hasExpiredId()) {
      return true;
    } 

    return this.initImageId() === null;
  }

  getInitImageIdActionInfo () {
    return {
      isEnabled: this.canGetInitImageId(),
      isVisible: true
    };
  }

  async xhrForUrl (url, method, bodyString) {
    const xhr = SvXhrRequest.clone();
    xhr.setUrl(url);
    xhr.setMethod(method);
    xhr.setHeaders({
      "Authorization": `Bearer ` + await this.service().apiKeyOrUserAuthToken()
    });
    xhr.setDelegate(this);
    xhr.setBody(bodyString);
    return xhr;
  }

  async proxyXhrForUrl (url, method, bodyString) {
    const proxyUrl = ProxyServers.shared().defaultServer().proxyUrlForUrl(url);
    return await this.xhrForUrl(proxyUrl, method, bodyString);
  }

  async getInitImageId () {
    this.setStatus("getting init image id...");

    const initUrl = "https://cloud.leonardo.ai/api/rest/v1/init-image";
    const bodyJson = await this.asynInitRequestBodyJson();
    const bodyString = JSON.stringify(bodyJson);
    const xhr = await this.proxyXhrForUrl(initUrl, "POST", bodyString);
    await xhr.asyncSend();

    if (xhr.isSuccess()) {
      const json = JSON.parse(xhr.responseText());
      this.setStatus("got init image id");
      this.setInitImageDict(json.uploadInitImage);
      this.setIdObtainedDate(new Date());
    } else {
      this.setStatus("error getting init image id");
      this.setError(xhr.responseText());
    }
  }

  initImageId () {
    const dict = this.initImageDict();
    if (dict) {
      return dict.id;
    } else {
      return null;
    }
  }

  uploadTimeIsExpired () {
    const idObtainedDate = this.idObtainedDate();
    if (!idObtainedDate) {
      return false;
    }
    return idObtainedDate.getTime() + 2 * 60 * 1000 < Date.now();
  }


  async uploadInitImageToS3 () {
    this.setStatus("uploading image to S3...");

    //debugger;
    const initImageDict = this.initImageDict();
    // hack to deal with storage bug
    if (Type.isString(initImageDict.fields)) {
      initImageDict.fields = JSON.parse(initImageDict.fields);
    }

    const url = initImageDict.url;
    console.log("S3 URL: [" + url + "]");
    const proxyUrl = ProxyServers.shared().defaultServer().proxyUrlForUrl(url);
    const dataUrl = this.dataUrl();
    const presigned = { uploadUrl: proxyUrl, fields: initImageDict.fields };

    // presigned = { uploadUrl, fields } from POST /init-image
    // 1. Turn the data-URL into a Blob (raw bytes) - no network request
    const blob = await (await fetch(dataUrl)).blob();      // keeps correct MIME type
  
    // 2. Build the multipart/form-data payload
    const form = new FormData();
    Object.entries(presigned.fields).forEach(([k, v]) => form.append(k, v));
    form.append("file", blob);  // the part name must be "file"
  
    // 3. POST it to S3
    //const res = await fetch(proxyUrl, { method: "POST", body: form });

    const xhr = await this.proxyXhrForUrl(url, "POST", form);
    //const xhr = this.xhrForUrl(url, "POST", form);
    // Keep Authorization for proxy server authentication
    // IMPORTANT: Do NOT set Content-Type header for multipart/form-data
    // The browser will automatically set it with the correct boundary parameter
    
    xhr.setHeaders({
      "Authorization": `Bearer ` + await this.service().apiKeyOrUserAuthToken()
      // Removed "Content-Type": "multipart/form-data" - browser must set this with boundary
    });
    
    await xhr.asyncSend();
    this.setStatus("uploading image to S3");


    if (xhr.isSuccess()) {
      this.setHasUploaded(true);
      this.setUpdloadedDate(new Date());
      this.setStatus("complete");
    } else {
      debugger;
      this.setHasUploaded(false);
      this.setError(`S3 upload failed: ${xhr.error().message}`);
      this.setStatus("failed");
    }
  }

  copyErrorToClipboard () {
    const error = this.error();
    if (error) {
      navigator.clipboard.writeText(error);
    }
  }

  copyErrorToClipboardActionInfo () {
    return {
      isEnabled: this.hasError(),
      isVisible: this.hasError()
    };
  }

  /**
   * @description Shuts down the image fetching process.
   * @returns {this} The current instance.
   * @category Lifecycle
   */
  shutdown () {
    /*
    if (this.xhr()) {
      this.xhr().abort();
    }
      */
   return this;
  }


}.initThisClass());