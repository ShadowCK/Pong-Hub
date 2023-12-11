const React = require('react');
const ReactDOM = require('react-dom');

const {
  FormInput,
  FormSubmit,
  ContentSection,
  MessageBox,
  NavigationBar,
} = require('./components.jsx');
const utils = require('./utils.js');

const handleChangePassword = (e) => {
  e.preventDefault();

  const oldPass = e.target.querySelector('#old-pass').value;
  const newPass = e.target.querySelector('#new-pass').value;
  const newPass2 = e.target.querySelector('#new-pass2').value;

  if (!oldPass || !newPass || !newPass2) {
    utils.handleError('All fields are required!');
    return false;
  }

  if (newPass !== newPass2) {
    utils.handleError('New passwords do not match!');
    return false;
  }

  utils.sendPost(
    e.target.action,
    { oldPass, newPass, newPass2 },
    {
      onError: (result) => {
        utils.handleError(result.error);
      },
    },
  );

  return false;
};

const ChangePasswordWindow = () => (
  <form
    id="change-password-form"
    name="change-password-form"
    onSubmit={handleChangePassword}
    action="/changePassword"
    method="POST"
  >
    <FormInput label="Old Password:" id="old-pass" type="password" placeholder="old password" />
    <FormInput label="New Password:" id="new-pass" type="password" placeholder="new password" />
    <FormInput
      label="Retype New Password:"
      id="new-pass2"
      type="password"
      placeholder="retype new password"
    />
    <FormSubmit value="Change Password" />
  </form>
);

const init = () => {
  ReactDOM.render(
    <NavigationBar>
      <a className="button is-light" href="/game">Game</a>
      <a className="button is-light" href="/logout">Log Out</a>
    </NavigationBar>,
    document.getElementById('navbar'),
  );
  ReactDOM.render(
    <ContentSection title="Change Password">
      <ChangePasswordWindow />
    </ContentSection>,
    document.getElementById('content-section'),
  );
  ReactDOM.render(<MessageBox />, document.getElementById('message-box'));
};

window.onload = init;
