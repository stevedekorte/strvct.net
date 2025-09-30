"use strict";

/*
    OpenAiModels

*/


(class OpenAiModels extends BMSummaryNode {
    initPrototypeSlots () {
        this.newSlot("models", null);
        this.newSlot("didModelCheck", false);
    }

    init () {
        super.init();
        this.setTitle("models");
        this.setShouldStore(true);
        this.setShouldStoreSubnodes(true);
    }

    finalInit () {
        super.finalInit();
        this.nodeSubtitleIsChildrenSummary(true);
        this.setNodeSubtitleIsChildrenSummary(true);
        this.syncModelsToAllModelNames();
    }

    syncModelsToAllModelNames () {
        this.removeSubnodesWithTitlesNotInArray(this.allModelNames());

        const models = this.allModelNames().map(name => {
            const subnode = this.firstSubnodeWithTitle(name);
            if (!subnode) {
                const model = OpenAiChatModel.clone().setName(name);
                this.addSubnode(model);
            }
        });
        return this;
    }

    removeSubnodesWithTitlesNotInArray (titles) {
        const subnodesToRemove = this.subnodes().select(sn => !titles.includes(sn.title()));
        this.removeSubnodes(subnodesToRemove);
        return this;
    }

    didInit () {
        super.didInit();
        //this.asyncCheckAvailability()
        this.makeAllModelsAvailable();
    }

    service () {
        return this.parentNode();
    }

    allModelNames () {
    // model names with versions numbers are ones soon to be depricated,
    // so we don't include those, to avoid wasting requests
        const names = [];
        names.push("gpt-4");
        //names.push("gpt-4-1106-preview");
        /*
    names.push("gpt-4-32k")
    names.push("gpt-3.5-turbo")
    names.push("gpt-4-0613")
    names.push("gpt-3.5-turbo-0613")
    */
        return names;
    }

    makeAllModelsAvailable () {
        for (const model of this.subnodes()) {
            model.setIsAvailable(true);
        }
    }

    async asyncCheckAvailability () {
        for (const model of this.subnodes()) {
            model.asyncCheckAvailability();
        }
    }

}.initThisClass());
