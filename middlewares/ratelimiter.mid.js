const rateLimit = require('express-rate-limit');

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Max 10 requests per IP
  message: { message: 'Too many requests, please try again after 15 minutes' }
});

const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Max 5 uploads per IP
  message: { message: 'Too many upload requests, please try again after 15 minutes' }
});

module.exports = { authLimiter, uploadLimiter };