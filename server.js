'use strict';
const express = require('express');
const SocketServer = require('ws').Server;
const path = require('path');


// list of currently connected clients
var ipad_client;
var desktop_client;
var browser_client;
var clients = [];


const PORT = process.env.PORT || 3000;
const INDEX = path.join(__dirname, 'index.html');

const server = express()
	.use((req, res) => res.sendFile(INDEX))
	.listen(PORT, () => console.log(`Listening on ${ PORT }`));

const wss = new SocketServer({
	server
});

wss.on('connection', (ws) => {
	console.log('Client connected', ws.protocol);
	var protocol = ws.protocol;
	var connection = ws;
	var index = clients.push(connection) - 1;
	var clientName = ws.protocol;
	if (clientName == 'ipad') {
		ipad_client = ws;
	} else if (clientName == 'desktop') {
		desktop_client = ws;
	} else if (clientName == 'browser') {
		browser_client = ws;
	}

	ws.on('message', function incoming(message) {
		if (browser_client !== null) {
			browser_client.send(message);
		}
		var json_data = JSON.parse(message);
		if (json_data.name == "desktop_client") {
			browser_client.send("desktop connected");
			desktop_client = ws;

		}
		console.log('message', clientName, json_data.type);
		if (json_data.type == "gcode" && desktop_client !== null) {
			desktop_client.send(JSON.stringify(json_data));
		}

		ws.send("message recieved");


	});


	ws.on('close', () => console.log('Client disconnected'));
});



/*setInterval(() => {
  wss.clients.forEach((client) => {
  });
}, 1000);*/