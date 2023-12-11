const models = require('../models');
const { items } = require('../game/items.js');
const game = require('../game');

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
  const { account } = req.session;
  if (!account) {
    // mid.requiresLogin ensures user is logged in.
    // If this occurs, something is wrong with the server.
    res.status(500).json({ error: 'Internal server error' });
    return;
  }
  Account.findById(account._id)
    .then((doc) => {
      if (!doc) {
        res.status(404).json({ error: 'Document not found' });
        return;
      }
      res.status(200).json({ username: doc.username, items: doc.items });
    })
    .catch((err) => {
      console.log(err);
      res.status(500).json({ error: 'Internal server error' });
    });
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

const purchaseItem = (req, res) => {
  const userId = req.session.account._id;
  const { itemId } = req.body;
  if (!itemId) {
    res.status(400).json({ error: 'Item name is required!' });
    return;
  }
  const itemData = items[itemId];
  if (!itemData) {
    res.status(400).json({ error: 'Item does not exist!' });
    return;
  }
  // Skip price because we just want to showcase the profit model.
  // TODO: In the future, make the price in-game currency instead of "real money".
  Account.findById(userId)
    .then((doc) => {
      const exists = doc.items.some((item) => item.itemId === itemId);
      if (exists) {
        res.status(400).json({ error: 'Item already purchased!' });
        return;
      }
      doc.items.push({
        itemId,
        name: itemData.name,
        description: itemData.description,
        price: itemData.price,
      });
      // TODO: Save the doc atomically like for chat history
      doc
        .save()
        .then(() => res.status(200).json({ message: 'Item purchased!' }))
        .catch((err) => {
          console.log(err);
          res.status(500).json({ error: 'An error occured!' });
        });
    })
    .catch((err) => {
      console.log(err);
      res.status(500).json({ error: 'An error occured!' });
    });
  // If the user is in-game, apply the item immediately
  const { isConnectedToGame, socketId } = req.session;
  if (isConnectedToGame && socketId) {
    const player = game.players[socketId];
    if (player) {
      player.applyItem(itemId);
    }
  }
};

module.exports = {
  loginPage,
  login,
  logout,
  signup,
  getInfo,
  changePasswordPage,
  changePassword,
  purchaseItem,
};
