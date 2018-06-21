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
  const io = require('socket.io')(server);
  io.use((socket, next) => {
      if (socket.handshake.query && socket.handshake.query.token) {
        jwt.verify(socket.handshake.query.token, config.secret,
                   (err, decoded) => {
                     if (err) return next(new Error('Authentication error'));
                     socket.decoded = decoded;
                     next();
                   });
      } else {
        next(new Error('Authentication error'));
      }
    })
      .on('connection', (socket) => {
        console.log('Socket connection established');
        socket.on('disconnect', () => { console.log('user disconnected'); });
        usersController.addSocketId(socket.decoded, socket.id);

        // sending to individual socketid (private message)
        socket.on('message', (msg) => { console.log(msg); });
        // socket.to('id').emit('hey', 'I just met you');
      });
};