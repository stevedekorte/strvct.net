const { google } = require('googleapis');
const youtube = google.youtube({
    version: 'v3',
    auth: 'AIzaSyAMz1innItQgudy1EI_K3cwV2EyBuIrGq0'
});

async function searchCreativeCommonsVideos(searchTerm) {
    const response = await youtube.search.list({
        part: 'snippet',
        q: searchTerm, 
        videoDuration: 'short', // Videos less than 4 minutes
        videoLicense: 'creativeCommon',
        type: 'video',
        maxResults: 25 // Adjust the number of results if desired
    });

    const results = response.data.items.map(item => {
        return {
            title: item.snippet.title,
            videoId: item.id.videoId,
            url: `https://www.youtube.com/watch?v=${item.id.videoId}`
        };
    }); 

    return results;
}

// Example Usage        
const searchQuery = 'sound fx'; 
searchCreativeCommonsVideos(searchQuery)
    .then(results => console.log(results))
    .catch(error => console.error(error));
