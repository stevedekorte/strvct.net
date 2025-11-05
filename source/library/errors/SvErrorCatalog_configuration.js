"use strict";

/**
 * @class SvErrorCatalog_configuration
 * @extends SvErrorCatalog
 * @classdesc Category extension that registers general configuration error definitions.
 * Defines friendly error messages for storage, network, resources, and config errors.
 */
(class SvErrorCatalog_configuration extends SvErrorCatalog {

    /**
     * @description Register all configuration error definitions
     * @category Registration
     */
    registerConfigurationErrors () {
        this.registerStorageInitError();
        this.registerNetworkConnectivityError();
        this.registerResourceLoadingError();
        this.registerConfigurationInvalidError();
        return this;
    }

    /**
     * @description Register the "Storage Initialization Failed" error definition
     * @category Registration
     */
    registerStorageInitError () {
        const def = SvErrorDefinition.clone()
            .setId("config-storage-init-failed")
            .setCategory("configuration")
            .setFriendlyTitle("Storage Unavailable")
            .setFriendlyMessage("Local storage is not available. Your changes may not be saved.")
            .setImageName("config-storage.svg")
            .setPatterns([
                /storage.*not.*initialized/i,
                /IndexedDB.*failed/i,
                /storage.*unavailable/i,
                /storage.*not.*supported/i,
                /QuotaExceededError/i
            ])
            .setActions([
                { label: "Dismiss", method: "dismiss" }
            ]);

        this.registerDefinition(def);
        return this;
    }

    /**
     * @description Register the "Network Connectivity Issues" error definition
     * @category Registration
     */
    registerNetworkConnectivityError () {
        const def = SvErrorDefinition.clone()
            .setId("config-network-connectivity")
            .setCategory("configuration")
            .setFriendlyTitle("Connection Problem")
            .setFriendlyMessage("Unable to connect to the server. Please check your internet connection.")
            .setImageName("config-network.svg")
            .setPatterns([
                /network.*error/i,
                /failed.*to.*fetch/i,
                /connection.*refused/i,
                /ERR_NETWORK/i,
                /ERR_CONNECTION/i,
                /NetworkError/i,
                /net::ERR_/i
            ])
            .setActions([
                { label: "Dismiss", method: "dismiss" }
            ]);

        this.registerDefinition(def);
        return this;
    }

    /**
     * @description Register the "Resource Loading Failed" error definition
     * @category Registration
     */
    registerResourceLoadingError () {
        const def = SvErrorDefinition.clone()
            .setId("config-resource-loading-failed")
            .setCategory("configuration")
            .setFriendlyTitle("Loading Failed")
            .setFriendlyMessage("Failed to load required resources. Please refresh the page.")
            .setImageName("config-resource.svg")
            .setPatterns([
                /failed.*to.*load.*resource/i,
                /resource.*not.*found/i,
                /404.*not.*found/i,
                /script.*error/i,
                /module.*not.*found/i
            ])
            .setActions([
                { label: "Dismiss", method: "dismiss" }
            ]);

        this.registerDefinition(def);
        return this;
    }

    /**
     * @description Register the "Configuration Invalid" error definition
     * @category Registration
     */
    registerConfigurationInvalidError () {
        const def = SvErrorDefinition.clone()
            .setId("config-invalid")
            .setCategory("configuration")
            .setFriendlyTitle("Configuration Error")
            .setFriendlyMessage("Application configuration is invalid. Please contact support if this persists.")
            .setImageName("config-invalid.svg")
            .setPatterns([
                /invalid.*configuration/i,
                /config.*error/i,
                /configuration.*missing/i,
                /config.*not.*found/i,
                /environment.*not.*configured/i
            ])
            .setActions([
                { label: "Dismiss", method: "dismiss" }
            ]);

        this.registerDefinition(def);
        return this;
    }

}.initThisCategory());
