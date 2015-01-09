var Twit = require('twit');
var _ = require('underscore');

var app = require('express')();
var server = require('http').Server(app);
var socket = require('socket.io')(server);

server.listen(process.env.PORT || 8000);

var T = new Twit({
  consumer_key: process.env.consumer_key,
  consumer_secret: process.env.consumer_secret,
  access_token: process.env.access_token,
  access_token_secret: process.env.access_token_secret
});

var cloud_words = {};
var wordCloud = [];

var lastCounts = [];

function tone_freq(nr) {
  nr += 48;
  return Math.round(Math.pow(2, (nr-49)/12)*440);
}

function compare(a,b) {
  if (a.size > b.size)
     return -1;
  if (a.size < b.size)
    return 1;
  return 0;
}

function updateWordCloud(hashtags) {

  for(var i = 0; i<hashtags.length; i++) {
    var word = "#" + hashtags[i].text;

    if ( _.isUndefined(cloud_words[word])) {
      cloud_words[word] = 1;
    } else {
      cloud_words[word] = cloud_words[word]+1;
    }
  }

  wordCloud = [];

  for (var word in cloud_words) {
    if(cloud_words.hasOwnProperty(word)){
      wordCloud.push({text: word, size: cloud_words[word]});
    }
  }

  wordCloud = wordCloud.sort(compare);
  wordCloud = wordCloud.slice(0, 50);

  //console.log(wordCloud);
}

app.get('/', function (req, res) {
  res.sendFile(__dirname + '/index.html');
});

app.get('/fade.js', function (req, res) {
  res.sendFile(__dirname + '/fade.js');
});

var stream = T.stream('statuses/sample');

stream.on('tweet', function (tweet) {
  var fc = tweet.user.followers_count;
  lastCounts.push(fc);

  if(lastCounts.length < 10) {return;}


  var max = _.max(lastCounts);
  var min = _.min(lastCounts);

  var baseFreq = fc - min;

  var divider = (max-min)/(12*3);

  var toneNumber = Math.round(fc/divider);
  var toneFreq = tone_freq(toneNumber);

  //console.log("FC: "+fc, "Max: "+max, "Min: "+min, toneFreq + "HZ");

  updateWordCloud(tweet.entities.hashtags);

  socket.emit('tweet', {
    text: tweet.text,
    lang: tweet.lang,
    influencei: tweet.user.followers_count,
    tone: toneFreq,
    words: wordCloud
  });
  lastCounts.pop();
});

