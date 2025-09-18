"use strict";

/**
 * @module library.services.HomeAssistant.Assistants
 */

/**
 * @class HomeAssistant
 * @extends SvSummaryNode
 * @classdesc Represents a Home Assistant connection and manages various Home Assistant related nodes.
 */
(class HomeAssistant extends SvSummaryNode {
  /**
   * Initialize the prototype slots for the HomeAssistant class.

   */
  initPrototypeSlots () {
    /**
     * @member {Array} regionOptions - Options for regions.
     */
    {
      const slot = this.newSlot("regionOptions", []);
      slot.setSlotType("Array");
    }

    /**
     * @member {string} protocol - The protocol used for connection (wss or ws).
     */
    {
      const slot = this.newSlot("protocol", "wss");
      slot.setInspectorPath("Settings")
      slot.setLabel("Protocol");
      slot.setShouldStoreSlot(true);
      slot.setSyncsToView(true);
      slot.setDuplicateOp("duplicate");
      slot.setSlotType("String");
      slot.setIsSubnodeField(true);
      slot.setValidValues(["wss", "ws"]);
    }

    /**
     * @member {string} host - The host for the HomeAssistant websocket server.
     */
    {
      const slot = this.newSlot("host", "localnode.ddns.net");
      slot.setInspectorPath("Settings")
      slot.setLabel("Host (HomeAssistant websocket server)");
      slot.setShouldStoreSlot(true);
      slot.setSyncsToView(true);
      slot.setDuplicateOp("duplicate");
      slot.setSlotType("String");
      slot.setIsSubnodeField(true);
    }

    /**
     * @member {number} port - The port number for the HomeAssistant websocket server.
     */
    {
      const slot = this.newSlot("port", 8124);
      slot.setInspectorPath("Settings")
      slot.setLabel("Port");
      slot.setShouldStoreSlot(true);
      slot.setSyncsToView(true);
      slot.setDuplicateOp("duplicate");
      slot.setSlotType("Number");
      slot.setIsSubnodeField(true);
    }

    /**
     * @member {string} url - The full URL for the HomeAssistant websocket server.
     */
    {
      const slot = this.newSlot("url", 8124);
      slot.setInspectorPath("Settings")
      slot.setLabel("Url");
      slot.setShouldStoreSlot(true);
      slot.setSyncsToView(true);
      slot.setDuplicateOp("duplicate");
      slot.setSlotType("String");
      slot.setIsSubnodeField(true);
      slot.setCanEditInspection(false);
      slot.setSummaryFormat("value");
    }

    /**
     * @member {string} accessToken - The access token for authentication.
     */
    {
      const slot = this.newSlot("accessToken", "");
      slot.setInspectorPath("Settings")
      slot.setLabel("Access Token");
      slot.setShouldStoreSlot(true);
      slot.setSyncsToView(true);
      slot.setDuplicateOp("duplicate");
      slot.setSlotType("String");
      slot.setIsSubnodeField(true);
    }

    /**
     * @member {string} status - The current status of the connection.
     */
    {
      const slot = this.newSlot("status", "");
      slot.setCanEditInspection(false);
      slot.setInspectorPath("")
      slot.setLabel("status");
      slot.setShouldStoreSlot(true);
      slot.setSyncsToView(true);
      slot.setDuplicateOp("duplicate");
      slot.setSlotType("String");
      slot.setIsSubnodeField(false);
    }

    /**
     * @member {string|null} error - Any error message.
     */
    {
      const slot = this.newSlot("error", null);
      slot.setCanEditInspection(false);
      slot.setInspectorPath("")
      slot.setLabel("error");
      slot.setShouldStoreSlot(false);
      slot.setSyncsToView(true);
      slot.setDuplicateOp("duplicate");
      slot.setSlotType("String");
    }

    /**
     * @member {boolean} hasAuth - Whether authentication has been successful.
     */
    {
      const slot = this.newSlot("hasAuth", false);
      slot.setCanEditInspection(false);
      slot.setInspectorPath("")
      slot.setLabel("has auth");
      slot.setShouldStoreSlot(false);
      slot.setSyncsToView(true);
      slot.setDuplicateOp("duplicate");
      slot.setSlotType("Boolean");
      slot.setIsSubnodeField(false);
    }

    /**
     * @member {HomeAssistantFolder|null} rootFolder - The root folder for HomeAssistant.
     */
    {
      const slot = this.newSlot("rootFolder", null)
      slot.setFinalInitProto(HomeAssistantFolder);
      slot.setShouldStoreSlot(false);
      slot.setIsSubnode(true);
    }

    const showNodes = false;

    /**
     * @member {HomeAssistantAreas|null} areasNode - Node for HomeAssistant areas.
     */
    {
      const slot = this.newSlot("areasNode", null)
      slot.setFinalInitProto(HomeAssistantAreas);
      slot.setShouldStoreSlot(false);
      slot.setIsSubnode(showNodes);
    }

    /**
     * @member {HomeAssistantDevices|null} devicesNode - Node for HomeAssistant devices.
     */
    {
      const slot = this.newSlot("devicesNode", null)
      slot.setFinalInitProto(HomeAssistantDevices);
      slot.setShouldStoreSlot(false);
      slot.setIsSubnode(showNodes);
    }

    /**
     * @member {HomeAssistantEntities|null} entitiesNode - Node for HomeAssistant entities.
     */
    {
      const slot = this.newSlot("entitiesNode", null)
      slot.setFinalInitProto(HomeAssistantEntities);
      slot.setShouldStoreSlot(false);
      slot.setIsSubnode(showNodes);
    }

    /**
     * @member {HomeAssistantStates|null} statesNode - Node for HomeAssistant states.
     */
    {
      const slot = this.newSlot("statesNode", null)
      slot.setFinalInitProto(HomeAssistantStates);
      slot.setShouldStoreSlot(false);
      slot.setIsSubnode(showNodes);
    }

    /**
     * @member {Action|null} toggleConnectAction - Action for toggling connection.
     */
    {
      const slot = this.newSlot("toggleConnectAction", null);
      slot.setLabel("Connect");
      slot.setSyncsToView(true);
      slot.setDuplicateOp("duplicate");
      slot.setSlotType("Action");
      slot.setIsSubnodeField(true);
      slot.setCanInspect(true)
      slot.setActionMethodName("connect");
    }

    /**
     * @member {WebSocket|null} socket - The WebSocket connection.
     */
    {
      const slot = this.newSlot("socket", null);
      slot.setSlotType("WebSocket");
    }

    /**
     * @member {number} sentMessageCount - Count of sent messages.
     */
    {
      const slot = this.newSlot("sentMessageCount", 0);
      slot.setSlotType("Number");
    }

    /**
     * @member {Map|null} messagePromises - Map of message promises.
     */
    {
      const slot = this.newSlot("messagePromises", null);
      slot.setSlotType("Map");
    }

    this.setShouldStore(true);
    this.setShouldStoreSubnodes(false);
  }

  /**
   * Initialize the HomeAssistant instance.

   */
  init () {
    super.init();
    this.setTitle("Home Assistant");
    this.setCanDelete(true);
    this.setMessagePromises(new Map());
  }

  /**
   * Get the subtitle for the HomeAssistant instance.

   * @returns {string} The subtitle.
   */
  subtitle () {
    return [this.url(), this.status()].join("\n");
  }
  
  /**
   * Perform final initialization.

   */
  finalInit () {
    super.finalInit();
    this.setCanDelete(true);
    this.updateUrl();
    this.setNodeCanEditTitle(true);
    this.setStatus("not connected");
    this.rootFolder().setTitle("regions");
    this.groups().forEach(group => group.setHomeAssistant(this));
  }

  /**
   * Handle updates to the host slot.

   */
  didUpdateSlotHost () {
    this.updateUrl()
  }

  /**
   * Handle updates to the port slot.

   */
  didUpdateSlotPort () {
    this.updateUrl()
  }

  /**
   * Compose the full URL.

   * @returns {string} The full URL.
   */
  composedUrl () {
    const url = this.protocol() + "://" + this.host() + ":" + this.port() + "/";
    return url;
  }

  /**
   * Update the URL.

   */
  updateUrl () {
    this.setUrl(this.composedUrl());
  }

  /**
   * Handle updates to the URL slot.

   */
  didUpdateSlotUrl () {
    //this.rescan();
  }

  /**
   * Check if the URL is valid.

   * @returns {boolean} True if the URL is valid, false otherwise.
   */
  hasValidUrl () {
    return this.host().length > 0 && this.port() >= 0;
  }

  /**
   * Toggle the connection state.

   */
  toggleConnect () {
    if (this.isConnected()) {
      this.disconnect();
    } else {
      this.connect();
    }
  }

  /**
   * Disconnect from the HomeAssistant server.

   */
  disconnect () {
    this.setStatus("disconnecting...");
    this.socket().close();
  }

  /**
   * Connect to the HomeAssistant server.

   */
  connect () {
    this.setStatus("connecting...");

    const socket = new WebSocket(this.url());
    this.setSocket(socket);

    socket.addEventListener('open',() => {
      this.onOpen();
    });

    socket.addEventListener('message', (event) => {
       this.onMessage(event);
    });

    socket.addEventListener('error', (error) => {
      this.onError(error);
    });

    socket.addEventListener('close', (event) => {
      this.onClose(event);
    });
  }

  /**
   * Check if connected to the HomeAssistant server.

   * @returns {boolean} True if connected, false otherwise.
   */
  isConnected () {
    return this.socket() !== null;
  }

  /**
   * Get information for the toggle connect action.

   * @returns {Object} Action information.
   */
  toggleConnectActionInfo () {
    return {
        isEnabled: true,
        title: this.isConnected() ? "Disconnect" : "Connect",
        subtitle: this.hasValidUrl() ? null : "Invalid Host URL",
        isVisible: true
    }
  }

  /**
   * Handle the close event of the WebSocket.

   * @param {Event} event - The close event.
   */
  onClose (event) {
    if (event.wasClean) {
      this.setStatus('unconnected');
    } else {
      this.setStatus('Connection died');
    }
    this.setSocket(null);
  }

  /**
   * Handle errors in the WebSocket connection.

   * @param {Error} error - The error object.
   */
  onError (error) {
    if (error.currentTarget.readyState === 3) {
      console.log("ERROR: unable to connect");
    }
    console.warn(this.typeId() + " " + this.wsUrl() + " onError:", error);
    this.setStatus("ERROR: " + error.message);
    error.rethrow();
  }

  /**
   * Get authentication from the HomeAssistant server.

   * @returns {Promise<boolean>} True if authentication was successful, false otherwise.
   */
  async getAuth () {
    const hasAuth = await this.asyncSendMessageDict({
      type: 'auth',
      access_token: this.accessToken()
    });

    if (!hasAuth) {
      this.setStatus("ERROR: invalid access token");
    } else {
      this.setStatus("access token accepted");
    }
    this.setHasAuth(hasAuth);
    return hasAuth;
  }

  /**
   * Handle the open event of the WebSocket.

   * @param {Event} event - The open event.
   */
  async onOpen (/*event*/) {
    this.setStatus("connected, authorizing...");
  }

  /**
   * Get all the group nodes.

   * @returns {Array} An array of group nodes.
   */
  groups () {
    return [ 
      this.areasNode(),
      this.devicesNode(),
      this.entitiesNode(),
      this.statesNode()
    ];
  }

  /**
   * Refresh all group nodes.

   */
  async refresh () {
    try {
      this.setStatus("refreshing objects...");

      await Promise.all(this.groups().map(group => group.asyncRefresh()));

      this.groups().forEach(group => group.completeSetup());

      this.setStatus("");
      this.didUpdateNode();
    } catch (error) {
      this.setError(error);
      throw error;
      //this.disconnect();
    }
  }

  /**
   * Generate a new message ID.

   * @returns {number} A new message ID.
   */
  newMessageId () {
    const count = this.sentMessageCount();
    this.setSentMessageCount(count + 1);
    return count;
  }

  /**
   * Send a message to the HomeAssistant server.

   * @param {Object} dict - The message to send.
   * @returns {Promise} A promise that resolves with the server's response.
   */
  asyncSendMessageDict (dict) {
    const promise = Promise.clone();
    let id = this.newMessageId();
    promise.beginTimeout(3000);

    if (dict["type"] !== "auth") {
      dict.id = id;
    } else {
      id = "auth";
    }
    this.messagePromises().set(id, promise);

    const s = JSON.stringify(dict);
    promise.setLabel("HomeAssistant request: " + s);
    console.log(this.svType() + " asyncSendMessageDict( " + s.clipWithEllipsis(40) + " )");
    this.socket().send(s);

    this.updateStatus();
    return promise;
  }

  /**
   * Update the status based on pending messages.

   */

  updateStatus () {
    if (this.messagePromises().size) {
      //const ids = Array.from(this.messagePromises().keys());
      //this.setStatus("awaiting " + this.messagePromises().size + " messages (" + JSON.stringify(ids) + ")");
      this.setStatus("awaiting " + this.messagePromises().size + " messages...");
    } else {
      if (this.socket()) {
        this.setStatus("connected");
      }
    }
  }

  /**
   * @async
   * @description Handle successful authentication.
   */
  async onAuthOk () {
    this.refresh();
  }

  /**
   * @async
   * @description Handle invalid authentication.
   */
  async onAuthInvalid () {
    this.disconnect();
  }

  /**
   * @description Pop a promise with the given ID.
   * @param {string} id - The ID of the promise to pop.
   * @returns {Promise} The promise with the given ID.
   */
  popPromiseWithId (id) {
    const promise = this.messagePromises().get(id);
    this.messagePromises().delete(id);
    return promise;
  }

  /**
   * @async
   * @description Handle incoming messages from the HomeAssistant server.
   * @param {MessageEvent} event - The message event.
   */
  async onMessage (event) {
    const message = JSON.parse(event.data);
    console.log(this.svType() + " onMessage( ", event.data.clipWithEllipsis(40) + " )");

    if (message.type === "auth_required") {
      await this.getAuth(); // response is handled with "auth" and "auth_invalid" message types
    } else if (message.type === 'auth_ok') {
      const promise = this.popPromiseWithId("auth");
      promise.callResolveFunc(true); // should this be before resolve?
      this.onAuthOk();
    } else if (message.type === 'auth_invalid') {
      const promise = this.popPromiseWithId("auth");
      promise.callResolveFunc(false); 
      this.onAuthInvalid(); // should this be before resolve/reject?
      //promise.callRejectFunc();
    } else if (message.type === 'result') {
      if (message.success === false) {
        this.setError(new Error(message.error.message));
        this.setStatus("ERROR: ", message.error.message);
      } else {
        const id = message.id;
        const result = message.result;
        const promise = this.popPromiseWithId(id);
        promise.callResolveFunc(result);
      }

    } else {
      console.warn(this.typeId() + " WARNING: unhandled message [[" + JSON.stringify(message, null, 2) + "]]");
    }
    this.updateStatus();
  }

  /**
   * @description Finish the scan process.
   */
  finsihScan () {
        /*
      this.devices().forEach(device => {
          // Find entities that belong to this device in the states
          const deviceEntityIds = this.states().filter(state => state.device_id === device.id).map(state => state.entity_id);
          const deviceEntities = this.entities().filter(entity => deviceEntityIds.includes(entity.entity_id));

          const entityStates = deviceEntities.map(entity => `${entity.entity_id.split('.')[1]}: ${entity.state}`).join(', ');

          const node = HomeAssistantDevice.clone();
          node.setJsonDict(device);
          node.setEntitiesJson(deviceEntities);

          node.setTitle(device.name);
          //node.setSubtitle(entityStates);
          this.devicesNode().addSubnode(node);

          deviceEntities.forEach(deviceEntity => {
            const sn = HomeAssistantEntity.clone();
            //sn.setTitle(deviceEntity.entity_id.before("."));
            sn.setTitle(deviceEntity.entity_id);
            sn.setSubtitle(deviceEntity.state);
            sn.setSummaryFormat("key value");
            node.addSubnode(sn);
          });
      });
      */


      //console.log("SHOW: ", s);
  }


  /**
   * Get the scan action info.

   * @returns {Object} The scan action info.
   */
  scanActionInfo () {
    return {
        isEnabled: this.hasValidUrl(),
        //title: this.title(),
        subtitle: this.hasValidUrl() ? null : "Invalid Host URL",
        isVisible: true
    }
  }

  /*
  areaWithId (id) {
    return this.areasNode().subnodeWithId(id);
  }

  deviceWithId (id) {
    return this.devicesNode().subnodeWithId(id);
  }

  entityWithId (id) {
    return this.entitiesNode().subnodeWithId(id);
  }

  stateWithId (id) {
    return this.statesNode().subnodeWithId(id);
  }
  */
  
}).initThisClass();

/*
function changeDeviceArea(deviceId, newAreaId) {
    const messageId = Math.floor(Math.random() * Number.MAX_SAFE_INTEGER);

    const updateAreaMessage = {
        id: messageId,
        type: 'config/device_registry/update',
        device_id: deviceId,
        area_id: newAreaId
    };

    socket.send(JSON.stringify(updateAreaMessage));
}
*/