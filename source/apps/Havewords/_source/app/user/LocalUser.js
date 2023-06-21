"use strict";

/* 
    LocalUser

*/

(class LocalUser extends Base {
  initPrototypeSlots() {
    this.newSlot("cryptoId", null);
    this.newSlot("nickname", null);
    this.newSlot("avatar", null);
    this.newSlot("data", null);
  }

  init() {
    super.init();
    this.setCryptoId(CryptoIdentity.clone());
    this.setIsDebugging(false);
  }

  setNickname(aString) {
    this._nickname = aString;
    this.save();
    return this;
  }

  setAvatar(aString) {
    this._avatar = aString;
    this.save();
    return this;
  }

  setData(json) {
    this._data = json;
    this.save();
    return this;
  }

  async asyncSetup() {
    //this.clear()
    // load from localStorage or generate if not found
    const didLoad = await this.asyncLoad();
    if (!didLoad) {
      await this.cryptoId().asyncGenerate();
      this.save();
    }

    if (!this.nickname()) {
      this.setNickname(Nickname.generateNickname());
    }

    this.debugLog(this.description());
    return this;
  }

  id() {
    return this.cryptoId().serializedPublicKey();
  }

  shortId() {
    return this.id().slice(1, 6) + "...";
  }

  description() {
    return this.type() + " id:" + this.shortId() + " nickname:" + this.nickname();
  }

  // --- json ---

  asPlayerJson () {
    return {
      id: this.id(),
      nickname: this.nickname(),
      avatar: this.avatar(),
      data: this.data(),
    }
  }

  asJson() {
    return {
      cryptoId: this.cryptoId().asJson(),
      nickname: this.nickname(),
      avatar: this.avatar(),
      data: this.data(),
    };
  }

  async asyncFromJson(json) {
    this._nickname = json.nickname;
    this._avatar = json.avatar;
    this._data = json.data;
    await this.cryptoId().asyncFromJson(json.cryptoId);
    return this;
  }

  // --- save /load ---

  localStorageKey() {
    return "localUser";
  }

  save() {
    const data = JSON.stringify(this.asJson());
    localStorage.setItem(this.localStorageKey(), data);
    return this;
  }

  async asyncLoad() {
    const data = localStorage.getItem(this.localStorageKey());
    if (data) {
      const json = JSON.parse(data);
      await this.asyncFromJson(json);
      return true;
    }
    return false;
  }

  clear() {
    localStorage.removeItem(this.localStorageKey());
  }

  // --- sends ---

  /*
  sendChatMessage(message) {
    const m = GroupChatDataMessage.clone();
    m.setId(this.id());
    m.setNickname(this.nickname());
    m.setMessage(message);
    m.send();
    return this;
  }

  avatarUpdateMessageJson() {
    return {
      type: "avatarUpdate",
      id: this.id(),
      nickname: this.nickname(),
      avatar: this.avatar(),
    };
  }

  shareAvatar () {
    const json = this.avatarUpdateMessageJson();
    if (App.shared().isHost()) {
      HostSession.shared().broadcast(json);
    } else {
      GuestSession.shared().send(json);
    }
  }
  */
}).initThisClass();
