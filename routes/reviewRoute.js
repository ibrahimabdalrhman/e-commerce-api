const express = require("express");
const router = express.Router();
const {
  addReview,
  getReviews,
  getOneReview,
  updateReview,
} = require("../controllers/reviewController");

const auth = require("../middlewares/authMiddleware");
const { validateAddReview, validateUpdateReview } = require("../validators/reviews.validator");

router.use(auth);

router.post("/:prodoctId/addReview", validateAddReview, addReview);
router.get("/all/:prodoctId/", getReviews);
router.get("/:id", getOneReview);
router.patch("/:id", validateUpdateReview, updateReview);

module.exports = router;
