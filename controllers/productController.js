const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const ApiError = require("../utils/apiError"); // Adjust the path as necessary
const asyncHandler = require("express-async-handler");
const fsDeleteImage = require("../utils/deleteImage");
const { login } = require("./authController");

exports.getAll = asyncHandler(async (req, res, next) => {
  const { page = 1, limit = 10, sort, search, filter, fields } = req.query;

  // Pagination
  const skip = (page - 1) * limit;

  // Sorting
  const orderBy = sort
    ? sort.split(",").map((field) => {
        const [column, order = "asc"] = field.split(":");
        return { [column]: order.toLowerCase() === "desc" ? "desc" : "asc" };
      })
    : undefined;

  // Searching
  const searchCondition = search
    ? {
        OR: [
          { name: { contains: search } },
          { description: { contains: search } },
        ],
      }
    : undefined;

  // Filtering
  let filterCondition = {};
  if (filter) {
    try {
      filterCondition = JSON.parse(filter);
    } catch (error) {
      return next(new ApiError("Invalid filter query", 400));
    }
  }

  // Selecting specific fields
  const selectFields = fields
    ? fields.split(",").reduce((acc, field) => {
        acc[field.trim()] = true;
        return acc;
      }, {})
    : undefined;

  // Fetching products
  const products = await prisma.product.findMany({
    skip,
    take: +limit,
    where: { ...searchCondition, ...filterCondition },
    orderBy,
    select: selectFields || {
      id: true,
      name: true,
      description: true,
      price: true,
      categories: true,
      images: true,
      ratingsAverage: true,
      ratingsQuantity: true,
    },
  });

  // Total count for metadata
  const totalItems = await prisma.product.count({
    where: { ...searchCondition, ...filterCondition },
  });

  // Return response
  if (!products) {
    return next(new ApiError("Failed to retrieve products", 500));
  }

  return res.status(200).json({
    metadata: {
      totalItems,
      totalPages: Math.ceil(totalItems / limit),
      currentPage: +page,
      itemsPerPage: +limit,
    },
    data: products,
  });
});

exports.create = asyncHandler(async (req, res, next) => {
  let images = [];
  if (req.files) {
    const uploadedFiles = req.files;
    images = uploadedFiles.map((file) => `/uploads/products/${file.filename}`);
  }

  const { name, price, categoryId, description } = req.body;
  const userId = +req.user.id;
  if (!userId) {
    return next(new ApiError("you must login", 400));
  }

  if (!name || !price || !categoryId || !description) {
    return next(new ApiError("All fields are required", 400));
  }

  const newProduct = await prisma.product.create({
    data: {
      name,
      description,
      price: parseFloat(price),
      userId,
      categories: {
        connect: [{ id: parseInt(categoryId) }], // Connect existing category
      },
      images: {
        create: images.map((image) => ({ url: image })),
      },
    },
    include: { categories: true, images: true }, // Include related categories
  });

  return res.status(201).json(newProduct);
});

exports.getOne = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  if (!id) {
    return next(new ApiError("Product ID is required", 404));
  }

  const product = await prisma.product.findUnique({
    where: { id: parseInt(id) },
    include: { categories: true, images: true }, // Include related categories
  });

  if (!product) {
    return next(new ApiError("Product not found", 404));
  }

  return res.status(200).json(product);
});

exports.updateOne = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const userId = req.user.id;
  const userRole = req.user.type;

  const { name, description, price, categoryId } = req.body;

  if (!userId) {
    return next(new ApiError("you must login", 400));
  }
  if (!id) {
    return next(new ApiError("Product ID is required", 400));
  }

  const product = await prisma.product.findUnique({
    where: { id: parseInt(id) },
  });

  if (!product) {
    return next(new ApiError("Product not found", 404));
  }
  if (userId !== product.userId && userRole !== "ADMIN") {
    return next(
      new ApiError("you are not allowed to update this product", 400)
    );
  }

  // Validate and parse categoryId
  const parsedCategoryId = categoryId ? parseInt(categoryId) : undefined;
  if (categoryId && isNaN(parsedCategoryId)) {
    return next(new ApiError("Invalid category ID format", 400));
  }

  // Update product
  const updatedProduct = await prisma.product.update({
    where: { id: parseInt(id) },
    data: {
      name,
      description, // Allow optional fields
      price, // Use parsed price
      categories: parsedCategoryId
        ? { set: [{ id: parsedCategoryId }] } // Set the category if provided
        : undefined, // Skip if no categoryId
    },
    include: { categories: true }, // Include related categories
  });

  return res.status(200).json(updatedProduct);
});

exports.deleteOne = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const userId = req.user.id;
  const userRole = req.user.role;

  if (!id) {
    return next(new ApiError("Product ID is required", 404));
  }

  const product = await prisma.product.findUnique({
    where: { id: parseInt(id) },
  });

  if (!product) {
    return next(new ApiError("Product not found", 404));
  }
  if (userId !== product.userId && userRole !== "ADMIN") {
    return next(
      new ApiError("you are not allowed to update this product", 400)
    );
  }

  await prisma.product.delete({
    where: { id: parseInt(id) },
  });

  return res.status(204).end();
});

exports.addImages = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const userId = req.user.id;
  const userRole = req.user.type;
  let images = [];
  if (req.files) {
    const uploadedFiles = req.files;
    images = uploadedFiles.map((file) => `/uploads/products/${file.filename}`);
  }

  if (!id) {
    return next(new ApiError("Product ID is required", 404));
  }

  const product = await prisma.product.findUnique({
    where: { id: parseInt(id) },
  });

  if (!product) {
    return next(new ApiError("Product not found", 404));
  }
  if (userId !== product.userId && userRole !== "ADMIN") {
    return next(
      new ApiError("you are not allowed to update this product", 400)
    );
  }

  const updatedProduct = await prisma.product.update({
    where: { id: parseInt(id) },
    data: {
      images: {
        create: images.map((image) => ({ url: image })),
      },
    },
    include: { images: true }, // Include related images
  });

  return res.status(200).json(updatedProduct);
});

exports.deleteImage = asyncHandler(async (req, res, next) => {
  const { id, imageId } = req.params;
  const userId = req.user.id;
  const userRole = req.user.type;

  if (!id || !imageId) {
    return next(new ApiError("Product ID and image ID are required", 404));
  }

  const product = await prisma.product.findUnique({
    where: { id: parseInt(id), images: { some: { id: parseInt(imageId) } } },
  });

  if (!product) {
    return next(new ApiError("Product not found", 404));
  }
  if (userId !== product.userId && userRole !== "ADMIN") {
    return next(
      new ApiError("you are not allowed to update this product", 400)
    );
  }
  const image = await prisma.image.findUnique({
    where: { id: parseInt(imageId) },
  });

  if (!image) {
    return next(new ApiError("Image not found", 404));
  }

  // Extract the filename from the URL (removing the '/uploads/products/' part)
  await fsDeleteImage("products", image.url);

  await prisma.image.delete({
    where: { id: parseInt(imageId) },
  });

  return res.status(204).end();
});
