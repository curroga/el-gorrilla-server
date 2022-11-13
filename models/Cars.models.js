const mongoose = require("mongoose")

const carsSchema = new mongoose.Schema (
  {
  modelo: String,
  matricula: String,
  color: String,
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }
 },
 {
    timestamps: true
 }
);

const Cars = mongoose.model("Cars", carsSchema);

module.exports = Cars