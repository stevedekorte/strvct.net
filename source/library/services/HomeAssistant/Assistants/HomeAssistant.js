"use strict";

/* 
    HomeAssistant

*/

(class HomeAssistant extends BMStorableNode {
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
      const slot = this.newSlot("accessToken", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJmMTg2MzJiNDRhMDg0N2M0OTc2NzNhN2JkMmE2M2Y2NyIsImlhdCI6MTcwNTUxNTEwMSwiZXhwIjoyMDIwODc1MTAxfQ.BLXypYTQNzhKEZV7bKqsE30_2wNPIntRvfRKNtxKMmw");
      slot.setInspectorPath("Settings")
      slot.setLabel("Access Token");
      slot.setShouldStoreSlot(true);
      slot.setSyncsToView(true);
      slot.setDuplicateOp("duplicate");
      slot.setSlotType("String");
      slot.setIsSubnodeField(true);
    }

    {
      const slot = this.newSlot("devicesNode", null)
      slot.setFinalInitProto(BMSummaryNode);
      slot.setShouldStoreSlot(false);
      slot.setIsSubnode(true);
    }


    {
      const slot = this.newSlot("scanAction", null);
      //slot.setInspectorPath("Character");
      slot.setLabel("Scan");
      slot.setSyncsToView(true);
      slot.setDuplicateOp("duplicate");
      slot.setSlotType("Action");
      slot.setIsSubnodeField(true);
      slot.setCanInspect(true)
      slot.setActionMethodName("scan");
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

    {
      const slot = this.newSlot("devices", null);
    }

    {
      const slot = this.newSlot("entities", null);
    }

    {
      const slot = this.newSlot("entityRegistry", null);
    }

    this.setShouldStore(true);
    this.setShouldStoreSubnodes(false);
  }

  init() {
    super.init();
    this.setTitle("Home Assistant");
    this.setCanDelete(true);
    this.setMessagePromises(new Map());
    this.setDevices([]);
    this.setEntities([]);
    this.setEntityRegistry([]);
  }

  subtitle () {
    return this.url();
  }
  
  finalInit () {
    super.finalInit();
    this.setCanDelete(true);
    this.updateUrl();
    this.setNodeCanEditTitle(true);

    this.devicesNode().setTitle("Devices");
    this.devicesNode().setNoteIsSubnodeCount(true);
    this.devicesNode().makeSortSubnodesByTitle();

    //this.scan();
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

  scan () {
    const socket = new WebSocket(this.url());
    this.setSocket(socket);

    socket.addEventListener('open',() => {
      this.onOpen();
    });

    socket.addEventListener('message',(event) => {
       this.onMessage(event);
    });

    socket.addEventListener('error',(error) => {
      this.onError(error);
    });

    // close?
  }

  onError (error) {
    if (error.currentTarget.readyState === 3) {
      console.log("ERROR: unable to connect");
    }
    console.warn(this.typeId() + " " + this.wsUrl() + " onError:", error);
    throw error;
  }

  async onOpen (event) {
      // Authenticate when connection is open
      //debugger;
      await this.asyncSendMessageDict({
        type: 'auth',
        access_token: this.accessToken()
      });

      this.setEntities(await this.asyncGetStates());
      this.setDevices(await this.asyncDeviceRegistry());
      this.setEntityRegistry(await this.asyncEntityRegistry());
      this.show();
  }

  asyncGetStates () {
    return this.asyncSendMessageDict({type: 'get_states'});
  }

  asyncDeviceRegistry () {
    return this.asyncSendMessageDict({type: 'config/device_registry/list'});
  }

  asyncEntityRegistry () {
    return this.asyncSendMessageDict({type: 'config/entity_registry/list'});
  }

  newMessageId () {
    const count = this.sentMessageCount();
    this.setSentMessageCount(count + 1);
    return count;
  }

  asyncSendMessageDict (dict) {
    // we will add the id to the dict
    const promise = Promise.clone();
    let id = this.newMessageId();

    if (dict["type"] !== "auth") {
      dict.id = id;
    } else {
      id = "auth";
    }
    this.messagePromises().set(id, promise);

    const s = JSON.stringify(dict);
    console.log(this.typeId() + " asyncSendMessageDict(" + s + ")");
    this.socket().send(s);
    return promise;
  }

  popPromiseWithId (id) {
    const promise = this.messagePromises().get(id);
    this.messagePromises().delete(id);
    return promise;
  }

  onMessage (event) {
    const message = JSON.parse(event.data);

    // Check for auth OK
    if(message.type === 'auth_ok') {
      const promise = this.popPromiseWithId("auth");
      promise.callResolveFunc(true);
    } else if(message.type === 'auth_invalid') {
      const promise = this.popPromiseWithId("auth");
      promise.callResolveFunc(false);
    } else if (message.type === 'result') {
      const id = message.id;
      const result = message.result;
      const promise = this.popPromiseWithId(id);
      promise.callResolveFunc(result);
    } else {
      console.warn(this.typeId() + " WARNING: unhandled message [[" + JSON.stringify(message, 2, 2) + "]]");
    }
  }

  show () {
      let s = "";

      this.devices().forEach(device => {
          // Find entities that belong to this device in the entity registry
          const deviceEntityIds = this.entityRegistry().filter(er => er.device_id===device.id).map(er => er.entity_id);
          const deviceEntities = this.entities().filter(entity => deviceEntityIds.includes(entity.entity_id));

          const entityStates = deviceEntities.map(entity => `${entity.entity_id.split('.')[1]}: ${entity.state}`).join(', ');

          //s += device.name + " " + (entityStates || '') + "\n";
          //const node = BMFieldTile.clone();
          const node = BMSummaryNode.clone();
          node.setTitle(device.name);
          //node.setSubtitle(entityStates);
          node.setNodeSubtitleIsChildrenSummary(true);
          this.devicesNode().addSubnode(node);

          deviceEntities.forEach(deviceEntity => {
            const sn = BMSummaryNode.clone();
            //sn.setTitle(deviceEntity.entity_id.before("."));
            sn.setTitle(deviceEntity.entity_id);
            sn.setSubtitle(deviceEntity.state);
            sn.setSummaryFormat("key value");
            node.addSubnode(sn);
          });
      });


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

  
}).initThisClass();
