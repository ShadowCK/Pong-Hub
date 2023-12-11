const React = require('react');

const FormInput = ({ label, id, name = id, type, placeholder }) => (
  <div className="field">
    <label className="label" htmlFor={id}>
      {label}
    </label>
    <div className="control">
      <input className="input" id={id} type={type} name={name} placeholder={placeholder} />
    </div>
  </div>
);

const FormSubmit = ({ value }) => (
  <div className="field">
    <div className="control">
      <input className="button is-primary" type="submit" value={value} />
    </div>
  </div>
);

module.exports = { FormInput, FormSubmit };
