var Twit = require('twit');
var _ = require('underscore');
var socket = require('socket.io')(8000);

var T = new Twit({
  consumer_key: '7rMLsE4faev5mrvfJ5hYreu8w',
  consumer_secret: 'b6Qc4ED2MK03rOJxZlWMSf9VuU30KK3dLZncx5WIVrvNO7jvmT',
  access_token: '15518912-F2txQ4JnpwWhbVdsLSw6ZALPBbWvpIBdIv1RdnwzW',
  access_token_secret: 'D7NHtpsoSYwr0VwKhkSAC80podGOFofrXR1k3IzG0CoDm'
});

var stream = T.stream('statuses/sample');

var last24counts = [];

function tone_freq(nr) {
  nr += 48;
  return Math.round(Math.pow(2, (nr-49)/12)*440);
}

stream.on('tweet', function (tweet) {
  var fc = tweet.user.followers_count;
  last24counts.push(fc);

  if(last24counts.length < 5) {return;}


  var max = _.max(last24counts);
  var min = _.min(last24counts);

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
  last24counts.pop();
});

