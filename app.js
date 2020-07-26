const server = require('http').createServer(app);
const io = require('socket.io')(server);

const trackHashtags = process.env.TRACK_HASHTAGS.replace(/#/g, "").split(",");
const counter = trackHashtags.map(hashtag => ({ [hashtag]: 0 })).reduce((obj, pair) => ({ ...obj, ...pair }));

require("dotenv").config();

// configure twit
const Twit = require("twit");
const twit = new Twit({
    consumer_key: process.env.TWIT_CONSUMER_KEY,
    consumer_secret: process.env.TWIT_CONSUMER_SECRET,
    access_token: process.env.TWIT_ACCESS_TOKEN,
    access_token_secret: process.env.TWIT_ACCESS_TOKEN_SECRET
});

const streams = {};

function configureTwit() {
    trackHashtags.forEach(hashtag => {
        const stream = twit.stream('statuses/filter', { track: `#${hashtag}` });
        stream.on('tweet', () => {
            counter[hashtag] += 1;
            io.sockets.emit("update", counter[hashtag]);
        });
        streams[hashtag] = stream;
    });
}

function configureSocket() {
    io.on('connection', function (socket) {
        console.log("new socket connected:", socket.id);
    });
}

function startServer() {
    configureSocket();
    configureTwit();
}

startServer();

