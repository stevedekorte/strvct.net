"use strict";

/**
 * @module library.view.dom.DomView.subclasses
 */

/**
 * @class SvWindowErrorPanel
 * @extends ProtoClass
 * @classdesc SvWindowErrorPanel handles JavaScript window errors and provides error reporting functionality.
 */


class SvWindowErrorPanel extends Object {
    
    static _shared = null;

    static shared () {
        if (!this._shared) {
            this._shared = new SvWindowErrorPanel();
        }
        return this._shared;
    }

    constructor () {
        super();
        this._isRegistered = false;
        this.init();
    }

    setIsRegistered (aBool) {
        this._isRegistered = aBool;
        return this;
    }

    isRegistered () {
        return this._isRegistered;
    }

    /**
     * @description Initialize the SvWindowErrorPanel.
     * @returns {SvWindowErrorPanel}
     * @category Initialization
     */
    init () {
        if (SvPlatform.isBrowserPlatform()) {
            this.registerForWindowErrors();
        }
        return this;
    }

    errorFromEvent (event) {
        const message = event.reason ? event.reason : event.message;
        const error = new Error(message);
        error.reason = event.reason;
        error.filename = event.filename;
        error.lineno = event.lineno;
        error.colno = event.colno;
        error.error = event.error;
        return error;
    }
    /**
     * @description Register for window error events using addEventListener.
     * @returns {SvWindowErrorPanel}
     * @category Event Registration
     */
    registerForWindowErrors () {
        if (!this.isRegistered()) {
            window.addEventListener('error', (event) => {
                const error = this.errorFromEvent(event);
                this.handleWindowError(error);
            });
            
            // Also register for unhandled promise rejections
            window.addEventListener('unhandledrejection', (event) => {
                const error = this.errorFromEvent(event);
                this.handleWindowError(error);
            });
            
            this.setIsRegistered(true);
        }
        return this;
    }

    errorInfoFromError (error) {
        return {
            reason: error.reason,
            message: error.message,
            source: error.filename,
            sourceName: this.cleanSourceName(error.filename),
            lineno: error.lineno,
            colno: error.colno,
            error: error.error
        };
    }

    cleanSourceName (source) {
        let sourceName = null;
        if (typeof(source) === "string") {
            sourceName = source;
        } else if (source && source.type) {
            sourceName = source.svType();
        } else {
            sourceName = typeof(source);
        }
        return sourceName;
    }

    /**
     * @description Handle a window error event.
     * @param {string} message - The error message.
     * @param {string} source - The source file where the error occurred.
     * @param {number} lineno - The line number where the error occurred.
     * @param {number} colno - The column number where the error occurred.
     * @param {Error} error - The error object.
     * @returns {SvWindowErrorPanel}
     * @category Error Handling
     */
    handleWindowError (error) {
        //debugger;
        try { // DONT REMOVE THIS AS AN UNCAUGHT ERROR HERE COULD CAUSE AN INFINITE LOOP
            const errorInfo = this.errorInfoFromError(error);
            
            // Check if the error occurred within the YouTube API's Web Worker
            const source = errorInfo.sourceName;
            if (source.includes('www.youtube.com') || source.includes('www.google.com')) {
                this.handleYouTubeError(errorInfo);
                return this;
            }
            
            // Create visual error notification
            this.showPanelWithInfo(errorInfo);
            
            // Log the error
            console.error("JS Error:", errorInfo);
            
            // Send error report to server
            this.sendErrorReport(errorInfo);
            return this;
        } catch (e) {
            console.error("Error in handleWindowError:", e);
        }
    }

    /**
     * @description Handle YouTube API specific errors.
     * @param {Object} errorInfo - The error information object.
     * @category Error Handling
     */
    handleYouTubeError (errorInfo) {
        try {
            console.error('Exception caught from YouTube API Web Worker:');
            console.error(JSON.stringify(errorInfo, null, 2));
        } catch (e) {
            console.error("Error in handleYouTubeError:", e);
        }
    }


    /**
     * @description Show a visual error notification.
     * @param {Object} errorInfo - The error information object.
     * @category UI
     */
    showPanelWithInfo (errorInfo) {
        debugger;
        console.log("showPanelWithInfo", JSON.stringify(errorInfo, null, 2));

        try { // DONT REMOVE THIS AS AN UNCAUGHT ERROR HEAR COULD CAUSE AN INFINITE LOOP
            // Create backdrop div that fills the window
            const backdropDiv = document.createElement('div');
            {
                const style = backdropDiv.style;
                style.position = 'fixed';
                style.top = '0';
                style.left = '0';
                style.width = '100vw';
                style.height = '100vh';
                style.backgroundColor = 'rgba(255, 255, 255, 0.01)'; // Reduced opacity to see blur effect
                style.backdropFilter = 'blur(5px)';
                style.webkitBackdropFilter = 'blur(5px)'; // Safari support
                style.zIndex = '9999';
                style.display = 'flex';
                style.justifyContent = 'center';
                style.alignItems = 'center';
                style.transition = 'opacity 0.5s ease-out, backdrop-filter 0.5s ease-out, -webkit-backdrop-filter 0.5s ease-out';
            }

            const errorPanelDiv = document.createElement('div');
            {
                const style = errorPanelDiv.style;
                style.position = 'relative'; // Changed from fixed since it's now inside backdrop
                style.backgroundColor = 'rgb(25, 25, 25)';
                style.color = 'black';
                style.width = 'fit-content';
                style.height = 'fit-content';
                style.fontFamily = 'inherit';
                style.fontSize = '1em';
                style.borderRadius = '0em';
                style.overflow = 'hidden';
                style.border = '1px solid #444';
                style.transition = 'opacity 0.5s ease-out, transform 0.5s ease-out';
                style.maxWidth = '90%';
            }

            const messageDiv = document.createElement('div');
            {
                const style = messageDiv.style;
                style.fontFamily = 'inherit';
                style.fontSize = '1em';
                style.textAlign = 'center';
                style.paddingLeft = '2em';
                style.paddingRight = '2em';
                style.paddingTop = '1em';
                style.paddingBottom = '0';
                style.lineHeight = '1.5em';
                style.textAlign = 'center';
                style.width = 'fit-content';
                style.height = 'fit-content';
            }
            
            // Create error message content
            let errorMessage = errorInfo.message ? errorInfo.message : "";
            
            // First, extract only the first sentence (up to the first period)
            const periodIndex = errorMessage.indexOf(".");
            if (periodIndex > 0) {
                errorMessage = errorMessage.substring(0, periodIndex + 1);
            }
            
            // Then, if the message contains a colon, extract the part after the last colon
            if (errorMessage.includes(":")) {
                const lastColonIndex = errorMessage.lastIndexOf(":");
                errorMessage = errorMessage.substring(lastColonIndex + 1).trim();
            }

            //errorMessage += "<br>Source: '" + errorInfo.source + "'";
            //errorMessage += "<br>Line: " + errorInfo.lineno;

            //const errorTitle = parts[0];
            //const errorMessage = '"' + parts[1] + '"';
            //const location = `on ${errorSource} line${line}`;
            let html = "";
            html += "<div style='color:white; padding-bottom:0.4em;'>Sorry, there was an error.</div>";
            //html += `<div style='color:black; font-weight:bold; padding-bottom:0.5em;'>${this.warningSvgIcon()}</div>`;
            //html += `<div style="color:black">${errorTitle}</div>`;
            html += `<div style="color:#888; padding-bottom:0.5em;">${errorMessage}</div>`;
            //html += `<div style="color:#aaa;">${location}</div>`;
            messageDiv.innerHTML = html;
            
            // Create styled dismiss button as a div
            const dismissButton = document.createElement('div');
            {
                const style = dismissButton.style;
                style.fontFamily = 'inherit';
                style.textAlign = 'center';
                style.cursor = 'pointer';
                style.transition = 'all 0.2s ease';
                style.width = '100% - 2em';
                style.backgroundColor = 'rgb(25, 25, 25)';
                style.color = '#aaa';
                style.border = 'none';
                style.borderRadius = '0';
                style.padding = '0.5em 1em';
                style.margin = '1em';
                style.border = '1px solid #444';
                dismissButton.textContent = 'Report and Continue';
            }
            
            // Add hover effects
            dismissButton.addEventListener('mouseenter', () => {
                dismissButton.style.backgroundColor = '#333';
            });
            
            dismissButton.addEventListener('mouseleave', () => {
                dismissButton.style.backgroundColor = 'transparent';
            });
            
            // Add click handler
            dismissButton.addEventListener('click', () => {
                // Start fade out animation
                backdropDiv.style.opacity = '0';
                backdropDiv.style.backdropFilter = 'blur(0px)';
                backdropDiv.style.webkitBackdropFilter = 'blur(0px)';
                errorPanelDiv.style.opacity = '0';
                errorPanelDiv.style.transform = 'scale(0.95)';
                
                // Remove element after animation completes
                setTimeout(() => {
                    backdropDiv.remove();
                }, 500); // Match the 0.5s transition duration
            });
            
            // Assemble the error panel
            errorPanelDiv.appendChild(messageDiv);
            errorPanelDiv.appendChild(dismissButton);
            
            // Add error panel to backdrop
            backdropDiv.appendChild(errorPanelDiv);
            
            // Add backdrop to document body
            document.body.appendChild(backdropDiv);
            //debugger;
        } catch (e) {
            console.error("Error in showPanelWithInfo:", e);
        }
    }

    /**
     * @description Send error report to server.
     * @param {Object} errorInfo - The error information object.
     * @category Error Reporting
     */
    sendErrorReport (errorInfo) {
        if (SvGlobals.has("SvErrorReport")) {
            SvErrorReport.asyncSend(new Error(errorInfo.message), errorInfo);
        } else {
            console.warn("SvErrorReport not defined yet, so we cannot send error report");
        }
    }
    
    /**
     * @description Debug helper to clear application errors.
     * @returns {string} Confirmation message.
     * @category Debug
     */
    clearErrors () {
        this.setAppErrors([]);
        console.log("Error log cleared");
        return "Error log cleared";
    }

    test () {
        setTimeout(() => {
            throw new Error("SvWindowErrorPanel test error");
        }, 300);
    }

};

SvGlobals.set("SvWindowErrorPanel", SvWindowErrorPanel);

SvWindowErrorPanel.shared();

//SvWindowErrorPanel.shared(); // Move to app init until this class is extracted from Strvct

//SvWindowErrorPanel.shared().test();

