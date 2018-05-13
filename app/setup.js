'use strict';

const express = require('express');
const logger = require('morgan');
const bodyParser = require('body-parser');
var cors = require('cors')

module.exports.configureExpress = (app) => {
  app.use(cors());
  app.use(logger('dev'));
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({extended: false}));
};