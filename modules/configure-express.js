const path = require("path");
const session = require('express-session');

module.exports = (express, app) => {
  const COOKIE_SECRET = "lorem ipsum dolor";
  const sessionParser = session({
    secret: COOKIE_SECRET,
    resave: false,
    saveUninitialized: true
  });
  app.set("view engine", "pug");
  app.use(sessionParser);
  console.log(__dirname);
  console.log(path.join(__dirname + "/../", 'public'));
  app.use('/public', express.static(path.join(__dirname + "/../", 'public')));
  app.use('/bootstrap', express.static(path.join(__dirname + "/../", 'vendor/bootstrap-4.0.0/dist/')));

  return sessionParser;
}
