const router = require("express").Router();

router.get('/destroy', (req, res) => {
  console.log("/destroy");
  console.log(req.session);
  req.session.regenerate((err) => {
    if(err) console.log(err);
    console.log("Session destroyed");
    res.json(true);
  });
});


module.exports = router;
