"use strict";

require("./getGlobalThis.js");
require("./Base.js");
const fs = require('fs');
const { spawn } = require('child_process');

(class AutoRelauncher extends Base {

    initPrototypeSlots () {
		this.newSlot("filePath", null);
		this.newSlot("launchCommand", null);
		this.newSlot("launchArgs", null);
		this.newSlot("keyPath", null);
		this.newSlot("checkInterval", 5000);
		this.newSlot("intervalId", null);
    }
  
    initPrototype () {
	}

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

    stop () {
        if (this.intervalId()) {
            clearInterval(this.intervalId());
        }
    }

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

    restartProcess () {
        spawn(this.launchCommand(), this.launchArgs(), {
            stdio: 'inherit',
            detached: true,
            shell: true
        }).unref();

        process.exit();
    }

    setupDefaults () {
        autoRelauncher.setFilePath("./shouldRelaunchNow.txt");
        autoRelauncher.setLaunchCommand("bash");
        autoRelauncher.setLaunchArgs(['/home/protected/run.sh']);
    }

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

