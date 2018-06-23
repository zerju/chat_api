'use strict';

const express = require('express');
const logger = require('morgan');
const bodyParser = require('body-parser');
const cors = require('cors');
const mongoSanitize = require('express-mongo-sanitize');
const jwt = require('jsonwebtoken');
const config = require(__base + 'app/config');


// controllers
const usersController = require(__base + 'app/controllers/users');
const authController = require(__base + 'app/controllers/auth');
const convController = require(__base + 'app/controllers/conversations');

module.exports.configureExpress = (app) => {
  app.use(cors());
  app.use(logger('dev'));
  app.use(express.static(__base + 'app/public'));
  app.use(bodyParser.urlencoded({extended: true}));
  app.use(bodyParser.json());
  app.use(mongoSanitize());
  app.use(bodyParser.urlencoded({extended: false}));
};

module.exports.configureSockets = (server) => {
  const io =
      require('socket.io')(server, {transports: ['websocket', 'xhr-polling']});
  io.use((socket, next) => {
      console.log('socket start');
      if (socket.handshake.query && socket.handshake.query.token) {
        jwt.verify(
            socket.handshake.query.token, config.secret, (err, decoded) => {
              if (err) return next(new Error('Authentication error'));
              socket.decoded = decoded;
              console.log('decoded');
              next();
            });
      } else {
        console.log('error');
        next(new Error('Authentication error'));
      }
    }).on('connection', (socket) => {
    console.log('Socket connection established');
    socket.on('disconnect', () => {
      console.log('user disconnected');
    });
    usersController.addSocketId(socket.decoded, socket.id);

    socket.on('message', (msg) => {
      const decoded = jwt.decode(msg.token);
      const userId = decoded.userId;
      convController.addMessage(
          msg.token, msg.message, msg.conversationId, function(socketIds) {
            for (let id of socketIds) {
              // sending to individual socketid (private message)
              socket.to(id).emit('message', msg.message);
            }
          });
    });
  });
};