// server.js
// where your node app starts

// init project
const express = require('express');
const _ = require('lodash');

const app = express();
const participants = []; // the room is empty at this stage

const roomSize = 1000;

function Person({ name, lat, long, roomOwner }) {
	this.name = name;
	this.lat = lat;
	this.long = long;
	this.roomOwner = roomOwner;
}

function calcDistance(aLat, aLong, bLat, bLong) {
	return 0;
}

function getChatFolks(chatter) {
  return participants.filter(
  	person => calcDistance(person.lat, person.long, chatter.lat, chatter.long) <= roomSize
  );
}

function addChatterToRoom(chatter) {
	chatter.roomOwner = !!(colleagues.size() > 0);
    participants.add(chatter);
}

function sendMsg(receiver, msg) {
	return 'do-sth-to-send-a-message';
}

app.use(express.static('public'));

app.get('/', (request, response) => {
  response.sendFile(__dirname + '/views/index.html');
});

app.post('/locate', (request, response) => {
  const chatter = new Person(request.body);

  const colleagues = getChatFolks(chatter);
  const participates = participants.map(person => person.name).includes(chatter.name);
  
  if (!participates) {
  	addChatterToRoom(chatter);
  } else {
    if (colleagues.includes(chatter)) {
      
    }
  	// check if the distance is fine (colleagues.includes(chatter)),
  	// if not - kick out from from the existing room and stick to a new one
  	// in another case - we are good
  }

  response.send({ colleagues });
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