var Twit = require('twit');
var _ = require('underscore');

var T = new Twit({
  consumer_key: '7rMLsE4faev5mrvfJ5hYreu8w',
  consumer_secret: 'b6Qc4ED2MK03rOJxZlWMSf9VuU30KK3dLZncx5WIVrvNO7jvmT',
  access_token: '15518912-F2txQ4JnpwWhbVdsLSw6ZALPBbWvpIBdIv1RdnwzW',
  access_token_secret: 'D7NHtpsoSYwr0VwKhkSAC80podGOFofrXR1k3IzG0CoDm'
});


var lastCounts = [];

function tone_freq(nr) {
  nr += 48;
  return Math.round(Math.pow(2, (nr-49)/12)*440);
}


var app = require('express')();
var server = require('http').Server(app);
var socket = require('socket.io')(server);

server.listen(process.env.PORT || 8000);

app.get('/', function (req, res) {
  res.sendfile(__dirname + '/index.html');
});

app.get('/fade.js', function (req, res) {
  res.sendfile(__dirname + '/fade.js');
});

var stream = T.stream('statuses/sample');

stream.on('tweet', function (tweet) {
  var fc = tweet.user.followers_count;
  lastCounts.push(fc);

  if(lastCounts.length < 10) {return;}


  var max = _.max(lastCounts);
  var min = _.min(lastCounts);

  var baseFreq = fc - min;

  var divider = (max-min)/24;

  var toneNumber = Math.round(fc/divider);
  var toneFreq = tone_freq(toneNumber);

  console.log("FC: "+fc, "Max: "+max, "Min: "+min, toneFreq + "HZ");

  socket.emit('tweet', {
    text: tweet.text,
    lang: tweet.lang,
    influencei: tweet.user.followers_count,
    tone: toneFreq
  });
  lastCounts.pop();
});

