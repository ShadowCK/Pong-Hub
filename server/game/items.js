/**
 * @typedef {Object} Item
 * @property {string} image - url to the image
 * @property {string} name
 * @property {string} description
 * @property {number} price
 */

const itemIds = {
  faster: 'faster',
  stronger: 'stronger',
  godSpeed: 'godSpeed',
  obese: 'obese',
};

/** @type {{ [itemKey: string]: Item }} */
const items = {
  [itemIds.faster]: {
    image: '/assets/img/items/faster.png',
    name: 'Faster',
    description: 'Increases your max speed and acceleration by 20%',
    price: 1000,
  },
  [itemIds.stronger]: {
    image: '/assets/img/items/stronger.png',
    name: 'Stronger',
    description: 'Increases your height by 20%',
    price: 1000,
  },
  [itemIds.godSpeed]: {
    image: '/assets/img/items/god-speed.png',
    name: 'God Speed',
    description: 'Increases your max speed by 25% and acceleration by 100%',
    price: 10000,
  },
  [itemIds.obese]: {
    image: '/assets/img/items/obese.png',
    name: 'Obese',
    description: 'Increases your width and height by 25%',
    price: 10000,
  },
};

module.exports = { itemIds, items };
