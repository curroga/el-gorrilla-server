const mongoose = require("mongoose")

const calleSchema = new mongoose.Schema ({
  name: String,
  numAparcamientos: Number,
  numOcupados: {
    type: Number,
    default: 0
  },
  numLibres: {
    type: Number,
    default: 0
  },
  coches: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Cars"
  }], 
  positionMarker: [
    { type: Number }    
  ]

})

const Calles = mongoose.model("Calles", calleSchema);

module.exports = Calles