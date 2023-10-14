const mongoClient = require("mongodb").MongoClient;

const state = {
  db: null,
};

module.exports.connect = function (done) {
  const url = "mongodb+srv://thevectorcrop:msb.com001@cluster0.hm54v7y.mongodb.net/?retryWrites=true&w=majority";
  const dbname = "Sreya-WorkshopBookingSystem-Nodejs";

  mongoClient.connect(url, { useUnifiedTopology: true }, (err, data) => {
    if (err) {
      return done(err);
    }
    state.db = data.db(dbname);

    done();
  });
};

module.exports.get = function () {
  return state.db;
};
