// server.js
// where your node app starts

// init project
const express = require('express');
const _ = require('lodash');

const app = express();
const participants = new Set(); // the room is empty at this stage

const roomSize = 1000; // TODO consider some reasonable value

function Person({ name, lat, long, roomOwner }) {
	this.name = name;
	this.lat = lat;
	this.long = long;
	this.roomOwner = roomOwner;
	this.participation = null;
}

function calcDistance(aLat, aLong, bLat, bLong) {
	return Math.sqrt(Math.pow(bLat-aLat, 2) + Math.pow(bLong-aLong, 2));
}

function getChatFolks(chatter) {
  return participants.filter(
    person => calcDistance(person.lat, person.long, chatter.lat, chatter.long) <= roomSize
  );
}

function addChatterToRoom(chatter, colleagues) {
  const colleaguesExist = colleagues.size() > 0;
  chatter.roomOwner = chatter.participation.exists && colleaguesExist ? chatter.participation.roomOwner : !colleaguesExist;
  participants.add(chatter);
  return colleagues.push([chatter]);
}

function sendMsg(receiver, msg) {
  // TODO impl with push notifications
  return 'do-sth-to-send-a-message';
}

app.use(express.static('public'));

app.get('/', (request, response) => {
  response.sendFile(__dirname + '/views/index.html');
});

app.post('/locate', (request, response) => {
  const chatter = new Person(request.body);
  
  const participation = participants.find(person => person.name === chatter.name);
  chatter.participation = {
    exists: !!participation,
    roomOwner: participation ? participation.roomOwner : false
  };
  
  if (chatter.participation.exists) {
    participants.delete(participation); // need to refresh participation (coords, etc.)
  }
  
  let colleagues = getChatFolks(chatter);
  colleagues = addChatterToRoom(chatter, colleagues);
  if (!colleagues.any(person => person.roomOwner)) {
    chatter.roomOwner = true;
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