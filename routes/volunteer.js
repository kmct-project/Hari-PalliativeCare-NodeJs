var express = require("express");
var adminHelper = require("../helper/adminHelper");
var volunteerHelper = require("../helper/volunteerHelper");
var router = express.Router();

const verifySignedIn = (req, res, next) => {
  //  console.log( req.session)

  if (req.session.signedIn) {
    next();
  } else {
    res.redirect("/volunteer/signin");
  }
};

/* GET home page. */
router.get("/",verifySignedIn, async function (req, res, next) {
  let volunteer = req.session.volunteer;
  // console.log(volunteer.v_id, "jjjjj")
  volunteerHelper.getVolunteerDutiesById(volunteer.v_id).then((duties)=>{
    let pending;
    if( volunteer.status=="pending"){
      pending=true;
    }else{
      pending=false;
    }
    res.render("volunteer/home", { admin: false,  volunteer ,duties ,pending});
  })
  
 
//   userHelper.getAllProducts().then((products) => {
//   });
});

router.get("/signup", function (req, res) {
  if (req.session.signedIn) {
    res.redirect("/volunteer");
  } else {
    res.render("users/signup", { admin: false });
  }
});

router.post("/signup", function (req, res) {
  volunteerHelper.doSignup(req.body).then((response) => {
    req.session.signedIn = true;
    req.session.volunteer = response;
    res.redirect("/volunteer");
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
      req.session.volunteer = response.volunteer;
      res.redirect("/volunteer");
    } else {
      req.session.signInErr = "Invalid Email/Password";
      res.redirect("/volunteer/signin");
    }
  });
});

router.get("/signout", function (req, res) {
  req.session.signedIn = false;
  req.session.user = null;
  res.redirect("/");
});

router.get("/add-volunteer",async function (req, res) {
  let volunteerId = await adminHelper.getVolunteerIdFromSeries().then((id)=>id)
  res.render("volunteer/add-volunteer", { admin: false,volunteerId});
});

router.post("/add-volunteer", function (req, res) {
  req.body.status="pending";
  volunteerHelper.addVolunteer(req.body).then(()=>{
    res.redirect("/");
  })
});

router.get("/add-patient", verifySignedIn,async function (req, res) {
  let volunteer = req.session.volunteer;
  let patientId = await adminHelper.getPatientIdFromSeries().then((id)=>id)
  res.render("volunteer/add-patient", { admin: false , volunteer,patientId});
});

router.post("/add-patient", function (req, res) {
  adminHelper.addPatient(req.body).then(()=>{
    res.redirect("/volunteer/add-patient");
  })
});
router.get("/complete-duties/:vid/:index",async function (req, res) {
  let v_id = req.params.vid;
  let index = req.params.index;
  await volunteerHelper.completeDutiesById(v_id,index).then((resp)=>{
    res.redirect("/volunteer")
  })
 
});



module.exports = router;
