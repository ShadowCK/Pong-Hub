// Note: not all React components are here. For example, GameWindow is in game.jsx as it is
// closely related to other logic like rendering and using socket.io, and it's unique itself.
// LoginWindow, SignupWindow and ChangePasswordWindow for similar reasons as well.

const React = require('react');

/**
 * An input field for one of our forms.
 */
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

/**
 * A submit button for one of our forms.
 */
const FormSubmit = ({ value }) => (
  <div className="field">
    <div className="control">
      <input className="button is-primary" type="submit" value={value} />
    </div>
  </div>
);

/**
 * Represents a purchasable item.
 */
const ItemContainer = ({ itemId, item }) => (
  <div className="box item-container" data-item-id={itemId}>
    <article className="media">
      <div className="media-left">
        <figure className="image is-64x64">
          <img src={item.image} alt="Item image" />
        </figure>
      </div>
      <div className="media-content">
        <div className="content">
          <p>
            <strong>{item.name}</strong>
            <br />
            {item.description}
          </p>
        </div>
      </div>
      <div className="media-right">
        <button className="button is-success buy-button">Buy for {item.price} Tiger Spirits</button>
      </div>
    </article>
  </div>
);

/**
 * Renders a list of purchasable items.
 * Note: this component renders elements without wrapping them in an additional div.
 * By using React Fragments (<>...</>), it directly returns an array of ItemContainer components.
 * This approach is useful when rendering the component into a specific DOM element like
 * 'items-content' in our case, so we don't have the headache of adding an extra div.
 */
const ItemStore = ({ items }) => (
  <>
    {Object.entries(items).map(([itemId, item]) => (
      <ItemContainer key={itemId} itemId={itemId} item={item} />
    ))}
  </>
);

/**
 * Main section that contains dynamically rendered content.
 */
const ContentSection = ({ title, children }) => (
  <section className="section">
    <div className="container">
      {title && <h2 className="title is-4">{title}</h2>}
      <div id="content">{children}</div>
    </div>
  </section>
);

/**
 * A message box that displays error messages.
 */
const MessageBox = ({ message, isVisible }) => (
  <section className="section">
    <div className="container">
      <div id="msg-box" className="message is-danger">
        <div
          id="error-msg-container"
          className="message-body"
          style={{ display: isVisible ? 'block' : 'none' }}
        >
          <p id="error-msg">{message || 'No errors yet'}</p>
        </div>
      </div>
    </div>
  </section>
);

/**
 * Navigation bar for the website.
 */
const NavigationBar = ({ start, children }) => {
  const [isActive, setIsActive] = React.useState(false);

  const toggleNavbar = () => {
    setIsActive(!isActive);
  };

  return (
    <nav className="navbar" role="navigation" aria-label="main navigation">
      <div className="navbar-brand">
        <a className="navbar-item" href="/">
          <img src="/assets/img/logo.png" width="112" height="28" />
        </a>
        <a
          role="button"
          className={`navbar-burger ${isActive ? 'is-active' : ''}`}
          aria-label="menu"
          aria-expanded="false"
          onClick={toggleNavbar}
        >
          <span aria-hidden="true"></span>
          <span aria-hidden="true"></span>
          <span aria-hidden="true"></span>
        </a>
      </div>

      <div id="navbar-body" className={`navbar-menu ${isActive ? 'is-active' : ''}`}>
        {start && <div className="navbar-start">{start}</div>}
        <div className="navbar-end">
          <div className="navbar-item">
            <div className="buttons">{children}</div>
          </div>
        </div>
      </div>
    </nav>
  );
};

module.exports = { FormInput, FormSubmit, ItemStore, ContentSection, MessageBox, NavigationBar };
