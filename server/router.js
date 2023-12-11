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
  app.post(
    '/api/user/purchaseItem',
    mid.requiresSecure,
    mid.requiresLogin,
    controllers.Account.purchaseItem,
  );
  // For non-existent routes, redirect to the login/game page depending on login status.
  // requiresLogin leads non-logged-in users to the login page.
  // requiresLogout leads logged-in users to the game page.
  // We do not need a controller for this route as it will never be reached.
  // TODO: A 404 page would be better. For now, let's stick to redirection.
  app.get('*', mid.requiresLogin, mid.requiresLogout);
};

module.exports = router;
