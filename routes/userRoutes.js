const express = require("express");
const userController = require("../controllers/userController.js");
const jwtMiddleware = require("../middleware/jwtMiddleware.js");

const router = express.Router();

router.post("/register", userController.register);
router.post("/logon", userController.logon);
//router.use(jwtMiddleware); //this will protect all routes after it
router.post("/logoff", jwtMiddleware, userController.logoff);
router.get("/:id", userController.show);

module.exports = router;
