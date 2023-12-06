const path = require('path');

module.exports = {
  entry: {
    game: './client/game.jsx',
    login: './client/login.jsx',
    changePassword: './client/changePassword.jsx',
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
        },
      },
    ],
  },
  // devtool: 'cheap-module-source-map',
  // mode: 'development',
  mode: 'production',
  watchOptions: {
    aggregateTimeout: 200,
  },
  output: {
    path: path.resolve(__dirname, 'hosted'),
    filename: '[name]Bundle.js',
  },
};
