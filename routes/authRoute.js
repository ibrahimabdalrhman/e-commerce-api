const express = require("express");
const { sendOtp, create, login, verifyUser } = require("../controllers/authController");
const { validateCreateUser, validateSendOtp, validateVerifyOtp } = require("../validators/user.validator");
const router = express.Router();

router.post("/register", validateCreateUser,create);
router.post("/verify-user", validateSendOtp,verifyUser);
router.post("/sendOtp", validateSendOtp,sendOtp);
router.post("/login", validateVerifyOtp,login);

module.exports = router;
