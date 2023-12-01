const React = require('react');
const ReactDOM = require('react-dom');
const helper = require('./helper.js');

const handleLogin = (e) => {
  e.preventDefault();

  const username = e.target.querySelector('#username').value;
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

  const username = e.target.querySelector('#username').value;
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

  const oldPass = e.target.querySelector('#old-pass').value;
  const newPass = e.target.querySelector('#new-pass').value;
  const newPass2 = e.target.querySelector('#new-pass2').value;

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

const FormInput = ({ label, id, name = id, type, placeholder, size }) => (
  <div className="input-container">
    <label htmlFor={id}>{label}</label>
    <input id={id} type={type} name={name} placeholder={placeholder} {...(size ? { size } : {})} />
  </div>
);

const LoginWindow = () => (
  <form
    id="login-form"
    name="login-form"
    onSubmit={handleLogin}
    action="/login"
    method="POST"
    className="main-form"
  >
    <FormInput label="Username:" id="username" type="text" placeholder="username" size="16" />
    <FormInput label="Password:" id="pass" type="password" placeholder="password" size="16" />
    <input className="formSubmit" type="submit" value="Sign in" />
  </form>
);

const SignupWindow = () => (
  <form
    id="signup-form"
    name="signup-form"
    onSubmit={handleSignup}
    action="/signup"
    method="POST"
    className="main-form"
  >
    <FormInput label="Username:" id="username" type="text" placeholder="username" size="16" />
    <FormInput label="Password:" id="pass" type="password" placeholder="password" size="16" />
    <FormInput
      label="Password:"
      id="pass2"
      type="password"
      placeholder="retype password"
      size="16"
    />
    <input className="formSubmit" type="submit" value="Sign up" />
  </form>
);

const ChangePasswordWindow = () => (
  <form
    id="change-password-form"
    name="change-password-form"
    onSubmit={handleChangePassword}
    action="/changePassword"
    method="POST"
    className="main-form"
  >
    <FormInput
      label="Old Password:"
      id="old-pass"
      type="password"
      placeholder="old password"
      size="16"
    />
    <FormInput
      label="New Password:"
      id="new-pass"
      type="password"
      placeholder="new password"
      size="16"
    />
    <FormInput
      label="New Password:"
      id="new-pass2"
      type="password"
      placeholder="retype new password"
      size="16"
    />
    <input className="formSubmit" type="submit" value="Change Password" />
  </form>
);

const init = () => {
  const loginButton = document.getElementById('login-button');
  const signupButton = document.getElementById('signup-button');
  const changePasswordButton = document.getElementById('change-password-button');

  // Register event handlers
  loginButton.addEventListener('click', () => {
    ReactDOM.render(<LoginWindow />, document.getElementById('content'));
    return false;
  });

  signupButton.addEventListener('click', () => {
    ReactDOM.render(<SignupWindow />, document.getElementById('content'));
    return false;
  });

  changePasswordButton.addEventListener('click', () => {
    ReactDOM.render(<ChangePasswordWindow />, document.getElementById('content'));
    return false;
  });

  // Render initial window
  ReactDOM.render(<LoginWindow />, document.getElementById('content'));
};

window.onload = init;
