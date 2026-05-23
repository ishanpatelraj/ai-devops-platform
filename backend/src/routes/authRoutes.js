const express = require("express");
const router = express.Router();

const {registerUserController, loginUserController, logoutUserController, getMeController} = require("../controllers/authController");
const {protect} = require("../middleware/authMiddleware");

//public routes
router.post("/register", registerUserController);
router.post("/login", loginUserController);

//protected ones
router.post("/logout", protect, logoutUserController);
router.get("/me", protect, getMeController);

module.exports = router;