"use strict";

/* 
    Nickname

*/

(class Nickname extends Base {
    // This section is for creating a random nickname for the users
    static _adjectives = [
    "wacky",
    "spunky",
    "quirky",
    "zany",
    "kooky",
    "cranky",
    "sassy",
    "snarky",
    "dorky",
    "goofy",
    "dizzy",
    "silly",
    "sneaky",
    "bizarre",
    "nutty",
    "loopy",
    "whimsical",
    "rambunctious",
    "witty",
    "zesty",
    "bouncy",
    "peppy",
    "jazzy",
    "zippy",
    "fuzzy",
    "fizzy",
    "dizzying",
    "snappy",
    "flashy",
    "giddy",
    "hilarious",
    "absurd",
    "eccentric",
    "bizarre",
    "groovy",
    "boisterous",
    "ridiculous",
    "zonked",
    "kooky",
    "blazing",
    "snarling",
    "gnarly",
    "scowling",
    "grumpy",
    "fiery",
    "spiteful",
    "malevolent",
    "sinister",
    "nasty",
    "cynical",
    "cranky",
    "wicked",
    "vicious",
    "brutish",
    "malicious",
    "sardonic",
    "scathing",
    "venomous",
    "rude",
    "insolent",
  ];
  
  static _nouns = [
    "cheese-sculptor",
    "llama-farmer",
    "plumber-from-mars",
    "pro-thumb-wrestler",
    "underwater-basket-weaver",
    "fortune-cookie-writer",
    "pro-goose-caller",
    "ninja-warrior",
    "yo-yo-champion",
    "extreme-couponer",
    "cat-acrobat",
    "roadkill-collector",
    "cactus-whisperer",
    "quilt-sniffer",
    "stilt-walker",
    "cheese-grater",
    "gum-chewer",
    "lint-collector",
    "toe-wrestler",
    "pizza-acrobat",
    "bubble-wrap-popper",
    "dance-machine",
    "dream-interpreter",
    "taco-taster",
    "circus-clown",
    "pogo-stick-champion",
    "pillow-fight-champion",
    "speed-talker",
    "disco-ball-spinner",
    "gum-bubble-blower",
    "electric-scooter-rider",
    "balloon-animal-maker",
    "chicken-whisperer",
    "juggler-extraordinaire",
    "glow-stick-dancer",
    "sock-collector",
    "pineapple-juggler",
    "extreme-hiker",
    "karaoke-superstar",
    "chainsaw-juggler",
    "garbage-collector",
    "sewer-inspector",
    "human-ashtray",
    "rat-tamer",
    "insect-farmer",
    "denture-collector",
    "professional-complainer",
    "rotten-egg-collector",
    "cigarette-licker",
    "taxidermist-apprentice",
    "snail-racer",
    "feral-cat-wrangler",
  ];
  
  static _hostAdjectives = [
    "authoritative",
    "confident",
    "decisive",
    "determined",
    "focused",
    "smug",
    "influential",
    "inspiring",
    "knowledgeable",
    "motivated",
    "powerful",
    "proactive",
    "professional",
    "respected",
    "strategic",
    "successful",
    "visionary",
    "wise",
    "ambitious",
    "charismatic",
    "jocund",
    "halcyon",
    "ephemeral",
    "furtive",
    "incognito",
    "scintillating",
    "quixotic",
    "mellifluous",
    "susurrant",
    "penultimate",
    "euphonious",
    "ethereal",
    "effervescent",
    "fecund",
    "serendipitous",
    "melismatic",
    "obfuscating",
    "quintessential",
    "nebulous",
    "luminous",
  ];
  
  static _hostNouns = [
    "kite-surfer",
    "glass-blower",
    "lightning-catcher",
    "ice-sculptor",
    "cloud-watcher",
    "waterfall-climber",
    "fire-breather",
    "snowboarder",
    "flower-arranger",
    "labyrinth-builder",
    "skydiver",
    "volcano-tracker",
    "bird-whisperer",
    "meteor-watcher",
    "moon-walker",
    "aurora-chaser",
    "tide-pool-explorer",
    "forest-ranger",
    "wilderness-explorer",
    "glacier-trekker",
    "rainbow-chaser",
    "thunderbolt-rider",
    "desert-navigator",
    "jungle-explorer",
    "storm-chaser",
    "tropical-paradise-traveler",
    "mushroom-hunter",
    "sahara-trekker",
  ];

    initPrototypeSlots () {
        //this.newSlot("idb", null)
    }

    init () {
        super.init()
    }

    static pickFrom (anArray) {
        return anArray[Math.floor(Math.random() * anArray.length)];
    }

    static generateHostNickname () {
        const adjective = this.pickFrom(this._hostAdjectives);
        const noun = this.pickFrom(this._hostNouns);
        return `${adjective}-${noun}`;
      }
      
    static generateNickname () {
        const adjective = this.pickFrom(this._adjectives);
        const noun = this.pickFrom(this._nouns);
        return `${adjective}-${noun}`;
    }

}.initThisClass());



