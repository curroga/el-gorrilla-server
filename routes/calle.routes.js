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
  

  // recopilar la informacion del client (postman)
  
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
  const { name, numAparcamientos, numOcupados, numLibres, positionMarker } = req.body

  const calleUpdates = {
    name,
    numAparcamientos,
    numOcupados,
    numLibres,
    positionMarker    
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

// POST "/api/calle/favoritos/:calleId" añadir una calle favorita 
router.post("/favoritos/:calleId", isAuthenticated, async (req, res, next) => {
  const { calleId } = req.params;
  const userId = req.payload._id;

  try {
    // $addToSet previene duplicados, es más robusto que $push aquí.
    await User.findByIdAndUpdate(userId, { $addToSet: { favoritos: calleId } });
    res.status(200).json({ message: "Calle añadida a favoritos" });
  } catch (error) {
    next(error);
  }
});

// DELETE "/api/calle/favoritos/:calleId" borrar una calle favorita
router.delete("/favoritos/:calleId", isAuthenticated, async (req, res, next) => {
  const { calleId } = req.params;
  const userId = req.payload._id;

  try {
    await User.findByIdAndUpdate(userId, { $pull: { favoritos: calleId } });
    res.status(200).json({ message: "Calle eliminada de favoritos" });
  } catch (error) {
    next(error);
  }
});

// POST "/api/calle/:calleId/coches/:cocheId" => ruta para añadir un coche a la calle
router.post("/:calleId/coches/:cocheId", isAuthenticated, async (req, res, next) => {
  const { calleId, cocheId  } = req.params
  
  try {    
    await Calles.findByIdAndUpdate(calleId, {$addToSet: {coches: cocheId }})
    res.status(200).json({ message: "Coche añadido a la calle" })
  } catch (error) {
    next(error)
  }
})

// DELETE "/api/calle/:calleId/coches/:cocheId" => ruta para quitar un coche de la calle
router.delete("/:calleId/coches/:cocheId", isAuthenticated, async (req, res, next) => {
  const { calleId, cocheId  } = req.params
  

  try {    

    const response = await Calles.findByIdAndUpdate(calleId, {$pull: {coches: cocheId }})
    
    res.status(200).json({ message: "Coche quitado de la calle" })
    
  } catch (error) {
    next(error)
  }
})

module.exports = router