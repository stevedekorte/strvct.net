"use strict";

/* 
    VoiceChat

*/

(class VoiceChat extends Base {
    initPrototypeSlots () {
    }

    init () {
        super.init()
        this.setIsDebugging(true)
    }

}.initThisClass());


// ------------------------------------------------------------------------------


// --- voice call code ------------------

function updateCalleeVoiceRequestButton(calleeID, call) {
    const listItem = document.querySelector(`li[data-id="${calleeID}"]`);
    if (!listItem) {
      console.error("Couldn't find list item element for callee ID:", calleeID);
      return;
    }
  
    const userActions = listItem.parentNode.querySelector(".user-actions");
    if (!userActions) {
      console.error(
        "Couldn't find user actions element for callee ID:",
        calleeID
      );
      return;
    }
  
    const voiceRequestButton = userActions.querySelector("button");
    if (!voiceRequestButton) {
      console.error(
        "Couldn't find voice request button for callee ID:",
        calleeID
      );
      return;
    }
  
    voiceRequestButton.textContent = "End Voice Call";
    voiceRequestButton.onclick = () => {
      call.close();
      voiceRequestButton.textContent = "Request Voice Call";
      voiceRequestButton.onclick = null;
    };
  }
  
  
  function handleVoiceRequestButton(userActions, calleeID) {
    // Voice request button
    const voiceRequestButton = document.createElement("button");
    voiceRequestButton.textContent = "Request Voice Call";
    let isVoiceCallActive = false;
    let activeCalls = {}; // Store active calls
  
    voiceRequestButton.onclick = () => {
      if (!isVoiceCallActive) {
        // Start the voice call
        console.log("Requesting voice call with " + calleeID);
        voiceRequestButton.textContent = "End Voice Call";
        const call = HostSession.shared()
          .peer()
          .call(calleeID, Microphone.shared().userAudioStream());
        activeCalls[calleeID] = call;
  
        call.on("stream", (remoteStream) => {
          handleRemoteStream(remoteStream);
        });
        call.on("close", () => {
          console.log("Call with peer:", call.peer, "has ended");
          voiceRequestButton.textContent = "Request Voice Call";
          isVoiceCallActive = false;
          delete activeCalls[calleeID]; // Remove the call from activeCalls
        });
      } else {
        // End the voice call
        const call = activeCalls[calleeID];
        if (call) {
          call.close();
          delete activeCalls[calleeID];
        }
        voiceRequestButton.textContent = "Request Voice Call";
      }
      isVoiceCallActive = !isVoiceCallActive;
    };
    userActions.appendChild(voiceRequestButton);
  }
  
  function handleRemoteStream(remoteStream) {
    const audioContext = new AudioContext();
    const audioElement = new Audio();
  
    audioElement.srcObject = remoteStream;
    audioElement.play();
  
    const audioSource = audioContext.createMediaStreamSource(remoteStream);
    const stereoPanner = audioContext.createStereoPanner();
    stereoPanner.pan.value = 0; // Pan the audio evenly between left and right channels
  
    audioSource.connect(stereoPanner);
    stereoPanner.connect(audioContext.destination);
  }
  