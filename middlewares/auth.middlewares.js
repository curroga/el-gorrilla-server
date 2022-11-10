const { expressjwt: jwt } = require("express-jwt")


const isAuthenticated = jwt({
  secret: process.env.TOKEN_SECRET,
  algorithms: ["HS256"],
  requestProperty: "payload",
  getToken: (req) => { // esto es donde va a venir la info TOKEN
    console.log(req.headers)
    if(req.headers === undefined || req.headers.authorization === undefined){
      console.log("No hay Token")
      return null
    }

    const tokenArr = req.headers.authorization.split(" ")
    const tokenType = tokenArr[0]
    const token = tokenArr[1]
    if(tokenType !== "Bearer"){
      console.log("Tipo de token incorrecto")
      return null;
    }
    console.log("El token ha sido entregado")
    return token
    
  }
})
module.exports = isAuthenticated