"use strict";

//To get a list from a videos list page, scroll to the bottom, then open the console and type:

function getVideoslist () {
  let vids = document.getElementsByClassName(
    "yt-simple-endpoint focus-on-expand style-scope ytd-rich-grid-media"
  );
  let dict = {};
  for (const vid of vids) {
    let k = vid.getAttribute("aria-label");
    if (k.indexOf(" - ") != -1) {
      k = k.split(" - ")[1];
    }

    if (k.indexOf("(") != -1) {
      k = k.split("(")[0];
    }

    if (k.indexOf("|") != -1) {
      k = k.split("|")[0];
    }

    if (k.indexOf(" by ") != -1) {
      k = k.split(" by ")[0];
    }
    k = k.trim();

    let v = vid.getAttribute("href").split("=")[1];
    if (v.indexOf("&") != -1) {
      v = v.split("&")[0];
    }
    dict[k] = v;
  }
  return JSON.stringify(dict, null, 2);
}
getVideoslist();

//To get a list from a playlist page:

function getPlaylist () {
  let vids = document.getElementsByClassName(
    "yt-simple-endpoint style-scope ytd-playlist-video-renderer"
  );
  let dict = {};
  for (const vid of vids) {
    // get key

    let k = vid.getAttribute("title");
    if (k.indexOf(" - ") != -1) {
      k = k.split(" - ")[1];
    }

    if (k.indexOf("(") != -1) {
      k = k.split("(")[0];
    }

    if (k.indexOf(" by ") != -1) {
      k = k.split(" by ")[0];
    }
    k = k.trim();

    // get value

    let v = vid.getAttribute("href").split("=")[1];
    if (v.indexOf("&") != -1) {
      v = v.split("&")[0];
    }
    dict[k] = v;
  }
  return JSON.stringify(dict, null, 2);
}
getPlaylist();

//TODO: move this to node script
