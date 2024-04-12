const puppeteer = require('puppeteer');
const cheerio = require('cheerio');

async function timeout(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function scrapeYouTubeVideos(searchTerm) {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(searchTerm)}`;
    console.log("searchUrl:", searchUrl);
    await page.goto(searchUrl);
    console.log("after goto");

    // --- scroll to bottom ---

    //const clog = console.log;
    //page.on('console', msg => clog(msg.text())); // Capture console messages

    //id="container"\
    //class="style-scope ytd-search"

    async function scrollIt () {
        return await page.evaluate(async () => {
            const element = document.querySelector("#style-scope ytd-page-manager");
            //const elementHeight = element.offsetHeight; 
            const elementScrollHeight = element.scrollHeight;
            element.scrollTop = element.offsetHeight;

                //console.log("window.scrollY 1:" + window.scrollY); // how much we've scrolled
                //window.scrollBy(0, 1000);
                //console.log("window.scrollY 2:" + window.scrollY); // how much we've scrolled


                //return [window.scrollY, document.body.scrollHeight];
                //return window.scrollY;
            return element.offsetHeight;
        });
    }

    
    let prev = await scrollIt();
    let done = false;
    do {
        const next = await scrollIt();
        await timeout(300);
        console.log("next:", next);
        done = next === prev;
        prev = next;
    } while (!done);
    console.log("done:", done);
    

    done = await scrollIt();
    console.log("done:", done);

    // --- wait for more results to load ---

    const html = await page.content(); 
    await browser.close();

    console.log("html:", Math.floor(html.length/1000), "Kb");
   // console.log("html: [[[", html, "]]]");


    const $ = cheerio.load(html);

    const videoResults = {};
    // You'll need to carefully inspect YouTube's HTML structure 
    // to write the correct Cheerio selectors for the following
    $('.ytd-video-renderer').each((index, element) => {
        const titleElement = $(element).find("#video-title");
        const title = titleElement.attr('title'); 
        if (!title) {
            return;
        }
        const videoId = titleElement.attr('href').split('=')[1]; 
        if (!videoId) {
            return;
        }
        //console.log("videoId:", videoId);
        const url = `https://www.youtube.com/watch?v=${videoId}`;

        // Assume all scraped videos are under 4 minutes for simplicity

        // Potentially add a heuristic to check for Creative Commons 
        // based on text within the results, but this will be very unreliable

        videoResults[videoId] = { title, videoId, url };
    });

    return videoResults;
}

async function run() {
    const results = await scrapeYouTubeVideos("dungeon music");
    //console.log(results);
    console.log(Object.keys(results).length, " results found");
}

run();