var db = require("../config/connection");
var collections = require("../config/collections");
var bcrypt = require("bcrypt");
const objectId = require("mongodb").ObjectID;

module.exports = {

  addSeries: (series)=>{
    return new Promise((resolve,reject)=>{
      db.get()
        .collection(collections.SERIES_COLLECTION)
        .insertOne(series)
        .then((data)=>{
          resolve()
        })
    })

  },
  addPatient:(patient)=>{
    return new Promise(async(resolve,reject)=>{
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
  getPatientIdFromSeries: () => {
    return new Promise(async (resolve, reject) => {
      let pID = await db
        .get()
        .collection(collections.SERIES_COLLECTION)
        .findOne({name:"Patient_id"})
      resolve(pID.prefix+pID.nextCount);
    });
  },
  getVolunteerIdFromSeries: () => {
    return new Promise(async (resolve, reject) => {
      let pID = await db
        .get()
        .collection(collections.SERIES_COLLECTION)
        .findOne({name:"volunteer_id"})
      resolve(pID.prefix+pID.nextCount);
    });
  },
  getVolunteerById : (vid)=>{
    return new Promise(async (resolve, reject) => {
      let volunteer = await db
        .get()
        .collection(collections.VOLUNTEER_COLLECTION)
        .findOne({v_id: vid})
      resolve(volunteer);
    });
  },
  getAllDonation:()=>{
    return new Promise(async(resolve,reject)=>{
      let data= await db.get().collection(collections.DONOR_COLLECTION)
      .find().toArray()
      resolve(data)
    })
  },

  getAllVolunteer: () => {
    return new Promise(async (resolve, reject) => {
      let volunteers = await db
        .get()
        .collection(collections.VOLUNTEER_COLLECTION)
        .find()
        .toArray();
      resolve(volunteers);
    });
  },
  getAllPatient: () => {
    return new Promise(async (resolve, reject) => {
      let patients = await db
        .get()
        .collection(collections.PATIENT_COLLECTION)
        .find()
        .toArray();
      resolve(patients);
    });
  },
  approveVolunteer:(vId)=>{
    console.log("gfrgrhrthjtejyrj")
    return new Promise(async (resolve, reject) => {
      const volunteer = await db.get().collection(collections.VOLUNTEER_COLLECTION).findOne({ v_id: vId });
       volunteer.status="approved";
      await db.get().collection(collections.VOLUNTEER_COLLECTION).updateOne({ v_id: vId }, { $set: { status: "approved" } });
      resolve("approved successfully.");
    });

  },
  getAllPendingVolunteerCount:()=>{
    return new Promise(async (resolve,reject)=>{
      const pendingVolunteersCount = await db.get().collection(collections.VOLUNTEER_COLLECTION).countDocuments({ status: 'pending' });
      // .find({ status: 'pending' }).toArray();
      resolve( pendingVolunteersCount)
    })
  },
  getAllPendingVolunteers:()=>{
    return new Promise(async (resolve,reject)=>{
      
      const pendingVolunteers = await db.get().collection(collections.VOLUNTEER_COLLECTION).find({ status: 'pending' }).toArray();
      resolve( pendingVolunteers)
    })

  },
  setVolunteerDutiesById:(vId,dutyData)=>{
 
    return new Promise(async (resolve, reject) => {
      const volunteer = await db.get().collection(collections.VOLUNTEER_COLLECTION).findOne({ v_id: vId });
       volunteer.duties.push(dutyData);  
      await db.get().collection(collections.VOLUNTEER_COLLECTION).updateOne({ v_id: vId }, { $set: { duties: volunteer.duties } });
      resolve("Duty data added successfully.");
    });
  },
  deleteVolunteerDutiesById:(vId,dutyIndex)=>{
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
  doSignup: (adminData) => {
    return new Promise(async (resolve, reject) => {
      if (adminData.Code == "admin123") {
        adminData.Password = await bcrypt.hash(adminData.Password, 10);
        db.get()
          .collection(collections.ADMIN_COLLECTION)
          .insertOne(adminData)
          .then((data) => {
            resolve(data.ops[0]);
          });
      } else {
        resolve({ status: false });
      }
    });
  },

  doSignin: (adminData) => {
    return new Promise(async (resolve, reject) => {
      let response = {};
      let admin = await db
        .get()
        .collection(collections.ADMIN_COLLECTION)
        .findOne({ Email: adminData.Email });
      if (admin) {
        bcrypt.compare(adminData.Password, admin.Password).then((status) => {
          if (status) {
            console.log("Login Success");
            response.admin = admin;
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

  getVolunteerDetails: (productId) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collections.PRODUCTS_COLLECTION)
        .findOne({ _id: objectId(productId) })
        .then((response) => {
          resolve(response);
        });
    });
  },

  deleteVolunteer: (productId) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collections.PRODUCTS_COLLECTION)
        .removeOne({ _id: objectId(productId) })
        .then((response) => {
          console.log(response);
          resolve(response);
        });
    });
  },

  updateVolunteer: (productId, productDetails) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collections.PRODUCTS_COLLECTION)
        .updateOne(
          { _id: objectId(productId) },
          {
            $set: {
              Name: productDetails.Name,
              Category: productDetails.Category,
              Price: productDetails.Price,
              Description: productDetails.Description,
            },
          }
        )
        .then((response) => {
          resolve();
        });
    });
  },

  deleteAllVolunteer: () => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collections.PRODUCTS_COLLECTION)
        .remove({})
        .then(() => {
          resolve();
        });
    });
  },

  getAllUsers: () => {
    return new Promise(async (resolve, reject) => {
      let users = await db
        .get()
        .collection(collections.USERS_COLLECTION)
        .find()
        .toArray();
      resolve(users);
    });
  },

  removeUser: (userId) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collections.USERS_COLLECTION)
        .removeOne({ _id: objectId(userId) })
        .then(() => {
          resolve();
        });
    });
  },

  removeAllUsers: () => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collections.USERS_COLLECTION)
        .remove({})
        .then(() => {
          resolve();
        });
    });
  },

  

  changeStatus: (status, orderId) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collections.ORDER_COLLECTION)
        .updateOne(
          { _id: objectId(orderId) },
          {
            $set: {
              "orderObject.status": status,
            },
          }
        )
        .then(() => {
          resolve();
        });
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
