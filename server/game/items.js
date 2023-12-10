/**
 * @typedef {Object} Item
 * @property {string} image - url to the image
 * @property {string} name
 * @property {string} description
 * @property {number} price
 */

/** @type {{ [itemId: string]: Item }} */
const items = {
  faster: {
    image: '/assets/img/items/faster.png',
    name: 'Faster',
    description: 'Increases your max speed and acceleration by 20%',
    price: 1000,
  },
  stronger: {
    image: '/assets/img/items/stronger.png',
    name: 'Stronger',
    description: 'Increases your height by 20%',
    price: 1000,
  },
};

module.exports = items;
