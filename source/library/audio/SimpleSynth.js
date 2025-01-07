/**
 * @module library.audio
 * @class SimpleSynth
 * @extends ProtoClass
 * @classdesc
 * A simple audio synthesizer for playing sequences of notes in the browser.
 * You can play either a simple note sequence, or a sequence of notes with individual pitch, length, oscillator, delay, and volume details.
 *
 * Example usess:
 *
 * const synth = SimpleSynth.shared();
 * 
 * Play by method name:
 * synth.playSendBeep();
 * synth.playReceiveBeep();
 * synth.playButtonTap();
 * synth.playButtonDown();
 * synth.playButtonUp();
 * synth.playButtonCancelled();
 * 
 * Play by track name string:
 * synth.playTrackNamed("buttonPress");
 *
 * Play by track notes array:
 * synth.playNotes([440, 330, 220, 110]);
 * 
 * Play by track dict notes array:
 * synth.playTrackNotes([{pitch: 440, lengthMs: 1000, oscillator: "sine", delayMs: 100, volume: 0.7}]);
 *
 */
"use strict";

(class SimpleSynth extends ProtoClass {

  static initClass() {
    this.setIsSingleton(true);
  }

  initPrototypeSlots() {
    //this.newSlot("idb", null);
  }

  initPrototype() {
  }

  /**
   * @description Creates a new AudioContext object for generating sound.
   * @returns {AudioContext} The new AudioContext object.
   * @category Audio Context
   */
  audioContext() {
    const context = new (window.AudioContext || window.webkitAudioContext)();
    return context;
  }

  /**
   * @description Plays an ominous sound using the Web Audio API.
   * @category Sound Effects
   */
  playOminousSound() {
    const audioContext = this.audioContext();

    const notes = [110, 123.47, 130.81, 146.83]; // Frequencies for notes A2, B2, C3, and D3

    notes.forEach((note, index) => {
      const startTime = audioContext.currentTime + index * 0.5;
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.frequency.value = note;
      oscillator.type = index % 2 === 0 ? "sine" : "triangle";
      gainNode.gain.setValueAtTime(0.2, startTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + 0.5);

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.start(startTime);
      oscillator.stop(startTime + 0.5);
    });
  }

  /**
   * @description Plays an array of notes using the Web Audio API.
   * @param {number[]} notes - An array of frequencies (in Hz) to play.
   * @category Sound Generation
   */
  playNotes(notes) {
    /*
    The given function playNotes plays an array of notes using the Web Audio API. 
    Each note in the array is played for a duration of 0.1 seconds (100 milliseconds) with a delay of 0.1 seconds between each note. 
    The gain or volume of the notes is set to a low value of 0.02 to ensure that the notes are not too loud.
    */
    const context = this.audioContext();
    const gainNode = context.createGain();
    const volume = 0.1; //0.02;

    gainNode.gain.setValueAtTime(volume, context.currentTime);
    gainNode.connect(context.destination);

    notes.forEach((note, index) => {
      const oscillator = context.createOscillator();
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(
        note,
        context.currentTime + index * 0.1
      );

      oscillator.connect(gainNode);
      oscillator.start(context.currentTime + index * 0.1);
      oscillator.stop(context.currentTime + index * 0.1 + 0.1);
    });
  }

  /**
   * @description Plays a send beep sound.
   * @category Sound Effects
   */
  playSendBeep() {
    this.playNotes([330, 290]);
  }

  /**
   * @description Plays a receive beep sound.
   * @category Sound Effects
   */
  playReceiveBeep() {
    this.playNotes([290, 330]);
  }

  /**
   * @description Plays a button tap sound.
   * @category Sound Effects
   */
  playButtonTap() {
    //this.playNotes([440]);
    this.playTrackNamed("buttonPress");
  }

  /**
   * @description Plays a button down sound.
   * @category Sound Effects
   */
  playButtonDown() {
    //this.playNotes([400]);
    this.playTrackNamed("buttonPress");
  }

  /**
   * @description Plays a button up sound.
   * @category Sound Effects
   */
  playButtonUp() {
    this.playNotes([480]);
  }

  /**
   * @description Plays a button cancelled sound.
   * @category Sound Effects
   */
  playButtonCancelled() {
    this.playNotes([440, 330]);
  }

  /**
   * @description Plays a network connected sound.
   * @category Sound Effects
   */
  playNetworkConnected() {
    this.playNotes([300, 400, 500]);
  }

  /**
   * @description Plays a network disconnected sound.
   * @category Sound Effects
   */
  playNetworkDisconnected() {
    this.playNotes([500, 400, 300]);
  }

  /**
   * @description Plays a warning sound.
   * @category Sound Effects
   */
  playWarning() {
    this.playNotes([420, 450]);
  }

  /**
   * @description Plays an alert sound.
   * @category Sound Effects
   */
  playAlert() {
    playNotes([600, 660, 600]);
  }

  /**
   * @description Plays a named track of notes.
   * @param {string} trackName - The name of the track to play.
   * @category Sound Playback
   */
  playTrackNamed(trackName) {
    const notes = this.tracksJson()[trackName];

    if (!notes) {
      console.warn("no track with name " + trackName + "'");
      return
    }

    this.playTrackNotes(notes)
  }

  /**
   * @description Plays a track of notes.
   * @param {Object[]} notes - An array of note objects with properties like pitch, lengthMs, oscillator, delayMs, and volume.
   * @category Sound Playback
   */
  playTrackNotes(notes) {
    const context = this.audioContext();
    let currentTime = context.currentTime;

    notes.forEach(note => {
        const oscillator = context.createOscillator();
        const gainNode = context.createGain();

        // Set the oscillator type
        oscillator.type = note.oscillator || "sine";

        // Set the oscillator frequency
        oscillator.frequency.setValueAtTime(note.pitch, currentTime);

        // Set the volume
        gainNode.gain.setValueAtTime(note.volume || 0.7, currentTime); // Default to 0.7 if volume is not provided

        // Connect the oscillator to the gain node and the gain node to the destination
        oscillator.connect(gainNode);
        gainNode.connect(context.destination);

        // Start and stop the oscillator based on the note's length
        oscillator.start(currentTime);
        oscillator.stop(currentTime + (note.lengthMs / 1000)); // Convert milliseconds to seconds

        // Update the current time to include the note's length and delay to the next note
        currentTime += (note.lengthMs + (note.delayMs || 100)) / 1000; // Convert the total milliseconds to seconds
    });
  }

  /**
   * @description Returns an object containing various tracks of notes.
   * @returns {Object} An object with track names as keys and arrays of note objects as values.
   * @category Sound Data
   */
  tracksJson() {
    return {
      "buttonPress": [
        { "pitch": 400, "lengthMs": 100, "oscillator": "sine", "delayMs": 100, "volume": 0.7 }
      ],
      "buttonRelease": [
        { "pitch": 480, "lengthMs": 100, "oscillator": "sine", "delayMs": 100, "volume": 0.7 }
      ],
      "buttonCancel": [
        { "pitch": 440, "lengthMs": 50, "oscillator": "sine", "delayMs": 50, "volume": 0.6 },
        { "pitch": 330, "lengthMs": 50, "oscillator": "sine", "delayMs": 50, "volume": 0.6 }
      ],
      "connectionEstablished": [
        { "pitch": 300, "lengthMs": 100, "oscillator": "sine", "delayMs": 100, "volume": 0.7 },
        { "pitch": 400, "lengthMs": 100, "oscillator": "sine", "delayMs": 100, "volume": 0.7 },
        { "pitch": 500, "lengthMs": 100, "oscillator": "sine", "delayMs": 100, "volume": 0.7 }
      ],
      "connectionDisconnected": [
        { "pitch": 500, "lengthMs": 50, "oscillator": "sine", "delayMs": 50, "volume": 0.8 },
        { "pitch": 400, "lengthMs": 50, "oscillator": "sine", "delayMs": 50, "volume": 0.8 },
        { "pitch": 300, "lengthMs": 50, "oscillator": "sine", "delayMs": 50, "volume": 0.8 }
      ],
      "logWarning": [
        { "pitch": 420, "lengthMs": 75, "oscillator": "sine", "delayMs": 25, "volume": 0.6 },
        { "pitch": 450, "lengthMs": 100, "oscillator": "sine", "delayMs": 100, "volume": 0.6 }
      ],
      "alert": [
        { "pitch": 600, "lengthMs": 75, "oscillator": "square", "delayMs": 25, "volume": 0.9 },
        { "pitch": 660, "lengthMs": 75, "oscillator": "square", "delayMs": 25, "volume": 0.9 },
        { "pitch": 600, "lengthMs": 75, "oscillator": "square", "delayMs": 100, "volume": 0.9 }
      ]
    };
  }

}.initThisClass());