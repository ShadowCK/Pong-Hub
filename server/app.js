// Read .env file and set environment variables for local development
require('dotenv').config();

const serverStartTime = Date.now();

// Require modules
// Node.js path module
const path = require('path');
// Express web framework
const express = require('express');
// Compression middleware
const compression = require('compression');
// Favicon middleware
const favicon = require('serve-favicon');
// Body parsing middleware
const bodyParser = require('body-parser');
// Mongoose MongoDB ODM
const mongoose = require('mongoose');
// Handlebars view engine
const expressHandlebars = require('express-handlebars');
// Helmet security middleware
const helmet = require('helmet');
// Express session middleware
const session = require('express-session');
// Redis session store
const RedisStore = require('connect-redis').default;
// Redis client
const redis = require('redis');
// Router
const router = require('./router.js');
// Socket.io setup
const socketSetup = require('./io.js');
// Game script
const game = require('./game');
// Custom middleware
const { verifyUser } = require('./middleware');

const port = process.env.PORT || process.env.NODE_PORT || 3000;

const dbURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1/PongHub';
mongoose.connect(dbURI).catch((err) => {
  if (err) {
    console.log('Could not connect to database');
    throw err;
  }
});

const redisClient = redis.createClient({
  url: process.env.REDISCLOUD_URL,
});

redisClient.on('error', (err) => console.log('Redis Client Error', err));
redisClient.connect().then(() => {
  const app = express();

  app.use(helmet());
  app.use('/assets', express.static(path.resolve(`${__dirname}/../hosted/`)));
  app.use(favicon(`${__dirname}/../hosted/img/favicon.png`));
  app.use(compression());
  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(bodyParser.json());

  const sessionMiddleware = session({
    key: 'sessionid',
    store: new RedisStore({
      client: redisClient,
      prefix: 'ponghub:sess:',
    }),
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
  });
  app.use(sessionMiddleware);
  app.use(verifyUser);

  app.engine('handlebars', expressHandlebars.engine({ defaultLayout: '' }));
  app.set('view engine', 'handlebars');
  app.set('views', `${__dirname}/../views`);

  router(app);

  const { server, io } = socketSetup(app, sessionMiddleware, serverStartTime);
  // Can use req.app.get('io') to get the socket.io instance
  app.set('io', io);

  server.listen(port, (err) => {
    if (err) {
      throw err;
    }
    console.log(`Listening on port ${port}`);
  });

  // Processes after server successfully starts
  game.initChatHistory(serverStartTime);
});
