const handleError = (message) => {
  document.getElementById('error-msg').textContent = message;
  document.getElementById('error-msg-container').style.display = 'block';
};

/* Sends post requests to the server using fetch. Will look for various
     entries in the response JSON object, and will handle them appropriately.
  */
const sendPost = async (url, data, handlers = {}) => {
  const { onError, onSuccess, postProcess } = handlers;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  const result = await response.json();

  console.log(result);

  if (result.redirect) {
    window.location = result.redirect;
  }

  if (result.error) {
    if (typeof onError === 'function') {
      onError(result);
    }
  } else if (typeof onSuccess === 'function') {
    onSuccess(result);
  }

  if (typeof postProcess === 'function') {
    postProcess(result);
  }
};

module.exports = {
  handleError,
  sendPost,
};
