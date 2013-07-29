var _ = require('lodash'),
    util = require('util'),
    http = require('http'),
    https = require('https');

var lastTrack = '';

function checkTracks() {
    http.get("http://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks&user=blueflagmusic&api_key=1f1ac5c48e40633e23f6e09aa2341a84&format=json&limit=10", function(httpRes) {
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
            html += '<img src="' + currentTrack.image[1]['#text'] + '" />';
        }

        html += '<a href="' + currentTrack.url + '">' + currentTrack.name + '</a>';
        html += '<br>';
        html += currentTrack.artist['#text'] + ' - ' + currentTrack.album['#text'];

        sendToHipChat(html);
        lastTrack = currentTrack.name;
        util.log(lastTrack + ' - ' + currentTrack.artist['#text'] + ' - ' + currentTrack.album['#text']);
    }

    fetchTracks();
}

function sendToHipChat(message) {
    message = encodeURIComponent(message);
    var url = 'https://api.hipchat.com/v1/rooms/message?format=json&auth_token=17622a65877a7b2c47a2a56164b9da&room_id=HipFM&from=HipFM&color=random&message_format=html&message=' + message;

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



