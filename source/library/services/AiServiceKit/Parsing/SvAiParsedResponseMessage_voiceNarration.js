"use strict";

/**

    @class SvAiParsedResponseMessage_voiceNarration
    @extends SvAiParsedResponseMessage
    @description A class for voice narration of AI response messages.

*/

(class SvAiParsedResponseMessage_voiceNarration extends SvAiParsedResponseMessage {

    // TODO: make a generic protocol for voice narration, without session and settings dependencies

    didUpdateIsDoneSpeaking (oldValue, newValue) {
        if (newValue) {
            //this.clearAnyQueuedAudio();
        }
    }

    tagsToSpeak () {
        return ["sentence"];
    }

    // --- voice narration ---

    playTtsPauseMs (ms) {
        assert(Type.isNumber(ms));
        this.voiceNarrateText("<break time=\"" + ms + "ms\"/>");
    }

    shouldVoiceNarrate () {
        const controller = this.narrationController();
        if (!controller) { return false; }
        return !this.isDoneSpeaking() && controller.isEnabled();
    }

    stopSpeaking () {
        this.setIsDoneSpeaking(true);
        const controller = this.narrationController();
        if (controller) {
            controller.stopSpeaking();
        }
        return this;
    }

    session () {
        const conv = this.conversation();
        if (!conv) { return null; }
        return conv.firstOwnerChainNodeOfClass(UoSession);
    }

    narrationController () {
        const session = this.session();
        if (!session || typeof session.narrationController !== "function") { return null; }
        return session.narrationController();
    }

    voiceNarrateText (text) {
        const controller = this.narrationController();
        if (!controller) { return; }
        const sound = controller.queueNarrationSegment(text);
        if (!sound) { return; }
        // we want to follow when the sound starts/stops playing so we can
        // highlight/unhighlight the text in the chat view
        sound.addDelegate(this);
        sound.setTranscript(text); // so delegate callbacks know which text the audio is for
    }

    onSoundStarted (sound) {
        //console.log(this.svType() + ".onSoundStarted [" + sound.transcript().clipWithEllipsis(15) + "]");
        this.onSpeakingText(sound.transcript());
    }

    onSpeakingText (text) {
        this.postNoteNamed("onSpeakingText").setInfo(text); //.setIsDebugging(true);
    }

    onSoundEnded (sound) {
        //console.log(this.svType() + ".onSoundEnded [" + sound.transcript().clipWithEllipsis(15) + "]");
        this.onSpokeText(sound.transcript());
    }

    onSpokeText (text) {
        this.postNoteNamed("onSpokeText").setInfo(text); //.setIsDebugging(true);
    }

    /*
    onSoundStarted (aNote) {
        const sound = aNote.sender();
        this.postNoteNamed("onSpeakingText").setInfo(sound.transcript());
    }

    onSoundEnded (aNote) {
        const sound = aNote.sender();
        this.postNoteNamed("onSpokeText").setInfo(sound.transcript());
    }

    spokenContentOfText (text) {
        return text.stripHtmlElementsWithTagNames(this.unspeakableTagNames());
    }
  */

}).initThisCategory();

