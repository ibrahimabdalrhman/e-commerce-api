const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const asyncHandler = require("express-async-handler");
const ApiError = require("../utils/apiError");
const jwt = require("jsonwebtoken");
const twilio = require("twilio");

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
); // Ensure you have a utility for ApiError

exports.getAll = asyncHandler(async (req, res, next) => {
  const users = await prisma.user.findMany({ include: { images: true } });

  if (!users) {
    return next(new ApiError("No users found", 404));
  }

  res.status(200).json(users);
});

// Get a specific user by ID
exports.profile = asyncHandler(async (req, res, next) => {
  const { id } = req.user;

  const user = await prisma.user.findUnique({
    where: { id: parseInt(id) },
  });

  if (!user) {
    return next(new ApiError("User not found", 404));
  }

  res.status(200).json(user);
});

exports.getOne = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const user = await prisma.user.findUnique({
    where: { id: parseInt(id) },
  });

  if (!user) {
    return next(new ApiError("User not found", 404));
  }

  res.status(200).json(user);
});

exports.updateImages = asyncHandler(async (req, res, next) => {
  const { id } = req.user;
  const uploadedFiles = req.files;
  if (!uploadedFiles || uploadedFiles.length === 0) {
    return next(new ApiError("No files uploaded.", 400));
  }

  const imagePaths = uploadedFiles.map(
    (file) => `/uploads/users/${file.filename}`
  );

  const updatedUser = await prisma.user.update({
    where: { id },
    data: { images: { create: imagePaths.map((path) => ({ url: path })) } },
  });

  res.status(200).json(updatedUser);
});

exports.updateProfileImage = asyncHandler(async (req, res, next) => {
  const { id } = req.user;
  const profileImage = req.files[0]
    ? `/uploads/${req.files[0].filename}`
    : null;

  if (!profileImage) {
    return next(new ApiError("No profile image uploaded", 400));
  }

  const updatedUser = await prisma.user.update({
    where: { id },
    data: { profileImage },
  });

  res.status(200).json(updatedUser);
});

exports.updatePassword = asyncHandler(async (req, res, next) => {
  const { id } = req.user;
  const { oldPassword, newPassword } = req.body;

  if (!oldPassword || !newPassword) {
    return next(
      new ApiError("Old password and new password are required", 400)
    );
  }

  const user = await prisma.user.findUnique({
    where: { id },
  });

  if (!user) {
    return next(new ApiError("User not found", 404));
  }

  const isMatch = user.password === oldPassword;
  if (!isMatch) {
    return next(new ApiError("Invalid old password", 400));
  }

  const updatedUser = await prisma.user.update({
    where: { id },
    data: { password: newPassword },
  });

  res.status(200).json(updatedUser);
});
