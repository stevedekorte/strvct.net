"use strict";

/**
 * @module library.services.Firebase
 */

/**
 * @class FirebaseStorageService
 * @extends AiService
 * @classdesc Service for Firebase Storage integration via AccountServer
 * 
 * This service coordinates with the AccountServer to get signed upload URLs,
 * allowing secure uploads to Firebase Storage without exposing credentials.
 * 
 * Security model:
 * - Client requests signed URL from AccountServer (authenticated)
 * - AccountServer generates time-limited upload URL using Firebase Admin SDK
 * - Client uploads directly to Firebase using signed URL
 * - No Firebase credentials exposed to client
 */
(class FirestoreDatabaseService extends SvSummaryNode {
    
    /**
     * @static
     * @description Initializes the class and sets it as a singleton.
     * @category Initialization
     */
    static initClass () {
        this.setIsSingleton(true);
    }

    initPrototypeSlots () {
        {
            const slot = this.newSlot("documents", null);
            slot.setFinalInitProto(FirestoreDocuments);
            slot.setIsSubnodeField(true);
            slot.setShouldStoreSlot(true);
            slot.setSyncsToView(true);
        }
    }

    initPrototype () {
        this.setTitle("Firestore Database");
        this.setSubtitle("document database");
        this.setShouldStoreSubnodes(false);
    }

    static preClone () {
        const obj = super.preClone();
        console.log("----------- " + obj.svTypeId() + " [after preClone] ");
        
        return obj;
    }

    static clone () {
        const obj = super.clone();
        console.log("----------- " + obj.svTypeId() + " [after clone] ");
        
        return obj;
    }

    init () {
        super.init();
        console.log("----------- " + this.svTypeId() + ".init() ");
       
    }

}.initThisClass());