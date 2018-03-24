(() => {
  'use strict';
  const ws = new WebSocket(`ws://${location.host}`);
  console.log(ws);
  const card = document.querySelector("#main-card-content");

  ws.onmessage = (event) => {
    console.log("Received from server:", event.data);

    try {
      const response = JSON.parse(event.data);

      if (response.paid) {
        document.location = document.location;
      }
    }
    catch(e) {
      console.log(e);
    }
  };

  ws.onclose = (event) => {
    card.insertAdjacentHTML('beforeend', `<p class="text-danger"><small>Web socket closed!</small></p>`);
    // Graceful fallback to AJAX polling
    //AjaxPoll();
  };

  function AjaxPoll() {
    const poll = setInterval(async () => {
      const data = await fetch(`/invoice/check-status`, { credentials: "same-origin", cache: "no-cache"});
      const status = await data.json();
      if (status === true) {
        refresh();
      }
    }, 6000);
  }

  function refresh() {
    document.location = document.location;
  }

  const checkPaymentButton = document.querySelector('.check-payment-button');
  if(checkPaymentButton !== null) {
    checkPaymentButton.addEventListener('click', async () => {
      console.log("click");
      checkPaymentButton.classList.add("disabled");
      const data = await fetch(`/invoice/check-status`, { credentials: "same-origin", cache: "no-cache"});
      const status = await data.json();
      if (status === true) {
        refresh();
        return;
      }
      checkPaymentButton.classList.remove("disabled");
    });
  }

  const resetSessionButton = document.querySelector('.reset-session-button');
  if(resetSessionButton !== null) {
    resetSessionButton.addEventListener('click', async () => {
      const data = await fetch('/session/destroy', { credentials: "same-origin", cache: "no-cache"});
      const status = await data.json();
      if(status === true) {
        refresh();
      }
      else {
        // ???
      }
    });
  }
})();
