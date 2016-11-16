// init project
const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');
const webpush = require('web-push');
const _ = require('lodash');
const app = express();

let participants = new Map();
const roomSize = 1000; // TODO consider some reasonable value

const vapidKeys = webpush.generateVAPIDKeys();
webpush.setVapidDetails(
  'mailto:proximity@guidewire.com',
  vapidKeys.publicKey,
  vapidKeys.privateKey
);

function Person({ name, lat, long }) {
  const now  = () => new Date().getTime();

	this.name = name;
	this.lat = lat;
	this.long = long;
	this.lastUpdate = now();
	
	this.stale = () => {
	  const currentTime = now();
	  return (currentTime - this.lastUpdate) > 5 * 60 * 1000;
	};
	this.update = rhs => {
	  this.lat = rhs.lat;
	  this.long = rhs.long;
	  this.lateUpdate = now();
	}
	this.subscription = null;
}

function calcDistance(aLat, aLong, bLat, bLong) {
	return Math.sqrt(Math.pow(bLat-aLat, 2) + Math.pow(bLong-aLong, 2));
}

function getChatFolks(chatter) {
  return new Map(
    [...participants]
    .filter(([k, p]) => calcDistance(p.lat, p.long, chatter.lat, chatter.long) <= roomSize)
  );
}

function groomParticipants() {
  participants = new Map(
    [...participants]
    .filter(([k, p]) => !p.stale())
  );
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
  
  const existing = participants.get(chatter.name);

  if (existing) {
    existing.update(chatter);
  } else {
    participants.set(chatter.name, chatter);
  }

  let colleagues = getChatFolks(chatter);
  colleagues = [...colleagues.values()];
  response.send({ colleagues });
});

app.post('/subscribe', (request, response) => {
  const { name, subscription } = request.body;
  console.log(`subscribe ${name}`);
  
  const chatter = participants.get(name);
  if (chatter) {
    chatter.subscription = subscription;
  }

  response.send('ok');
});

app.post('/post', (request, response) => {
  const chatter = new Person(request.body);
  const msgReceivers = getChatFolks(chatter);
  const msg = {
    author: chatter.name,
    text: request.body.msg
  };
  
  msgReceivers.forEach(person => sendMsg(person, JSON.stringify(msg)));
  response.send('ok');
});

// listen for requests :)
listener = app.listen(process.env.PORT, function () {
  console.log('Your app is listening on port ' + listener.address().port);
});
