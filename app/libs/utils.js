'use strict';

module.exports.sendRequestError = (res, status, errorMessages) => {
  res.status(status).json({errors: errorMessages});
}