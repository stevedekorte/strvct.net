/*
<option value="DnD">Traditional D&D</option>
<option value="Conan">Conan (Robert E. Howard)</option>
<option value="HarryPotter">Harry Potter (J.K. Rowling)</option>
<option value="StudioGhibli">Studio Ghibli</option>
<option value="Naruto">Naruto</option>
<option value="NorseMythology">Norse Mythology</option>
<option value="Greek Mythology">Greek Mythology</option>
<option value="Dune">Dune (Frank Herbert)</option>
<option value="Star Wars">Star Wars (George Lucas)</option>
<option value="Cyberpunk">Cyberpunk (William Gibson)</option>
<option value="Discworld">Discworld (Terry Pratchett)</option>
<option value="HitchhikersGuide">Hitchhikers Guide to the Galaxy (Scott Adams)</option>



Humor:
  Father Ted
  PG Wodehouse
  Evelyn Waugh
  Saki (H.H. Munro)
  Mark Twain
  Douglas Adams
  Terry Pratchett
  Oscar Wilde
  The Princess Bride
  Austin Powers
  Rick and Morty
  The Office
  Seinfeld
  Friends
  Monty python the Holy Grail
  Blackadder
  Arrested development

Fiction:
  Haruki Murakami

Fantasy (kids):
  Disney: Moana, The Little Mermaid, Frozen
  The Never ending Story
  Adventure Time
  Pokeman, Mario, Zelda  
  The Nightmare Before Christmas
  Diana Wynne Jones: Her Chrestomanci series and other fantasy novels often feature young protagonists who discover magical worlds.
  C.S. Lewis: The Chronicles of Narnia series, like Harry Potter, involves children entering a magical world and playing crucial roles in its conflicts.
  Cornelia Funke: Her Inkheart trilogy is a magical adventure where characters can bring book worlds to life by reading aloud.
  Lemony Snicket (Daniel Handler): A Series of Unfortunate Events shares the Harry Potter series' mixture of darkness, humor, and the resilience of children.
  Brandon Mull: His Fablehaven series is a magical adventure filled with mythical creatures and heroic deeds.

Fantasy (young adult):
  Suzanne Collins: The Hunger Games trilogy doesn't involve magic, but it's a gripping young adult series with strong themes of survival, rebellion against tyranny, and moral choices.

Fantasy (adult):
  Tolkien, the Hobbit
  Rick Riordan

  Like Rowling:
    Rick Riordan
    Neil Gaiman: While his works vary in tone and subject matter, books like Coraline and The Graveyard Book may appeal to Harry Potter fans.

Action / Adventure:
  The Road Warrior
  Stranger things
  Indiana Jones
  Game of thrones, Fire and Ice
  Ian Flemming, James Bond

Mystery:
  Sherlock Holmes 
  Twin Peaks
  Lost
  Agatha Christie (Poirot, Miss Marple)

Cyberpunk: 
  Max Headroom
  The Matrix
  Blade Runner
  William Gibson
  Philip K Dick
  Snow Crash by Neal Stephenson 
  Freedom series by Daniel Suarez
  The Windup Girl by Paolo Bacigalupi
  The Demolished Man by Alfred Bester
  Her Smoke Rose Up Forever anthology by James Tiptree Jr. AKA Alice Bradley Sheldon
  When Gravity Fails by George Alec Effinger
  TRON
  Wargames

SciFi:
  Doctor Who
  Star Trek
  Star Wars, George Lucas
  Dune
  SCP Foundation
  Back to the Future, Steven Speilberg
  Foundation series
  Three body problem 

Anime:
  Aeon Flux
  Naruto 
  Star Blazers 
  Attack on Titan
  Akira
  Thunder the Barbarian
  Dungeons and Dragons cartoon
  He Man

Fantasy (Comic Books):
  Marvel DC
  X-men 

Dark Fantasy (adult):
  Black mirror

  Battlestar Galactica

Fantasy Period:
  Downton Abby
  The Crown
  The Great Gadbsy

  

  THEMES:
  Light Theme:
  {
    color: "#000",
    backgroundColor: "#F2EDE8",
  }


*/

getGlobalThis().sessionOptionsJson = [
  {
    value: "fantasyRoleplay",
    label: "Fantasy",
    description: `Choose from various fantasy worlds to embark on an exciting roleplaying adventure with your friends. The AI Dungeon Master will guide you through the story and help you create memorable moments.`,
    gameMode: true,
    promptSuffix: `You are our guide, describing the settings and the characters, and making the fictional world come alive for our group.
    Formatting: Don't use Markdown, only use HTML. Respond with HTML but only using the formatting described here.
    Do not use <p></p> for paragraphs. 
    Please place any quoted speech within <span class="quote"></span> tags.
    
    Messages: Each player will respond with their own name at the beginning of the message for you to identify them. 
    
    You can ask players what actions they will take. Keep track of them individually but try not to split the party.
    
    Dialogue: Never speak for the players. Use dialogue for the characters you are describing frequently, always in quotation marks. 
    Make the dialogue realistic based on what you know of the character. Give the characters emotions fitting to the situation. 
    Remember there are multiple players, and dialogue is usually happening within a group.
    
    Plot: Describe only the next step of the adventure based on the player input. 
    Don't take actions on the player's behalf, always let the player make the decisions.
    Remember there are multiple players, and descriptions of scenes should include more than just one player. 
    The story should only progress when the player has made a decision about how to move forward. 
    If it's not clear what options the player might choose, you might suggest some.
    Do not progress the story if the player is still engaged in dialogue (unless the dialogue is describing them taking a specific action). 
    
    Players should sometimes fail, especially if their request is unrealistic given the setting and world. 
    The plot should be challenging but fun, including puzzles, riddles, or combat.
    
    Beginning the session: Give us very brief character descriptions fitting the world theme (with our names in bold), 
    and then start the session.\n
    The player names are: [playerNames].
    
    When the session begins, please create and title for the first chapter of the adventure and 
    place the chapter number (written in words, not number characters) within <div class=chapterNumber></div> 
    followed by the tags <div class=chapterImage></div> 
    and the chapter name within <div class=chapterTitle></div> tags. 
    
    When you being a chapter, or when you introduce the players to a new scene in the story, please start your response with a single
    <div class=sceneSummary></div> tag containing a description that could be used to generate an image of the scene.
    The players will not see the contents of this tag, but it will be used to generate an image for them to see.
    
    When quoting text which is handwritten, such as from a handwritten letter, please surround it with <div class=handWritten></div> tags.
    
    If the story is inspired by a certain author's writings, do not mention the author's name when introducing the story.
    
    When it feels like a new chapter is beginning, please create a title for it in a similar manner. 
    Also, please place the first letter of the first word in each chapter within an HTML span element whose class is set to "drop-cap".
    
    When you feel the story is completed, please end by saying we have come to it's conclusion, followed by a fitting title for the story 
    as if it were a book title and place it with <div class=bookTitle></div> tags, and follow this with a brief summary of the story that 
    covers the adventure's most dramatic moments and most important player actions.
    
    Again, do not make decisions for the players.`,
    musicPlaylists: ["DnD"],
    theme: {
      fontFamily: "inherit",
      headerFontFamily: "inherit",
      backgroundColor: "#222",
      color: "rgb(219, 219, 219)",
      headerFontTextTransform: "capitalize",
      chapterNumberLetterSpacing: "0.1em",
      chapterTitleLetterSpacing: "0.2em",
    },
    options: [
      {
        label: "Dungeons & Dragons",
        value: "traditional fantasy",
        /*
        prompt: `Please play the roll of an dungeon master and lead us on a traditional campaign of Dungeons and Dragons. 
        The campaign should be epic and full of serious challenges. 
        This is a game played by adults and should not be a children's story or involve children as characters.`,
        */
        prompt: `Pretend you are we're playing a Dungeons and Dragons 5th edition game. You're the dungeon master and we're the players. 
We create the story together, with you in charge of the setting, environment, non-player characters (NPCs), and their actions, as well as how my actions affect these elements. 
You can only describe my character's actions based on what I say they do. Please write your responses in the style that Robert E. Howard used in his novels.

You also decide if my character's actions are successful. Simple actions, like opening an unlocked door, are automatic successes. 
More complex actions, like breaking down a door, require a skill check. Ask me to make a skill check following D&D 5th edition rules when needed. 
Impossible actions, like lifting a building, are just that: impossible.

Make sure my actions fit the context of the setting. For example, in a fantasy tavern, there won't be a jukebox to play songs. 
Keep the setting consistent and don't allow players to invent items, locations, or characters.

When we start combat, roll for initiative, providing an order of action. Keep track of each creature's health points (HP), reducing them when damage is dealt. 
If a creature's HP reaches zero, they die.

[sessionSubtype2]

You make the decisions for NPCs and creatures. When introducing a new scene, include a <div class=sceneSummary></div> tag with a description for generating an image of the scene. 
Do not reference character names in the scene description, only describe them visually.

I'll provide my character's class, race, and alignment details. You'll generate their standard Dungeons and Dragons 5th edition stats, items, and other details. 
When providing a player's stats and items for a character, use a JSON format within a <div class=playerInfo></div> tag, and use separate tags for each player. 
When using a playerInfo div, *always* include the complete set of playerInfo info.
This should include a name property whose value is the player's name, and also an "appearance" property, providing a detailed physical description (which should not mention the character's name or use the word 'thick'). 

When a player's attributes change during the game, such as when their hitpoints decreases due to damage, or they gain or lose an item, 
please include a <div class=playerInfo></div> containing the updated JSON in your response.

Here is an example of the playerInfo JSON format:

{
  "name": "Foo",
  "level": 10,
  "race": "Human",
  "class": "Rogue",
  "alignment": "Neutral Good",
  "stats": {
    "strength": 14,
    "dexterity": 20,
    "constitution": 16,
    "intelligence": 14,
    "wisdom": 12,
    "charisma": 10
  },
  "armorClass": 17,
  "hitPoints": 75,
  "proficiencies": {
    "acrobatics": 7,
    "stealth": 9,
    "sleightOfHand": 9,
    "investigation": 6,
    "perception": 5,
    "thievesTools": 9
  },
  "equipment": {
    "rapier": {
      "damage": "1d8+5",
      "attackBonus": 9
    },
    "shortbow": {
      "damage": "1d6+5",
      "attackBonus": 9
    },
    "leatherArmor": {
      "armorClass": 12
    },
    "thievesTools": {},
    "dungeoneersPack": {},
    "cloakOfElvenkind": {}
  },
  "features": {
    "evasion": {},
    "uncannyDodge": {},
    "sneakAttack": "5d6"
  },
  "appearance": "..."
}

Here are the player character sheets (in JSON format) for the players in our game:

[playerCharacterSheets]

If any necessary details are empty (such as stats, armorClass, hitPoints, proficiencies, equitment, money, features or appearance), please generate those details and provide a playerInfo div with the results.

When you ask players to make dice rolls, remember to tell them:
- the reason for the roll
- the type of dice to roll
- how many dice to roll
- if there are any modifiers that apply
- the target roll they have to beat, if any
`,
        //prompt: "Please ask the player (Conan) to make an attack roll with advantage (2d20). Conan has +6 to hit and must beat an AC of 16 to succeed.",
        promptSuffix: " ",
        artPromptPrefix: "Painting in the style of Frank Frazetta of:",
        options: [
          {
            label: "AI generated adventure",
            subtitle: "",
            promptSuffix: `Before we begin playing, I would like you to provide my three adventure options. 
Each should be a short description of the kind of adventure we will play, and what the tone of the adventure will be. 
Once I decide on the adventure, you may provide a brief setting description and begin the game.`,
          },

          {
            label: "module",
            promptSuffix: "Please make the adventure a campaign using the DnD [selectedItemLabel] module.",
            options: [
              {
                label: "The Lost City",
                subtitle:
                  "Traps adventurers in an ancient, ruined city with a mysterious pyramid.",
              },
              {
                label: "Keep on the Borderlands",
                subtitle:
                  "Investigates a dangerous wilderness and a labyrinthine cave system known as the Caves of Chaos.",
              },
              {
                label: "The Temple of Elemental Evil",
                subtitle:
                  "Brings characters face-to-face with the dark gods of the universe.",
              },
              {
                label: "White Plume Mountain",
                subtitle:
                  "Tasks adventurers with retrieving three infamous weapons from a bizarre dungeon.",
              },
              {
                label: "Against the Giants",
                subtitle:
                  "Pits players against a series of giant-led monstrous forces.",
              },
              {
                label: "Descent into the Depths of the Earth",
                subtitle:
                  "Leads adventurers into the dark, subterranean world of the drow.",
              },
              {
                label: "Queen of the Spiders",
                subtitle:
                  "Culminates a series of adventures against the machinations of Lolth, the demon queen of spiders.",
              },
              {
                label: "The Tomb of Horrors",
                subtitle:
                  "Challenges adventurers with the deadliest dungeon, filled with lethal traps and cunning puzzles.",
              },
              {
                label: "Ravenloft",
                subtitle:
                  "Introduces the iconic villain Strahd von Zarovich in his haunted castle.",
              },
              {
                label: "The Hidden Shrine of Tamoachan",
                subtitle:
                  "Tests adventurers' ingenuity with Mayan/Aztec-themed puzzles and traps.",
              },
              {
                label: "The Village of Hommlet",
                subtitle:
                  "Begins a grand campaign against the forces of Elemental Evil.",
              },
              {
                label: "Palace of the Silver Princess",
                subtitle:
                  "Rescues a captured princess from her enchanted palace.",
              },
              {
                label: "Red Hand of Doom",
                subtitle:
                  "Thwarts the invasion plan of the destructive Red Hand hobgoblin army.",
              },
              {
                label: "Curse of Strahd",
                subtitle:
                  "Returns adventurers to the realm of Barovia and its vampiric master.",
              },
              {
                label: "Storm King's Thunder",
                subtitle:
                  "Combats a great conflict between giants and small folk.",
              },
              {
                label: "Tomb of Annihilation",
                subtitle:
                  "Faces a deadly curse in the dinosaur-filled jungles of Chult.",
              },
              {
                label: "Waterdeep: Dragon Heist",
                subtitle:
                  "Reveals a hidden treasure and conspiracies in the city of Waterdeep.",
              },
              {
                label: "Waterdeep: Dungeon of the Mad Mage",
                subtitle: "Explores the mega-dungeon of Undermountain.",
              },
              {
                label: "Ghost of Saltmarsh",
                subtitle:
                  "Features seafaring adventures and mystery in the coastal town of Saltmarsh.",
              },
              {
                label: "Baldur's Gate: Descent Into Avernus",
                subtitle:
                  "Journeys from the city of Baldur's Gate to the hellscape of Avernus.",
              },
              {
                label: "Icewind Dale: Rime of the Frostmaiden",
                subtitle:
                  "Survives the frozen wilderness of Icewind Dale under the shadow of a cruel god.",
              },
              {
                label: "Candlekeep Mysteries",
                subtitle:
                  "Solves a variety of mysteries originating from the books in the fortress library of Candlekeep.",
              },
            ],
          },
        ],
      },
      {
        label: "Harry Potter",
        value: "Harry Potter",
        prompt: `Overview: We are a group of players, exploring the fictional worlds and characters from the Harry Potter books and films. 
We'd like you to write this adventure as J.K. Rowling would.`,
        artPromptPrefix: "Mary GrandPré style pastel drawing of:",
        musicPlaylists: ["HarryPotter"],
        defaultMusicTrackId: "MgkIHQvCJRk",
        theme: {
          headerFontFamily: "Lumos",
          fontFamily: "Cardo",
        },
      },
      {
        label: "Studio Ghibli",
        value: "Studio Ghibli",
        /*        Spirited Away, My Neighbor Totoro, Howl's Moving Castle, Castle in the Sky, Kiki's Delivery Service, Porco Rosso, and others.*/
        prompt: `Overview: We are a group of players, exploring the fictional worlds and characters from Studio Ghibli films.
Please create an adventure of your own creation in this world for us that feels like it could be a part of a Studio Ghibli film.
Please remember that Totoro doesn't speak. In your adventure, please don't mention Studio Ghibli. 
Also, please do not make decisions for the players.`,
        artPromptPrefix:
          "Anime oil painting high resolution Ghibli inspired 4k.",
        musicPlaylists: ["StudioGhibli"],
        theme: {
          fontFamily: "Ghibli",
          headerFontFamily: "Ghibli",
          backgroundColor: "#109CEB",
          color: "rgba(255, 255, 255, 1)",
        },
      },
      {
        value: "Conan",
        label: "Conan the Barbarian",
        //subtitle: "Inspired by Robert E. Howard's books",
        prompt: `Please play the roll of an expert dungeon master and lead us on a campaign of your own creation in Robert E. Howard's Conan the Barbarian universe.
Feel free to borrow elements from the stories of H.P. Lovecraft, Clark Ashton Smith, or Lord Dunsany when you feel they fit well into the stories.
As in the books, the adventures should be of epic and deal with great challenges and mysteries - nothing mundane. 
The time period roughly corresponds to that of the earliest human civilations in the fertile cresent and while steel and magic exists in this universe, 
no modern technologies (such as guns, planes, or automobiles, etc) do. Do not mention any of the names of the authors.`,
        artPromptPrefix: "Painting in the style of Frank Frazetta of:",
        theme: {
          headerFontFamily: "Cardo",
          fontFamily: "Cardo",
        },
      },
      {
        label: "Norse Mythology",
        value: "Norse Mythology",
        prompt: `Please play the roll of an expert dungeon master and lead us on a campaign of your own creation in the [selectedItemLabel] universe.`,
        artPromptPrefix: "Painting in the style of Frank Frazetta of:",
        theme: {
          headerFontFamily: "Cardo",
          fontFamily: "Cardo",
        },
      },
      {
        label: "Discworld",
        value: "Discworld",
        prompt: `Please play the roll of an expert dungeon master and lead us on a campaign of your own creation in Terry Pratchett's[selectedItemLabel] universe. 
Do not mention any of the name of the author.`,
        artPromptPrefix: "Humorous 1980s comic book style frame of: ",
      },
      {
        label: "Hitchhiker's Guide to the Galaxy",
        value: "Hitchhiker's Guide to the Galaxy",
        prompt: `Please play the roll of an expert dungeon master and lead us on a campaign of your own creation in Douglas Adams's [selectedItemLabel] universe.
Do not mention any of the name of the author.`,
        artPromptPrefix: "Humorous 1980s comic book style frame of: ",
        theme: {
          headerFontFamily: "Harlow",
          headerFontTextTransform: "none",
          fontFamily: "Crimson",
          chapterNumberLetterSpacing: "0em",
          chapterTitleLetterSpacing: "0em",
        },
      },

      {
        label: "Lord Dunsany",
        value: "Lord Dunsany",
        prompt: `Please play the roll of an expert dungeon master and lead us on a campaign of your own creation in the realm of [selectedItemLabel]'s short stories.
Do not mention any of the name of the author.`,
        artPromptPrefix: "Painting in the style of Frank Frazetta of: ",
        theme: {
          headerFontFamily: "Cardo",
          fontFamily: "Cardo",
        },
      },

      {
        label: "H.P. Lovecraft",
        value: "H.P. Lovecraft",
        prompt: `Please play the roll of an expert dungeon master and lead us on a campaign of your own creation in the realm of [selectedItemLabel]'s short stories,
        including his unpublished Dream Quest to Unknown Kadath. These stories should be dark fiction, and typically lead to the player's demise.
        Do not mention any of the name of the author.`,
        artPromptPrefix: "Pen and ink illustration of:",
        theme: {
          fontFamily: "XTypewriter",
        },
      },

      {
        label: "Clark Ashton Smith",
        value: "Clark Ashton Smith",
        prompt: `Please play the roll of an expert dungeon master and lead us on a campaign of your own creation in the realm of [selectedItemLabel]'s short stories.
        These stories should be dark fiction, and almost always lead to the player's demise.
        Do not mention any of the name of the author.`,
        artPromptPrefix: "Pen and ink illustration of:",
        theme: {
          headerFontFamily: "Cardo",
          fontFamily: "Cardo",
        },
      },

      {
        label: "Thomas Ligotti",
        value: "Thomas Ligotti",
        prompt: `Please play the roll of the author Thomas Ligotti and lead us on an interactive fiction adventure of your own creation in the realm of his short stories.
        These stories always lead to the doom of the character the player is playing, but don't tell the player this.`,
        artPromptPrefix: "Dark art pen and ink illustration of:",
        fontFamily: "XTypewriter",
      },

      {
        label: "Jane Austen",
        value: "Jane Austen",
        prompt: `Overview: We are a group of players, exploring the fictional worlds and characters from the [selectedItemLabel] books and films. 
        We'd like you to write this adventure as [selectedItemLabel] would.`,
        artPromptPrefix:
          "Rich color lithograph in the style of Théodore Gericault of:",
        theme: {
          headerFontFamily: "Cardo",
          fontFamily: "Cardo",
        },
      },

      {
        label: "Anne Rice",
        value: "Anne Rice",
        prompt: `Please play the roll of the author [selectedItemLabel] and lead us on an interactive fiction adventure of your own creation in the realm of [selectedItemLabel]'s books.
        Do not mention the author's name while telling or describing the story. Do not take actions on the player's behalf.`,
        artPromptPrefix: "Pen and ink illustration of:",
        fontFamily: "XTypewriter",
        theme: {
          headerFontFamily: "Cardo",
          fontFamily: "Cardo",
        },
      },

      {
        label: "Twilight Saga",
        value: "Twilight Saga",
        prompt: `Please play the roll of an expert dungeon master and lead us on a campaign of your own creation in the realm of Stephenie Meyer's [selectedItemLabel]'s books and films.`,
        artPromptPrefix: "Pen and ink illustration of:",
        theme: {
          headerFontFamily: "Cardo",
          fontFamily: "Cardo",
        },
      },

      {
        label: "Cyberpunk",
        value: "Cyberpunk",
        prompt: `Please play the roll of an interactive story teller and lead us on a campaign of your own creation in the genre of Cyberpunk as inspired by the books of
        William Gibson. Please create your own stories by try to replicate William Gibson's style of prose.`,
        artPromptPrefix: "Blade Runner like dark art illustration of:",
        theme: {
          fontFamily: "Barlow Condensed",
        },
      },
    ],
    /*
    and Philip K Dick, as well as books such as Snow Crash by Neal Stephenson, the Freedom series by Daniel Suarez, 
        The Windup Girl by Paolo Bacigalupi, and The Demolished Man by Alfred Bester. 
        Please make the writing style itself similar to  William Gibson's writing style.
        */
  },
];

/*
assert(getGlobalThis().sessionOptionsJson)
debugger
*/
