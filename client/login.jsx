const React = require('react');
const ReactDOM = require('react-dom');

const { FormInput, FormButton } = require('./components.jsx');
const utils = require('./utils.js');

const handleLogin = (e) => {
  e.preventDefault();

  const username = e.target.querySelector('#username').value;
  const pass = e.target.querySelector('#pass').value;

  if (!username || !pass) {
    utils.handleError('Username or password is empty!');
    return false;
  }

  utils.sendPost(
    e.target.action,
    { username, pass },
    {
      onError: (result) => {
        utils.handleError(result.error);
      },
    },
  );

  return false;
};

const handleSignup = (e) => {
  e.preventDefault();

  const username = e.target.querySelector('#username').value;
  const pass = e.target.querySelector('#pass').value;
  const pass2 = e.target.querySelector('#pass2').value;

  if (!username || !pass || !pass2) {
    utils.handleError('All fields are required!');
    return false;
  }

  if (pass !== pass2) {
    utils.handleError('Passwords do not match!');
    return false;
  }

  utils.sendPost(
    e.target.action,
    { username, pass, pass2 },
    {
      onError: (result) => {
        utils.handleError(result.error);
      },
    },
  );

  return false;
};

const LoginWindow = () => (
  <form id="login-form" name="login-form" onSubmit={handleLogin} action="/login" method="POST">
    <FormInput label="Username:" id="username" type="text" placeholder="username" />
    <FormInput label="Password:" id="pass" type="password" placeholder="password" />
    <FormButton value="Sign in" />
  </form>
);

const SignupWindow = () => (
  <form id="signup-form" name="signup-form" onSubmit={handleSignup} action="/signup" method="POST">
    <FormInput label="Username:" id="username" type="text" placeholder="username" />
    <FormInput label="Password:" id="pass" type="password" placeholder="password" />
    <FormInput label="Retype Password:" id="pass2" type="password" placeholder="retype password" />
    <FormButton value="Sign up" />
  </form>
);

const init = () => {
  const loginButton = document.getElementById('login-button');
  const signupButton = document.getElementById('signup-button');

  // Register event handlers
  loginButton.addEventListener('click', () => {
    ReactDOM.render(<LoginWindow />, document.getElementById('content'));
    return false;
  });

  signupButton.addEventListener('click', () => {
    ReactDOM.render(<SignupWindow />, document.getElementById('content'));
    return false;
  });

  // Render initial window
  ReactDOM.render(<LoginWindow />, document.getElementById('content'));
};

window.onload = init;

utils.initBulmaNavbar();
