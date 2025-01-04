const express = require("express");
const {
  getCategories,
  createCategory,
  getCategoryById,
  deleteCategory,
  updateCategory,
} = require("../controllers/categoryController");
const router = express.Router();
const auth = require("../middlewares/authMiddleware");
const {
  validateCreateCategory,
  validateUpdateCategory,
} = require("../validators/category.validator");
const allowToRole=require("../middlewares/roleMiddleware")


router.get("/", getCategories);
router.get("/:id", getCategoryById);

router.use(auth);
router.use(allowToRole("ADMIN"));
// Routes
router.post("/", validateCreateCategory, createCategory);
router.patch("/:id", validateUpdateCategory, updateCategory);
router.delete("/:id", deleteCategory);

module.exports = router;
