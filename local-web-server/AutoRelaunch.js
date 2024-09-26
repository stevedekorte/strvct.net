"use strict";

/**
 * @module AutoRelaunch
 */

require("./getGlobalThis.js");
require("./Base.js");
const fs = require('fs');
const { spawn } = require('child_process');

/**
 * @class AutoRelauncher
 * @extends Base
 * @classdesc A class for automatically relaunching a process based on file changes.
 */
(class AutoRelauncher extends Base {

    /**
     * Initialize prototype slots
     */
    initPrototypeSlots () {
        /** @member {string|null} filePath - The path to the file to watch */
        this.newSlot("filePath", null);
        /** @member {string|null} launchCommand - The command to launch the process */
        this.newSlot("launchCommand", null);
        /** @member {Array|null} launchArgs - The arguments for the launch command */
        this.newSlot("launchArgs", null);
        /** @member {string|null} keyPath - The key path */
        this.newSlot("keyPath", null);
        /** @member {number} checkInterval - The interval (in milliseconds) to check for file changes */
        this.newSlot("checkInterval", 5000);
        /** @member {number|null} intervalId - The ID of the interval timer */
        this.newSlot("intervalId", null);
    }
  
    /**
     * Initialize prototype
     */
    initPrototype () {
    }

    /**
     * Start the auto-relauncher
     */
    start () {
        console.log(this.type() + " started");
        const tid = setInterval(() => this.checkAndDeleteFile(), this.checkInterval());
        this.setIntervalId(tid);

        /*
        process.on('SIGHUP', () => {
            console.log('Received SIGHUP. Reloading configuration...');
            // Code to reload configuration or perform other tasks
            this.restartProcess();
        });
        */
    }

    /**
     * Stop the auto-relauncher
     */
    stop () {
        if (this.intervalId()) {
            clearInterval(this.intervalId());
        }
    }

    /**
     * Check for the file and delete it if it exists, then restart the process
     */
    checkAndDeleteFile () {
        try {
            if (fs.existsSync(this.filePath())) {
                console.log(this.type() + " found '" + this.filePath() + "' - this is our signal to (delete this file and) restart the process...");
                fs.unlinkSync(this.filePath());
                this.restartProcess();
            }
        } catch (error) {
            console.error('Error occurred:', error);
        }
    }

    /**
     * Restart the process
     */
    restartProcess () {
        spawn(this.launchCommand(), this.launchArgs(), {
            stdio: 'inherit',
            detached: true,
            shell: true
        }).unref();

        process.exit();
    }

    /**
     * Set up default values
     */
    setupDefaults () {
        autoRelauncher.setFilePath("./shouldRelaunchNow.txt");
        autoRelauncher.setLaunchCommand("bash");
        autoRelauncher.setLaunchArgs(['/home/protected/run.sh']);
    }

    /**
     * Set up test values
     */
    setupTest () {
        autoRelauncher.setFilePath("./shouldRelaunchNow.txt");
        autoRelauncher.setLaunchCommand("node");
        autoRelauncher.setLaunchArgs(['./strvct/local-web-server/AutoRelaunch.js']);
    }

}.initThisClass());

const autoRelauncher = AutoRelauncher.clone();
autoRelauncher.setupTest();
//autoRelauncher.setupDefaults();
autoRelauncher.start();