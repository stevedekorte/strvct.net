"use strict";

/* 
    HomeAssistant

*/

(class HomeAssistant extends BMStorableNode {
  initPrototypeSlots() {
    this.newSlot("regionOptions", []);

    {
      const slot = this.newSlot("longLivedToken", null);
      //slot.setInspectorPath("")
      slot.setLabel("Long Lived Token");
      slot.setShouldStoreSlot(true);
      slot.setSyncsToView(true);
      slot.setDuplicateOp("duplicate");
      slot.setSlotType("String");
      slot.setIsSubnodeField(true);
    }

    {
      //const slot = this.newSlot("host", "umbrel.local");
      const slot = this.newSlot("host", "localhost");
      //slot.setInspectorPath("")
      slot.setLabel("Host");
      slot.setShouldStoreSlot(true);
      slot.setSyncsToView(true);
      slot.setDuplicateOp("duplicate");
      slot.setSlotType("String");
      slot.setIsSubnodeField(true);
    }

    {
      //const slot = this.newSlot("port", 8123);
      const slot = this.newSlot("port", 8080);
      //slot.setInspectorPath("")
      slot.setLabel("Host");
      slot.setShouldStoreSlot(true);
      slot.setSyncsToView(true);
      slot.setDuplicateOp("duplicate");
      slot.setSlotType("Number");
      slot.setIsSubnodeField(true);
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
    this.setMessagePromises(new Set());
    this.setDevices([]);
    this.setEntities([]);
    this.setEntityRegistry([]);
  }

  subtitle () {
    return this.host();
  }
  
  finalInit () {
    super.finalInit();
    //this.scan();
  }

  wsUrl () {
    //return "wss://" + this.host() + ":" + this.port() + "/api/websocket";
    return "wss://" + this.host() + ":" + this.port() + "/";
  }

  didUpdateSlotHost () {

  }

  didUpdateSlotPort () {

  }

  didUpdateUrl () {

  }

  scan () {
    const socket = new WebSocket(this.wsUrl());
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
      debugger;
      await this.asyncSendMessageDict({
        type: 'auth',
        access_token: this.longLivedToken()
      });

      this.setEntityStates(await this.asyncGetStates());
      this.setDevices(await this.asyncDeviceRegistry());
      this.setEntiryRegistry(await this.asyncEntityRegistry());
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
    const id = this.newMessageId();
    this.messagePromises().put(id, promise);

    dict.id = id;
    socket.send(JSON.stringify(dict));
    return promise;
  }

  onMessage (event) {
    const message = JSON.parse(event.data);

    // Check for auth OK
    if(message.type==='auth_ok') {
      this.onAuthOkMessage(event);
    }

    if (message.type==='result') {
      const id = message.id;
      const result = message.result;
      const promise = this.messagePromises().at(id);
      promise.callResolveFunc(result);
    } else {
      console.warn(this.typeId() + " WARNING: unhandled message [[" + JSON.stringify(message, 2, 2) + "]]");
    }
  }

  show () {
      const s = "";

      this.devices().forEach(device => {
          // Find entities that belong to this device in the entity registry
          const deviceEntityIds = this.entityRegistry().filter(er => er.device_id===device.id).map(er => er.entity_id);
          const deviceEntities = this.entities().filter(entity => deviceEntityIds.includes(entity.entity_id));

          const entityStates = deviceEntities.map(entity => `${entity.entity_id.split('.')[1]}: ${entity.state}`).join(', ');

          s += `<strong>${device.name}</strong> (${entityStates||'No entities found'})`;
      });

      console.log("SHOW: ", s);
  }
  
}).initThisClass();
