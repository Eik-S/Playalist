'use strict';
var currentVideoId;
var currentPlatform;
var currentThumbnail;
var currentName;
var currentQuality;
var currentDuration;

var search = [];
var playing;
var related;
var playlist = [];
var playedlist = [];
var draggData;

var youtubePlayer1;
var youtubePlayer2;

var crossfade = 10.0;
var fading = false;

setFancyBg( 200, 0.3);

function Song(platform, id, name, thumbnail, quality, duration) {
    this.platform = platform;
    this.id = id;
    this.name = name;
    this.thumbnail = thumbnail;
    this.quality = quality;
    this.duration = duration;
    this.player;
}

$(function() {
    $("#searchForm").on("submit", function(e) {
        $("#searchForm").blur();
        e.preventDefault();
        // prepare the request
        var searchQuery = encodeURIComponent($("#search").val().trim()).replace(/%20/g, "+");
        searchQuery = searchQuery.replace("%C3%A4","ae").replace("%C3%BC", "ue").replace("%C3%B6","oe");
        var searchRequest = gapi.client.youtube.search.list({
            part: "snippet",
            type: "video",
            safeSearch: "none",
            q: searchQuery,
            maxResults: 10,
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
                    songObject.duration = getVideoDurationSeconds(videoResults.items[0].contentDetails.duration);
                    search[index] = songObject;
                    i++;
                    if(searchResults.items.length === i ){
                        createBxSlider();
                    }
                });
            });
        });
    }); 
});

function onYouTubeIframeAPIReady() {
    if (typeof(Storage) !== "undefined") {
        if(localStorage.playing !== undefined){
            try {
                playing = JSON.parse(localStorage.playing);
                playYoutubeVideo(playing.id, 1);
                switchToPlayer(1);
                playing.player = 1;
            } catch(err) {
                localStorage.removeItem("playing");
                localStorage.removeItem("playlist");
                localStorage.removeItem("playedlist");
            }
        }
        if(localStorage.playlist !== undefined){
            try {
                playlist = JSON.parse(localStorage.playlist);
                updatePlaylist();
            } catch(err) {
                localStorage.removeItem("playlist");
            }
        }
        if(localStorage.playedlist !== undefined){
            try {
                playedlist = JSON.parse(localStorage.playedlist);
                updatePlayedlist();
            } catch(err) {
                localStorage.removeItem("playedlist");
            }
        }
    }
}

function deleteLocalStorage() {
    localStorage.removeItem("playing");
    localStorage.removeItem("playlist");
    localStorage.removeItem("playedlist");
    window.location.reload();
}

function updatePlaylist() {
    if(playing){
        localStorage.playing = songToJson(playing);
    }
    if( playlist.length === 0){
        $("#playlist").replaceWith("<div id=\"playlist\" class=\"playlist\"></div>");
        localStorage.removeItem("playlist");
        loadRelatedVideo(playing.id);
    } else {
        var input = "<div id=\"playlist\" class=\"playlist\">";
        input += "{0}";
        input += "</div>";
        for( var i = 0; i < playlist.length; i++) {
            input = input.replace("{0}", createPlaylistTile( i, playlist[i], false) + "{0}");
        }
        input = input.replace("{0}", "");
        $("#playlist").replaceWith(input);
        loadNextVideo( playlist[0]);
        related = undefined;
        localStorage.playlist = songArrayToJson(playlist);
    }
    console.log("Playlist length: " + playlist.length);
}

function updatePlayedlist() {
    if( playedlist.length === 0){
        $("#playedlist").replaceWith("<div id=\"playedlist\" class=\"playlist\"></div>");
        localStorage.removeItem("playedlist");
    } else {
        var input = "<div id=\"playedlist\" class=\"playlist\">";
        input += "{0}";
        input += "</div>";
        for( var i = playedlist.length - 1; i >= 0; i--) {
            input = input.replace("{0}", createPlaylistTile( i, playedlist[i], true) + "{0}");
        }
        input = input.replace("{0}", "");
        $("#playedlist").replaceWith(input);
        localStorage.playedlist = songArrayToJson(playedlist);
    }
    console.log("Playedlist length: " + playedlist.length);
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
    
    var resultSlider= "<div id=\"resultSlider\">{0}";
    for( var i = 0; i < search.length; i++){
        resultSlider = resultSlider.replace("{0}", getResultSlide( i, search[i])) + "{0}";
    }
    resultSlider = resultSlider.replace("{0}","</div>");
    $("#resultSlider").replaceWith(resultSlider);
    $("#resultPlaceholder").replaceWith(resultSlider);
    setMousewheel();
}

function getResultSlide( searchIndex, songObject){
    var input = "<div class=\"resultTile\" onclick=processResultClick(\"{0}\")>";
    input += "<img class=\"background\" src=\"{1}\">";
    input += "<div class=\"textArea\">{2}</div>";
    input += "<div class=\"metaArea\">";
    input += "<div class=\"picto\"><img src=\"{3}\"></div>";
    input += "<div class=\"qualityBar\"><img src=\"{4}\"></div>";
    input += "<div class=\"duration\">{5}</div>";
    input += "</div></div>";
    var pictoSrc = getPlatformPicto( songObject.platform);
    var qualitySrc = getQualitySrc( songObject.platform, songObject.quality);
    var duration = formatVideoDuration( songObject.duration);
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

function getVideoDurationSeconds( duration) {
    var seconds = 0;
    if( duration.indexOf("S") >= 0) {
        if(!isNaN( duration.charAt(duration.indexOf("S") - 2))) {
            seconds += Number(duration.slice(duration.indexOf("S") - 2, duration.indexOf("S")));
        } else {
            seconds += Number(duration.slice(duration.indexOf("S") - 1, duration.indexOf("S")));
        }
    }
    if( duration.indexOf("M") >= 0) {
        if(!isNaN( duration.charAt(duration.indexOf("M") - 2))) {
            seconds += 60 * Number(duration.slice(duration.indexOf("M") - 2, duration.indexOf("M")));
        } else {
            seconds += 60 * Number(duration.slice(duration.indexOf("M") - 1, duration.indexOf("M")));
        }
    }
    if( duration.indexOf("H") >= 0) {
        if(!isNaN( duration.charAt(duration.indexOf("H") - 2))) {
            seconds += 3600 * Number(duration.slice(duration.indexOf("H") - 2, duration.indexOf("H")));
        } else {
            seconds += 3600 * Number(duration.slice(duration.indexOf("H") - 1, duration.indexOf("H")));
        }
    }
    return seconds;
}

function formatVideoDuration( duration) {
    var rest = duration;
    var seconds = 0;
    var minutes = 0;
    var hours;
    if(duration >= 3600) {
        hours = Math.floor( duration / 3600);
        rest = duration % 3600;
    }
    if(duration >= 60) {
        minutes = Math.floor(rest / 60);
        rest = rest % 60;
    }
    if( duration > 0) {
        seconds = rest;
    }
    if( hours === undefined) {
        return twoDigitString(minutes) + ":" + twoDigitString(seconds);
    } else {
        return hours + ":" + twoDigitString(minutes) + ":" + twoDigitString(seconds);
    }
}

function twoDigitString( number) {
    return ("0" + number).slice(-2);
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
    input += "</div>";
    input += "<div class=\"deleteTile\" onClick=deleteVideoFromList(\"{5}\",{6})>X";
    input += "</div></li>";
    var pictoSrc = getPlatformPicto( songObject.platform);
    var duration = formatVideoDuration( songObject.duration);
    var name = songObject.name;
    if(name.indexOf(" - ") >= 0) {
        var result = name.slice(0, name.indexOf(" - ") + 1) + "<br>    " + name.slice(name.indexOf(" - ") + 2);
        name = result;
    }
    input = input.format( playlistIndex, played, pictoSrc, name ,duration, playlistIndex, played);
    return input;
}

//---------------------------------------------------------------------
// Drag and Drop functionality
//---------------------------------------------------------------------
//document.addEventListener("dragstart", function(event) {
//    draggData = event.target.parentElement;
//    draggData.firstChild.style.backgroundColor = "#ddd";
//
//    draggData.index = $(event.target.parentElement).index();
//    if( event.target.parentElement.parentElement.id === "playlist") {
//        draggData.played = false;
//        draggData.song = playlist[draggData.index];
//    } else {
//        draggData.played = true;
//        draggData.song = playedlist[draggData.index];
//    }
//});
//
//document.addEventListener("dragover", function(event) {
//    if ( event.target.className == "playlistTile" ) {
//        if( event.target.parentElement !== draggData) {
//            event.target.parentElement.parentElement.insertBefore(draggData, event.target.parentElement); 
//        }
//    }
//    draggData.dropIndex = $(event.target.parentElement).index();
//    console.log("event.target.parentElement....id: " + event.target.parentElement.parentElement.id);
//    if( event.target.parentElement.parentElement.id === "playlist") {
//        draggData.dropPlayed = false;
//    } else {
//        draggData.dropPlayed = true;
//    }
//});
//
//document.addEventListener("dragend", function(event) {
//    console.log("draggData.dropPlayed = " + draggData.dropPlayed);
//    if(draggData) {
//        deleteVideoFromList(draggData.index, draggData.played);
//        draggData.firstChild.style.backgroundColor = "#E3BFA8";
//        if(draggData.dropPlayed === false) {
//            console.log("draggData.dropIndex = " + draggData.dropIndex);
//            playlist.splice( draggData.dropIndex, 0, draggData.song);
//            console.log(playlist);
//        } else {
//            playedlist.splice( draggData.dropIndex, 0, draggData.song);
//            console.log(playedlist);
//        }
//        updatePlaylist();
//        updatePlayedlist();
//    }
//});
//---------------------------------------------------------------------


function loadYoutubePlayerApi(){
    var tag = document.createElement('script');
    tag.src = "https://www.youtube.com/iframe_api";
    var firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
    console.log("Youtube Player Api loaded.");
}

var youtubePlayer1;
var youtubePlayer2;

function loadNextVideo( video) {
    if( playing.player === 1) {
        if( youtubePlayer2 === undefined){
            cueYoutubeVideo( video.id, 2);
        } else {
            youtubePlayer2.cueVideoById( video.id);
        }
    } else if ( playing.player === 2) {
        if( youtubePlayer1 === undefined){
            cueYoutubeVideo( video.id, 1);
        } else {
            youtubePlayer1.cueVideoById( video.id);
        }
    } else if ( playing === undefined) {
        if( youtubePlayer === undefined) {
            playYoutubeVideo( video.id, 1)
            switchToPlayer( 1); 
        } else {
            youtubePlayer1.loadVideoById( video.id);
            switchToPlayer( 1);
        }
    }
}

function switchToPlayer( playerId) {
    if( playerId === 1){
        document.getElementById("player1").style.zIndex = "1";
        document.getElementById("player2").style.zIndex = "0";
    } else {
        document.getElementById("player2").style.zIndex = "1";
        document.getElementById("player1").style.zIndex = "0";
    }
}

function processResultClick( searchIndex) {
    $("#resultSlider").replaceWith("<div id=\"resultPlaceholder\"></div>");
    if( playing){
        if(playing.player === 1){
            if(youtubePlayer1.getPlayerState() === 0) {
                playedlist.push(playing);
                youtubePlayer1.loadVideoById(search[searchIndex].id);
                playing = search[searchIndex];
                playing.player = 1;
                search = [];
            }
        } else if(playing.player === 2){
            if(youtubePlayer2.getPlayerState() === 0) {
                playedlist.push(playing);
                youtubePlayer2.loadVideoById(search[searchIndex].id);
                playing = search[searchIndex];
                playing.player = 2;
                search = [];
            }
        }
        updatePlayedlist();
        playlist.push(search[searchIndex]);
        updatePlaylist();
        search = [];
    } else {
        playYoutubeVideo( search[searchIndex].id, 1);
        playing = search[searchIndex];
        playing.player = 1;
        search =[];
        switchToPlayer( 1);
        updatePlaylist();
    }
}

function forcePlay( playlistIndex, played) {
    if(related) related = undefined;
    if( playing.player === 1) {
        if(played){
            youtubePlayer1.loadVideoById( playedlist[playlistIndex].id); 
            playedlist.push( playing);
            updatePlayedlist();
            playing = playedlist[playlistIndex];
            playing.player = 1;
            deleteVideoFromList( playlistIndex, played);
        } else {
            youtubePlayer1.loadVideoById( playlist[playlistIndex].id);
            playedlist.push( playing);
            updatePlayedlist();
            playing = playlist[playlistIndex];
            playing.player = 1;
            deleteVideoFromList( playlistIndex, played);
        }
    } else {
        if(played){
            youtubePlayer2.loadVideoById( playedlist[playlistIndex].id); 
            playedlist.push( playing);
            updatePlayedlist();
            playing = playedlist[playlistIndex];
            playing.player = 2;
            deleteVideoFromList( playlistIndex, played);
        } else {
            youtubePlayer2.loadVideoById( playlist[playlistIndex].id);
            playedlist.push( playing);
            updatePlayedlist();
            playing = playlist[playlistIndex];
            playing.player = 2;
            deleteVideoFromList( playlistIndex, played);
        }
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

function playYoutubeVideo( id, playerNumber) {
    console.log("## Player" + playerNumber + ": ## Youtube Api Ready.");
    if(playerNumber === 1){
        youtubePlayer1 = new YT.Player( player1, {
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
    } else {
        youtubePlayer2 = new YT.Player( player2, {
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
    $("#controlsWrapper").css("visibility","visible");
}

function cueYoutubeVideo( id, playerNumber) {
    console.log("## Player" + playerNumber + ": ## Youtube Api Ready.");
    if(playerNumber === 1){
        youtubePlayer1 = new YT.Player( player1, {
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
                'onStateChange': onPlayerStateChange
            }
        });
    } else {
        youtubePlayer2 = new YT.Player( player2, {
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
                'onStateChange': onPlayerStateChange
            }
        });
    }
}

// 4. The API will call this function when the video player is ready.
function onPlayerReady(event) {
    event.target.playVideo();
}
  
// 5. The API calls this function when the player's state changes.
//    The function indicates that when playing a video (state=1),
//    the player should play for six seconds and then stop.
function onPlayerStateChange(event) {
    if (event.target.getPlayerState() === 0) {
        if( playlist.length > 0 || related) {
            playedlist.push(playing);
            updatePlayedlist();
            if( playing.player === 1) {
                switchToPlayer( 2);
                youtubePlayer2.playVideo();
                if( related) {
                    playing = related;
                    related = undefined;
                } else {
                    playing = playlist[0];
                    deleteVideoFromList(0, false);
                }
                playing.player = 2;
            } else {
                switchToPlayer( 1);
                youtubePlayer1.playVideo();
                if( related) {
                    playing = related;
                    related = undefined;
                } else {
                    playing = playlist[0];
                    deleteVideoFromList( 0, false);
                }
                playing.player = 1;
            }
        }
    }
}

function updateCrossfade( seconds) {
    crossfade = Number(seconds) + (Number(seconds) * 0.1);
    $("#crossfadeWrapper .crossfadeValue").val(String(seconds) + "s");
}

function fadeTo( playerNum) {
    // Fading prevents the Crossfade Listener from being executed while fadeTo runs
    fading = true;
    if( playerNum === 1){
        var stepTime = crossfade * 1000 / 10;
        youtubePlayer1.setVolume(0);
        youtubePlayer1.playVideo();
        var i = 0;
        var timerId = window.setInterval(function() {
            i += 10;
            youtubePlayer2.setVolume( (100 - i));
            youtubePlayer1.setVolume( i);
            if( i === 100){
                youtubePlayer1.setVolume(100);
                youtubePlayer2.setVolume(0);
                endFadeTo( timerId);
            }
        }, stepTime);
    } else {
        var stepTime = crossfade * 1000 / 10;
        youtubePlayer2.setVolume(0);
        youtubePlayer2.playVideo();
        var i = 0;
        var timerId = window.setInterval(function() {
            i += 10;
            youtubePlayer1.setVolume( (100 - i));
            youtubePlayer2.setVolume( i);
            if( i === 100){
                youtubePlayer1.setVolume(0);
                youtubePlayer2.setVolume(100);
                endFadeTo( timerId);
            }
        }, stepTime);
    }
}

function endFadeTo( timerId){
    fading = false;
    window.clearInterval(timerId);
}

//Crossfade Listener
window.setInterval(function() {
    if(crossfade > 0 && !fading){
        if(youtubePlayer1){
            if( youtubePlayer1.getPlayerState() === 1){
                var duration = playing.duration;
                var playtime = youtubePlayer1.getCurrentTime();
                if( (playlist.length > 0 || related) && (duration - playtime) <= crossfade && (duration - playtime) >= 1) {
                    fadeTo( 2);
                }
            }
        }
        if( youtubePlayer2){
            if( youtubePlayer2.getPlayerState() === 1){
                var duration = playing.duration;
                var playtime = youtubePlayer2.getCurrentTime();
                if( (playlist.length > 0 || related) && (duration - playtime) <= crossfade && (duration - playtime) >= 1) {
                    fadeTo( 1);
                }
            }
        }
    }
}, 1000);

function loadRelatedVideo( videoId) {
    var searchRequest = gapi.client.youtube.search.list({
        part: "snippet",
        type: "video",
        safeSearch: "none",
        maxResults: 10,
        relatedToVideoId: videoId
    });

    //execute the request
    searchRequest.execute(function(searchResponse) {
        var searchResults = searchResponse.result;
        songIteration:
        while( true) {
            var x = Math.floor(Math.random() * 10);
            var item = searchResults.items[x];
            var currentId = item.id.videoId;
            for( var i = 0; i < playedlist.length; i++){
                if( currentId === playedlist[i].id) {
                    console.log("This song is already in the Playedlist: " + item.snippet.title);
                    continue songIteration;
                }
            }
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
                songObject.duration = getVideoDurationSeconds(videoResults.items[0].contentDetails.duration);
                related = songObject;
                playlist.push(related);
                updatePlaylist();
            });
            break;
        }
    });
}

function songToJson( song) {
    var returnString = "{";
    returnString += "\"platform\":\"" + song.platform + "\", ";
    returnString += "\"id\":\"" + song.id + "\", ";
    returnString += "\"name\":\"" + song.name + "\",";
    returnString += "\"thumbnail\":\"" + song.thumbnail + "\",";
    returnString += "\"quality\":\"" + song.quality + "\",";
    returnString += "\"duration\":\"" + song.duration + "\",";
    returnString += "\"player\":\"" + song.player + "\"";
    returnString += "}";
    return returnString;
}

function songArrayToJson( songs){
    var returnString = "[";
    for(var i = 0; i < songs.length; i++){
        returnString += "{";
        returnString += "\"platform\":\"" + songs[i].platform + "\", ";
        returnString += "\"id\":\"" + songs[i].id + "\", ";
        returnString += "\"name\":\"" + songs[i].name + "\",";
        returnString += "\"thumbnail\":\"" + songs[i].thumbnail + "\",";
        returnString += "\"quality\":\"" + songs[i].quality + "\",";
        returnString += "\"duration\":\"" + songs[i].duration + "\",";
        returnString += "\"player\":\"" + songs[i].player + "\"";
        returnString += "},";
    }
    returnString = returnString.slice(0,returnString.length - 1);
    returnString += "]";
    return returnString;
}

//Mouse Wheel Support for resultSlider
function setMousewheel() {
    $("#resultSlider").mousewheel(function(event, delta) {
         this.scrollLeft -= (delta * 30);
         event.preventDefault();
    });
}
