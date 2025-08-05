"use strict";

/**
 * @module library.view.dom.DomView.subclasses
 */

/**
 * @class WindowErrorPanel
 * @extends ProtoClass
 * @classdesc WindowErrorPanel handles JavaScript window errors and provides error reporting functionality.
 */


class WindowErrorPanel extends Object {
    
    static _shared = null;

    static shared () {
        if (!this._shared) {
            this._shared = new WindowErrorPanel();
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
     * @description Initialize the WindowErrorPanel.
     * @returns {WindowErrorPanel}
     * @category Initialization
     */
    init () {
        if (SvPlatform.isBrowserPlatform()) {
            this.registerForWindowErrors();
        }
        return this;
    }

    /**
     * @description Register for window error events using addEventListener.
     * @returns {WindowErrorPanel}
     * @category Event Registration
     */
    registerForWindowErrors () {
        if (!this.isRegistered()) {
            window.addEventListener('error', (event) => {
                this.handleWindowError(
                    event.message,
                    event.filename,
                    event.lineno,
                    event.colno,
                    event.error
                );
                //throw event.error; // so the debugger will break
            });
            
            // Also register for unhandled promise rejections
            window.addEventListener('unhandledrejection', (event) => {
                this.handleWindowError(
                    `Unhandled Promise Rejection: ${event.reason}`,
                    'Promise',
                    0,
                    0,
                    event.reason
                );
                //throw event.reason; // so the debugger will break
            });
            
            this.setIsRegistered(true);
            //console.log("WindowErrorPanel: Registered for window error events");
        }
        return this;
    }

    /**
     * @description Handle a window error event.
     * @param {string} message - The error message.
     * @param {string} source - The source file where the error occurred.
     * @param {number} lineno - The line number where the error occurred.
     * @param {number} colno - The column number where the error occurred.
     * @param {Error} error - The error object.
     * @returns {WindowErrorPanel}
     * @category Error Handling
     */
    handleWindowError (message, source, lineno, colno, error) {
        debugger;
        try { // DONT REMOVE THIS AS AN UNCAUGHT ERROR HEAR COULD CAUSE AN INFINITE LOOP
            const errorInfo = {
                message: message,
                source: source,
                lineno: lineno,
                colno: colno,
                stack: error ? error.stack : "No stack trace",
                timestamp: new Date().toISOString()
            };
            
            // Check if the error occurred within the YouTube API's Web Worker
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
            console.error('Message:', errorInfo.message);
            console.error('Source:', errorInfo.source);
            console.error('Line:', errorInfo.lineno);
            console.error('Column:', errorInfo.colno);
            console.error('Error object:', errorInfo.error);
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
        console.log("showPanelWithInfo", JSON.stringify(errorInfo, null, 2));
        //debugger;
        //return;

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
            let errorMessage = errorInfo.message;
            if (errorMessage.includes(":")) {
                const parts = errorMessage.split(":").map(part => part.trim());
                while (parts.length > 1 && parts.first().toLowerCase().endsWith("error")) {
                    parts.shift();
                }
                errorMessage = parts.last();
            }

            errorMessage += "<br>Source: '" + errorInfo.source + "'";
            errorMessage += "<br>Line: " + errorInfo.lineno;

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
                this.addTimeout(() => {
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
            throw new Error("WindowErrorPanel test error");
        }, 300);
    }

};

SvGlobals.set("WindowErrorPanel", WindowErrorPanel);

WindowErrorPanel.shared();

//WindowErrorPanel.shared(); // Move to app init until this class is extracted from Strvct

//WindowErrorPanel.shared().test();

