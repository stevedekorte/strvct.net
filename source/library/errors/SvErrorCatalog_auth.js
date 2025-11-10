"use strict";

/**
 * @class SvErrorCatalog_auth
 * @extends SvErrorCatalog
 * @classdesc Category extension that registers authentication error definitions.
 * Defines friendly error messages for authentication-related errors.
 */
(class SvErrorCatalog_auth extends SvErrorCatalog {

    /**
     * @description Register all authentication error definitions
     * @category Registration
     */
    registerAuthenticationErrors () {
        this.registerNotLoggedInError();
        this.registerSessionExpiredError();
        this.registerPermissionDeniedError();
        return this;
    }

    /**
     * @description Register the "Not Logged In" error definition
     * @category Registration
     */
    registerNotLoggedInError () {
        const def = SvErrorDefinition.clone()
            .setId("auth-not-logged-in")
            .setCategory("authentication")
            .setFriendlyTitle("Login Required")
            .setFriendlyMessage("You need to be logged in to access this feature.")
            .setImageName("auth-lock.svg")
            .setPatterns([
                /not.*logged.*in/i,
                /authentication.*required/i,
                /please.*log.*in/i,
                /login.*required/i,
                /must.*be.*authenticated/i
            ])
            .setActions([
                { label: "Dismiss", method: "dismiss" }
            ]);

        this.registerDefinition(def);
        return this;
    }

    /**
     * @description Register the "Session Expired" error definition
     * @category Registration
     */
    registerSessionExpiredError () {
        const def = SvErrorDefinition.clone()
            .setId("auth-session-expired")
            .setCategory("authentication")
            .setFriendlyTitle("Session Expired")
            .setFriendlyMessage("Your session has expired. Please log in again to continue.")
            .setImageName("auth-expired.svg")
            .setPatterns([
                /session.*expired/i,
                /token.*expired/i,
                /session.*invalid/i,
                /token.*invalid/i,
                /authentication.*expired/i
            ])
            .setActions([
                { label: "Dismiss", method: "dismiss" }
            ]);

        this.registerDefinition(def);
        return this;
    }

    /**
     * @description Register the "Permission Denied" error definition
     * @category Registration
     */
    registerPermissionDeniedError () {
        const def = SvErrorDefinition.clone()
            .setId("auth-permission-denied")
            .setCategory("authentication")
            .setFriendlyTitle("Access Denied")
            .setFriendlyMessage("You don't have permission to perform this action.")
            .setImageName("auth-denied.svg")
            .setPatterns([
                /permission.*denied/i,
                /access.*denied/i,
                /forbidden/i,
                /not.*authorized/i,
                /insufficient.*permissions/i,
                /403/
            ])
            .setActions([
                { label: "Dismiss", method: "dismiss" }
            ]);

        this.registerDefinition(def);
        return this;
    }

}.initThisCategory());
