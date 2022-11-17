const router = require("express").Router();
const Calles = require("../models/Calles.model");
const User = require("../models/User.model");
const Cars = require("../models/Cars.models")
const {isAuthenticated, isAdmin} = require("../middlewares/auth.middlewares.js");


// GET "/api/calle" => enviar los titulos de todas las calles
router.get("/", isAuthenticated, async (req, res, next) => {
  
  try {
    
    //1. buscar en la base de datos todas las calles
    const response = await Calles.find().populate("coches")
    
    //2. enviarlos al cliente (postman)
    res.status(200).json(response)
    
  } catch (error) {
    next(error)
  }
})
// router.get("/favoritos", async (req, res, next) => {
//   res.status(200).json("entrando en la ruta de favoritos")
// })
// GET "/calle/favoritos"
router.get("/favoritos", isAuthenticated, async (req, res, next) => {
  const userId = req.payload._id
  console.log(userId)
  try {
    const user = await User.findById(userId).populate("favoritos");
    const response = await Calles.find({ _id: { $in: user.favoritos } });
    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
  
});

// POST "/api/calle" => recibe detalles de una nueva calle y lo crea en la DB
router.post("/", isAuthenticated, isAdmin, async (req, res, next) => {
  console.log("postman accediendo a la ruta")

  // recopilar la informacion del client (postman)
  console.log(req.body)
  const { name, numAparcamientos, positionMarker } = req.body

  const newCalle = {
    name,
    numAparcamientos,
    positionMarker    
    // positionMarker: JSON.parse(positionMarker) //! cuando haga pruebas, en el FE coloco solo positionMarker(sin el JSON.PARSE)
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
    const response = await Calles.findById(calleId).populate("coches")

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
  const { name, numAparcamientos, numOcupados } = req.body

  const calleUpdates = {
    name,
    numAparcamientos,
    numOcupados    
    //!positionMarker: JSON.parse(positionMarker)    
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

// rutas para crear una lista de favoritos



//PATCH "/api/calle/favoritos/:calleId" añadir una calle favorita 
router.patch("/favoritos-update/:calleId", isAuthenticated, async (req, res, next) => {
  const { calleId } = req.params
  const userId = req.payload._id
  console.log(calleId)
  console.log(userId)

  try {
    const response = await User.findByIdAndUpdate(userId, {$push: {favoritos: calleId}}, {new:true})
    console.log(response)
    res.status(200).json(response)
    
  } catch (error) {
    next(error)
  }
})

//PATCH "/api/calle/favoritos-delete/:calleId" borrar una calle favorita
router.patch("/favoritos-delete/:calleId", isAuthenticated, async (req, res, next) => {
  const { calleId } = req.params
  const userId = req.payload._id
  console.log(calleId)
  console.log(userId)

  try {
    const response = await User.findByIdAndUpdate(userId, {$pull: {favoritos: calleId}}, {new:true})
    res.status(200).json(response)
  } catch (error) {
    next(error)
  }

})

//PATCH "/api/calle/:calleId/:cocheId" => ruta para añadir un coche a la calle y que recibe dos params dinamicos, uno va a ser la id de la calle a la que queremos agregar el coche y el otro va a ser el id del coche que queremos agregar
router.patch("/:calleId/:cocheId", isAuthenticated, async (req, res, next) => {
  const { calleId, cocheId  } = req.params
  console.log("calleId:", calleId)
  console.log("cocheId:", cocheId)

  try {    

    const response = await Calles.findByIdAndUpdate(calleId, {$addToSet: {coches: cocheId }})
    console.log("response", response)
    res.status(200).json(response)
    return;
    
  } catch (error) {
    next(error)
  }
})

//PATCH "/api/calle/:calleId/:cocheId" => ruta para quitar un coche de la calle
router.patch("/delete/:calleId/:cocheId", isAuthenticated, async (req, res, next) => {
  const { calleId, cocheId  } = req.params
  console.log("calleId:", calleId)
  console.log("cocheId:", cocheId)

  try {    

    const response = await Calles.findByIdAndUpdate(calleId, {$pull: {coches: cocheId }})
    console.log("response", response)
    res.status(200).json(response)
    return;
    
  } catch (error) {
    next(error)
  }
})

module.exports = router