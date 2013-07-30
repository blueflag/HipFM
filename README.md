HipFM
=====

Post "now playing" track from last.fm to HipChat room.


## Usage

```shell
node server.js [last.fm API Key] [last.fm User] [HipChat Key] [HipChat Room] [HipChat Name]

node server.js THISISMYLASTFMAPIKEY blueflagmusic HIPCHATKEY "My Room" "HipFM"
```

* **last.fm API Key**: Get one here [Last.fm Web Services](http://www.last.fm/api/account/create)
* **last.fm User**: The user's playlist you want to follow (eg. [blueflagmusic](http://ws.audioscrobbler.com/1.0/user/blueflagmusic/recenttracks.rss))
* **HipChat Key**: Either an Admin or Notification key. Get one here [https://hipchat.com/admin/api](https://hipchat.com/admin/api)
* **HipChat Room**: The room you want to post to. Must be created in HipChat first.
* **HipChat Name**: _Optional_ Name to display in HipChat (usually where the username goes).