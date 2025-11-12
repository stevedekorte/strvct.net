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
        let error;

        // For unhandledrejection events, event.reason is often the actual error
        if (event.reason && event.reason instanceof Error) {
            error = event.reason;
        } else if (event.error instanceof Error) {
            error = event.error;
        } else {
            // For regular error events or when reason is not an Error
            const message = event.reason ? String(event.reason) : (event.message || "Unknown error");
            error = new Error(message);
        }

        // Store additional event properties without modifying the error object
        if (!error.filename && event.filename) {
            error.filename = event.filename;
        }
        if (!error.lineno && event.lineno) {
            error.lineno = event.lineno;
        }
        if (!error.colno && event.colno) {
            error.colno = event.colno;
        }
        // Don't store reason if it would create a circular reference
        if (!error.reason && event.reason && event.reason !== error) {
            error.reason = event.reason;
        }

        return error;
    }
    /**
     * @description Register for window error events using addEventListener.
     * @returns {SvWindowErrorPanel}
     * @category Event Registration
     */
    registerForWindowErrors () {
        if (!this.isRegistered()) {
            window.addEventListener("error", (event) => {
                const error = this.errorFromEvent(event);
                this.handleWindowError(error);
            });

            // Also register for unhandled promise rejections
            window.addEventListener("unhandledrejection", (event) => {
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
            error: error // Pass the error object itself, not error.error
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

        try { // DONT REMOVE THIS AS AN UNCAUGHT ERROR HERE COULD CAUSE AN INFINITE LOOP
            const errorInfo = this.errorInfoFromError(error);

            // Check if the error occurred within the YouTube API's Web Worker
            const source = errorInfo.sourceName;
            if (source.includes("www.youtube.com") || source.includes("www.google.com")) {
                this.handleYouTubeError(errorInfo);
                return this;
            }

            // Try to find a matching error definition
            let errorDefinition = null;
            if (SvGlobals.has("SvErrorCatalog")) {
                errorDefinition = SvErrorCatalog.shared().definitionForError(error);
            }

            // Create visual error notification
            this.showPanelWithInfo(errorInfo, errorDefinition);

            // Log the error
            console.error("JS Error:", errorInfo);

            // Send error report to server
            this.sendErrorReport(errorInfo, errorDefinition);
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
            console.error("Exception caught from YouTube API Web Worker:");
            console.error(JSON.stringify(errorInfo, null, 2));
        } catch (e) {
            console.error("Error in handleYouTubeError:", e);
        }
    }


    /**
     * @description Show a visual error notification.
     * @param {Object} errorInfo - The error information object.
     * @param {SvErrorDefinition} errorDefinition - The matching error definition (if any).
     * @category UI
     */
    showPanelWithInfo (errorInfo, errorDefinition = null) {

        try { // DONT REMOVE THIS AS AN UNCAUGHT ERROR HERE COULD CAUSE AN INFINITE LOOP
            // Create backdrop div that fills the window
            const backdropDiv = document.createElement("div");
            {
                const style = backdropDiv.style;
                style.position = "fixed";
                style.top = "0";
                style.left = "0";
                style.width = "100vw";
                style.height = "100vh";
                style.backgroundColor = "rgba(255, 255, 255, 0.01)"; // Reduced opacity to see blur effect
                style.backdropFilter = "blur(5px)";
                style.webkitBackdropFilter = "blur(5px)"; // Safari support
                style.zIndex = "9999";
                style.display = "flex";
                style.justifyContent = "center";
                style.alignItems = "center";
                style.transition = "opacity 0.5s ease-out, backdrop-filter 0.5s ease-out, -webkit-backdrop-filter 0.5s ease-out";
            }

            const errorPanelDiv = document.createElement("div");
            {
                const style = errorPanelDiv.style;
                style.position = "relative"; // Changed from fixed since it's now inside backdrop
                style.backgroundColor = "rgb(25, 25, 25)";
                style.color = "black";
                style.width = "fit-content";
                style.height = "fit-content";
                style.fontFamily = "inherit";
                style.fontSize = "1em";
                style.borderRadius = "0em";
                style.overflow = "hidden";
                style.border = "1px solid #444";
                style.transition = "opacity 0.5s ease-out, transform 0.5s ease-out";
                style.maxWidth = "min(40%, 90vw)"; // 40% on desktop, 90% on mobile
            }

            const messageDiv = document.createElement("div");
            {
                const style = messageDiv.style;
                style.fontFamily = "inherit";
                style.fontSize = "1em";
                style.paddingLeft = "2em";
                style.paddingRight = "2em";
                style.paddingTop = "1.5em";
                style.paddingBottom = "1em";
                style.lineHeight = "1.5em";
                style.display = "flex";
                style.alignItems = "flex-start";
                style.gap = "1.5em";
            }

            // Create error message content
            let errorTitle = "Sorry, there was an error.";
            let errorMessage = "";

            if (errorDefinition) {
                // Use friendly error definition
                errorTitle = errorDefinition.friendlyTitle();
                errorMessage = errorDefinition.friendlyMessage();
            } else {
                // Fall back to simplified error message
                errorMessage = errorInfo.message ? errorInfo.message : "";

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
            }

            // Create image container on the left
            let html = "";
            if (errorDefinition && errorDefinition.imageUrl()) {
                const imageUrl = errorDefinition.imageUrl();
                html += `<div style='flex-shrink:0;'><img src='${imageUrl}' style='max-height:120px; width:80px; opacity:0.8;' /></div>`;
            }

            // Create text container on the right
            html += "<div style='flex:1;'>";
            html += `<div style='color:white; font-weight:bold; font-size:1.2em; padding-bottom:0.5em;'>${errorTitle}</div>`;
            html += `<div style="color:#888;">${errorMessage}</div>`;
            html += "</div>";

            messageDiv.innerHTML = html;

            // Create collapsible technical details section
            const detailsContainer = document.createElement("div");
            {
                const style = detailsContainer.style;
                style.margin = "0 2em 0 2em";
                style.borderTop = "1px solid #444";
                style.paddingTop = "0.5em";
            }

            const detailsHeader = document.createElement("div");
            {
                const style = detailsHeader.style;
                style.display = "flex";
                style.alignItems = "center";
                style.gap = "0.5em";
                style.padding = "0.5em 0";
            }

            const detailsToggle = document.createElement("div");
            {
                const style = detailsToggle.style;
                style.color = "#aaa";
                style.cursor = "pointer";
                style.fontSize = "0.9em";
                style.userSelect = "none";
                detailsToggle.textContent = "▸ Details";
            }

            const detailsContent = document.createElement("div");
            {
                const style = detailsContent.style;
                style.display = "none";
                style.color = "#999";
                style.fontSize = "0.7em";
                style.fontFamily = "monospace";
                style.backgroundColor = "#1a1a1a";
                style.padding = "0.5em";
                style.borderRadius = "4px";
                style.marginTop = "0.5em";
                style.maxHeight = "200px";
                style.overflowY = "auto";
                style.whiteSpace = "pre-wrap";
                style.wordBreak = "break-word";

                // Build technical details content
                let details = "";
                if (errorInfo.error && errorInfo.error.name) {
                    details += `Error: ${errorInfo.error.name}\n`;
                }
                details += `Message: ${errorInfo.message}\n`;
                if (errorInfo.source) {
                    details += `Source: ${errorInfo.sourceName}\n`;
                }
                if (errorInfo.lineno) {
                    details += `Line: ${errorInfo.lineno}:${errorInfo.colno}\n`;
                }

                // Try to get stack trace from multiple sources
                let stackTrace = null;
                if (errorInfo.error && errorInfo.error.stack) {
                    stackTrace = errorInfo.error.stack;
                } else if (errorInfo.reason && errorInfo.reason.stack) {
                    stackTrace = errorInfo.reason.stack;
                }

                details += `\nStack Trace:\n${stackTrace || "No stack trace available"}`;

                detailsContent.textContent = details;
            }

            const copyButton = document.createElement("div");
            {
                const style = copyButton.style;
                style.cursor = "pointer";
                style.width = "28px";
                style.height = "28px";
                style.border = "1px solid #444";
                style.borderRadius = "4px";
                style.display = "none"; // Hidden until details are expanded
                style.alignItems = "center";
                style.justifyContent = "center";
                style.transition = "all 0.2s ease";
                style.flexShrink = "0";

                // SVG icon paths
                const clipboardIconPath = "/strvct/resources/icons/clipboard.svg";
                const checkmarkIconPath = "/strvct/resources/icons/checkmark.svg";

                // Create clipboard icon img element
                const clipboardImg = document.createElement("img");
                clipboardImg.src = clipboardIconPath;
                clipboardImg.style.width = "16px";
                clipboardImg.style.height = "16px";
                clipboardImg.style.display = "block";
                clipboardImg.style.filter = "invert(48%) sepia(0) saturate(2476%) hue-rotate(0deg) brightness(118%) contrast(119%)";
                copyButton.appendChild(clipboardImg);

                copyButton.addEventListener("mouseenter", () => {
                    copyButton.style.backgroundColor = "#333";
                });

                copyButton.addEventListener("mouseleave", () => {
                    copyButton.style.backgroundColor = "transparent";
                });

                copyButton.addEventListener("click", (e) => {
                    e.stopPropagation(); // Prevent toggling details
                    navigator.clipboard.writeText(detailsContent.textContent).then(() => {
                        // Switch to checkmark (keep same grey opacity)
                        clipboardImg.src = checkmarkIconPath;
                        setTimeout(() => {
                            // Switch back to clipboard (opacity stays the same)
                            clipboardImg.src = clipboardIconPath;
                        }, 2000);
                    }).catch(err => {
                        console.error("Failed to copy:", err);
                    });
                });
            }

            // Toggle handler for expanding/collapsing details
            let isExpanded = false;
            detailsToggle.addEventListener("click", () => {
                isExpanded = !isExpanded;
                if (isExpanded) {
                    detailsToggle.textContent = "▾ Details";
                    detailsContent.style.display = "block";
                    copyButton.style.display = "flex";
                } else {
                    detailsToggle.textContent = "▸ Details";
                    detailsContent.style.display = "none";
                    copyButton.style.display = "none";
                }
            });

            detailsHeader.appendChild(detailsToggle);
            detailsHeader.appendChild(copyButton);
            detailsContainer.appendChild(detailsHeader);
            detailsContainer.appendChild(detailsContent);

            // Create action buttons container
            const buttonsContainer = document.createElement("div");
            {
                const style = buttonsContainer.style;
                style.display = "flex";
                style.gap = "0.5em";
                style.padding = "1em";
                style.justifyContent = "center";
            }

            // Function to create a styled button
            const createButton = (label, isPrimary, clickHandler) => {
                const button = document.createElement("div");
                const style = button.style;
                style.fontFamily = "inherit";
                style.textAlign = "center";
                style.cursor = "pointer";
                style.transition = "all 0.2s ease";
                style.backgroundColor = isPrimary ? "#444" : "rgb(25, 25, 25)";
                style.color = isPrimary ? "#fff" : "#aaa";
                style.border = "1px solid #444";
                style.borderRadius = "0";
                style.padding = "0.5em 1.5em";
                style.flex = "1";
                button.textContent = label;

                button.addEventListener("mouseenter", () => {
                    button.style.backgroundColor = isPrimary ? "#555" : "#333";
                });

                button.addEventListener("mouseleave", () => {
                    button.style.backgroundColor = isPrimary ? "#444" : "rgb(25, 25, 25)";
                });

                button.addEventListener("click", clickHandler);
                return button;
            };

            // Function to dismiss the error panel
            const dismissPanel = () => {
                backdropDiv.style.opacity = "0";
                backdropDiv.style.backdropFilter = "blur(0px)";
                backdropDiv.style.webkitBackdropFilter = "blur(0px)";
                errorPanelDiv.style.opacity = "0";
                errorPanelDiv.style.transform = "scale(0.95)";

                setTimeout(() => {
                    backdropDiv.remove();
                }, 500);
            };

            // Create action buttons based on error definition or default dismiss
            if (errorDefinition && errorDefinition.actions() && errorDefinition.actions().length > 0) {
                // Create buttons from error definition actions
                for (const action of errorDefinition.actions()) {
                    const isPrimary = action.method === "navigateToLogin";
                    const button = createButton(action.label, isPrimary, () => {
                        dismissPanel();
                        this.handleAction(action.method);
                    });
                    buttonsContainer.appendChild(button);
                }
            } else {
                // Default dismiss button
                const button = createButton("Dismiss", false, dismissPanel);
                buttonsContainer.appendChild(button);
            }

            // Assemble the error panel
            errorPanelDiv.appendChild(messageDiv);
            errorPanelDiv.appendChild(detailsContainer);
            errorPanelDiv.appendChild(buttonsContainer);

            // Add error panel to backdrop
            backdropDiv.appendChild(errorPanelDiv);

            // Add backdrop to document body
            document.body.appendChild(backdropDiv);

        } catch (e) {
            console.error("Error in showPanelWithInfo:", e);
        }
    }

    /**
     * @description Send error report to server.
     * @param {Object} errorInfo - The error information object.
     * @param {SvErrorDefinition} errorDefinition - The matching error definition (if any).
     * @category Error Reporting
     */
    sendErrorReport (errorInfo, errorDefinition = null) {
        if (SvGlobals.has("SvErrorReport")) {
            // Prepare additional data with user-facing information
            const additionalData = Object.assign({}, errorInfo);

            // Add user-facing information if we have a definition
            if (errorDefinition) {
                additionalData.userFacing = {
                    definitionId: errorDefinition.id(),
                    category: errorDefinition.category(),
                    friendlyTitle: errorDefinition.friendlyTitle(),
                    friendlyMessage: errorDefinition.friendlyMessage(),
                    imagePath: errorDefinition.imagePath()
                };
            } else {
                additionalData.userFacing = null;
            }

            SvErrorReport.asyncSend(new Error(errorInfo.message), additionalData);
        } else {
            console.warn("SvErrorReport not defined yet, so we cannot send error report");
        }
    }

    /**
     * @description Handle error panel action button clicks
     * @param {String} method - The action method name
     * @category Actions
     */
    handleAction (method) {
        console.log("Handling action:", method);

        // Try to find the method on the error catalog first
        if (SvGlobals.has("SvErrorCatalog")) {
            const catalog = SvErrorCatalog.shared();
            if (catalog[method] && typeof catalog[method] === "function") {
                catalog[method]();
                return;
            }
        }

        // Fall back to built-in actions
        switch (method) {
            case "dismiss":
                // Panel already dismissed, no additional action needed
                break;
            default:
                console.warn("Unknown action method:", method);
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

    /**
     * @description Test generic error (no definition match)
     * @category Testing
     */
    testGenericError () {
        setTimeout(() => {
            throw new Error("Something went wrong with the frob widget.");
        }, 500);
    }

    /**
     * @description Test various error types from the catalog
     * @category Testing
     * @note Most test methods have been moved to their respective ErrorCatalog classes.
     * Use SvErrorCatalog.shared().testMethodName() to trigger specific error types.
     */
    testCatalogError (categoryName, errorType) {
        const catalog = SvErrorCatalog.shared();
        const methodName = `test${errorType}`;

        if (catalog[methodName]) {
            catalog[methodName]();
        } else {
            console.warn(`Test method '${methodName}' not found in catalog`);
        }
    }

};

SvGlobals.set("SvWindowErrorPanel", SvWindowErrorPanel);

SvWindowErrorPanel.shared();

