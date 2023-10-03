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
  adminHelper.getAllVolunteer().then((volunteers) => {
    res.render("admin/home", { admin: true, volunteers, administator });
  });
});

router.get("/all-volunteers", verifySignedIn, function (req, res) {
  let administator = req.session.admin;
  adminHelper.getAllVolunteer().then((volunteers) => {
    res.render("admin/home", { admin: true, volunteers, administator });
  });
});

router.get("/all-patients", verifySignedIn, function (req, res) {
  let administator = req.session.admin;
  adminHelper.getAllProducts().then((products) => {
    res.render("admin/all-products", { admin: true, products, administator });
  });
});

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

router.get("/edit-product/:id", verifySignedIn, async function (req, res) {
  let administator = req.session.admin;
  let productId = req.params.id;
  let product = await adminHelper.getProductDetails(productId);
  console.log(product);
  res.render("admin/edit-product", { admin: true, product, administator });
});

router.post("/edit-product/:id", verifySignedIn, function (req, res) {
  let productId = req.params.id;
  adminHelper.updateProduct(productId, req.body).then(() => {
    if (req.files) {
      let image = req.files.Image;
      if (image) {
        image.mv("./public/images/product-images/" + productId + ".png");
      }
    }
    res.redirect("/admin/all-products");
  });
});

router.get("/delete-product/:id", verifySignedIn, function (req, res) {
  let productId = req.params.id;
  adminHelper.deleteProduct(productId).then((response) => {
    fs.unlinkSync("./public/images/product-images/" + productId + ".png");
    res.redirect("/admin/all-products");
  });
});

router.get("/delete-all-products", verifySignedIn, function (req, res) {
  adminHelper.deleteAllProducts().then(() => {
    res.redirect("/admin/all-products");
  });
});

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

router.get("/all-orders", verifySignedIn, async function (req, res) {
  let administator = req.session.admin;
  let orders = await adminHelper.getAllOrders();
  res.render("admin/all-orders", {
    admin: true,
    administator,
    orders,
  });
});

router.get(
  "/view-ordered-products/:id",
  verifySignedIn,
  async function (req, res) {
    let administator = req.session.admin;
    let orderId = req.params.id;
    let products = await userHelper.getOrderProducts(orderId);
    res.render("admin/order-products", {
      admin: true,
      administator,
      products,
    });
  }
);

router.get("/change-status/", verifySignedIn, function (req, res) {
  let status = req.query.status;
  let orderId = req.query.orderId;
  adminHelper.changeStatus(status, orderId).then(() => {
    res.redirect("/admin/all-orders");
  });
});

router.get("/cancel-order/:id", verifySignedIn, function (req, res) {
  let orderId = req.params.id;
  adminHelper.cancelOrder(orderId).then(() => {
    res.redirect("/admin/all-orders");
  });
});

router.get("/cancel-all-orders", verifySignedIn, function (req, res) {
  adminHelper.cancelAllOrders().then(() => {
    res.redirect("/admin/all-orders");
  });
});

router.post("/search", verifySignedIn, function (req, res) {
  let administator = req.session.admin;
  adminHelper.searchProduct(req.body).then((response) => {
    res.render("admin/search-result", { admin: true, administator, response });
  });
});


module.exports = router;
