const helper = require('./helper.js');
const React = require('react');
const ReactDOM = require('react-dom');

const handleLogin = (e) => {
  e.preventDefault();

  const username = e.target.querySelector('#user').value;
  const pass = e.target.querySelector('#pass').value;

  if (!username || !pass) {
    helper.handleError('Username or password is empty!');
    return false;
  }

  helper.sendPost(e.target.action, { username, pass });

  return false;
};

const handleSignup = (e) => {
  e.preventDefault();

  const username = e.target.querySelector('#user').value;
  const pass = e.target.querySelector('#pass').value;
  const pass2 = e.target.querySelector('#pass2').value;

  if (!username || !pass || !pass2) {
    helper.handleError('All fields are required!');
    return false;
  }

  if (pass !== pass2) {
    helper.handleError('Passwords do not match!');
    return false;
  }

  helper.sendPost(e.target.action, { username, pass, pass2 });

  return false;
};

const handleChangePassword = (e) => {
  e.preventDefault();

  const oldPass = e.target.querySelector('#oldPass').value;
  const newPass = e.target.querySelector('#newPass').value;
  const newPass2 = e.target.querySelector('#newPass2').value;

  if (!oldPass || !newPass || !newPass2) {
    helper.handleError('All fields are required!');
    return false;
  }

  if (newPass !== newPass2) {
    helper.handleError('New passwords do not match!');
    return false;
  }

  helper.sendPost('/changePassword', { oldPass, newPass });

  return false;
};

const LoginWindow = (props) => {
  return (
    <form
      id="login-Form"
      name="login-Form"
      onSubmit={handleLogin}
      action="login"
      method="POST"
      className="main-Form"
    >
      <label htmlFor="username">Username: </label>
      <input id="user" type="text" name="username" placeholder="username" />
      <label htmlFor="pass">Password: </label>
      <input id="pass" type="password" name="pass" placeholder="password" />
      <input className="formSubmit" type="submit" value="Sign in" />
    </form>
  );
};

const SignupWindow = (props) => {
  return (
    <form
      id="signup-form"
      name="signup-form"
      onSubmit={handleSignup}
      action="/signup"
      method="POST"
      className="main-Form"
    >
      <label htmlFor="username">Username: </label>
      <input id="user" type="text" name="username" placeholder="username" />
      <label htmlFor="pass">Password: </label>
      <input id="pass" type="password" name="pass" placeholder="password" />
      <label htmlFor="pass2">Password: </label>
      <input id="pass2" type="password" name="pass2" placeholder="retype password" />
      <input className="formSubmit" type="submit" value="Sign up" />
    </form>
  );
};

const ChangePasswordWindow = (props) => (
  <form
    id="change-password-form"
    name="change-password-form"
    onSubmit={handleChangePassword}
    action="/changePassword"
    method="POST"
    className="main-Form"
  >
    <label htmlFor="oldPass">Old Password: </label>
    <input id="oldPass" type="password" name="oldPass" placeholder="old password" />
    <label htmlFor="newPass">New Password: </label>
    <input id="newPass" type="password" name="newPass" placeholder="new password" />
    <label htmlFor="newPass2">Retype New Password: </label>
    <input id="newPass2" type="password" name="newPass2" placeholder="retype new password" />
    <input className="formSubmit" type="submit" value="Change Password" />
  </form>
);

const init = () => {
  const loginButton = document.getElementById('login-button');
  const signupButton = document.getElementById('signup-button');
  const changePasswordButton = document.getElementById('change-password-button');

  // Register event handlers
  loginButton.addEventListener('click', (e) => {
    e.preventDefault();
    ReactDOM.render(<LoginWindow />, document.getElementById('content'));
    return false;
  });

  signupButton.addEventListener('click', (e) => {
    e.preventDefault();
    ReactDOM.render(<SignupWindow />, document.getElementById('content'));
    return false;
  });

  changePasswordButton.addEventListener('click', (e) => {
    e.preventDefault();
    ReactDOM.render(<ChangePasswordWindow />, document.getElementById('content'));
    return false;
  });

  // Render initial window
  ReactDOM.render(<LoginWindow />, document.getElementById('content'));
};

window.onload = init;
