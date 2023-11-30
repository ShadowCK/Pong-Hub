const helper = require('./helper.js');
const React = require('react');
const ReactDOM = require('react-dom');

const handleDomo = (e) => {
  e.preventDefault();
  helper.hideError();

  const name = e.target.querySelector('#domoName').value;
  const age = e.target.querySelector('#domoAge').value;
  const ability = e.target.querySelector('#domoAbility').value;

  if (!name || !age || !ability) {
    helper.handleError('All fields are required!');
    return false;
  }

  helper.sendPost(e.target.action, { name, age, ability }, loadDomosFromServer);

  return false;
};

const DomoForm = (props) => {
  return (
    <div>
      <form
        id="domoForm"
        onSubmit={handleDomo}
        name="domoForm"
        action="/maker"
        method="POST"
        className="domoForm"
      >
        <label htmlFor="domoName">Name: </label>
        <input id="domoName" type="text" name="domoName" placeholder="Domo Name" />
        <label htmlFor="domoAge">Age: </label>
        <input id="domoAge" type="number" min="0" name="domoAge" placeholder="Domo Age" />
        <label htmlFor="domoAbility">Ability: </label>
        <input id="domoAbility" type="text" name="domoAbility" placeholder="Domo Ability" />
        <input className=' = "makeDomoSubmit' type="submit" value="Make Domo" />
      </form>
      <h3>Click to delete domo!</h3>
    </div>
  );
};

const DomoList = (props) => {
  if (props.domos.length === 0) {
    return (
      <div className="domoList">
        <h3 className="emptyDomo">No Domos Yet!</h3>
      </div>
    );
  }

  const domoNodes = props.domos.map((domo) => {
    const deleteDomo = (e) => {
      helper.sendPost(
        '/deleteDomo',
        {
          name: domo.name,
          age: domo.age,
          ability: domo.ability,
          owner: domo.owner,
        },
        loadDomosFromServer,
      );
    };

    return (
      <div key={domo._id} className="domo" onClick={deleteDomo}>
        <img src="/assets/img/domoface.jpeg" alt="domo face" className="domoFace" />
        <h3 className="domoName">Name: {domo.name}</h3>
        <h3 className="domoAge">Age: {domo.age}</h3>
        <h3 className="domoAbility">Ability: {domo.ability}</h3>
      </div>
    );
  });

  return <div className="domoList">{domoNodes}</div>;
};

const loadDomosFromServer = async () => {
  const response = await fetch('getDomos');
  const data = await response.json();
  ReactDOM.render(<DomoList domos={data.domos} />, document.getElementById('domos'));
};

const init = () => {
  ReactDOM.render(<DomoForm />, document.getElementById('makeDomo'));

  ReactDOM.render(<DomoList domos={[]} />, document.getElementById('domos'));

  loadDomosFromServer();
};

window.onload = init;
