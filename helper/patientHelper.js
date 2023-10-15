var db = require("../config/connection");
var collections = require("../config/collections");
const bcrypt = require("bcrypt");
const objectId = require("mongodb").ObjectId;


module.exports = {
    addPatient:(patient)=>{
        return new Promise(async(resolve,reject)=>{
            patient.password = await bcrypt.hash(patient.password, 10);
         await  db.get()
            .collection(collections.PATIENT_COLLECTION)
            .insertOne(patient)
            .then(async(data)=>{
             await db.get().collection(collections.SERIES_COLLECTION).
              updateOne({name:"Patient_id"}, { $inc: { nextCount: 1 } }).then(()=>{
                resolve()
              })
            })
        })
    
      },
      getPatientScheduleById:(pId,volunteers)=>{
        // console.log("sss",volunteers,"eeendd")
        return new Promise(async (resolve, reject) => {
            const filteredDuties = volunteers.reduce((result, volunteer) => {
              const matchingDuties = volunteer.duties.filter(duty => duty.p_id == pId);
              return result.concat(matchingDuties);
            }, []);
          
            // console.log(filteredDuties ,pId);
            resolve(filteredDuties);
          });

      },
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
        .collection(collections.PATIENT_COLLECTION)
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
        .collection(collections.PATIENT_COLLECTION)
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

};