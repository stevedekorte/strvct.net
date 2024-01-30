"use strict";

/* 
    HomeAssistant

*/

(class HomeAssistant extends BMSummaryNode {
  initPrototypeSlots() {
    this.newSlot("regionOptions", []);

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

    {
      //const slot = this.newSlot("host", "umbrel.local");
      const slot = this.newSlot("host", "localnode.ddns.net");
      slot.setInspectorPath("Settings")
      slot.setLabel("Host (HomeAssistant websocket server)");
      slot.setShouldStoreSlot(true);
      slot.setSyncsToView(true);
      slot.setDuplicateOp("duplicate");
      slot.setSlotType("String");
      slot.setIsSubnodeField(true);
    }

    {
      //const slot = this.newSlot("port", 8123);
      const slot = this.newSlot("port", 8124);
      slot.setInspectorPath("Settings")
      slot.setLabel("Port");
      slot.setShouldStoreSlot(true);
      slot.setSyncsToView(true);
      slot.setDuplicateOp("duplicate");
      slot.setSlotType("Number");
      slot.setIsSubnodeField(true);
    }

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

    {
      const slot = this.newSlot("error", null);
      slot.setCanEditInspection(false);
      slot.setInspectorPath("")
      slot.setLabel("error");
      slot.setShouldStoreSlot(true);
      slot.setSyncsToView(true);
      slot.setDuplicateOp("duplicate");
      slot.setSlotType("String");
      //slot.setIsSubnodeField(true);
    }

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


    {
      const slot = this.newSlot("rootFolder", null)
      slot.setFinalInitProto(HomeAssistantFolder);
      slot.setShouldStoreSlot(false);
      slot.setIsSubnode(true);
    }

    const showNodes = false;

    {
      const slot = this.newSlot("areasNode", null)
      slot.setFinalInitProto(HomeAssistantAreas);
      slot.setShouldStoreSlot(false);
      slot.setIsSubnode(showNodes);
    }

    {
      const slot = this.newSlot("devicesNode", null)
      slot.setFinalInitProto(HomeAssistantDevices);
      slot.setShouldStoreSlot(false);
      slot.setIsSubnode(showNodes);
    }

    {
      const slot = this.newSlot("entitiesNode", null)
      slot.setFinalInitProto(HomeAssistantEntities);
      slot.setShouldStoreSlot(false);
      slot.setIsSubnode(showNodes);
    }

    {
      const slot = this.newSlot("statesNode", null)
      slot.setFinalInitProto(HomeAssistantStates);
      slot.setShouldStoreSlot(false);
      slot.setIsSubnode(showNodes);
    }


    {
      const slot = this.newSlot("toggleConnectAction", null);
      //slot.setInspectorPath("Character");
      slot.setLabel("Connect");
      slot.setSyncsToView(true);
      slot.setDuplicateOp("duplicate");
      slot.setSlotType("Action");
      slot.setIsSubnodeField(true);
      slot.setCanInspect(true)
      slot.setActionMethodName("connect");
    }

    {
      const slot = this.newSlot("socket", null);
    }

    {
      const slot = this.newSlot("sentMessageCount", 0);
    }

    {
      const slot = this.newSlot("messagePromises", null);
    }

    this.setShouldStore(true);
    this.setShouldStoreSubnodes(false);
  }

  init() {
    super.init();
    this.setTitle("Home Assistant");
    this.setCanDelete(true);
    this.setMessagePromises(new Map());
  }

  subtitle () {
    return [this.url(), this.status()].join("\n");
  }
  
  finalInit () {
    super.finalInit();
    this.setCanDelete(true);
    this.updateUrl();
    this.setNodeCanEditTitle(true);
    this.setStatus("not connected");
    this.rootFolder().setTitle("regions");
    this.groups().forEach(group => group.setHomeAssistant(this));
  }

  didUpdateSlotHost () {
    this.updateUrl()
  }

  didUpdateSlotPort () {
    this.updateUrl()
  }

  composedUrl () {
    const url = this.protocol() + "://" + this.host() + ":" + this.port() + "/";
    return url;
  }

  updateUrl () {
    this.setUrl(this.composedUrl());
  }

  didUpdateSlotUrl () {
    //this.rescan();
  }

  hasValidUrl () {
    return this.host().length > 0 && this.port() >= 0;
  }

  toggleConnect () {
    if (this.isConnected()) {
      this.disconnect();
    } else {
      this.connect();
    }
  }

  disconnect () {
    this.setStatus("disconnecting...");
    this.socket().close();
    //this.setSocket(null); // needed?
  }

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

  isConnected () {
    return this.socket() !== null;
  }

  toggleConnectActionInfo () {
    return {
        isEnabled: true,
        title: this.isConnected() ? "Disconnect" : "Connect",
        subtitle: this.hasValidUrl() ? null : "Invalid Host URL",
        isVisible: true
    }
  }

  onClose (event) {
    if (event.wasClean) {
      //console.log(`Connection closed cleanly, code=${event.code}, reason=${event.reason}`);
      this.setStatus('unconnected');
    } else {
      this.setStatus('Connection died');
    }
    this.setSocket(null);
  }

  onError (error) {
    if (error.currentTarget.readyState === 3) {
      console.log("ERROR: unable to connect");
    }
    console.warn(this.typeId() + " " + this.wsUrl() + " onError:", error);
    this.setStatus("ERROR: " + error.message);
    throw error;
  }

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

  async onOpen (event) {
    this.setStatus("connected, authorizing...");
    // await  onMessage message.type === "auth_required"
  }

  groups () {
    return [ 
      this.areasNode(),
      this.devicesNode(),
      this.entitiesNode(),
      this.statesNode()
    ];
  }

  async refresh () {
    try {
      //debugger;
      // fetch the JSON and setup objects
      this.setStatus("refreshing objects...");

      await Promise.all(this.groups().map(group => group.asyncRefresh()));

      this.groups().forEach(group => group.completeSetup());

      this.setStatus("");
      this.didUpdateNode();
    } catch (error) {
      this.setError(error);
      throw error;
      this.disconnect();
    }
  }

  /*
  // change device areaId
  const updateAreaMessage = {
    id: messageId,
    type: 'config/device_registry/update',
    device_id: deviceId,
    area_id: newAreaId
  };

  // change entity name
    const updateEntityMessage = {
        id: messageId,
        type: 'config/entity_registry/update',
        entity_id: entityId,
        name: newFriendlyName
    };
*/

/*

  asyncAreaRegistry () {
    return this.asyncSendMessageDict({ type: 'config/area_registry/list' });
  }

  asyncEntityRegistry () {
    return this.asyncSendMessageDict({ type: 'config/entity_registry/list'});
  }

  asyncDeviceRegistry () {
    return this.asyncSendMessageDict({ type: 'config/device_registry/list'});
  }

  asyncGetStates () {
    return this.asyncSendMessageDict({ type: 'get_states'});
  }
  */

  newMessageId () {
    const count = this.sentMessageCount();
    this.setSentMessageCount(count + 1);
    return count;
  }

  asyncSendMessageDict (dict) {
    // we will add the id to the dict
    const promise = Promise.clone();
    let id = this.newMessageId();
    promise.beginTimeout(3000); // auth request and response aren't numbered

    if (dict["type"] !== "auth") {
      dict.id = id;
      //promise.beginTimeout(3000); // auth request and response aren't numbered
    } else {
      id = "auth";
    }
    this.messagePromises().set(id, promise);

    const s = JSON.stringify(dict);
    promise.setLabel("HomeAssistant request: " + s);
    console.log(this.type() + " asyncSendMessageDict( " + s.clipWithEllipsis(40) + " )");
    this.socket().send(s);

    this.updateStatus();
    return promise;
  }

  updateStatus () {
    if (this.messagePromises().size) {
      const ids = Array.from(this.messagePromises().keys());
      //this.setStatus("awaiting " + this.messagePromises().size + " messages (" + JSON.stringify(ids) + ")");
      this.setStatus("awaiting " + this.messagePromises().size + " messages...");
    } else {
      if (this.socket()) {
        this.setStatus("connected");
      }
    }
  }

  async onAuthOk () {
    this.refresh();
  }

  async onAuthInvalid () {
    this.disconnect();
  }

  popPromiseWithId (id) {
    const promise = this.messagePromises().get(id);
    this.messagePromises().delete(id);
    return promise;
  }

  async onMessage (event) {
    const message = JSON.parse(event.data);
    console.log(this.type() + " onMessage( ", event.data.clipWithEllipsis(40) + " )");

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
      console.warn(this.typeId() + " WARNING: unhandled message [[" + JSON.stringify(message, 2, 2) + "]]");
    }
    this.updateStatus();
  }

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