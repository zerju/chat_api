
'use strict';

const express = require('express');
const app = express();

// base directory
global.__base = __dirname + '/';

const db = require(__base + 'app/libs/database');

// setup express
const setup = require(__base + 'app/setup');
setup.configureExpress(app);

// include routes
const routes = require(__base + 'app/routes');
app.use('/', routes);

// handle 404 errors
app.use('*', (req, res) => {
  res.status(404).json({message: 'Wrong path'});
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log('Listening on port 3000!'));