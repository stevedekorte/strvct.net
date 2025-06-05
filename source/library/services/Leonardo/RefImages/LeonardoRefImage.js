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
      const slot = this.newSlot("uploadAction", null);
      slot.setInspectorPath("");
      slot.setLabel("Upload");
      //slot.setShouldStoreSlot(true)
      slot.setSyncsToView(true);
      slot.setDuplicateOp("duplicate");
      slot.setSlotType("Action");
      slot.setIsSubnodeField(true);
      slot.setActionMethodName("upload");
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
      //slot.setIsSubnodeField(true);
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

    // add a delegate slot
    {
      const slot = this.newSlot("delegate", null);
      slot.setSlotType("Delegate");
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
    const id = this.initImageId();
    if (id) {
      return `ID: ${id}\n${this.status()}`;
    } else {
      return this.status();
    }
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

  /**
   * @description Checks if the image can be fetched.
   * @returns {boolean} True if the image can be fetched, false otherwise.
   * @category Actions
   */
  canUpload () {
    return Type.isString(this.dataUrl()) && this.dataUrl().length > 0 && this.initImageId() === null;
  }

  /**
   * @description Gets the fetch action information.
   * @returns {Object} An object containing fetch action information.
   * @category Actions
   */
  uploadActionInfo () {
    return {
        isEnabled: this.canUpload(),
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


  async asynInitRequestBody () {
    const dataUrl = this.dataUrl();
    return new Promise((resolve, reject) => {
      const m = dataUrl.match(/^data:([^;,]+)?(?:;[^,]+)?,/);
      if (!m) return reject(new Error("Not a valid data-URL"));
  
      // derive file extension from MIME type
      let ext = (m[1] || "").split("/").pop().toLowerCase();
      if (ext === "jpeg") ext = "jpg";          // normalize common case
  
      const img = new Image();
      img.onload  = () =>
        resolve({ extension: ext || "bin", width: img.naturalWidth, height: img.naturalHeight });
      img.onerror = () => reject(new Error("Image failed to load"));
      img.src = dataUrl;
    });
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

  async getInitImageId () {

    const initUrl = "/init-image";
    const proxyInitUrl = ProxyServers.shared().defaultServer().proxyUrlForUrl(initUrl);
    const apiKey = this.service().apiKeyOrUserAuthToken();

    const xhr = new SvXhrRequest();
    this.setXhrRequest(xhr);
    xhr.setEndpoint(proxyInitUrl);
    xhr.setMethod("POST");
    xhr.setHeaders({
      "Authorization": `Bearer ` + apiKey,
      "Content-Type": "application/json"
    });
    xhr.setDelegate(this);
    const body = await this.asynInitRequestBody();
    xhr.setBody(body);
    await xhr.asyncSend();

    if (xhr.isSuccess()) {
      const json = JSON.parse(xhr.responseText());
      this.initImageDict(json.uploadInitImage);
    } else {
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

  async uploadInitImageToS3() {
    //{ dataUrl, presigned }
    const initImageDict = this.initImageDict();
    const dataUrl = this.dataUrl();
    const presigned = { uploadUrl: initImageDict.uploadUrl, fields: initImageDict.fields };

    // presigned = { uploadUrl, fields } from POST /init-image
    // 1. Turn the data-URL into a Blob (raw bytes)
    const blob = await (await fetch(dataUrl)).blob();      // keeps correct MIME type
  
    // 2. Build the multipart/form-data payload
    const form = new FormData();
    Object.entries(presigned.fields).forEach(([k, v]) => form.append(k, v));
    form.append("file", blob);  // the part name must be "file"
  
    // 3. POST it to S3
    const res = await fetch(presigned.uploadUrl, { method: "POST", body: form });
    if (!res.ok) {
      this.setError(`S3 upload failed: ${res.status}`);
      this.setStatus("failed");
    } else {
      this.setStatus("complete");
    }
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