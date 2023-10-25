var express = require("express");
var adminHelper = require("../helper/adminHelper");
var volunteerHelper = require("../helper/volunteerHelper");
var patientHelper = require("../helper/patientHelper");
var router = express.Router();

const verifySignedIn = (req, res, next) => {
  //  console.log( req.session)

  if (req.session.signedIn) {
    next();
  } else {
    res.redirect("/patient/signin");
  }
};

/* GET home page. */
router.get("/",verifySignedIn, async function (req, res, next) {
  let patient = req.session.patient;
  let volunteers = await adminHelper.getAllVolunteer()
  
  patientHelper.getPatientScheduleById(patient.p_id, volunteers).then((duties)=>{
    let pending;
    if(patient.status=="pending"){
      pending=true;
    }else{
      pending=false;
    }
    res.render("patient/home", { admin: false,  patient ,duties,pending});
  })
});

router.get("/signup", function async(req, res) {
  if (req.session.signedIn) {
    res.redirect("/");
  } else {
    let pId = adminHelper.getPatientIdFromSeries().then((pId)=>
    res.render("patient/add-patient", { admin: false , pId})
    )
    
  }
});

router.post("/signup", function (req, res) {
  patientHelper.doSignup(req.body).then((response) => {
    req.session.signedIn = true;
    req.session.patient = response;
    res.redirect("/");
  });
});

router.get("/signin", function (req, res) {
  if (req.session.signedIn) {
    res.redirect("/patient");
  } else {
    res.render("patient/signin", {
      admin: false,
      signInErr: req.session.signInErr,
    });
    req.session.signInErr = null;
  }
});

router.post("/signin", function (req, res) {
    patientHelper.doSignin(req.body).then((response) => {
    if (response.status) {
      req.session.signedIn = true;
      req.session.patient = response.user;
      res.redirect("/patient");
    } else {
      req.session.signInErr = "Invalid Email/Password";
      res.redirect("/patient/signin");
    }
  });
});

router.get("/signout", function (req, res) {
  req.session.signedIn = false;
  req.session.user = null;
  res.redirect("/");
});
router.post("/add-patient", function (req, res) {
  req.body.status="pending";
  patientHelper.addPatient(req.body).then(()=>{
    res.redirect("/");
  })
});



router.get("/add-patient", verifySignedIn,async function (req, res) {
  let volunteer = req.session.volunteer;
  let patientId = await adminHelper.getPatientIdFromSeries().then((id)=>id)
  res.render("volunteer/add-patient", { admin: false , volunteer,patientId});
});




module.exports = router;
