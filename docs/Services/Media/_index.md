# Media

YouTube audio playback and browser speech recognition.

## SvYouTubeService

Manages YouTube-based audio playback via the IFrame Player API. The service contains a `SvYouTubeAudioPlayer` subnode that wraps a hidden YouTube player element.

### SvYouTubeAudioPlayer

The core playback class. Handles player lifecycle, volume, looping, and state tracking. The YouTube IFrame API script is loaded lazily on first use, and playback waits for a user gesture (browser autoplay policy).

```javascript
// Create a player and loop background music
const player = SvYouTubeAudioPlayer.clone();
player.setTrackName("Ambient Forest");
player.setVideoId("abc123xyz");
player.setShouldRepeat(true);
player.setVolume(0.1);
player.play();

// Control
player.stop();
player.togglePlay();
player.isPlaying();       // => boolean
player.stateName();       // => "playing" | "paused" | "buffering" | "ended"

// One-shot playback (resolves when video ends)
player.setShouldRepeat(false);
await player.play();

// Cleanup
await player.shutdown();  // destroys the YT.Player and removes the DOM element
```

### SvMusicLibrary

A higher-level layer that manages playlists of `SvMusicTrack` nodes loaded from a JSON resource file. Owns two `SvYouTubeAudioPlayer` instances — one for background music (low volume), one for sound effects (higher volume).

```javascript
// Play looping background music by track name
library.playTrackWithName("Mystical Forest");

// Play a one-shot sound effect
await library.playSoundEffectWithName("Sword Clash");

// Stop background music
library.musicPlayer().stop();

// Lookup
library.trackWithName("Battle Theme");       // => SvMusicTrack
library.playlists();                          // => SvMusicFolder[]
library.trackNames();                         // => String[]
```

Playlist data is a JSON object mapping folder names to track dictionaries:

```json
{
  "Fantasy": {
    "Mystical Forest": "YouTubeVideoId1",
    "Battle Theme": "YouTubeVideoId2"
  },
  "Sound FX": {
    "Sword Clash": "YouTubeVideoId3"
  }
}
```

### SvMusicTrack

Represents a single track with a YouTube video ID. Supports a delegate set for playback notifications:

```javascript
track.addDelegate(myObserver);
await track.play();
track.stop();
```

Delegates receive `onSoundStarted(track)` and `onSoundEnded(track)`.

## SvSpeechToTextSessions

Wraps the browser's native `SpeechRecognition` API for voice input. Each `SvSpeechToTextSession` tracks recognition state, language settings, and transcription results. Not a cloud service — all processing happens in the browser.

### SvSpeechToTextSession

```javascript
const session = SvSpeechToTextSession.clone();
session.setDelegate(myObject);
session.setLanguage("en-US");
session.setIsContinuous(true);
session.setGetInterimResults(true);
session.setInputTimeoutMs(1500);

// Start — returns a promise that resolves with the transcript
// when the input timeout fires (silence detected after speech)
const text = await session.start();

// Manual stop
session.stop();

// State
session.isRecording();
session.fullTranscript();       // accumulated text
session.interimTranscript();    // current partial text
```

### Delegate Protocol

All methods are optional. The session is passed as the first argument.

| Method | When |
|---|---|
| `onSpeechInterimResult(session)` | Partial result received |
| `onSpeechFinal(session)` | Finalized segment received, appended to `fullTranscript` |
| `onSpeechEnd(session)` | Browser speech recognition ended |
| `onSpeechInput(session)` | Input timeout elapsed — transcript is final |
| `onSessionEnd(session)` | Recognition service disconnected |
| `onSpeechError(session, error)` | Recognition error |

### Usage in SvTextView

Any text field supports voice input via Alt+L. Holding the key starts a session; releasing it stops recognition and inserts the transcript at the cursor:

```javascript
startSpeechToText () {
    this._speechSession = SvSpeechToTextSession.clone().setDelegate(this);
    this._speechSession.start();
}

onSpeechEnd (speechSession) {
    const s = speechSession.fullTranscript();
    this.insertTextAtCursorSimple(s);
    this._speechSession = null;
}
```
