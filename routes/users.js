var express = require("express");
var userHelper = require("../helper/userHelper");
var router = express.Router();


const verifySignedIn = (req, res, next) => {
  if (req.session.signedIn) {
    next();
  } else {
    res.redirect("/signin");
  }
};

/* GET home page. */
router.get("/", async function (req, res, next) {


  res.render("users/home", { admin: false, });

});

router.get("/signup", function (req, res) {
  if (req.session.signedIn) {
    res.redirect("/");
  } else {
    res.render("users/signup", { admin: false });
  }
});
router.get("/donateUs", async function (req, res) {
  let donationId = await userHelper.getDonationIdFromSeries().then((id) => id)
  res.render("users/donateUs", { admin: false, donationId });
});

router.post("/donateUs", async function (req, res) {
  let data = req.body;
  userHelper.addDonation(req.body).then(() => {
    res.render("users/donation-accepted", { admin: false, data });
  })
});


router.get("/donation-accepted", function (req, res) {
  res.render("users/donation-accepted", { admin: false });
});



router.post("/signup", function (req, res) {
  userHelper.doSignup(req.body).then((response) => {
    req.session.signedIn = true;
    req.session.user = response;
    res.redirect("/");
  });
});

router.get("/signin", function (req, res) {
  if (req.session.signedIn) {
    res.redirect("/");
  } else {
    res.render("users/signin", {
      admin: false,
      signInErr: req.session.signInErr,
    });
    req.session.signInErr = null;
  }
});

router.post("/signin", function (req, res) {
  userHelper.doSignin(req.body).then((response) => {
    if (response.status) {
      req.session.signedIn = true;
      req.session.user = response.user;
      res.redirect("/");
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
