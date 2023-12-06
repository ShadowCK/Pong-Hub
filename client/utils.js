const handleError = (message) => {
  document.getElementById('error-msg').textContent = message;
  document.getElementById('error-msg-container').style.display = 'block';
};

/* Sends post requests to the server using fetch. Will look for various
     entries in the response JSON object, and will handle them appropriately.
  */
const sendPost = async (url, data, handler) => {
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
    handleError(result.error);
  }

  if (handler && typeof handler === 'function') {
    handler(result);
  }
};

// Toggle visibility of navbar menu on smaller screens (width < 1024px) by clicking the burger
const initBulmaNavbar = () => {
  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.navbar-burger').forEach((burger) => {
      burger.addEventListener('click', () => {
        const target = document.getElementById(burger.dataset.target);
        burger.classList.toggle('is-active');
        target.classList.toggle('is-active');
      });
    });
  });
};

module.exports = {
  handleError,
  sendPost,
  initBulmaNavbar,
};
