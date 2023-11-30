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
router.get("/", verifySignedIn, async function (req, res, next) {
  let patient = req.session.patient;
  let volunteers = await adminHelper.getAllVolunteer()

  patientHelper.getPatientScheduleById(patient.p_id, volunteers).then((duties) => {
    let pending;
    if (patient.status == "pending") {
      pending = true;
    } else {
      pending = false;
    }
    res.render("patient/home", { admin: false, patient, duties, pending });
  })
});




router.get("/appointment", verifySignedIn, async function (req, res) {
  let patient = req.session.patient;
  res.render("patient/appointment", { admin: false, patient });
});


///////ADD appointment/////////////////////                                         
router.post("/appointment", function (req, res) {
  patientHelper.addappointment(req.body, (id) => {
    if (id) {
      console.log("helooowwwww")
      req.flash('success', 'Appointment added successfully');
    } else {
      console.log("helooowwwww")

      req.flash('error', 'Failed to add appointment');
    }
    console.log("redirect-----------------------------------")
    res.redirect("/patient");
  });
});



router.get("/signup", async function (req, res) {
  if (req.session.signedIn) {
    res.redirect("/");
  } else {
    await adminHelper.getPatientIdFromSeries().then((pId) =>
      res.render("patient/add-patient", { admin: false, pId })
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
  req.body.status = "pending";
  patientHelper.addPatient(req.body).then(() => {
    res.redirect("/");
  })
});

router.get("/check-email", async function (req, res) {
  console.log("ggggggggg")
  let email = req.query.email;
  patientHelper.existEmail(email).then((data) => {
    res.json({ exists: data });
  })
});
router.get("/check-mobile", async function (req, res) {
  console.log("ggggggggg")
  let mobile = req.query.mobile;
  patientHelper.existEmail(mobile).then((data) => {
    res.json({ exists: data });
  })
});
router.get("/add-patient", verifySignedIn, async function (req, res) {
  let volunteer = req.session.volunteer;
  let patientId = await adminHelper.getPatientIdFromSeries().then((id) => id)
  res.render("volunteer/add-patient", { admin: false, volunteer, patientId });
});




module.exports = router;
