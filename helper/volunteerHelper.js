var db = require("../config/connection");
var collections = require("../config/collections");
const bcrypt = require("bcrypt");
const objectId = require("mongodb").ObjectId;
const Razorpay = require("razorpay");

var instance = new Razorpay({
  key_id: "rzp_test_8NokNgt8cA3Hdv",
  key_secret: "xPzG53EXxT8PKr34qT7CTFm9",
});

module.exports = {
  getVolunteerDutiesById:(vId)=>{
    return new Promise(async (resolve, reject) => {
      const volunteer = await db.get().collection(collections.VOLUNTEER_COLLECTION).findOne({ v_id: vId });
      resolve(volunteer);
    });
  },
  getAllDuties: () => {
    return new Promise(async (resolve, reject) => {
      let products = await db
        .get()
        .collection(collections.VOLUNTEER_COLLECTION)
        .find()
        .toArray();
      resolve(products);
    });
  },
  addVolunteer:(volData)=>{
    return new Promise(async(resolve,reject)=>{
      volData.password = await bcrypt.hash(volData.password, 10);
      volData.duties = [];
     await  db.get()
        .collection(collections.VOLUNTEER_COLLECTION)
        .insertOne(volData)
        .then(async(data)=>{
         await db.get().collection(collections.SERIES_COLLECTION).
          updateOne({name:"volunteer_id"}, { $inc: { nextCount: 1 } }).then(()=>{
            resolve()
          })
        })
    })

  },
  completeDutiesById:(vId,dutyIndex)=>{
    return new Promise(async (resolve, reject) => {
      const volunteer = await db.get().collection(collections.VOLUNTEER_COLLECTION).findOne({ v_id: vId });
        // Check if the dutyIndex is valid
        if (dutyIndex >= 0 && dutyIndex < volunteer.duties.length) {
          // Remove the duty at the specified index using $pull
          await db.collection(collections.VOLUNTEER_COLLECTION).updateOne(
            { v_id: vId },
            { $pull: { duties: volunteer.duties[dutyIndex] } }
          );

          resolve('Duty deleted successfully.');
        }

    })
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
        .collection(collections.VOLUNTEER_COLLECTION)
        .findOne({ email: userData.email });
      if (user) {
        bcrypt.compare(userData.password, user.password).then((status) => {
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

  searchProduct: (details) => {
    console.log(details);
    return new Promise(async (resolve, reject) => {
      db.get()
        .collection(collections.PRODUCTS_COLLECTION)
        .createIndex({ Name : "text" }).then(async()=>{
          let result = await db
            .get()
            .collection(collections.PRODUCTS_COLLECTION)
            .find({
              $text: {
                $search: details.search,
              },
            })
            .toArray();
          resolve(result);
        })

    });
  },
};
