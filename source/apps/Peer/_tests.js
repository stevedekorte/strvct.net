"use strict";

/*
console.log("--- test ---")

for(i = 0; i < 1000; i ++) {
	let s = ("x" + i)
	let h1 = s.sha256String()
	//console.log("calling String.prototype.sha256String this = " + typeof(s) + " '" + s + "'")
	//let shaBits = sjcl.hash.sha256.hash(s);
	//let h2 = sjcl.codec.hex.fromBits(shaBits);

	let h2 = bitcore.crypto.Hash.sha256(s.toBuffer()).toString('hex')
	
	console.log(s,  ":", h1 === h2)
}
*/

/*
App.runTests = function () {
	let PlainText = "hello world"
	
	let msg = { 
	}

	sha256 = {}
	sha256.hex = function(s)
	{
	    return SHA256(s);
	}
	
	//console.log("sha256.hex = ", sha256.hex)
	let bits = 1024 // 3072

	let knownRSAkey = cryptico.generateRSAKey("known", bits);
	let knownPublicKeyString = cryptico.publicKeyString(knownRSAkey);       
	
	// send from sam to matt 
	
	let receiverPassPhrase = "4329843289843098345909432987"; 
	let receiverRSAkey = cryptico.generateRSAKey(receiverPassPhrase, bits);
	let receiverPublicKeyString = cryptico.publicKeyString(receiverRSAkey);       

	let senderPassPhrase = "3094093288545334523098095248"; 
	let senderRSAkey = cryptico.generateRSAKey(senderPassPhrase, bits);
	
	msg.data = cryptico.encrypt(PlainText, receiverPublicKeyString, senderRSAkey).cipher; // signed
	let DecryptionResult = cryptico.decrypt(msg.data, receiverRSAkey);
	
	let hash = sha256.hex(msg.data)
	msg.signature = cryptico.encrypt(hash, knownPublicKeyString, senderRSAkey).cipher
	
	console.log("rsa test 1: DecryptionResult: ", DecryptionResult )
	console.log("rsa test 1: PlainText       : ", PlainText)
	console.log("msg = ", msg)

	// receive and verify
	
	let hash = sha256.hex(msg.data)
	let verifySig = cryptico.decrypt(msg.signature, knownRSAkey);
	let isVerified = (verifySig.plaintext === hash) && (verifySig.signature === "verified");
	console.log("verifySig: ", verifySig)
	console.log("     hash: ", msg.hash)
	console.log("   verify: ", isVerified)
	

	// ---- encrypt with pubkey --------------------------------------------

	let keys = ecc.generate(ecc.ENC_DEC);
	// => { dec: "192e35a51dc....", enc: "192037..." }
	console.log("keys = ", keys)
	let plaintext = "hello world!";
	let cipher = ecc.encrypt(keys.enc, plaintext);
	let result = ecc.decrypt(keys.dec, cipher);
	console.log("ecc encryption test 1: ", plaintext === result);
	// => truez

	// ---- encrypt with pubkey --------------------------------------------

	let cipher = ecc.encrypt(keys.dec, plaintext);
	let result = ecc.decrypt(keys.enc, cipher);
	console.log("ecc encryption test 2: ", plaintext === result);

	// ---- signature --------------------------------------------
	
	// Generate (or load) sign/verify keys 
	let keys = ecc.generate(ecc.SIG_VER);
	// => { dec: "192e35a51dc....", enc: "192037..." }
	
	
	// An important message
	let message = "hello world!";

	// Create digital signature
	let signature = ecc.sign(keys.sig, message);

	// Verify matches the text
	let result = ecc.verify(keys.ver, signature, message);

	console.log("ecc signature test 2: ", result); // => trues	
	
	
	let shaBits = sjcl.hash.sha256.hash("test");
    let shaHex = sjcl.codec.hex.fromBits(shaBits);
    assert(shaHex === "9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08")		        
    console.log("sjcl.hash.sha256 test passed")

}
*/

/*
console.log("------ BEGIN TESTS ------")

// generate keys, encrypt and decrypt message with signature 

//let bitcore = require('bitcore');

let bitcore = require('bitcore-lib');
let ECIES = require('bitcore-ecies');

let Buffer = bitcore.deps.Buffer;

let alicePrivateKey = new bitcore.PrivateKey();
let bobPrivateKey = new bitcore.PrivateKey();

let alice = ECIES().privateKey(alicePrivateKey).publicKey(bobPrivateKey.publicKey);

let message = 'some secret message';
let encryptedString = alice.encrypt(message).toString('base64')

console.log("encryptedString = ", encryptedString)

let encryptedBuffer = new Buffer(encryptedString, 'base64')


//let encrypted = new Buffer(JSON.parse(JSON.stringify(encrypted)))
// encrypted = new Buffer(encrypted)

console.log("encryptedBuffer = ", encryptedBuffer)


// encrypted will contain an encrypted buffer only Bob can decrypt

let bob = ECIES().privateKey(bobPrivateKey).publicKey(alicePrivateKey.publicKey);
let decrypted = bob.decrypt(encryptedBuffer).toString();

console.log("'" + decrypted + "' " + ((decrypted === message) ? "==" : "!=" ) + " '" + message + "'")

console.log("------ END TESTS ------")
*/

/*
let bitcore = require('bitcore-lib');
let ECIES = require('bitcore-ecies');
let Buffer = bitcore.Buffer;

let alicePrivateKey = new bitcore.PrivateKey();
let bobPrivateKey = new bitcore.PrivateKey();

let data = new Buffer('The is a raw data example');

// Encrypt data
let cypher1 = ECIES.privateKey(alicePrivateKey).publicKey(bobPrivateKey.publicKey);
let encrypted = cypher1.encrypt(data);

// Decrypt data
let cypher2 = ECIES.privateKey(bobPrivateKey).publicKey(alicePrivateKey.publicKey);
let decrypted = cypher2.decrypt(encrypted);

assert(data.toString(), decrypted.toString());
*/

/*
//netscape.security.PrivilegeManager.enablePrivilege('UniversalBrowserWrite');

window.requestFileSystem  = window.requestFileSystem || window.webkitRequestFileSystem;

window.requestFileSystem(
  PERSISTENT,        // persistent vs. temporary storage
  1024 * 1024,      // 1MB. Size (bytes) of needed space
  initFs,           // success callback
  opt_errorHandler  // opt. error callback, denial of access
);

function opt_errorHandler(e) {
  let msg = '';

  switch (e.code) {
    case FileError.QUOTA_EXCEEDED_ERR:
      msg = 'QUOTA_EXCEEDED_ERR';
      break;
    case FileError.NOT_FOUND_ERR:
      msg = 'NOT_FOUND_ERR';
      break;
    case FileError.SECURITY_ERR:
      msg = 'SECURITY_ERR';
      break;
    case FileError.INVALID_MODIFICATION_ERR:
      msg = 'INVALID_MODIFICATION_ERR';
      break;
    case FileError.INVALID_STATE_ERR:
      msg = 'INVALID_STATE_ERR';
      break;
    default:
      msg = 'Unknown Error';
      break;
  };

  console.log('>>>> Error: ' + msg);
}
function initFs(fs) {
	console.log(">>>> initFs ")
  	fs.root.getFile('logFile.txt', {create: true}, GetFileWriter, errorHandler);
}


function GetFileWriter (fileEntry) {
	
	console.log(">>>> GetFileWriter ")
	
    fileEntry.createWriter(function(writer) {  // FileWriter

		writer.onwrite = function(e) {
			console.log('>>>> Write completed.');
		};

		writer.onerror = function(e) {
			console.log('>>>>  Write failed: ' + e.toString());
		};

		let bb = new BlobBuilder();
		bb.append('Lorem ipsum');
		writer.write(bb.getBlob('text/plain'));
    })
}
*/


/*
let shaObj = new jsSHA("SHA-256", "TEXT");
shaObj.update("This is a test");
let hash = shaObj.getHash("HEX");
console.log("hash = [" + hash + "]")
*/

/*
function TestsRun () {
    // wait until an ECIES javascript library that works in the browser is available
    TestSHA();
    TestElGamalEncryptDecrypt();
    TestSig2();
    TestSerializedKeys();
}

function TestSHA () {
    let shaBits = sjcl.hash.sha256.hash("test");
    let shaHex = sjcl.codec.hex.fromBits(shaBits);
    assert(shaHex === "9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08")		        
    console.log("TestSHA passed")
}

function TestElGamalEncryptDecrypt () {
    let pair = sjcl.ecc.elGamal.generateKeys(256)
    let inputPlainText = "Hello World!"
    
    let cipherText = sjcl.encrypt(pair.pub, inputPlainText)
    let outputPlainText = sjcl.decrypt(pair.sec, cipherText)
    assert(outputPlainText === inputPlainText)		        
    //console.log("encryption test cipherText: [" + cipherText + "]")
    console.log("encryption test outputPlainText: [" + outputPlainText + "]")
    console.log("TestSig TestElGamalEncryptDecrypt")
}

function TestSig () {
    // Must be ECDSA!
    let pair = sjcl.ecc.ecdsa.generateKeys(256)
    let inputPlainText = "Hello World!"
    
    let sig = pair.sec.sign(sjcl.hash.sha256.hash(inputPlainText))
    // [ 799253862, -791427911, -170134622, ... ]

    let ok = pair.pub.verify(sjcl.hash.sha256.hash(inputPlainText), sig)
    // Either `true` or an error will be thrown.
    assert(ok === true)		        
    console.log("TestSig passed")
}

function TestSig2 () {
    // Must be ECDSA!
    let pair = sjcl.ecc.ecdsa.generateKeys(256)
    let inputPlainText = "Hello World!"
    let cipherText = sjcl.encrypt(pair.pub, inputPlainText)
    
    
    /*
    let sig = pair.sec.sign(sjcl.hash.sha256.hash(inputPlainText))
    // [ 799253862, -791427911, -170134622, ...

    let ok = pair.pub.verify(sjcl.hash.sha256.hash(inputPlainText), sig)
    // Either `true` or an error will be thrown.
    assert(ok === true)		        
    console.log("TestSig passed")
}


function TestSerializedKeys () {
    let pair = sjcl.ecc.elGamal.generateKeys(256);
    let pub = pair.pub.get();
    let sec = pair.sec.get();
    //let codec = sjcl.codec.z85;
    let codec = sjcl.codec.hex;
    
    // Serialized public key:
    let serializedPub = codec.fromBits(pub.x.concat(pub.y))
    console.log("serializedPub: [" + serializedPub + "]")
    
    // Unserialized public key:
    let unserializedPub = new sjcl.ecc.elGamal.publicKey(
        sjcl.ecc.curves.c256, 
        codec.toBits(serializedPub)
    )
    console.log("unserializedPub: [", unserializedPub, "]")
    //assert( unserializedPub.equals(pub) )         

    // Serialized private key:
    let serializedSec = codec.fromBits(sec)
    console.log("serializedSec: [" + serializedSec + "]")

    // Unserialized private key:
    let unserializedSec = new sjcl.ecc.elGamal.secretKey(
        sjcl.ecc.curves.c256,
        sjcl.ecc.curves.c256.field.fromBits(codec.toBits(serializedSec))
    )
    console.log("unserializedSec: [", unserializedSec, "]")
    //assert( unserializedSec.equals(sec) )         
}

console.log("--- test end ---")
*/

