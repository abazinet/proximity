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

app.use(express.static('public'));

app.get('/', (request, response) => {
  response.sendFile(__dirname + '/views/index.html');
});

app.post('/locate', (request, response) => {
  const chatter = new Person(request.body);

  const colleagues = participants.filter(
  	person => calcDistance(person.lat, person.long, chatter.lat, chatter.long) <= roomSize
  );
  participants.add(chatter);
  chatter.roomOwner = !!(colleagues.size() > 0);

  response.send({
  	chatters: colleagues.concat([chatter])
  });
});

app.post('/post', (request, response) => {
  response.send(request.body);
});

// listen for requests :)
listener = app.listen(process.env.PORT, function () {
  console.log('Your app is listening on port ' + listener.address().port);
});