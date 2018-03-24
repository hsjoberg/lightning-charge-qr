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
