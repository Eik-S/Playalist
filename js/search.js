'use strict';
var currentVideoId;
var currentPlatform;
var currentThumbnail;
var currentName;
var currentQuality;
var currentDuration;

var search = [];
var playing = undefined;
var playlist = [];
var playedlist = [];

function Song(platform, id, name, thumbnail, quality, duration) {
    this.platform = platform;
    this.id = id;
    this.name = name;
    this.thumbnail = thumbnail;
    this.quality = quality;
    this.duration = duration;
}

$(function() {
    $("form").on("submit", function(e) {
        e.preventDefault();
        // prepare the request
        var searchQuery = encodeURIComponent($("#search").val()).replace(/%20/g, "+");
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
            var i = 0; //Own Index to have no problems with unsynchronous execution of the loop
            $.each(searchResults.items, function(index, item) {
                var songObject = new Song;
                songObject.id = item.id.videoId;
                songObject.platform = "youtube";
                songObject.name = item.snippet.title;
                songObject.thumbnail = item.snippet.thumbnails.high.url;
                var videoRequest = gapi.client.youtube.videos.list({
                    part: "contentDetails",
                    id: songObject.id
                });

                videoRequest.execute(function(videoResponse) {
                    var videoResults = videoResponse.result;
                    songObject.quality = videoResults.items[0].contentDetails.definition;
                    songObject.duration = videoResults.items[0].contentDetails.duration;
                    console.log(songObject.name);
                    search[index] = songObject;
                    i++;
                    console.log("search.results.items.length: " + searchResults.items.length);
                    console.log("search-length: " + i);
                    if(searchResults.items.length === i ){
                        createBxSlider();
                    }
                });
            });
        });
    }); 
});

function updatePlaylist() {
    console.log("## Updating Playlist with length of: " + playlist.length);
    if( playlist.length === 0){
        $("#playlistWrapper").replaceWith("<div id=\"playlistWrapper\" class=\"playlist\"></div>");
    } else {
        var input = "<div id=\"playlistWrapper\" class=\"playlist\">";
        input += "{0}";
        input += "</div>";
        for( var i = 0; i < playlist.length; i++) {
            input = input.replace("{0}", createPlaylistTile( i, playlist[i], false) + "{0}");
        }
        input = input.replace("{0}", "");
        $("#playlistWrapper").replaceWith(input);
    }
}

function updatePlayedlist() {
    console.log("## Updating Playedlist with length of: " + playedlist.length);
    if( playedlist.length === 0){
        $("#playedlistWrapper").replaceWith("<div id=\"playedlistWrapper\" class=\"playlist\"></div>");
    } else {
        var input = "<div id=\"playedlistWrapper\" class=\"playlist\">";
        input += "{0}";
        input += "</div>";
        for( var i = playedlist.length - 1; i >= 0; i--) {
            input = input.replace("{0}", createPlaylistTile( i, playedlist[i], true) + "{0}");
        }
        input = input.replace("{0}", "");
        $("#playedlistWrapper").replaceWith(input);
    }
}

// Called when Client API is loaded.
function onClientLoad() {
    console.log("Google client api ready.");
    gapi.client.setApiKey('AIzaSyA0Uet82u6oOXIyIiAvdaRXJvas7i16NkA');
    gapi.client.load('youtube', 'v3', function() {
        loadYoutubePlayerApi();
    });

}

function createBxSlider(){
    $("#resultSlider").replaceWith("<div id=\"resultSlider\"><div>");
    var resultSlider= "<div id=\"resultSlider\">{0}";
    for( var i = 0; i < search.length; i++){
        resultSlider = resultSlider.replace("{0}", getResultSlide( i, search[i])) + "{0}";
    }
    resultSlider = resultSlider.replace("{0}","</div>");
    $("#resultSlider").replaceWith(resultSlider);

    $('#resultSlider').bxSlider({
        slideWidth: 320,
        minSlides: 1,
        maxSlides: 4,
        slideMargin: 10,
        pager: false
    });
}

function getResultSlide( searchIndex, songObject){
    var input = "<div class=\"slide\"><div class=\"resultTile\" onclick=processResultClick(\"{0}\")>";
    input += "<img class=\"background\" src=\"{1}\">";
    input += "<div class=\"textArea\">{2}</div>";
    input += "<div class=\"metaArea\">";
    input += "<div class=\"picto\"><img src=\"{3}\"></div>";
    input += "<div class=\"qualityBar\"><img src=\"{4}\"></div>";
    input += "<div class=\"duration\">{5}</div>";
    input += "</div></div></div>";
    var pictoSrc = getPlatformPicto( songObject.platform);
    var qualitySrc = getQualitySrc( songObject.platform, songObject.quality);
    var duration = getVideoDuration( songObject.duration);
    currentThumbnail = encodeURI(currentThumbnail);
    input = input.format( searchIndex, songObject.thumbnail, songObject.name, pictoSrc, qualitySrc, duration);
    return input;
}

function getPlatformPicto( platform) {
    return "./pic/youtubePicto.ico";
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
    return duration.replace("H",":").replace("M",":").replace("S","");
}

String.prototype.format = function() {
    var args = arguments;
    return this.replace(/{(\d+)}/g, function(match, number) { 
        return typeof args[number] != 'undefined' ? args[number] : match;
    });
};

function createPlaylistTile( playlistIndex, songObject, played){
    var input = "<li><div class=\"playlistTile\" onClick=forcePlay(\"{0}\",{1})>";
    input += "<div class=\"picto\"><img src=\"{2}\"></div>";
    input += "<div class=\"textArea\">{3}</div>";
    input += "<div class=\"duration\">{4}</div>";
    input += "</div></li>";
    var pictoSrc = getPlatformPicto( songObject.platform);
    var duration = getVideoDuration( songObject.duration);
    var name = songObject.name;
    if(name.indexOf("-") >= 0) {
        var result = name.slice(0, name.indexOf("-") + 1) + "<br>    " + name.slice(name.indexOf("-") + 2);
        name = result;
    }
    console.log(name);
    input = input.format( playlistIndex, played, pictoSrc, name ,duration);
    return input;
}

function loadYoutubePlayerApi(){
    var tag = document.createElement('script');
    tag.src = "https://www.youtube.com/iframe_api";
    var firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
    console.log("Youtube Player Api loaded.");
}

var youtubePlayer;

function processResultClick( searchIndex) {
    $(".bx-wrapper").replaceWith("<div id=\"resultSlider\"></div>");
    if( playing){
        playlist.push(search[searchIndex]);
        updatePlaylist();
        search = [];
    } else {
        playYoutubeVideo( search[searchIndex].id);
        playing = search[searchIndex];
        search =[];
    }
}

function forcePlay( playlistIndex, played) {
    if(played){
        youtubePlayer.loadVideoById( playedlist[playlistIndex].id); 
        playedlist.push( playing);
        updatePlayedlist();
        playing = playedlist[playlistIndex];
        deleteVideoFromList( playlistIndex, played);
    } else {
        youtubePlayer.loadVideoById( playlist[playlistIndex].id);
        playedlist.push( playing);
        updatePlayedlist();
        playing = playlist[playlistIndex];
        deleteVideoFromList( playlistIndex, played);
    }
}

function deleteVideoFromList( index, played) {
    if(played){
        if( index === 0) {
            playedlist = playedlist.slice(1);
        } else if( index === playedlist.length - 1) {
            playedlist = playedlist.slice(0, playedlist.length - 1);
        } else {
            playedlist.splice(index, 1);
        }
        updatePlayedlist(); 
    } else {
        if( index === 0) {
            playlist = playlist.slice(1);
        }else if( index === playlist.length - 1) {
            playlist = playlist.slice(0, playlist.length - 1);
        } else {
            playlist.splice(index, 1);
        }
        updatePlaylist(); 
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
function onPlayerStateChange(event) {
    if (youtubePlayer.getPlayerState() === 0 && playlist.length > 0) {
        playedlist.push(playing);
        updatePlayedlist();
        playing = playlist[0];
        youtubePlayer.loadVideoById( playlist[0].id);
        deleteVideoFromList( 0, false);
    }
}
function stopVideo() {
    youtubePlayer.stopVideo();
}

