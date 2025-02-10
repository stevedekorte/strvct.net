const youtubesearchapi = require("youtube-search-api");

async function scrapeYouTubeVideos(searchTerm) {
    const allItems = [];
    const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(searchTerm)}`;
    console.log("searchUrl:", searchUrl);
    let result = await youtubesearchapi.GetListByKeyword(searchTerm, false, 10000, [{type:"cc-video"}]);
    console.log("result:", result.items);
    console.log("result.items.length:", result.items.length);
    
    allItems.push(...result.items);

    while (result.nextPage && result.items.length > 0) {
        result = await youtubesearchapi.NextPage(result.nextPage, false, 10000);
        console.log("result.items.length:", result.items.length);
        allItems.push(...result.items);
    }
    return allItems;
}

async function run () {
    const allItems = await scrapeYouTubeVideos("dungeon music");
    console.log(JSON.stringify(allItems, null, 2));
    //console.log("allItems.length:", allItems.length);
}

run();


