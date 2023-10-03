var express = require("express");
var userHelper = require("../helper/userHelper");
var volunteerHelper = require("../helper/volunteerHelper");
var router = express.Router();

const verifySignedIn = (req, res, next) => {
   console.log( req.session)

  if (req.session.signedIn) {
    next();
  } else {
    res.redirect("volunteer/signin");
  }
};

/* GET home page. */
router.get("/",verifySignedIn, async function (req, res, next) {
  let user = req.session.user;
  res.render("volunteer/home", { admin: false,  user});
 
//   userHelper.getAllProducts().then((products) => {
//   });
});

router.get("/signup", function (req, res) {
  if (req.session.signedIn) {
    res.redirect("/");
  } else {
    res.render("users/signup", { admin: false });
  }
});

router.post("/signup", function (req, res) {
  volunteerHelper.doSignup(req.body).then((response) => {
    req.session.signedIn = true;
    req.session.user = response;
    res.redirect("/");
  });
});

router.get("/signin", function (req, res) {
  if (req.session.signedIn) {
    res.redirect("/volunteer");
  } else {
    res.render("volunteer/signin", {
      admin: false,
      signInErr: req.session.signInErr,
    });
    req.session.signInErr = null;
  }
});

router.post("/signin", function (req, res) {
    volunteerHelper.doSignin(req.body).then((response) => {
    if (response.status) {
      req.session.signedIn = true;
      req.session.volunteer = response.user;
      res.redirect("/volunteer");
    } else {
      req.session.signInErr = "Invalid Email/Password";
      res.redirect("/signin");
    }
  });
});

router.get("/signout", function (req, res) {
  req.session.signedIn = false;
  req.session.user = null;
  res.redirect("/");
});

module.exports = router;
