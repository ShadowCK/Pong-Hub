const controllers = require('./controllers');
const mid = require('./middleware');

const router = (app) => {
  app.get('/login', mid.requiresSecure, mid.requiresLogout, controllers.Account.loginPage);
  app.post('/login', mid.requiresSecure, mid.requiresLogout, controllers.Account.login);
  app.post('/signup', mid.requiresSecure, mid.requiresLogout, controllers.Account.signup);

  app.get('/game', mid.requiresLogin, controllers.Game.gamePage);
  app.get('/logout', mid.requiresLogin, controllers.Account.logout);

  app.get('/', mid.requiresSecure, mid.requiresLogout, controllers.Account.loginPage);

  app.get('/api/user/info', mid.requiresLogin, controllers.Account.getInfo);
  app.get(
    '/changePassword',
    mid.requiresSecure,
    mid.requiresLogin,
    controllers.Account.changePasswordPage,
  );
  app.post(
    '/changePassword',
    mid.requiresSecure,
    mid.requiresLogin,
    controllers.Account.changePassword,
  );
};

module.exports = router;
