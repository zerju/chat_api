
'use strict';

const express = require('express');
const app = express();

// base directory
global.__base = __dirname + '/';

// user controller
const usersController = require(__base + 'app/controllers/users');

const db = require(__base + 'app/libs/database');

// setup express
const setup = require(__base + 'app/setup');
setup.configureExpress(app);

// include routes
const routes = require(__base + 'app/routes');
app.use('/', routes);

// handle 404 errors
app.use('*', (req, res) => { res.status(404).json({message: 'Wrong path'}); });

const port = process.env.PORT || 3000;
const server = require('http').createServer(app);
const io = require('socket.io')(server);
io.on('connection', (socket) => {
  console.log('Socket connection established');
  socket.on('disconnect', () => { console.log('user disconnected'); });
  usersController.addSocketId(socket.id);
  // sending to individual socketid (private message)
  socket.on('message', (msg) => { console.log(msg); });
  socket.to('id').emit('hey', 'I just met you');
});
server.listen(port, () => console.log('Listening on port 3000!'));