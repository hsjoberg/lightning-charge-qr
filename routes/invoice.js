const qr = require('../modules/qr');
const charge = require("lightning-charge-client")("http://localhost:9112", "test");


 qr.generatePNG2("test");

module.exports = (userWebSocketConnections) => {
  const router = require("express").Router();

  router.get('/', (req, res) => {
    res.redirect('/qr/invoice');
  });

  router.get('/qr', async (req, res) => {
    try {
      let invoice;
      if (!req.session.invoiceId) {
        invoice = await charge.invoice({ msatoshi: 50000, metadata: { uuid: req.session.uuid } });
        req.session.invoiceId = invoice.id;

        // Asynchronous
        waitForInvoice(invoice, req.session);
      }
      else {
        invoice = await await charge.fetch(req.session.invoiceId);

        if (invoice.status == "paid") {
          req.session.paid = true;
        }
      }

      const paymentReq = invoice.payreq;
      const paymentReqPng = await qr.generatePNG(paymentReq, 5);

      res.render('pay-invoice-png', {
        title: 'LN', paymentReqPng,
        paymentReq,
        invoiceId: invoice.id,
        uuid: req.session.uuid,
        status: (req.session.paid) ? "paid" : invoice.status
      });
    }
    catch(e) {
      console.log("exception");
      console.log(e);
    }
  });

  /**
    * Will be called by the application until we have WebSockets set up
  */
  router.get("/check-status", async (req, res) => {
    try {
      const invoice = await charge.fetch(req.session.invoiceId);
      if (!req.session.paid && invoice.status == "paid")
        req.session.paid = true;
      res.json(invoice.status == "paid");
    }
    catch(e) {
      console.log("Exception", e);
    }
  });

  router.get("/test-qr/:text", async (req, res) => {
    const png = await qr.generatePNG(req.params.text);
    const base64Png = Buffer.from(png, "binary").toString("base64");

    res.send(`<img src="data:image/png;base64, ${base64Png}" />`);
  });

  router.get("/test-qr2/:text", async (req, res) => {
    const png = await qr.generatePNG2(req.params.text);
    const base64Png = Buffer.from(png, "binary").toString("base64");

    res.send(`<img src="data:image/png;base64, ${base64Png}" />`);
  });

  router.get('/debug-pay', (req, res) => {
    req.session.paid = true;
    res.redirect('/invoice/qr');
  });

  async function waitForInvoice(invoice, session) {
    console.log("waitForInvoice()");
    try {
      let paid;
      do {
        paid = await charge.wait(invoice.id, /* timeout: */ 60 /* seconds */);

        if (paid) {
          console.log(`invoice ${ paid.id } of ${ paid.msatoshi } paid`);
          session.paid = true;
          session.save(function(err) {
            if(err) console.log(err);
          });

          // Check if we have a websocket with the client up:
          if (userWebSocketConnections[session.uuid]) {
            userWebSocketConnections[session.uuid].send(JSON.stringify({
              paid: true
            }));
          }
        }
        else if (paid === false) {
          console.log('invoice expired and can no longer be paid');
        }
        else if (paid === null) {
          // TODO remove state...
          console.log('timeout reached without payment, invoice is still payable');
        }
      } while (paid === null);
    }
    catch(e) {
      console.log("waitForInvoice() exception:", e);
    }
  }

  return router;
};
