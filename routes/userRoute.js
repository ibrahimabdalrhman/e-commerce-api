const express = require("express");
const {
  getAll,
  create,
  getOne,
  login,
  updateProfileImage,
  updateImages,
  updatePassword,
  profile,
} = require("../controllers/usersController");
const router = express.Router();
const auth = require("../middlewares/authMiddleware");
const upload = require("../middlewares/uploadMiddleware");
const {
  validateCreateUser,
  validateSendOtp,
  validateVerifyOtp,
} = require("../validators/user.validator");
const allowToRole=require("../middlewares/roleMiddleware")

// Routes
router.get("/",allowToRole("ADMIN"), getAll);
router.get("/profile", auth, profile);
router.get("/:id", getOne);
// Update image
router.use(auth);

router.patch(
  "/profile-image",
  upload("profileImage", "users"),
  updateProfileImage
);
router.patch("/images", upload("images"), updateImages);

router.patch("/change-password", updatePassword);

module.exports = router;
