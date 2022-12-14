const router = require("express").Router();

router.get("/", (req, res, next) => {
  res.json("All good in here");
});

const authRoutes = require("./auth.routes")
router.use("/auth", authRoutes)

const callesRoutes = require("./calle.routes")
router.use("/calle", callesRoutes)

const carsRoutes = require("./cars.routes")
router.use("/car", carsRoutes)

module.exports = router;
