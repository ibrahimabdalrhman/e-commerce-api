const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const ApiError = require("../utils/apiError"); // Adjust the path as necessary
const asyncHandler = require("express-async-handler");

exports.getCategories = asyncHandler(async (req, res) => {
  const categories = await prisma.category.findMany();
  return res.status(200).json(categories);
});

exports.getCategoryById = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  if (!id) {
    return next(new ApiError("Category ID is required", 404));
  }

  const category = await prisma.category.findUnique({
    where: {
      id: parseInt(id),
    },
  });

  if (!category) {
    return next(new ApiError("Category not found", 404));
  }

  return res.status(200).json(category);
});

exports.createCategory = asyncHandler(async (req, res, next) => {
  const { name, description } = req.body;

  if (!name || !description) {
    return next(
      new ApiError("Category name and description are required", 400)
    );
  }

  const newCategory = await prisma.category.create({
    data: {
      name,
      description,
    },
  });

  return res.status(201).json(newCategory);
});

exports.updateCategory = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { name, description } = req.body;

  if (!id) {
    return next(new ApiError("Category ID is required", 400));
  }

  const updatedCategory = await prisma.category.update({
    where: {
      id: parseInt(id),
    },
    data: {
      name,
      description,
    },
  });

  if (!updatedCategory) {
    return next(new ApiError("Category not found", 404));
  }

  return res.status(200).json(updatedCategory);
});

exports.deleteCategory = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  if (!id) {
    return next(new ApiError("Category ID is required", 400));
  }

  const category = await prisma.category.findUnique({
    where: {
      id: parseInt(id),
    },
  });

  if (!category) {
    return next(new ApiError("Category not found", 404));
  }

  await prisma.category.delete({
    where: {
      id: parseInt(id),
    },
  });

  return res.status(204).json({ message: "Category deleted successfully" });
});
