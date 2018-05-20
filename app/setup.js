'use strict';

const express = require('express');
const logger = require('morgan');
const bodyParser = require('body-parser');
const cors = require('cors')
const mongoSanitize = require('express-mongo-sanitize');

module.exports.configureExpress = (app) => {
  app.use(cors());
  app.use(logger('dev'));
  app.use(express.static(__base + 'app/public'));
  app.use(bodyParser.urlencoded({extended: true}));
  app.use(bodyParser.json());
  app.use(mongoSanitize());
  app.use(bodyParser.urlencoded({extended: false}));
};