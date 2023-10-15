var db = require("../config/connection");
var collections = require("../config/collections");
const bcrypt = require("bcrypt");

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
          await db.get().collection(collections.VOLUNTEER_COLLECTION).updateOne(
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
        .collection(collections.VOLUNTEER_COLLECTION)
        .insertOne(userData)
        .then((data) => {
          resolve(data.ops[0]);
        });
    });
  },

  doSignin: (userData) => {
    return new Promise(async (resolve, reject) => {
      let response = {};
      let volunteer = await db
        .get()
        .collection(collections.VOLUNTEER_COLLECTION)
        .findOne({ email: userData.email });
      if (volunteer) {
        bcrypt.compare(userData.password, volunteer.password).then((status) => {
          if (status) {
            console.log("Login Success");
            response.volunteer = volunteer;
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
  }
};
