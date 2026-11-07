const mongoose = require("mongoose")

const calleSchema = new mongoose.Schema ({
  name: String,
  numAparcamientos: Number,
  // plazas ocupadas por coches que no usan la app; lo ajusta el admin a mano
  ocupadosExternos: {
    type: Number,
    min: 0
  },
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

// Antes, numOcupados se guardaba y solo lo editaba el admin a mano, así que
// ese valor equivale al ajuste manual. Si una calle aún no tiene
// ocupadosExternos, se usa el numOcupados guardado (sin migrar los datos).
calleSchema.pre("init", function (raw) {
  if (raw && raw.ocupadosExternos == null && typeof raw.numOcupados === "number") {
    raw.ocupadosExternos = raw.numOcupados
  }
})

// numOcupados y numLibres no se guardan: se calculan a partir de los coches
// aparcados, del ajuste del admin y de numAparcamientos, para que no puedan
// contradecirse.
calleSchema.virtual("numOcupados").get(function () {
  return (this.coches || []).length + (this.ocupadosExternos || 0)
})

calleSchema.virtual("numLibres").get(function () {
  return Math.max((this.numAparcamientos || 0) - this.numOcupados, 0)
})

const Calles = mongoose.model("Calles", calleSchema);

module.exports = Calles