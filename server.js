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

function Person({ name, lat, long }) {
	this.name = name;
	this.lat = lat;
	this.long = long;
	this.lastUpdate = new Date().getTime();
	this.stale = () => {
	  const currentTime = new Date().getTime();
	  return (currentTime - this.lastUpdate) > 5 * 60 * 1000;
	};
	this.vapid = null;
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
  if (!receiver.vapid || !receiver.subscription) {
    throw new Error(`User ${receiver.name} not subscribed properly. Cannot notify`);
  }
  
  webpush.setVapidDetails(
    `mailto:${receiver.name}@guidewire.com`,
    receiver.vapid.publicKey,
    receiver.vapid.privateKey
  );
  webpush.sendNotification(receiver.subscription, msg);
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

app.post('/locate', (request, response) => {
  console.log(request.body);

  let chatter = new Person(request.body);
  
  groomParticipants(chatter);
  
  const colleagues = getChatFolks(chatter);
  chatter = colleagues.find(person => person.name === chatter.name);
  
  let data = { colleagues };
  if (!chatter.vapidKeys) {
    chatter.vapid = webpush.generateVAPIDKeys();
    data.subscriptionKey = chatter.vapid.publicKey;
  }
  
  response.send(data);
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

  console.log('Sent: ' + msg + ' to ' + msgReceivers.map(p => p.name));

  response.send('ok');
});

// listen for requests :)
listener = app.listen(process.env.PORT, function () {
  console.log('Your app is listening on port ' + listener.address().port);
});
