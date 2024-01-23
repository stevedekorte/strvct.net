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
      const slot = this.newSlot("devicesNode", null)
      slot.setFinalInitProto(HomeAssistantDevices);
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
      this.finsihScan();
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

  finsihScan () {
      this.devicesNode().setDevicesJson(this.devices());
      console.log("this.devices()[20]:", JSON.stringify(this.devices()[0], 2, 2));
      console.log("this.entityRegistry()[20]:", JSON.stringify(this.entityRegistry()[0], 2, 2));
      console.log("this.entities()[20]:", JSON.stringify(this.entities()[0], 2, 2));

      /*

      Example device:

      {
        "area_id": null,
        "configuration_url": null,
        "config_entries": [
          "a8bc13c525dbdcf6e0bbcd6b8693dadc"
        ],
        "connections": [],
        "disabled_by": null,
        "entry_type": "service",
        "hw_version": null,
        "id": "6cdcb91bb251ccd6ba6828d4b56c761b",
        "identifiers": [
          [
            "sun",
            "a8bc13c525dbdcf6e0bbcd6b8693dadc"
          ]
        ],
        "manufacturer": null,
        "model": null,
        "name_by_user": null,
        "name": "Sun",
        "serial_number": null,
        "sw_version": null,
        "via_device_id": null
      }

      Example entity:

      {
        "entity_id": "person.steve",
        "state": "unknown",
        "attributes": {
          "editable": true,
          "id": "steve",
          "user_id": "e55ca8faae12472898941e6eb8802489",
          "device_trackers": [],
          "friendly_name": "Steve"
        },
        "last_changed": "2024-01-17T18:51:50.916677+00:00",
        "last_updated": "2024-01-17T18:52:28.382201+00:00",
        "context": {
          "id": "01HMCC90TY0NRN93F72KV1QEAX",
          "parent_id": null,
          "user_id": null
        }
      }


      example entityRegistry:
      {
        "area_id": null,
        "config_entry_id": "78a7a47f8151214520d5107adc398354",
        "device_id": "0d0e73b442b43c01d43cf1c308121817",
        "disabled_by": null,
        "entity_category": null,
        "entity_id": "remote.living_room_2",
        "has_entity_name": true,
        "hidden_by": null,
        "icon": null,
        "id": "b3c5634b2c480bccb319d77b0a175040",
        "name": null,
        "options": {
          "conversation": {
            "should_expose": false
          }
        },
        "original_name": null,
        "platform": "apple_tv",
        "translation_key": null,
        "unique_id": "D4:A3:3D:67:77:BF"
      },
      */

      /*
      this.devices().forEach(deviceJson => {
        const node = HomeAssistantDevice.clone();
        node.setJsonDict(deviceJson);
        //node.setEntitiesJson(deviceEntities);

      });
*/
        /*
      this.devices().forEach(device => {
          // Find entities that belong to this device in the entity registry
          const deviceEntityIds = this.entityRegistry().filter(er => er.device_id === device.id).map(er => er.entity_id);
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

  
}).initThisClass();
