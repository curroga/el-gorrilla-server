const router = require("express").Router();
const User = require("../models/User.model.js");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const {isAuthenticated} = require("../middlewares/auth.middlewares.js");

//POST "/api/auth/signup" => registrar a un usuario
router.post("/signup", async (req, res, next) => {
  
  console.log(req.body)
  const { username, email, password, role } =req.body

  // 1. Hacer validaciones de Backend
  // validar que todos los campos esten rellenos
  if( !username || !email || !password ){
    res.status(400).json({ errorMessage: "Debe llenar todos los campos" })
    return;
  }
  // validar la fuerza de la contraseña
  const passwordRegex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[a-zA-Z]).{8,}$/gm;
  if (passwordRegex.test(password) === false) {
    res.status(400).json({ errorMessage: "La contraseña debe de tener mínimo 8 caracteres, una mayúscula y un número" })
    return;
  }

  // validar formato de correo electrónico
  const emailRegex = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/g;
  if (emailRegex.test(email) === false){
    res.status(400).json({ errorMessage: "Debe escribir el email correctamente" })
    return;
  }

  
  try {
    // validar que el usuario sea unico, no este registrado en la db
    const foundUser = await User.findOne({ username: username })    
    if (foundUser !== null) {
      res.status(401).json({errorMessage: "Usuario ya creado con ese nomnbre"})
      return;
    }
  
    // vaidar que el correo electrónico sea único, no este registrado
    const foundEmail = await User.findOne({ email: email })
    if(foundEmail !== null) {
      res.status(401).json({errorMessage: "Correo electrónico ya creado"})
      return;
    }


    // 2. codificar la contraseña
    const salt = await bcrypt.genSalt(12)
    const hashPassword = await bcrypt.hash(password, salt)
    // 3. crear el usuario
    const newUser = {
      username: username,
      email: email,
      password: hashPassword,
    }
    await User.create(newUser)
    
    // 4. enviar un mensaje de OK al FE    
    res.status(201).json("Usuario registrado correctamente")

  } catch (error) {
    next(error)        
  }

})

//POST "/api/auth/login" => validar credenciales del usuario
router.post("/login", async (req, res, next) => {
  console.log(req.body)

  const { username, password } = req.body

  // 1. Validaciones de backend
  // validar que todos los campos esten rellenos
  if( !username || !password ){
    res.status(400).json({ errorMessage: "Debe llenar todos los campos" })
    return;
  }
    
 try {
   // validar que el username sea único, no este registrado
   const foundUser = await User.findOne({ username: username })
   if(foundUser === null) {
     res.status(400).json({errorMessage: "Credenciales no validas"})
     return;
  }
  const isPasswordValid = await bcrypt.compare(password, foundUser.password);
  if(isPasswordValid === false) {
     res.status(401).json({errorMessage: "Credenciales no validas"})
     return;
  }

  // 2. crear el TOKEN (algo parecido a la sesion) y enviarlo al cliente

  // payload es la info del usuario dueño del TOKEN
  const payload = {
    _id: foundUser._id,
    username: foundUser.username,
    email: foundUser.email,
    role: foundUser.role
  }

  const authToken = jwt.sign(
    payload,
    process.env.TOKEN_SECRET,
     { algorithm: "HS256", expiresIn: "3h"}
  )
 
 
  // enviar el token al cliente
  res.status(200).json({ authToken: authToken})
  
 } catch (error) {
  next(error)
 }

})

//GET "/api/auth/verify" => para que el BE le diga al FE si el ususuario ya ha sido validado
router.get("/verify", isAuthenticated, (req, res, next) => {

  console.log(req.payload) // vemos la info del usuario que se ha logeado(pero de los que se han autenticado)
  
  res.status(200).json(req.payload)
  
})


module.exports = router