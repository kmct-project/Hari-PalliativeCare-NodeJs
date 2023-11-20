var db = require("../config/connection");
var collections = require("../config/collections");
var bcrypt = require("bcrypt");
const objectId = require("mongodb").ObjectID;

module.exports = {


  ///////GET ALL appointment/////////////////////                                            
  getAllappointments: () => {
    return new Promise(async (resolve, reject) => {
      let appointments = await db
        .get()
        .collection(collections.APPOINTMENT_COLLECTION)
        .find()
        .toArray();
      resolve(appointments);
    });
  },

  ///////ADD appointment DETAILS/////////////////////                                            
  getappointmentDetails: (appointmentId) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collections.APPOINTMENT_COLLECTION)
        .findOne({
          _id: objectId(appointmentId)
        })
        .then((response) => {
          resolve(response);
        });
    });
  },

  addSeries: (series) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collections.SERIES_COLLECTION)
        .insertOne(series)
        .then((data) => {
          resolve()
        })
    })

  },
  addPatient: (patient) => {
    return new Promise(async (resolve, reject) => {
      await db.get()
        .collection(collections.PATIENT_COLLECTION)
        .insertOne(patient)
        .then(async (data) => {
          await db.get().collection(collections.SERIES_COLLECTION).
            updateOne({ name: "Patient_id" }, { $inc: { nextCount: 1 } }).then(() => {
              resolve()
            })
        })
    })

  },
  addVolunteer: (volData) => {
    return new Promise(async (resolve, reject) => {
      volData.password = await bcrypt.hash(volData.password, 10);
      volData.duties = [];
      await db.get()
        .collection(collections.VOLUNTEER_COLLECTION)
        .insertOne(volData)
        .then(async (data) => {
          await db.get().collection(collections.SERIES_COLLECTION).
            updateOne({ name: "volunteer_id" }, { $inc: { nextCount: 1 } }).then(() => {
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
        .findOne({ name: "Patient_id" })
      resolve(pID.prefix + pID.nextCount);
    });
  },
  getVolunteerIdFromSeries: () => {
    return new Promise(async (resolve, reject) => {
      let pID = await db
        .get()
        .collection(collections.SERIES_COLLECTION)
        .findOne({ name: "volunteer_id" })
      resolve(pID.prefix + pID.nextCount);
    });
  },
  getVolunteerById: (vid) => {
    return new Promise(async (resolve, reject) => {
      let volunteer = await db
        .get()
        .collection(collections.VOLUNTEER_COLLECTION)
        .findOne({ v_id: vid })
      resolve(volunteer);
    });
  },

  getAllDonation: () => {
    return new Promise(async (resolve, reject) => {
      let data = await db.get().collection(collections.DONOR_COLLECTION)
        .find().toArray()
      resolve(data)
    })
  },

  getAllVolunteer: () => {
    return new Promise(async (resolve, reject) => {
      let volunteers = await db
        .get()
        .collection(collections.VOLUNTEER_COLLECTION)
        .find({ status: "approved" })
        .toArray();
      resolve(volunteers);
    });
  },
  getAllPatient: () => {
    return new Promise(async (resolve, reject) => {
      let patients = await db
        .get()
        .collection(collections.PATIENT_COLLECTION)
        .find({ status: "approved" })
        .toArray();
      resolve(patients);
    });
  },
  approveVolunteer: (vId) => {
    return new Promise(async (resolve, reject) => {
      const volunteer = await db.get().collection(collections.VOLUNTEER_COLLECTION).findOne({ v_id: vId });
      volunteer.status = "approved";
      await db.get().collection(collections.VOLUNTEER_COLLECTION).updateOne({ v_id: vId }, { $set: { status: "approved" } });
      resolve("approved successfully.");
    });

  },
  rejectionVolunteer: (vId) => {
    return new Promise(async (resolve, reject) => {

      const patient = await db.get().collection(collections.PATIENT_COLLECTION).deleteOne({ v_id: vId });
      resolve("rejected successfully.");
    });
  },
  approvePatient: (pId) => {
    return new Promise(async (resolve, reject) => {
      const patient = await db.get().collection(collections.PATIENT_COLLECTION).findOne({ p_id: pId });
      patient.status = "approved";
      await db.get().collection(collections.PATIENT_COLLECTION).updateOne({ p_id: pId }, { $set: { status: "approved" } });
      resolve("approved successfully.");
    });

  },
  rejectionPatient: (pId) => {
    return new Promise(async (resolve, reject) => {

      const patient = await db.get().collection(collections.PATIENT_COLLECTION).deleteOne({ p_id: pId });
      resolve("rejected successfully.");
    });
  },
  getAllPendingVolunteerCount: () => {
    return new Promise(async (resolve, reject) => {
      const pendingVolunteersCount = await db.get().collection(collections.VOLUNTEER_COLLECTION).countDocuments({ status: 'pending' });
      // .find({ status: 'pending' }).toArray();
      resolve(pendingVolunteersCount)
    })
  },
  getAllPendingVolunteers: () => {
    return new Promise(async (resolve, reject) => {

      const pendingVolunteers = await db.get().collection(collections.VOLUNTEER_COLLECTION).find({ status: 'pending' }).toArray();
      resolve(pendingVolunteers)
    })

  },
  getAllPendingPatientCount: () => {
    return new Promise(async (resolve, reject) => {
      const pendingPatientsCount = await db.get().collection(collections.PATIENT_COLLECTION).countDocuments({ status: 'pending' });
      // .find({ status: 'pending' }).toArray();
      resolve(pendingPatientsCount)
    })
  },
  getAllPendingPatients: () => {
    return new Promise(async (resolve, reject) => {

      const pendingPatients = await db.get().collection(collections.PATIENT_COLLECTION).find({ status: 'pending' }).toArray();
      resolve(pendingPatients)
    })

  },
  setVolunteerDutiesById: (vId, dutyData) => {

    return new Promise(async (resolve, reject) => {
      const volunteer = await db.get().collection(collections.VOLUNTEER_COLLECTION).findOne({ v_id: vId });
      volunteer.duties.push(dutyData);
      await db.get().collection(collections.VOLUNTEER_COLLECTION).updateOne({ v_id: vId }, { $set: { duties: volunteer.duties } });
      resolve("Duty data added successfully.");
    });
  },
  deleteVolunteerDutiesById: (vId, dutyIndex) => {
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

  getVolunteerDetails: (Id) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collections.VOLUNTEER_COLLECTION)
        .findOne({ v_id: Id })
        .then((response) => {
          resolve(response);
        });
    });
  },

  deleteVolunteer: (Id) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collections.VOLUNTEER_COLLECTION)
        .removeOne({ v_id: Id })
        .then((response) => {
          console.log(response);
          resolve(response);
        });
    });
  },
  deletePatients: (pId) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collections.PATIENT_COLLECTION)
        .removeOne({ p_id: pId })
        .then((response) => {
          console.log(response);
          resolve(response);
        });
    });
  },

  updateVolunteer: (Id, Details) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collections.VOLUNTEER_COLLECTION)
        .updateOne(
          { _id: objectId(Id) },
          {
            $set: {
              ...Details
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
        .collection(collections.VOLUNTEER_COLLECTION)
        .remove({})
        .then(() => {
          resolve();
        });
    });
  },
  deleteAllPatients: () => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collections.PATIENT_COLLECTION)
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
  }

}