'use strict';
var currentVideoId;
var currentPlatform;
var currentThumbnail;
var currentName;
var currentQuality;
var currentDuration;

var resultSlider;

$(function() {
    $("form").on("submit", function(e) {
        e.preventDefault();
        // prepare the request
        var searchQuery = encodeURIComponent($("#search").val()).replace(/%20/g, "+");
        console.log(searchQuery);
        searchQuery = searchQuery.replace("%C3%A4","ae").replace("%C3%BC", "ue").replace("%C3%B6","oe");
        var searchRequest = gapi.client.youtube.search.list({
            part: "snippet",
            type: "video",
            q: searchQuery,
            maxResults: 5,
            order: "relevance"
        });
        //execute the request
        searchRequest.execute(function(searchResponse) {
            var searchResults = searchResponse.result;
            resultSlider= "<div id=\"resultSlider\">{0}";
            $.each(searchResults.items, function(index, item) {
                var videoId = item.id.videoId;
                var platform = "youtube";
                var name = item.snippet.title;
                var thumbnail = item.snippet.thumbnails.high.url;
                var videoRequest = gapi.client.youtube.videos.list({
                    part: "contentDetails",
                    id: videoId
                });

                var videoDetails = [];
                videoRequest.execute(function(videoResponse) {
                    var videoResults = videoResponse.result;
                    var quality = videoResults.items[0].contentDetails.definition;
                    var duration = videoResults.items[0].contentDetails.duration;
                    resultSlider = resultSlider.replace("{0}",getResultSlide( videoId, thumbnail, name, platform, quality, duration)) + "{0}";
                    if(searchResults.items.length - 1 === index) {
                        resultSlider = resultSlider.replace("{0}","</div>");
                        $("#resultSlider").replaceWith(resultSlider);
                        createBxSlider();
                        //TODO if player exists create playlist tile
                    }
                });
            });
        });
    }); 
});

// Called when Client API is loaded.
function onClientLoad() {
    console.log("Google client api ready.");
    gapi.client.setApiKey('AIzaSyA0Uet82u6oOXIyIiAvdaRXJvas7i16NkA');
    gapi.client.load('youtube', 'v3', function() {
        loadYoutubePlayerApi();
    });

}

function createBxSlider(){
    $('#resultSlider').bxSlider({
        slideWidth: 320,
        minSlides: 1,
        maxSlides: 4,
        slideMargin: 10,
        pager: false
    });
}

function getResultSlide( id, thumbnail, name, platform, quality, duration){
    var input = "<div class=\"slide\"><div class=\"resultTile\" onclick=processResultClick(\"{0}\")>";
    input += "<img class=\"background\" src=\"{1}\">";
    input += "<div class=\"textArea\">{2}</div>";
    input += "<div class=\"metaArea\">";
    input += "<div class=\"picto\"><img src=\"{3}\"></div>";
    input += "<div class=\"qualityBar\"><img src=\"{4}\"></div>";
    input += "<div class=\"duration\">{5}</div>";
    input += "</div></div></div>";
    var pictoSrc = getPlatformPicto( platform);
    var qualitySrc = getQualitySrc( platform, quality);
    var duration = getVideoDuration( duration);
    currentThumbnail = encodeURI(currentThumbnail);
    console.log(currentThumbnail);
    input = input.format( id, thumbnail, name, pictoSrc, qualitySrc, duration);
    return input;
}

function getPlatformPicto( platform) {
    switch(platform){
        case "youtube":
            return "./pic/youtubePicto.ico";
        default:
            throw new Error("Video platform is not assigned.");
    }
}

function getQualitySrc( platform, quality) {
    switch(platform){
        case "youtube":
            if(quality === "sd")
                return "./js/images/3stars.png";
            else
                return "./js/images/5stars.png";
        default:
            throw new Error("Video platform is not assigned.");
    }
}

function getVideoDuration( duration) {
    var duration = duration.slice(2, duration.length - 1);
    return duration.replace("M",":").replace("S","");
}

String.prototype.format = function() {
    var args = arguments;
    return this.replace(/{(\d+)}/g, function(match, number) { 
        return typeof args[number] != 'undefined' ? args[number] : match;
    });
};

function getPlaylistObject( id, name, platform, duration) {
    //TODO
}

function addPlaylistElement( id) {};

function loadYoutubePlayerApi(){
    var tag = document.createElement('script');
    tag.src = "https://www.youtube.com/iframe_api";
    var firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
    console.log("Youtube Player Api loaded.");
}

var youtubePlayer;
// 3. This function creates an <iframe> (and YouTube player)
//    after the API code downloads.
function playYoutubeVideo() {
    console.log("Youtube Api Ready.");
    youtubePlayer = new YT.Player('player', {
        height: '360',
        width: '640',
        playerVars: {
            color: 'white',
            iv_load_policy: '3',
            playsinline: '1',
            showinfo: '0'
        },
        videoId: currentVideoId,
        events: {
            'onReady': onPlayerReady,
            'onStateChange': onPlayerStateChange
        }
    });
}

function processResultClick( id) {
    $(".bx-wrapper").replaceWith("<div id=\"resultSlider\"></div>");    
    if( typeof youtubePlayer !== 'undefined'){
        addPlaylistElement( id);
    } else {
        playYoutubeVideo( id);
    }
}
  
function playYoutubeVideo( id) {
    console.log("Youtube Api Ready.");
    youtubePlayer = new YT.Player('player', {
        height: '360',
        width: '640',
        playerVars: {
            color: 'white',
            iv_load_policy: '3',
            playsinline: '1',
            showinfo: '0'
        },
        videoId: id,
        events: {
            'onReady': onPlayerReady,
            'onStateChange': onPlayerStateChange
        }
    });
}
// 4. The API will call this function when the video player is ready.
function onPlayerReady(event) {
    event.target.playVideo();
}
  
// 5. The API calls this function when the player's state changes.
//    The function indicates that when playing a video (state=1),
//    the player should play for six seconds and then stop.
var done = true;
function onPlayerStateChange(event) {
    if (event.data == YT.PlayerState.PLAYING && !done) {
        setTimeout(stopVideo, 6000);
        done = true;
    }
}
function stopVideo() {
    player.stopVideo();
}

