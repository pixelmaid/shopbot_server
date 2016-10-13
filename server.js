'use strict';
const express = require('express');
const SocketServer = require('ws').Server;
const path = require('path');


// list of currently connected clients
var ipad_client;
var desktop_client;
var browser_client;
var authoring_client;
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
	} else if (clientName == 'authoring') {
		authoring_client = ws;
		if (browser_client) {
			browser_client.send("authoring client connected");
		}
	} else if (clientName == 'browser') {
		browser_client = ws;
	}

	ws.on('message', function incoming(message) {
		console.log('message', clientName, message);

		if (browser_client) {
			//browser_client.send(message);
		}
		var json_data = JSON.parse(message);
		if (json_data.name == "desktop_client") {
			if(browser_client){
				browser_client.send("desktop connected");
			}
			desktop_client = ws;
			clientName = "desktop";

		}
		if(json_data.type == "fabricator_data"){

			if(browser_client){
				browser_client.send("fabrication data generated");
			}
			if(authoring_client){
			browser_client.send("sending fab data to authoring client");
			authoring_client.send(JSON.stringify(json_data));

			}
		}
		if (json_data.type == "gcode" && desktop_client) {
			desktop_client.send(JSON.stringify(json_data));
		} else if (json_data.type == "behavior_data" || json_data.type == "behavior_change") {
			if (authoring_client) {
				authoring_client.send(JSON.stringify(json_data));
			}
		}
		if (json_data.type == "brush_init") {
			ws.send("init_data_recieved");
		} else {
			ws.send("message recieved");
		}

	});


	ws.on('close', function close(){
		console.log(clientName + ' client disconnected');
		if(clientName == "authoring"){
			authoring_client = null;
		}
		else if(clientName == "desktop_client"){
			desktop_client = null;

		}
		else if(clientName == "browser_client"){
			browser_client = null;
		}
		clients.splice(index, 1);
	});
});



/*setInterval(() => {
  wss.clients.forEach((client) => {
  });
}, 1000);*/