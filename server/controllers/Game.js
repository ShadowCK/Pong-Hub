const { items } = require('../game/items.js');

const gamePage = (req, res) => res.render('game', {
  items: Object.entries(items).map(([key, value]) => ({ ...value, _id: key })),
});

module.exports = { gamePage };
