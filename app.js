'use strict';
const express = require("express");
const app = express();
const http = require("http");
const url = require("url");

const uuid = require("uuid");
const WebSocket = require('ws');

const sessionParser = require("./modules/configure-express")(express, app);
const userWebSocketConnections = {};

const qr = require('./modules/qr');
const invoice = require('./routes/invoice');
const session = require('./routes/session');

// Setup session uuid for all visitors:
app.use((req, res, next) => {
  // XXX does web sockets reach this?
  if (req.session && !req.session.uuid) {
    req.session.uuid = uuid.v4();
  }

  next();
});

app.get("/", (req, res) => {
  res.redirect('/invoice/qr');
});

app.use("/invoice", invoice(userWebSocketConnections));
app.use("/session", session);

const server = http.createServer(app);
const wss = new WebSocket.Server({
  server,
  verifyClient: (info, done) => {
    // TODO needs more testing
    // Use the express-session middleware here as well to authenticate websockets
    // https://github.com/websockets/ws/blob/master/examples/express-session-parse/index.js
    sessionParser(info.req, {}, (err) => {
      if (err) {
        console.log(err);
        done(false);
        return;
      }

      // Double check session
      if (info.req.session && info.req.session.uuid) {
        console.log(`WebSocket verify ${info.req.session.uuid} done`);
        done(info.req.session.uuid);
        return;
      }
      done(false);
    });
  }
});

wss.on('connection', (ws, req) => {
  console.log(`WebSocket connection for user ${req.session.uuid} opened`);

  if (!userWebSocketConnections[req.session.uuid])
    // TODO figure out if this is a scalable solution
    userWebSocketConnections[req.session.uuid] = ws;

  ws.on('message', (message) => {
    console.log(`Received from ${req.session.uuid}: ${message}`);
  });

  ws.on("close", () => {
    console.log(`Deleting websocket reference from ${req.session.uuid}`);
    // Delete reference
    userWebSocketConnections[req.session.uuid] = undefined;
  });
});

server.listen(3000, '0.0.0.0', () => {
  console.log('Listening on %d', server.address().port);
});



app.get("/inv", async (req, res) => {
  try {
    const inv = await charge.invoice({ msatoshi: 50, metadata: { customer_id: 123, product_id: 456 } })
    console.log(`invoice ${ inv.id } created with rhash=${ inv.rhash }, payreq=${ inv.payreq }`)
    res.send("payreq: " + inv.payreq);
    res.send("<br>\ninvoice id: " + inv.id);

    let paid;
    do {
      paid = await charge.wait(inv.id, /* timeout: */ 600 /* seconds */)

      if (paid)
        console.log(`invoice ${ paid.id } of ${ paid.msatoshi } paid, updated invoice:`, paid)
      else if (paid === false)
        console.log('invoice expired and can no longer be paid')
      else if (paid === null)
        console.log('timeout reached without payment, invoice is still payable')
    } while (paid === null);
  }
  catch(e) {
    console.log("exception");
    console.log(e);
  }
});
