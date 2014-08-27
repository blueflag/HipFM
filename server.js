var _ = require('lodash'),
    util = require('util'),
    http = require('http'),
    https = require('https'),
    fs = require('fs');

var config = {};


if(process.argv[2] == '-f') { // We're using a config file
    fs.exists("hipfm.json", function(exists) {
        if (exists) {
            console.log('Using hipfm config file.');
            config = (JSON.parse(fs.readFileSync("hipfm.json", "utf8")));
            fetchTracks(true, config);
        } else {
            console.log('The hipfm.json file does not exist. Please create the file before using the -f flag.');b
            process.exit(1);
        }
    });
} else {  // We're using the command line args
    if (process.argv.length < 6) {
        console.log('Usage: node server.js ' + ' [Last.fm Api Key] [Last.fm User] [HipChat Admin/Notification Key] [Room] [Display Name]');
        process.exit(1);
    }

    config = {
        "hipchat": {
            "key": process.argv[4],
            "room": process.argv[5]
        },
        "lastfm": {
            "users": [
                {
                    "displayName": process.argv[6] || 'HipFM',
                    "username": process.argv[3],
                    "key": process.argv[2]
                }
            ]
        }
    }
    fetchTracks(true, config);
}

function checkTracks(config) {
    var tracks = null;
    var dangerzone = null;

    config.lastfm.users.forEach(function(element, index, array){
        var lastfmURL = 'http://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks&user=' + config.lastfm.users[index].username + '&api_key=' + config.lastfm.users[index].key + '&format=json&limit=10';
        http.get(lastfmURL, function(httpRes) {
            var data = '';

            httpRes.on('data', function (chunk){
                data += chunk;
            });

            httpRes.on('end',function(){
                tracks = JSON.parse(data);
                complete(index);
            });


        }).on('error', function(e) {
            util.log("ERROR::checkTracks " + e.message);
        });

        // danger zone
        var dangerZoneUrl = 'http://ws.audioscrobbler.com/2.0/?method=user.gettoptracks&user=' + config.lastfm.users[index].username + '&api_key=' + config.lastfm.users[index].key + '&period=3month&format=json&limit=10';
        http.get(dangerZoneUrl, function(httpRes) {
            var data = '';

            httpRes.on('data', function (chunk){
                data += chunk;
            });

            httpRes.on('end',function(){
                dangerzone = JSON.parse(data);
                complete(index);
            });


        }).on('error', function(e) {
            util.log("ERROR::checkTracks " + e.message);
        });
    });

    function complete(index) {
        if (tracks !== null && dangerzone !== null) {
            processData(tracks, dangerzone, index);
        }
    }   

}



function processData(data, dangerzone, userIndex) {
    if (data.recenttracks && data.recenttracks.track) {
        var currentTrack = data.recenttracks.track[0];
        var dangerTracks = dangerzone.toptracks.track;

        if (config.lastfm.users[userIndex].lastTrack != currentTrack.name) {

            var dangerTrack = _.find(dangerTracks, function(track){        
                if(track.mbid === currentTrack.mbid || track.name === currentTrack.name) {
                    return track;
                }
            });
            
            var html = '';
            var color = 'purple';

            
            
            if (currentTrack.image[1]['#text'] !== '') {
                html += '<img src="' + currentTrack.image[1]['#text'] + '" height="32"/>';
            }
            html += '<span>&nbsp;&nbsp;</span>';
            html += '<a href="' + currentTrack.url + '">' + currentTrack.name + '</a>';
            html += ' - <a href="http://www.last.fm/music/'  + currentTrack.artist['#text'] + '">' + currentTrack.artist['#text'] + '</a>';
            html += ', <a href="http://www.last.fm/music/'  + currentTrack.artist['#text'] + '/'+ currentTrack.album['#text'] + '">' + currentTrack.album['#text'] + '</a>';

            if(dangerTrack) {
                color = 'red';
                html += "<div>&nbsp;&nbsp; This track's on a highway to the DANGER ZONE! Please, somebody skip it.</div>";                
            }

            sendToHipChat(html, userIndex, color);
            config.lastfm.users[userIndex].lastTrack = currentTrack.name;
            util.log(config.lastfm.users[userIndex].lastTrack + ' - ' + currentTrack.artist['#text'] + ' - ' + currentTrack.album['#text']);
        }    
    }
    
    if(userIndex==0) { // Only call the timeout callback once to prevent n*2 callbacks each time.
        fetchTracks(false, config);
    }
}

function sendToHipChat(message, userIndex, color) {
    color = color || 'purple';
    message = encodeURIComponent(message);
    var url = 'https://api.hipchat.com/v1/rooms/message?format=json&auth_token=' + config.hipchat.key + '&room_id=' + config.hipchat.room + '&from=' + config.lastfm.users[userIndex].displayName + '&color='+ color +'&message_format=html&message=' + message;

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


function fetchTracks(instant, config) {
    var millis = instant ? 0 : 30000;

    setTimeout(function() {
        checkTracks(config);
    }, millis);
}



