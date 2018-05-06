'use strict';

const db = require(__base + 'app/libs/database');
const uuid = require('uuid/v4');
const bcrypt = require('bcrypt');
const utils = require(__base + 'app/libs/utils');
const jwt = require('jsonwebtoken');
const validators = require(__base + 'app/libs/validators');

// Register a new user
module.exports.register = (req, res) => {
  if (!req.body.email || !req.body.username || !req.body.password) {
    res.status(400).json({errors: ['Data for registration missing']});
  } else if (!validators.validateEmail(req.body.email)) {
    res.status(400).json({errors: ['Not a valid email address']});
  } else {
    let errorMsg = [];
    const newUser = new db.UserModel(req.body);
    newUser.id = uuid();
    bcrypt.hash(req.body.password, 10, (err, hash) => {
      db.UserModel.findOne({username: newUser.username}, (err1, user) => {
        db.UserModel.findOne({email: newUser.email}, (err2, userMail) => {
          if (err1 || err2) {
            res.status(503).json({errors: 'Something went wrong'});
          }
          if (user != null) {
            errorMsg.push('Username already exist');
          }
          if (userMail != null) {
            errorMsg.push('Email already exists');
          }
          if (errorMsg.length > 0) {
            res.status(409).json({errors: errorMsg});
          } else {
            newUser.password = hash;
            db.UserModel.create(newUser, (err, user) => {
              if (err) {
                res.status(503).json({errors: 'Something went wrong'});
              } else {
                res.status(200).json({user: user});
              }
            });
          }
        });
      });
    });
  }
};

// login existing user
module.exports.login = (req, res) => {
  db.UserModel.findOne({username: req.body.username}, (err, user) => {
    if (user == null) {
      utils.sendRequestError(res, 401, ['Wrong username or password']);
    }
    bcrypt.compare(req.body.password, user.password, (err, correct) => {
      if (correct) {
        res.status(200).json({
          token: jwt.sign(
              {
                email: user.email,
                username: user.username,
                id: user.id,
                statuses: user.statuses
              },
              'secret')
        });
      } else {
        utils.sendRequestError(res, 401, ['Wrong username or password']);
      }
    });
  });
};

// check if user is authenticated
module.exports.isAuthenticated = (req, res, next) => {
  if (req.headers && req.headers.authorization &&
      req.headers.authorization.split(' ')[0] === 'JWT') {
    jwt.verify(
        req.headers.authorization.split(' ')[1], 'secret', (err, decode) => {
          if (err) {
            res.status(501).json({errors: 'Not authenticated'});
          } else {
            req.user = decode;
            next();
          }
        });
  } else {
    res.status(501).json({errors: 'Not authenticated'});
  }
}