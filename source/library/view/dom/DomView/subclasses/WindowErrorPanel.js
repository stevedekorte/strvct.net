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

    /**
     * @description Show a visual error notification.
     * @param {Object} errorInfo - The error information object.
     * @category UI
     */
    showErrorNotification (errorInfo) {
        const errorDiv = document.createElement('div');
        errorDiv.style.position = 'fixed';
        errorDiv.style.top = '50%';
        errorDiv.style.left = '50%';
        errorDiv.style.transform = 'translate(-50%, -50%)';
        errorDiv.style.backgroundColor = 'rgba(255, 0, 0, 0.8)';
        errorDiv.style.color = 'white';
        errorDiv.style.padding = '1em';
        errorDiv.style.borderRadius = '5px';
        errorDiv.style.width = 'fit-content';
        errorDiv.style.height = 'fit-content';
        errorDiv.style.zIndex = '10000';
        errorDiv.style.fontFamily = 'monospace';
        errorDiv.style.fontSize = '12px';
        errorDiv.style.textAlign = 'center';

        const errorSource = errorInfo.source.split('/').pop();
        const column = errorInfo.colno ? `:${errorInfo.colno}` : "";
        const line = errorInfo.lineno ? `:${errorInfo.lineno}` : "";
        errorDiv.innerHTML = `<strong>JS Error:</strong> ${errorInfo.message}<br>
                             <strong>File:</strong> ${errorSource}<br>
                             <strong>Line: Col:</strong> ${line}${column}<br>
                             <button onclick="this.parentNode.remove()">Dismiss</button>`;
        
        document.body.appendChild(errorDiv);
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

}.initThisClass());