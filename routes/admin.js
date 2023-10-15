var express = require("express");
var adminHelper = require("../helper/adminHelper");
var fs = require("fs");
const userHelper = require("../helper/userHelper");
var router = express.Router();

const verifySignedIn = (req, res, next) => {
  if (req.session.signedInAdmin) {
    next();
  } else {
    res.redirect("/admin/signin");
  }
};

/* GET admins listing. */
router.get("/", verifySignedIn, function (req, res, next) {
  let administator = req.session.admin;
  adminHelper.getAllVolunteer().then(async(volunteers) => {
    const patients=  await adminHelper.getAllPatient()
    const patientsCount= patients.length;
    const volunteersCount= volunteers.length;
    const volunteersPendingCount = await adminHelper.getAllPendingVolunteerCount();
    const patientsPendingCount = await adminHelper.getAllPendingPatientCount();
    res.render("admin/home", { admin: true, volunteers,patients,patientsCount,volunteersCount,volunteersPendingCount,patientsPendingCount, administator });
  });
});

router.get("/all-volunteers", verifySignedIn, function (req, res) {
  let administator = req.session.admin;
  adminHelper.getAllVolunteer().then(async (volunteers) => {
    res.render("admin/home", { admin: true, volunteers, administator });
  });
});

router.get("/all-patients", verifySignedIn, function (req, res) {
  let administator = req.session.admin;
  adminHelper.getAllProducts().then((products) => {
    res.render("admin/all-products", { admin: true, products, administator });
  });
});

router.get("/approval/:vid",async function (req, res) {
  console.log("ggg")
  let v_id = req.params.vid;
  await adminHelper.approveVolunteer(v_id).then((resp)=>{
    res.redirect("/admin")
  })
});

router.get("/approvalPatient/:pid",async function (req, res) {
  console.log("ggg")
  let p_id = req.params.pid;
  await adminHelper.approvePatient(p_id).then((resp)=>{
    res.redirect("/admin")
  })
});
router.get("/rejectionPatient/:pid",async function (req, res) {
  let p_id = req.params.pid;
  await adminHelper.approvePatient(p_id).then((resp)=>{
    res.redirect("/admin")
  })
});


router.get("/assign-duties/:vid",verifySignedIn, function (req, res) {
  let administator = req.session.admin;
  let vId = req.params.vid;
  adminHelper.getVolunteerById(vId).then((volunteer) => {
     adminHelper.getAllPatient().then((patients)=>{
      res.render("admin/assign-duties", { admin: true, volunteer, vId,patients, administator });
    }

    )
  });
})


router.post("/assign-duties/",verifySignedIn, function (req, res) {
   let administator = req.session.admin;
   let vId = req.body.v_id;
   let pId =req.body.p_id;
   let dutyId= req.body.dutyId;
  adminHelper.setVolunteerDutiesById(vId,req.body).then(() => {
    res.redirect("/admin")
  });
})
router.get("/all-pending-volunteers",verifySignedIn, function (req, res) {
  let administator = req.session.admin;
  adminHelper.getAllPendingVolunteers().then((volunteer) => {
    res.render("admin/all-pending-volunteers", { admin: true, volunteer, administator });
  });
})

router.get("/all-pending-patients",verifySignedIn, function (req, res) {
  let administator = req.session.admin;
  adminHelper.getAllPendingPatients().then((patient) => {
    res.render("admin/all-pending-patients", { admin: true, patient, administator });
  });
})


router.get("/signup", function (req, res) {
  if (req.session.signedInAdmin) {
    res.redirect("/admin");
  } else {
    res.render("admin/signup", {
      admin: true,
      signUpErr: req.session.signUpErr,
    });
  }
});

router.post("/signup", function (req, res) {
  adminHelper.doSignup(req.body).then((response) => {
    console.log(response);
    if (response.status == false) {
      req.session.signUpErr = "Invalid Admin Code";
      res.redirect("/admin/signup");
    } else {
      req.session.signedInAdmin = true;
      req.session.admin = response;
      res.redirect("/admin");
    }
  });
});

router.get("/signin", function (req, res) {
  if (req.session.signedInAdmin) {
    res.redirect("/admin");
  } else {
    res.render("admin/signin", {
      admin: true,
      signInErr: req.session.signInErr,
    });
    req.session.signInErr = null;
  }
});

router.post("/signin", function (req, res) {
  adminHelper.doSignin(req.body).then((response) => {
    if (response.status) {
      req.session.signedInAdmin = true;
      req.session.admin = response.admin;
      res.redirect("/admin");
    } else {
      req.session.signInErr = "Invalid Email/Password";
      res.redirect("/admin/signin");
    }
  });
});

router.get("/signout", function (req, res) {
  req.session.signedInAdmin = false;
  req.session.admin = null;
  res.redirect("/admin");
});

router.get("/add-series", verifySignedIn, function (req, res) {
  let administator = req.session.admin;
  res.render("admin/add-series", { admin: true, administator });
});

router.post("/add-series", function (req, res) {
  adminHelper.addSeries(req.body).then(()=>{
    res.redirect("/admin/add-series");
  })
});
router.get("/add-patient", verifySignedIn,async function (req, res) {
  let administator = req.session.admin;
  let patientId = await adminHelper.getPatientIdFromSeries().then((id)=>id)
  res.render("admin/add-patient", { admin: true, administator ,patientId});
});

router.post("/add-patient", function (req, res) {
  req.body.status="approved";
  adminHelper.addPatient(req.body).then(()=>{
    res.redirect("/admin/add-patient");
  })
});
router.get("/add-volunteer", verifySignedIn,async function (req, res) {
  let administator = req.session.admin;
  let volunteerId = await adminHelper.getVolunteerIdFromSeries().then((id)=>id)
  res.render("admin/add-volunteer", { admin: true, administator ,volunteerId});
});

router.post("/add-volunteer", function (req, res) {
  req.body.status="approved";
  adminHelper.addVolunteer(req.body).then(()=>{
    res.redirect("/admin/add-volunteer");
  })
});

router.get("/all-donations", verifySignedIn,
  async function (req, res) {
    let administator = req.session.admin;
    let donations = await adminHelper.getAllDonation();
    let grossTotal = donations.reduce((total, donation) => {
      // Convert donation.amount to a number using parseFloat
      const amount = parseFloat(donation.amount);
      if (!isNaN(amount)) {
          return total + amount;
      }
      return total; 
  }, 0);
    res.render("admin/donation-report", {
      admin: true,
      administator,
      donations,
      grossTotal
      
    });
  }
);

router.get("/all-users", verifySignedIn, function (req, res) {
  let administator = req.session.admin;
  adminHelper.getAllUsers().then((users) => {
    res.render("admin/all-users", { admin: true, administator, users });
  });
});

router.get("/remove-user/:id", verifySignedIn, function (req, res) {
  let userId = req.params.id;
  adminHelper.removeUser(userId).then(() => {
    res.redirect("/admin/all-users");
  });
});

router.get("/remove-all-users", verifySignedIn, function (req, res) {
  adminHelper.removeAllUsers().then(() => {
    res.redirect("/admin/all-users");
  });
});


module.exports = router;
