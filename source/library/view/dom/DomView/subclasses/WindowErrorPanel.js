"use strict";

/**
 * @module library.view.dom.DomView.subclasses
 */

/**
 * @class WindowErrorPanel
 * @extends ProtoClass
 * @classdesc WindowErrorPanel handles JavaScript window errors and provides error reporting functionality.
 * This class replaces the window.onerror approach with addEventListener for better error handling.
 */
(class WindowErrorPanel extends ProtoClass {
    
    /**
     * @description Initialize prototype slots for the WindowErrorPanel.
     * @category Initialization
     */
    initPrototypeSlots () {
        /**
         * @member {Array} appErrors - Array to store application errors.
         * @category Data
         */
        {
            const slot = this.newSlot("appErrors", null);
            slot.setSlotType("Array");
        }
        
        /**
         * @member {Number} maxErrors - Maximum number of errors to store.
         * @category Configuration
         */
        {
            const slot = this.newSlot("maxErrors", 50);
            slot.setSlotType("Number");
        }
        
        /**
         * @member {Boolean} isRegistered - Whether error listening is registered.
         * @category State
         */
        {
            const slot = this.newSlot("isRegistered", false);
            slot.setSlotType("Boolean");
        }
    }

    /**
     * @description Initialize class as singleton.
     * @category Initialization
     */
    static initClass () {
        this.setIsSingleton(true);
    }

    /**
     * @description Initialize the WindowErrorPanel.
     * @returns {WindowErrorPanel}
     * @category Initialization
     */
    init () {
        super.init();
        this.setAppErrors([]);
        this.registerForWindowErrors();
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
            });
            
            this.setIsRegistered(true);
            console.log("WindowErrorPanel: Registered for window error events");
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
        const errorInfo = {
            message: message,
            source: source,
            lineno: lineno,
            colno: colno,
            stack: error ? error.stack : "No stack trace",
            timestamp: new Date().toISOString()
        };
        
        this.appErrors().push(errorInfo);
        
        // Limit size to prevent memory issues
        if (this.appErrors().length > this.maxErrors()) {
            this.appErrors().shift();
        }
        
        // Check if the error occurred within the YouTube API's Web Worker
        if (source.includes('www.youtube.com') || source.includes('www.google.com')) {
            this.handleYouTubeError(errorInfo);
            return this;
        }
        
        // Create visual error notification
        this.showErrorNotification(errorInfo);
        
        // Log the error
        console.error("JS Error:", errorInfo);
        
        // Send error report to server
        this.sendErrorReport(errorInfo);
        
        return this;
    }

    /**
     * @description Handle YouTube API specific errors.
     * @param {Object} errorInfo - The error information object.
     * @category Error Handling
     */
    handleYouTubeError (errorInfo) {
        console.error('Exception caught from YouTube API Web Worker:');
        console.error('Message:', errorInfo.message);
        console.error('Source:', errorInfo.source);
        console.error('Line:', errorInfo.lineno);
        console.error('Column:', errorInfo.colno);
        console.error('Error object:', errorInfo.error);
    }

    warningSvgIcon () {
        return `<svg width="48" height="48" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <mask id="excl-mask">
      <!-- white = show, black = hide -->
      <rect width="100%" height="100%" fill="red"/>
      <text
        x="12" y="17"
        text-anchor="middle"
        font-size="12"
        font-family="sans-serif"
        font-weight="bold"
        fill="black"
      >!</text>
    </mask>
  </defs>

  <!-- rounded triangle, masked to cut out the "!" -->
  <path
    d="M12 3.5 L3.5 19.5 H20.5 Z"
    fill="currentColor"
    stroke="currentColor"
    stroke-linejoin="round"
    stroke-width="2"
    mask="url(#excl-mask)"
  />
</svg>
`;
    }


    /**
     * @description Show a visual error notification.
     * @param {Object} errorInfo - The error information object.
     * @category UI
     */
    showErrorNotification (errorInfo) {
        const errorPanelDiv = document.createElement('div');
        {
            const style = errorPanelDiv.style;
            style.position = 'fixed';
            style.top = '50%';
            style.left = '50%';
            style.transform = 'translate(-50%, -50%)';
            style.backgroundColor = 'white';
            style.color = 'black';
            style.zIndex = '10000';
            style.width = 'fit-content';
            style.height = 'fit-content';
            style.fontFamily = 'sans-serif';
            style.fontSize = '0.8em';
            style.borderRadius = '0.5em';
            style.overflow = 'hidden';
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

        //const errorSource = errorInfo.source.split('/').pop();
        //const column = errorInfo.colno ? `:${errorInfo.colno}` : "";
        //const line = errorInfo.lineno ? ` ${errorInfo.lineno}` : "";
        
        // Create error message content
        const parts = errorInfo.message.split(":").map(part => part.trim());
        //const errorTitle = parts[0];
        const errorMessage = parts[1];
        //const location = `on ${errorSource} line${line}`;
        let html = "";
        html += "<div style='color:black; font-weight:bold; padding-bottom:0.4em;'>Sorry, there was an error.</div>";
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
            style.fontSize = '1em';
            style.textAlign = 'center';
            style.cursor = 'pointer';
            style.transition = 'all 0.2s ease';
            style.width = '100%';
            style.backgroundColor = 'rgba(255, 0, 0, 0.8)';
            style.color = 'white';
            style.border = 'none';
            style.borderRadius = '0';
            style.padding = '0.5em 1em';
            style.marginTop = '1em';
            style.fontWeight = '600';
            dismissButton.textContent = 'Report and Continue';
        }
        
        // Add hover effects
        dismissButton.addEventListener('mouseenter', () => {
            dismissButton.style.backgroundColor = 'red';
        });
        
        dismissButton.addEventListener('mouseleave', () => {
            dismissButton.style.backgroundColor = 'rgba(255, 0, 0, 0.8)';
        });
        
        // Add click handler
        dismissButton.addEventListener('click', () => {
            errorPanelDiv.remove();
        });
        
        // Assemble the error panel
        errorPanelDiv.appendChild(messageDiv);
        errorPanelDiv.appendChild(dismissButton);
        
        document.body.appendChild(errorPanelDiv);
    }

    /**
     * @description Send error report to server.
     * @param {Object} errorInfo - The error information object.
     * @category Error Reporting
     */
    sendErrorReport (errorInfo) {
        // Send the error to the server if the app is initialized
        if (UoApp.shared()) {
            try {
                UoApp.shared().asyncPostErrorReport(errorInfo);
            } catch (e) {
                console.error("Error while trying to send error report:", e);
            }
        }
    }

    /**
     * @description Debug helper to show all application errors.
     * @returns {string} A formatted error report.
     * @category Debug
     */
    showErrors () {
        if (!this.appErrors() || this.appErrors().length === 0) {
            console.log("No errors recorded");
            return "No errors recorded";
        }
        
        console.table(this.appErrors());
        
        // Create a simplified text report
        let report = `--- JS Error Report (${this.appErrors().length} errors) ---\n\n`;
        
        this.appErrors().forEach((err, index) => {
            report += `[${index + 1}] ${err.timestamp}\n`;
            report += `Message: ${err.message}\n`;
            report += `Location: ${err.source.split('/').pop()}:${err.lineno}:${err.colno}\n`;
            if (err.stack) {
                report += `Stack: ${err.stack.split('\n')[0]}\n`;
            }
            report += '\n';
        });
        
        console.log(report);
        return report;
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
        throw new Error("Missing Service API Key");
    }

}.initThisClass());

WindowErrorPanel.shared(); // will register for window errors

setTimeout(() => {
    WindowErrorPanel.shared().test();
}, 300);

