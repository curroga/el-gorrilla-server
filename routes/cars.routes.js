const router = require("express").Router();
const Cars = require("../models/Cars.models")

const {isAuthenticated} = require("../middlewares/auth.middlewares.js");

// GET "/api/car" => enviar el modelo de todos los coches
router.get("/", isAuthenticated, async (req, res, next) => {

  try {
    //1. buscar en la base de datos todas los coches  
    const response = await Cars.find({owner: req.payload._id})
    
    //2. enviarlas al cliente 
    res.status(200).json(response)  
  } catch (error) {
    next(error)
  }
})

// POST "/api/car" => recibe detalles de un nuevo coche y lo crea en la BD
router.post("/", isAuthenticated, async (req, res, next) => {
  

  // recopilar la info del cliente (Postman)
    
  const { modelo, matricula, color } = req.body

  const newCoche = {
    modelo,
    matricula,
    color,
    owner: req.payload._id 
  }

  try {
    // usar la informacion para crear
    await Cars.create(newCoche)
    res.status(201).json("Coche creado en la BD")
    return;
    
  } catch (error) {
    next(error)
  }

})

// GET "/api/car/:carId" => enviar todos los detalles de un coche por su Id
router.get("/:carId", isAuthenticated, async (req, res, next) => {
  const {carId} = req.params
  try {
    //1. buscar un documento por su Id
    const response = await Cars.findById(carId)
    //2. enviar el documento al cliente
    res.status(200).json(response)

  } catch (error) {
   next(error) 
  }
})

// DELETE "/api/car/:carId" => borrar un documento de Coche de la BD por su Id
router.delete("/:carId", isAuthenticated, async (req, res, next) => {
  const { carId } = req.params
  try {
    //1. borrar el documento por su Id
    const response = await Cars.findByIdAndDelete(carId)
    //2. enviar respuesta al FE
    res.status(200).json("Coche borrado")
  } catch (error) {
    next(error)
  }
})

// Patch "/api/car/:carId" => editar un documento de Coche de la Bd por su Id
router.patch("/:carId", isAuthenticated, async (req, res, next) => {
  const { carId } = req.params
  const { modelo, matricula, color } = req.body

  const carUpdate = {
    modelo,
    matricula,
    color
  }
  try {
    await Cars.findByIdAndUpdate(carId, carUpdate)

    res.status(200).json("Coche actualizado")
    
  } catch (error) {
    next(error)
  }
})

module.exports = router