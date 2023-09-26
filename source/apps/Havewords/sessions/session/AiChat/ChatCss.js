"use strict";

/*

*/

WebDocument.shared().addStyleSheetString(`
      :root {
        --AiChatMessages-font-family: inherit; 
        --AiChatMessages-font-weight: inherit; 
    
        --drop-cap-font-family: inherit; 
    
        --chapterNumber-family: inherit; 
        --chapterNumber-letter-spacing: 0.1em;
    
        --chapterTitle-family: inherit; 
        --chapterTitle-text-transform: capitalize;
        --chapterTitle-letter-spacing: 0.2em;
    
        --bookTitle-family: inherit; 
    
        --body-background-color: #222;
        --body-color: rgba(255, 255, 255, 0.8);
      }

      .drop-cap {
        font-family: var(--drop-cap-font-family);
        float: left;
        font-size: 4.7em;
        font-weight: bold;
        line-height: 1.5em;
        margin-right: 0.15em;
        margin-top: -0.2em;
        margin-bottom: -0.5em;
      }

      .chapterNumber {
        font-family: var(--chapterNumber-font-family);
        text-transform: var(--chapterTitle-text-transform);
        letter-spacing: var(--chapterNumber-letter-spacing);
        font-size: 1.2em;
        font-weight: bold;
        width: 100%;
        text-align: center;
        padding-top: 2em;
        padding-bottom: 0em;
      }

      .chapterImage {
        font-family: var(--chapterImage-font-family);
        display: flex;
        width: 100%;
        justify-content: center;
        padding-top: 0em;
        padding-bottom: 0em;
      }

      .chapterTitle {
        font-family: var(--chapterTitle-font-family);
        text-transform: var(--chapterTitle-text-transform);
        letter-spacing: var(--chapterNumber-letter-spacing);
        font-size: 2em;
        line-height: 1.3em;
        font-weight: normal;
        font-style: normal;
        width: 100%;
        text-align: center;
        padding-top: 0em;
        padding-bottom: 2em;
      }

      .bookTitle {
        font-family: var(--bookTitle-font-family);
        font-size: 2em;
        line-height: 1.3em;
      }

      /*--- end theme related styles --- */

      .whitespace {
        white-space: pre;
      }

      .quote {
        font-style: italic;
      }

      .handWritten {
        font-family: Sand Dunes;
        /* probably want to customize this for the adventure period */
        line-height: 1.9em;
        font-size: 1.1em;

        margin: 1.5em;

        padding-left: 2em;
        padding-right: 2em;

        padding-top: 1.5em;
        padding-bottom: 1.5em;

        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 0.3em;
        opacity: 0.8;

        text-align: left;
        /* so writing doesn't readjust  */
      }

      .fadeInWord {
          animation-duration: 1.1s;
          animation-name: fadeInWordsAnimation;
          animation-iteration-count: 1;
      }
      
      @keyframes fadeInWordsAnimation {
          0% {
              opacity: 0;
          }
          100% {
              opacity: 1;
          }
      }


      .sceneSummary {
        display: none;
        min-width: 100%;
        text-align: center;
        font-style: italic;
        padding-bottom: 1em;
        opacity: 0.5;
      }

      .playerInfo {
        display: none;
        font-style: italic;
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 0.5em;
        opacity: 0.5;
        white-space: pre-wrap;
      }

      /* --- dice box --- */
      #diceBox {
        position: absolute;
        top: 0;
        left: 0;
        box-sizing: border-box;
        width: 100%;
        height: 100%;
        background-color: transparent;
        pointer-events: none;
      }

      #diceBox canvas {
        width: 100%;
        height: 100%;
        z-index: 1;
        pointer-events: none;
        background-color: transparent;
      }

      /* --- Dice Roll Messages --- */

      .rollRequest h3 {
        font-weight: normal;
      }

      /* --- DiceBoxView --- */

      span.criticalSuccessRoll {
        font-weight: bold;
      }

      span.criticalFailureRoll {
        font-weight: bold;
      }

      span.criticalFailureRoll {
        font-weight: bold;
      }

      span.ignoredRoll {
        color: #888;
      }

      /* --- RollPanelView --- */

      #rollPanelView {
        position: absolute;
        margin: 0px;
        padding: 1em;
        background-color: var(--body-background-color);
        color: var(--body-color);
        display: none;
        
      }

      #rollPanelView .rollPanelRow {
        display: flex;
        gap: 1em;
        align-items: baseline;
      }

      #rollPanelView .rollPanelButtons {
        text-align: center;
      }

      #rollPanelRollButton {
        margin-right: 1em;
      }

      #rollPanelTitle {
        margin: 0px;
        margin-bottom: 1em;
      }

      .rollPanelTitleRow {
        align-self: center;
      }

      #rollPanelView label {
        color: rgba(255, 255, 255, 0.8)
      }

      #rollPanelView input {
        margin-top: 0px;
      }

      #rollPanelView button {
        margin-top: 1em;
        padding: 0.25em;
        padding-left: 0.5em;
        padding-right: 0.5em;
        font-size: 16px;
      }

      #rollPanelView input[type="checkbox"] {
        position: relative;
        top: 0.1em;
      }
`);