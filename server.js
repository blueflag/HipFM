if (process.argv.length < 6) {
    console.log('Usage: node server.js ' + ' [Last.fm Api Key] [Last.fm User] [HipChat Admin/Notification Key] [Room] [Display Name]');
    process.exit(1);
}

var HIPCHAT_AUTH_TOKEN = process.argv[4],
    HIPCHAT_ROOM = process.argv[5],
    HIPCHAT_DISPLAY_NAME = process.argv[6] || 'HipFM',
    LASTFM_API = process.argv[2],
    LASTFM_USER = process.argv[3];

var _ = require('lodash'),
    util = require('util'),
    http = require('http'),
    https = require('https');

var lastTrack = '';

function checkTracks() {
    var lastfmURL = 'http://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks&user=' + LASTFM_USER + '&api_key=' + LASTFM_API + '&format=json&limit=10';

    http.get(lastfmURL, function(httpRes) {
        var data = '';

        httpRes.on('data', function (chunk){
            data += chunk;
        });

        httpRes.on('end',function(){
            processData(JSON.parse(data));
        });


    }).on('error', function(e) {
        util.log("ERROR::checkTracks " + e.message);
    });
}

function processData(data) {
    var currentTrack = data.recenttracks.track[0];

    if (lastTrack != currentTrack.name) {
        var html = '';

        if (currentTrack.image[1]['#text'] !== '') {
            html += '<img src="' + currentTrack.image[1]['#text'] + '" height="32"/>';
        }
        html += '<span>&nbsp;&nbsp;</span>';
        html += '<a href="' + currentTrack.url + '">' + currentTrack.name + '</a>';
        html += ' - <a href="http://www.last.fm/music/'  + currentTrack.artist['#text'] + '">' + currentTrack.artist['#text'] + '</a>';
        html += ', <a href="http://www.last.fm/music/'  + currentTrack.artist['#text'] + '/'+ currentTrack.album['#text'] + '">' + currentTrack.album['#text'] + '</a>';

        sendToHipChat(html);
        lastTrack = currentTrack.name;
        util.log(lastTrack + ' - ' + currentTrack.artist['#text'] + ' - ' + currentTrack.album['#text']);
    }

    fetchTracks();
}

function sendToHipChat(message) {
    message = encodeURIComponent(message);
    var url = 'https://api.hipchat.com/v1/rooms/message?format=json&auth_token=' + HIPCHAT_AUTH_TOKEN + '&room_id=' + HIPCHAT_ROOM + '&from=' + HIPCHAT_DISPLAY_NAME + '&color=purple&message_format=html&message=' + message;

    https.get(url, function(httpRes) {
        var data = '';

        httpRes.on('data', function (chunk){
            data += chunk;
        });

        httpRes.on('end',function(){
            // util.log(data);
        });
    }).on('error', function(e) {
        util.log("ERROR::sendToHipChat " + e.message);
    });
}


function fetchTracks(instant) {
    var millis = instant ? 0 : 30000;

    setTimeout(function() {
        checkTracks();
    }, millis);
}

console.log('Started HipFM service');
fetchTracks(true);



