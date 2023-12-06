var db = require("../config/connection");
var collections = require("../config/collections");
const bcrypt = require("bcrypt");
const objectId = require("mongodb").ObjectID;
const Razorpay = require("razorpay");
const nodemailer = require('nodemailer');

//// Razorpay Payment Gateway Key ///////
var instance = new Razorpay({
  key_id: "rzp_test_8NokNgt8cA3Hdv",
  key_secret: "xPzG53EXxT8PKr34qT7CTFm9",
});

module.exports = {


  addDonation: (data) => {
    return new Promise(async (resolve, reject) => {
      try {
        // Save donation details to the database
        let donation = await db
          .get()
          .collection(collections.DONOR_COLLECTION)
          .insertOne(data);

        // Increment the donor_id count in the SERIES_COLLECTION
        await db.get().collection(collections.SERIES_COLLECTION)
          .updateOne({ name: "donor_id" }, { $inc: { nextCount: 1 } });

        // Send congratulatory email
        const transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: 'mishabmsb91@gmail.com',  // Replace with your Gmail email
            pass: 'buekcxygvhmrqska'         // Replace with your Gmail password or app password
          }
        });

        const mailOptions = {
          from: 'mishabmsb91@gmail.com',
          to: data.email,  // Assuming the email is stored in the 'email' field of the 'data' object
          subject: 'Congratulations on Your Donation!',
          text: `Dear ${data.name},\n\nThank you for your generous donation of Rs.${data.amount}.\n\nSincerely,\nThe Donation Team`
        };

        transporter.sendMail(mailOptions, (error, info) => {
          if (error) {
            console.error('Error sending email:', error);
          } else {
            console.log('Email sent:', info.response);
          }
        });

        

        resolve();
      } catch (error) {
        console.error('Error adding donation:', error);
        reject(error);
      }
    });
  },

  getDonationIdFromSeries: () => {
    return new Promise(async (resolve, reject) => {
      let pID = await db
        .get()
        .collection(collections.SERIES_COLLECTION)
        .findOne({ name: "donor_id" })
      resolve(pID.prefix + pID.nextCount);
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
  
  //////////// RAZORPAY PAYMENT INTEGRATION///////////////
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

  //////////// RAZORPAY PAYMENT VERIFICATION///////////////
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
  },

  ////////////CHANGE RAZORPAY PAYMENT STATUS///////////////
  changePaymentStatus: (orderId) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collections.ORDER_COLLECTION)
        .updateOne(
          { _id: objectId(orderId) },
          {
            $set: {
              "orderObject.status": "requested",
            },
          }
        )
        .then(() => {
          resolve();
        });
    });
  },

 
};
