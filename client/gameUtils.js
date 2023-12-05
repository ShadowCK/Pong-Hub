const Phaser = require('phaser');

const getMainCamera = (scene) => scene.cameras.main;

/**
 * @param {Phaser.GameObjects.GameObject} gameObject
 * @param {Phaser.Scene} scene
 */
const centerGameObject = (gameObject, scene) => {
  if (!gameObject.setPosition) {
    console.warn('centerGameObject: gameObject does not have setPosition method', gameObject);
    return;
  }
  const mainCamera = getMainCamera(scene);
  const { width, height } = gameObject;
  const centerX = mainCamera.worldView.x + mainCamera.width / 2;
  const centerY = mainCamera.worldView.y + mainCamera.height / 2;
  gameObject.setPosition(centerX - width / 2, centerY - height / 2);
};

const matterToPhaser = ({ x, y, width, height, angle = 0 }) => ({
  x: x - width / 2,
  y: y - height / 2,
  width,
  height,
  angle,
});

/**
 * @param {Phaser.GameObjects.Graphics} graphics
 * @param {Object} bodyData
 */
const drawMatterBody = (graphics, bodyData) => {
  const { x, y, width, height, angle } = matterToPhaser(bodyData);
  graphics.save();
  graphics.translateCanvas(x + width / 2, y + height / 2);
  graphics.rotateCanvas(angle);
  graphics.fillRect(-width / 2, -height / 2, width, height);
  graphics.restore();
};

module.exports = { getMainCamera, centerGameObject, drawMatterBody };
