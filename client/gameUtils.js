const Phaser = require('phaser');

const getMainCamera = (scene) => scene.cameras.main;

/**
 * Centers the game object on the main camera.
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

/**
 * Positions the game object at the given offset (0-1) of the camera.
 * @returns
 */
const positionGameObject = (gameObject, scene, offset) => {
  if (!gameObject.setPosition) {
    console.warn('centerGameObject: gameObject does not have setPosition method', gameObject);
    return;
  }
  const mainCamera = getMainCamera(scene);
  const { width, height } = gameObject;
  const positionX = mainCamera.worldView.x + mainCamera.width * offset.x;
  const positionY = mainCamera.worldView.y + mainCamera.height * offset.y;
  gameObject.setPosition(positionX - width / 2, positionY - height / 2);
};

/**
 * Converts a Matter body's coordinates to Phaser coordinates.
 * Positions in Matter are at the center of the body, while Phaser's are at the top-left corner.
 */
const matterToPhaser = ({ x, y, width, height, angle = 0 }) => ({
  x: x - width / 2,
  y: y - height / 2,
  width,
  height,
  angle,
});

/**
 * Draws a Matter body to the given graphics object.
 * Only supports rectangle bodies for now.
 * TODO: Make this support both circle and rectangle bodies, and even polygons!
 * @param {Phaser.GameObjects.Graphics} graphics
 * @param {Matter.Body} body
 */
const drawMatterBody = (graphics, bodyData) => {
  const { x, y, width, height, angle } = matterToPhaser(bodyData);
  graphics.save();
  graphics.translateCanvas(x + width / 2, y + height / 2);
  graphics.rotateCanvas(angle);
  graphics.fillRect(-width / 2, -height / 2, width, height);
  graphics.restore();
};

/**
 * Draws to the given graphics without affecting the current drawing context
 * @param {Phaser.GameObjects.Graphics} graphics
 * @param {Function} callback
 */
const safeDraw = (graphics, callback) => {
  graphics.save();
  callback(graphics);
  graphics.restore();
};

module.exports = { getMainCamera, centerGameObject, positionGameObject, drawMatterBody, safeDraw };
