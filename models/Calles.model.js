const mongoose = require("mongoose")

const calleSchema = new mongoose.Schema ({
  name: String,
  numAparcamientos: Number,
  numLibres: {
    type: Number,
    default: 0
  },
  // estadoAparcamiento: {
  //   type: String,
  //   enum: ["Libre", "Ocupado", "A punto de salir"],
  //   default: "Ocupado"
  // },
  // positionMapContainer: [
  //   { type: Number },
  //   { type: Number }
  // ],
  positionMarker: [
    { type: Number }    
  ]

})

const Calles = mongoose.model("Calles", calleSchema);

module.exports = Calles