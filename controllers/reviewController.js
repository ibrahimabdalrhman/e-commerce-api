const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const ApiError = require("../utils/ApiError"); // Adjust the path as necessary
const asyncHandler = require("express-async-handler");

exports.addReview = asyncHandler(async (req, res, next) => {
  const { prodoctId } = req.params;
  const userId = +req.user.id;
  const { rating, comment } = req.body;

  if (!prodoctId) {
    return next(new ApiError("Product ID is required", 404));
  }

  const product = await prisma.product.findUnique({
    where: { id: parseInt(prodoctId) },
  });

  if (!product) {
    return next(new ApiError("Product not found", 404));
  }

  if (!rating || !comment) {
    return next(new ApiError("Rating and comment are required", 400));
  }

  const review = await prisma.review.create({
    data: {
      rating: parseInt(rating),
      comment,
      userId,
      productId: parseInt(prodoctId),
    },
  });

  await updateProductRatings(parseInt(prodoctId));

  return res.status(201).json(review);
});

exports.getReviews = asyncHandler(async (req, res, next) => {
  const { prodoctId } = req.params;

  if (!prodoctId) {
    return next(new ApiError("Product ID is required", 404));
  }

  const reviews = await prisma.review.findMany({
    where: { productId: parseInt(prodoctId) },
  });

  return res.status(200).json(reviews);
});

exports.getOneReview = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  if (!id) {
    return next(new ApiError("Product ID is required", 404));
  }

  const review = await prisma.review.findUnique({
    where: { id: parseInt(id) },
  });

  return res.status(200).json(review);
});

exports.updateReview = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const userId = req.user.id;
  const { rating, comment } = req.body;
  if (!id) {
    return next(new ApiError("review ID is required", 404));
  }
  const review = await prisma.review.findUnique({
    where: { id: parseInt(id) },
  });
  if (!review) {
    return next(new ApiError("review not found", 404));
  }
  if (review.userId !== userId) {
    return next(
      new ApiError("You are not authorized to update this review", 403)
    );
  }
  const updatedReview = await prisma.review.update({
    where: { id: parseInt(id) },
    data: { rating: rating, comment },
  });
  await updateProductRatings(review.productId);

  return res.status(200).json(updatedReview);
});

async function updateProductRatings(productId) {
  // Fetch all reviews for the product
  const reviews = await prisma.review.findMany({
    where: { productId },
  });

  // Calculate the average rating and total count
  const ratingsQuantity = reviews.length;
  const ratingsAverage =
    ratingsQuantity > 0
      ? reviews.reduce((sum, review) => sum + review.rating, 0) /
        ratingsQuantity
      : 0;

  // Update the product
  await prisma.product.update({
    where: { id: productId },
    data: { ratingsAverage, ratingsQuantity },
  });
}
