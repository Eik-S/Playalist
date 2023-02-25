'use strict';
var active = false;
var detail = 0;
var intensity = 0;
var vpWidth = 0;
var vpHeight = 0;
function setFancyBg( thisDetail, thisIntensity){
    vpWidth = $(window).width();
    vpHeight = $(window).height();
    if(setFancyBg.length !== 2){
        throw new Error("Need detail (pixel size) and intensity (0.0-1.0) as parameters");
    }
    detail = Number(thisDetail);
    intensity = thisIntensity;
    var html = "";
    for ( var x = 0; x < vpWidth; x += detail){
        for ( var y=0; y < vpHeight; y += detail){
            html += "<div class=\"" + x + "x" + y + "\" style=\"height: 100px; width: 100px; position: absolute; opacity: " + intensity + "; left: " + x + "px; top: " + y + "px; background-color: #000; transition: background-color 5s linear;\"></div>"
        }
    }
    $("#background").replaceWith("<div id=\"background\" style=\"height: "+ vpHeight+ "px; width: "+ vpWidth + "px; overflow: hidden; z-index: -1; background-color: #000;\">" + html + "</div>");
    active = true;
}

window.setInterval(function(){
    if (active) {
        for ( var x = 0; x < vpWidth; x += detail){
            for ( var y=0; y < vpHeight; y += detail){
                var r = Math.floor(Math.random() * 255);
                var g = Math.floor(Math.random() * 255);
                var b = Math.floor(Math.random() * 255);
                var tile = x + "x" + y;
                var color = "rgb(" + r + "," + g + "," + b + ")";
                $("#background ." + tile).css("backgroundColor", color);
            }
        }
    }
},5000);

window.onresize = function(){
    setFancyBg( detail, intensity);
}

setFancyBg( 100, 0.5);
