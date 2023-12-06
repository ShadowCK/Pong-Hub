const models = require('../models');

const { Account } = models;

const loginPage = (req, res) => res.render('login');

const logout = (req, res) => {
  req.session.destroy();
  res.redirect('/');
};

const login = (req, res) => {
  const { username, pass } = req.body;

  if (!username || !pass) {
    return res.status(400).json({ error: 'All fields are required!' });
  }

  return Account.authenticate(username, pass, (err, account) => {
    if (err || !account) {
      return res.status(401).json({ error: 'Wrong username or password!' });
    }

    req.session.account = Account.toAPI(account);

    return res.json({ redirect: '/game' });
  });
};

const signup = async (req, res) => {
  const { username, pass, pass2 } = req.body;

  if (!username || !pass || !pass2) {
    return res.status(400).json({ error: 'All fields are required!' });
  }

  if (pass !== pass2) {
    return res.status(400).json({ error: 'Passwords do not match!' });
  }

  try {
    const hash = await Account.generateHash(pass);
    const newAccount = new Account({ username, password: hash });
    await newAccount.save();
    req.session.account = Account.toAPI(newAccount);
    return res.json({ redirect: '/game' });
  } catch (err) {
    console.log(err);
    if (err.code === 11000) {
      return res.status(400).json({ error: 'Username already in use!' });
    }
    return res.status(500).json({ error: 'An error occured!' });
  }
};

const getInfo = (req, res) => {
  if (!req.session.account) {
    // mid.requiresLogin ensures user is logged in.
    // If this occurs, something is wrong with the server.
    return res.status(500).json({ error: 'Internal server error' });
  }
  return res.status(200).json({ username: req.session.account.username });
};

const changePasswordPage = (req, res) => res.render('changePassword');

const changePassword = async (req, res) => {
  const { oldPass, newPass, newPass2 } = req.body;

  if (!oldPass || !newPass || !newPass2) {
    return res.status(400).json({ error: 'All fields are required!' });
  }
  if (newPass !== newPass2) {
    return res.status(400).json({ error: 'New passwords do not match!' });
  }
  if (newPass === oldPass) {
    return res.status(400).json({ error: 'New password cannot be the same as old password!' });
  }

  const { username } = req.session.account;
  const result = await Account.authenticate(username, oldPass, (err, account) => ({
    success: !err && account,
    account,
  }));
  if (!result.success) {
    return res.status(401).json({ error: 'Wrong password!' });
  }
  try {
    const hash = await Account.generateHash(newPass);
    result.account.password = hash;
    await result.account.save();
  } catch (err) {
    console.log(err);
    return res.status(500).json({ error: 'An error occured!' });
  }
  // Logout user after changing password.
  req.session.destroy();
  return res.json({ redirect: '/' });
};

module.exports = {
  loginPage,
  login,
  logout,
  signup,
  getInfo,
  changePasswordPage,
  changePassword,
};
