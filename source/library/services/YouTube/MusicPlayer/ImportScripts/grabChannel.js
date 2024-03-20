const puppeteer = require('puppeteer'); // npm install puppeteer

async function getChannelVideoData(url) {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto(url);

  const videoData = await page.$$eval('//ytd-grid-video-renderer', elements => elements.map((element) => { 
    const title = element.querySelector('a#video-title').textContent.trim();
    const url = element.querySelector('a#video-title').href;
    return { title, url}; 
  }));

  await browser.close();
  return videoData;
}

(async () => {
  const [, , channelUrl] = process.argv;

  if (!channelUrl) {
    console.error('Please provide a YouTube channel videos page URL as an argument.');
    return;
  }

  try {
    const videoData = await getChannelVideoData(channelUrl);
    const videoDict = {};

    videoData.forEach(video => videoDict[video.title] = video.url);

    console.log(JSON.stringify(videoDict)); 
  } catch (error) {
    console.error('Error fetching video URLs:', error);
  }
})();

