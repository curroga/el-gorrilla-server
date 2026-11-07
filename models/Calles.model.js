const mongoose = require("mongoose")

const calleSchema = new mongoose.Schema ({
  name: String,
  numAparcamientos: Number,
  coches: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Cars"
  }], 
  positionMarker: [
    { type: Number }    
  ]

}, {
  id: false,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
})

// numOcupados y numLibres no se guardan: se calculan a partir de los coches
// aparcados y de numAparcamientos, para que no puedan contradecirse.
calleSchema.virtual("numOcupados").get(function () {
  return (this.coches || []).length
})

calleSchema.virtual("numLibres").get(function () {
  return Math.max((this.numAparcamientos || 0) - this.numOcupados, 0)
})

const Calles = mongoose.model("Calles", calleSchema);

module.exports = Calles