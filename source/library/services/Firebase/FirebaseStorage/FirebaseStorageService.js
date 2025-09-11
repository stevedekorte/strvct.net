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
(class FirebaseStorageService extends SvSummaryNode {
    
    /**
     * @static
     * @description Initializes the class and sets it as a singleton.
     * @category Initialization
     */
    static initClass () {
        this.setIsSingleton(true);
    }

    initPrototypeSlots () {
        // This service doesn't need credential slots since uploads go through AccountServer
        // The AccountServer handles Firebase credentials securely
        
        // Images collection for testing
        {
            const slot = this.newSlot("images", null);
            slot.setFinalInitProto(FirestoreImages);
            slot.setIsSubnodeField(true);
            slot.setShouldStoreSlot(true);
            slot.setSyncsToView(true);
            slot.setDuplicateOp("duplicate");
            slot.setSlotType("FirestoreImages");
        }
    }

    initPrototype () {
        this.setTitle("Firebase Storage");
        this.setSubtitle("blob hosting");
        this.setShouldStoreSubnodes(false);
    }

    finalInit () {
        super.finalInit();
        this.initPrototype();
    }

}.initThisClass());