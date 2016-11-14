// init project
const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');
const webpush = require('web-push');
const _ = require('lodash');
const app = express();

// TODO: ALEX: Switch to a participants map with key being the name of the participant
let participants = []; // the room is empty at this stage
const roomSize = 1000; // TODO consider some reasonable value

const vapidKeys = webpush.generateVAPIDKeys();
webpush.setGCMAPIKey('AIzaSyD94NpyTWXSYXTV3mLl1F-xPS7Dr2x2vZ4');
webpush.setVapidDetails(
  'mailto:proximity@guidewire.com',
  vapidKeys.publicKey,
  vapidKeys.privateKey
);


function Person({ name, lat, long }) {
	this.name = name;
	this.lat = lat;
	this.long = long;
	this.lastUpdate = new Date().getTime();
	this.stale = () => {
	  const currentTime = new Date().getTime();
	  return (currentTime - this.lastUpdate) > 5 * 60 * 1000;
	};
	this.subscription = null;
}

function calcDistance(aLat, aLong, bLat, bLong) {
	return Math.sqrt(Math.pow(bLat-aLat, 2) + Math.pow(bLong-aLong, 2));
}

function getChatFolks(chatter) {
  return participants.filter(
    person => calcDistance(person.lat, person.long, chatter.lat, chatter.long) <= roomSize
  );
}

function groomParticipants(chatter) {
  participants = participants.filter( p => p.name !== chatter.name || !p.stale());
  participants.push(chatter);
}

function sendMsg(receiver, msg) {
  if (!receiver.subscription) {
    console.error(`User ${receiver.name} not subscribed properly. Cannot send notification.`);
    return;
  }
  
  webpush.sendNotification(receiver.subscription, msg)
    .then(  
      () => console.log(`Sent ${msg} to ${receiver.name}`),
      err => console.error(`Could not sent ${msg} to ${receiver.name}. Reason ${err}`)
    );
}

app.set('port', (process.env.PORT || 3000));

app.use('/', express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'no-cache');
  next();
});

app.get('/', (request, response) => {
  response.sendFile(__dirname + '/views/index.html');
});

app.get('/vapid', (request, response) => {
  // definitely not appropriate for production ;)
  response.send({ publicKey: vapidKeys.publicKey });
});

app.post('/locate', (request, response) => {
  console.log(request.body);

  let chatter = new Person(request.body);
  
  groomParticipants(chatter);
  
  const colleagues = getChatFolks(chatter);
  chatter = colleagues.find(person => person.name === chatter.name);
  
  response.send(colleagues);
});

app.post('/subscribe', (request, response) => {
  const { name, subscription } = request.body;
  
  const chatter = participants.find(person => person.name === name);
  if (chatter) {
    chatter.subscription = subscription;
  }
  
  response.send('ok');
});

app.post('/post', (request, response) => {
  const chatter = new Person(request.body);
  const msg = request.body.msg;

  const msgReceivers = getChatFolks(chatter);
  msgReceivers.forEach(person => sendMsg(person, msg));
  
  response.send('ok');
});

// listen for requests :)
listener = app.listen(process.env.PORT, function () {
  console.log('Your app is listening on port ' + listener.address().port);
});
