const models = require('../models');

/**
 * Redirects the request to a specified location.
 * Handles both GET and POST requests.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @param {string} location - The URL to redirect to.
 * @param {Object} extras - Additional data to include in the response (POST requests only).
 */
const redirect = (req, res, location, extras = {}) => {
  if (req.method === 'POST') {
    res.json({ redirect: location, ...extras });
    return;
  }
  res.redirect(location);
};

/**
 * Middleware function that checks if a user is logged in.
 * If the user is not logged in, it redirects them to the home page.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @param {Function} next - The next middleware function.
 * @returns {void}
 */
const requiresLogin = (req, res, next) => {
  if (!req.session.account) {
    return redirect(req, res, '/');
  }
  return next();
};

/**
 * Middleware function that checks if the user is logged out.
 * If the user is logged in, it redirects them to the game page.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @param {Function} next - The next middleware function.
 */
const requiresLogout = (req, res, next) => {
  if (req.session.account) {
    return redirect(req, res, '/game');
  }
  return next();
};

/**
 * Middleware function that redirects the request to HTTPS if it is not already using HTTPS.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @param {Function} next - The next middleware function.
 */
const requiresSecure = (req, res, next) => {
  if (req.headers['x-forwarded-proto'] !== 'https') {
    return res.redirect(`https://${req.hostname}${req.url}`);
  }
  return next();
};

const bypassSecure = (req, res, next) => {
  next();
};

/**
 * FIXME: This is currently an Express middleware instead of a router middleware,
 * which may cause performance issues as it queries MongoDB for every request
 * (and waits for it). In the future, consider combining this with requiresLogin
 *
 * Middleware function to verify if the account of a logged-in user exists in MongoDB.
 * If the account does not exist, it performs necessary actions such as logging out the user,
 * disconnecting them from socket.io, and redirecting them to the login page.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @param {Function} next - The next middleware function.
 */
const verifyUser = (req, res, next) => {
  if (req.session) {
    const { account } = req.session;
    if (!account) {
      next();
      return;
    }
    // If the user is logged in according to the Redis session,
    // verify if the account exists in MongoDB
    if (account) {
      models.Account.findById(account._id).then((doc) => {
        if (!doc) {
          console.log(
            `Account ${account._id} not found. Check your Redis and MongoDB. MongoDB does not have the account, but Redis does.`,
          );
          // Logout with our 'redirect()' suitable for both get and post requests
          req.session.destroy();
          redirect(req, res, '/', { error: 'Your account does not exist!' });
          // If the user is connected to socket.io, also disconnect them
          const socket = req.app.get('io').sockets.sockets.get(account.socketId);
          if (socket) {
            socket.disconnect();
          }
        } else {
          next();
        }
      });
    }
  }
};

module.exports.requiresLogin = requiresLogin;
module.exports.requiresLogout = requiresLogout;

if (process.env.NODE_ENV === 'production') {
  module.exports.requiresSecure = requiresSecure;
} else {
  module.exports.requiresSecure = bypassSecure;
}

module.exports.verifyUser = verifyUser;
