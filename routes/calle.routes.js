const router = require("express").Router();
const Calles = require("../models/Calles.model");
const {isAuthenticated, isAdmin} = require("../middlewares/auth.middlewares.js");


// GET "/api/calle" => enviar los titulos de todas las calles
router.get("/", isAuthenticated, async (req, res, next) => {

  try {

    //1. buscar en la base de datos todas las calles
    const response = await Calles.find().select("name positionMarker")

    //2. enviarlos al cliente (postman)
    res.status(200).json(response)
    
  } catch (error) {
    next(error)
  }
})

// POST "/api/calle" => recibe detalles de una nueva calle y lo crea en la DB
router.post("/", isAuthenticated, isAdmin, async (req, res, next) => {
  console.log("postman accediendo a la ruta")

  // recopilar la informacion del client (postman)
  console.log(req.body)
  const { name, numAparcamientos, positionMapContainer, positionMarker } = req.body

  const newCalle = {
    name,
    numAparcamientos,
    // positionMapContainer,
    positionMarker: JSON.parse(positionMarker) //! cuando haga pruebas, en el FE coloco solo positionMarker(sin el JSON.PARSE)
  }
  // usar la informacion para crear 
  try {

    await Calles.create(newCalle)
    res.status(201).json("todo bien, creada la calle en la DB")
    return;
    
  } catch (error) {
    next(error)
  }
})

// GET "/api/calle/:calleId" => enviar todos los detalles de una calle por su Id
router.get("/:calleId", isAuthenticated, async (req, res, next) => {

  const { calleId } = req.params

  try {

    // 1. buscar un documento de Calle por su Id
    const response = await Calles.findById(calleId)

    // 2. enviar el documento al cliente
    res.status(200).json(response)
    
  } catch (error) {
    next(error)    
  }

})

//DELETE "/api/calle/:calleId" borrar un documento de Calle de la BD por su id
router.delete("/:calleId", isAuthenticated, isAdmin, async (req, res, next) => {
  const { calleId } = req.params
  try {
    // borrar el documento por su id
    await Calles.findByIdAndDelete(calleId)

    // enviar repuesta al FE(Front End)
    res.status(200).json("todo bien, documento borrado")
    
  } catch (error) {
    next(error)
  }
})

// Patch "/api/calle/:calleId" =>editar un documento de Calle de la BD por su id

router.patch("/:calleId", isAuthenticated, isAdmin, async (req, res, next) => {
  // buscar los cambios a editar del documento
  const { calleId } = req.params
  const { name, numAparcamientos, positionMarker} = req.body

  const calleUpdates = {
    name,
    numAparcamientos,
    // positionMapContainer,
    positionMarker: JSON.parse(positionMarker)    
  }

  try {
    // editar el documento por su id
    await Calles.findByIdAndUpdate(calleId, calleUpdates)
      
    // enviar mensaje de "todo bien" al FE
    res.status(200).json("todo bien, documento actualizado")
    
  } catch (error) {
    next(error)    
  }

})

module.exports = router