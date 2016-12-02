// init projects 
const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');
const webpush = require('web-push');
const _ = require('lodash');
const app = express();

let participants = new Map();
const roomSizeMeters = 1000;

const vapidKeys = webpush.generateVAPIDKeys();
webpush.setVapidDetails(
  'mailto:proximity@guidewire.com',
  vapidKeys.publicKey,
  vapidKeys.privateKey
);

function Person({ name, lat, long }) {
  const now = () => new Date().getTime();

  this.name = name;
  this.lat = lat;
  this.long = long;
  this.lastUpdate = now();
  this.update = rhs => {
    this.lat = rhs.lat;
    this.long = rhs.long;
    this.lateUpdate = now();
  }
  this.subscription = null;
}

function calcDistance(lat1, lon1, lat2, lon2) {
  const deg2rad = deg => deg * (Math.PI / 180);
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2)
    ;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const meters = R * c * 1000;
  return meters;
}

function getChatFolks(chatter) {
  return new Map(
    [ ...participants ]
      .filter(([k, p]) => calcDistance(p.lat, p.long, chatter.lat, chatter.long) <= roomSizeMeters)
  );
}


function sendMsg(receiver, msg) {
  if (!receiver.subscription) {
    console.error(`User ${receiver.name} not subscribed properly. Cannot send notification.`);
    return;
  }

  webpush.sendNotification(receiver.subscription, msg)
    .then(() => console.log(`Sent ${msg} to ${receiver.name}`))
    .catch(err => {
      console.error(`Could not sent ${msg} to ${receiver.name}. Reason ${err}`);
    });
}

app.set('port', (process.env.PORT || 3000));

app.use('/', express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

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

  const existing = participants.get(chatter.name);

  if (existing) {
    existing.update(chatter);
  } else {
    participants.set(chatter.name, chatter);
  }

  let colleagues = getChatFolks(chatter);
  colleagues = [ ...colleagues.values() ];
  response.send({ colleagues });
});

app.post('/subscribe', (request, response) => {
  const { name, subscription } = request.body;
  console.log(`subscribe ${name}`);

  let chatter = participants.get(name);
  if (!chatter) {
    chatter = new Person({ name });
  }
  chatter.subscription = subscription;

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
listener = app.listen(process.env.PORT || 80, function () {
  console.log('Your app is listening on port ' + listener.address().port);
});
 