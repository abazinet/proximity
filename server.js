// init project
const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');
const _ = require('lodash');
const app = express();

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
	}
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
  // TODO impl with push notifications
  return 'do-sth-to-send-a-message';
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

  const chatter = new Person(request.body);
  
  groomParticipants(chatter);
  
  const colleagues = getChatFolks(chatter);

  response.send({ colleagues });
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