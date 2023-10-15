var db = require("../config/connection");
var collections = require("../config/collections");
const bcrypt = require("bcrypt");
const objectId = require("mongodb").ObjectID;
const Razorpay = require("razorpay");

var instance = new Razorpay({
  key_id: "rzp_test_8NokNgt8cA3Hdv",
  key_secret: "xPzG53EXxT8PKr34qT7CTFm9",
});

module.exports = {
  addDonation:(data) => {
    return new Promise(async (resolve, reject) => {
      let donation = await db
        .get()
        .collection(collections.DONOR_COLLECTION)
        .insertOne(data)
        .then(async(data)=>{
          await db.get().collection(collections.SERIES_COLLECTION).
           updateOne({name:"donor_id"}, { $inc: { nextCount: 1 } }).then(()=>{
             resolve()
           })
         })
    });
  },
  getDonationIdFromSeries:() => {
    return new Promise(async (resolve, reject) => {
      let pID = await db
        .get()
        .collection(collections.SERIES_COLLECTION)
        .findOne({name:"donor_id"})
      resolve(pID.prefix+pID.nextCount);
    });
  },

  doSignup: (userData) => {
    return new Promise(async (resolve, reject) => {
      userData.Password = await bcrypt.hash(userData.Password, 10);
      db.get()
        .collection(collections.USERS_COLLECTION)
        .insertOne(userData)
        .then((data) => {
          resolve(data.ops[0]);
        });
    });
  },

  doSignin: (userData) => {
    return new Promise(async (resolve, reject) => {
      let response = {};
      let user = await db
        .get()
        .collection(collections.USERS_COLLECTION)
        .findOne({ Email: userData.Email });
      if (user) {
        bcrypt.compare(userData.Password, user.Password).then((status) => {
          if (status) {
            console.log("Login Success");
            response.user = user;
            response.status = true;
            resolve(response);
          } else {
            console.log("Login Failed");
            resolve({ status: false });
          }
        });
      } else {
        console.log("Login Failed");
        resolve({ status: false });
      }
    });
  },
  generateRazorpay: (orderId, totalPrice) => {
    return new Promise((resolve, reject) => {
      var options = {
        amount: totalPrice * 100, // amount in the smallest currency unit
        currency: "INR",
        receipt: "" + orderId,
      };
      instance.orders.create(options, function (err, order) {
        console.log("New Order : ", order);
        resolve(order);
      });
    });
  },

  verifyPayment: (details) => {
    return new Promise((resolve, reject) => {
      const crypto = require("crypto");
      let hmac = crypto.createHmac("sha256", "xPzG53EXxT8PKr34qT7CTFm9");

      hmac.update(
        details["payment[razorpay_order_id]"] +
          "|" +
          details["payment[razorpay_payment_id]"]
      );
      hmac = hmac.digest("hex");

      if (hmac == details["payment[razorpay_signature]"]) {
        resolve();
      } else {
        reject();
      }
    });
  }
};
