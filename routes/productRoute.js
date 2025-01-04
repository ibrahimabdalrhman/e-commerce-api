const express = require("express");
const {
  getAll,
  create,
  getOne,
  updateOne,
  deleteOne,
  addImages,
  deleteImage,
  addReview,
} = require("../controllers/productController");
const auth = require("../middlewares/authMiddleware");

const {
  validateCreateProduct,
  validateUpdateProduct,
  validateGetAllProducts,
} = require("../validators/product.validator");
const upload = require("../middlewares/uploadMiddleware");
const router = express.Router();
const allowToRole = require("../middlewares/roleMiddleware");

router.get("/", validateGetAllProducts, getAll);
router.get("/:id", getOne);

router.use(auth);

router.use(allowToRole("ADMIN", "CAFE", "RESTURANT"));
router.post("/", upload("images", "products"), validateCreateProduct, create);

router.patch("/add-images/:id", upload("images", "products"), addImages);
router.patch("/:id", validateUpdateProduct, updateOne);

router.delete("/:id/delete-image/:imageId", deleteImage);
router.delete("/:id", deleteOne);

module.exports = router;
