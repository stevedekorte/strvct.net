"use strict";

/* 
    CryptoIdentity

    - generate and serialize/deserialize a key pair
    - sign a byteArray (using private key)
    - verify a byteArray (for a given public key)
    - provide a serialized version of the public key

*/

(class CryptoIdentity extends Base {
  initPrototypeSlots() {
    this.newSlot("keyPair", null);
    this.newSlot("algorithm", {
      name: "ECDSA",
      namedCurve: "P-256",
      hash: { 
        name: "SHA-256" 
      },
    });
    this.newSlot("serializatonFormat", "jwk");
    this.newSlot("keyUsages", ["sign", "verify"]);
    this.newSlot("extractable", true);
    this.newSlot("serializedPublicKey", null);
    this.newSlot("asJson", null);
  }

  init() {
    super.init();
    this.setIsDebugging(true);
  }

  async asyncUpdate() {
    await this.asyncUpdateAsJson();
    await this.asyncUpdateSerializedPublicKey();
  }

  async asyncSetKeyPair(keyPair) {
    this._keyPair = keyPair;
    await this.asyncUpdate();
    return this;
  }

  async asyncUpdateSerializedPublicKey() {
    this.setSerializedPublicKey(await this.calcPublicKeyAsString());
    return this;
  }

  async calcPublicKeyAsString() {
    const json = await window.crypto.subtle.exportKey(
      this.serializatonFormat(),
      this.keyPair().publicKey
    );
    // not sure what's safe as a seperator
    const string = json.x + " " + json.y;
    const encoded = string.stringToBase32Hex()
    return encoded;
  }

  async asyncGenerate() {
    // Generate a public/private key pair using the RSASSA-PKCS1-v1_5 algorithm
    const keyPair = await window.crypto.subtle.generateKey(
      this.algorithm(),
      this.extractable(),
      this.keyUsages()
    );
    await this.asyncSetKeyPair(keyPair);
    this.debugLog(
      "generated pubkey string: ",
      await this.calcPublicKeyAsString()
    );
    return this;
  }

  /*
  async deserializePubKey(base32SerializedPublicKey) {
    const serializedPublicKey = base32SerializedPublicKey.base32HexToArrayBuffer();
    const publicKey = await window.crypto.subtle.importKey(
      this.serializatonFormat(),
      serializedPublicKey,
      this.algorithm(),
      this.extractable(),
      ["verify"]
    );
    return publicKey;
  }
  */

  async asyncUpdateAsJson() {
    const publicKey = await window.crypto.subtle.exportKey(
      this.serializatonFormat(),
      this.keyPair().publicKey
    );

    const privateKey = await window.crypto.subtle.exportKey(
      this.serializatonFormat(),
      this.keyPair().privateKey
    );

    const json = {
      serializatonFormat: this.serializatonFormat(),
      publicKey: publicKey,
      privateKey: privateKey,
      algorithm: this.algorithm(),
      keyUsages: this.keyUsages(),
      extractable: this.extractable(),
    };
    this.setAsJson(json);
  }

  static async asyncNewFromJson(json) {
    const cid = CryptoIdentity.clone();
    await cid.asyncFromJson(json);
    return cid;
  }

  async asyncFromJson(json) {
    this.setSerializatonFormat(json.serializatonFormat);
    this.setAlgorithm(json.algorithm);
    this.setExtractable(json.extractable);
    this.setKeyUsages(json.keyUsages);
    let keyPair;

    try {
      const publicKey = await window.crypto.subtle.importKey(
        json.serializatonFormat,
        json.publicKey,
        json.algorithm,
        json.extractable,
        ["verify"]
      );

      const privateKey = await window.crypto.subtle.importKey(
        json.serializatonFormat,
        json.privateKey,
        json.algorithm,
        json.extractable,
        ["sign"]
      );

      keyPair = { 
        publicKey: publicKey, 
        privateKey: privateKey 
      };
  
    } catch (e) {
      console.warn(e);
      debugger;
    }
    await this.asyncSetKeyPair(keyPair);
    return this;
  }

  static async asyncSelfTest() {
    const cid1 = CryptoIdentity.clone();

    await cid1.asyncGenerate();
    console.log("generated pubkey:", cid1.serializedPublicKey());

    const json = cid1.asJson();
    console.log("serialized:", json);

    const cid2 = await CryptoIdentity.clone().asyncFromJson(json);
    console.log("unserialized pubkey:", cid2.serializedPublicKey());
    debugger;
  }

  // --- sign and verify byteArray ---

  async signatureForByteArray(byteArray) {
    const signature = await window.crypto.subtle.sign(
      this.algorithm(),
      this.keyPair().privateKey,
      byteArray
    );
    return signature; // returns an ArrayBuffer
    //return new Uint8Array(signature);
  }

  async validateSignatureForPubKeyOnByteArray(signatureArrayBuffer, publicKey, byteArray) {
    const isValid = await window.crypto.subtle.verify(
      this.algorithm(),
      publicKey,
      signatureArrayBuffer,
      byteArray
    );
    return isValid;
  }

  // --- sign and verify json ---

  async signJson(json) { 
    assert(json);
    // _signature dict for the stable version of the json
    const byteArray = JSON.stableStringify(json).stringToUint8Array();
    const sigByteArray = await this.signatureForByteArray(byteArray);
    json._signature = {
      pubkey: this.asJson().publicKey,
      sig: sigByteArray.toBase64EncodedString(),
    };
    return json
  }

  async verifySignatureOnJson(inJson) { // returns undefined if invalid signature
    const json = Object.assign(inJson); // shallow copy
    const signature = json._signature;

    try {
      assert(signature);
      assert(signature.pubkey);    
      assert(signature.sig);
    } catch (error) {
      return false;
    }

    delete json._signature; // remove the signature and get a stable stringified byte array
    const byteArray = JSON.stableStringify(json).stringToUint8Array();

    const publicKey = await window.crypto.subtle.importKey(
      this.serializatonFormat(),
      signature.pubkey,
      this.algorithm(),
      this.extractable(),
      ["verify"]
    );

    const isValid = this.validateSignatureForPubKeyOnByteArray(
      signature.sig.base64ToArrayBuffer(),
      publicKey, 
      byteArray
    );
    return isValid;
  }

}).initThisClass();

//CryptoIdentity.asyncSelfTest();

/*

  Example signature use:

  await LocalUser.shared().cryptoId().signJson(json);
  const isValid = await LocalUser.shared().cryptoId().verifySignatureOnJson(json);

*/
