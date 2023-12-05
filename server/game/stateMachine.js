const states = {
  LOBBY: 'LOBBY',
  IN_GAME: 'IN_GAME',
};

let currentState = states.LOBBY;

const getGameState = () => currentState;

const setGameState = (newState) => {
  currentState = newState;
};

module.exports = { states, getGameState, setGameState };
