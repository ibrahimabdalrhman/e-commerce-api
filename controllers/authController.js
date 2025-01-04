const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const asyncHandler = require("express-async-handler");
const ApiError = require("../utils/apiError");
const jwt = require("jsonwebtoken");
const twilio = require("twilio");

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

exports.create = asyncHandler(async (req, res, next) => {
  const data = req.body;

  // Check if email or mobileNumber already exists
  const existingUser = await prisma.user.findFirst({
    where: { mobileNumber: data.mobileNumber },
  });

  if (existingUser) {
    return next(new ApiError("User with mobile number already exists", 400));
  }

  const newUser = await prisma.user.create({ data });
  const generateOTP = () =>
    Math.floor(100000 + Math.random() * 900000).toString();
  const otp = await generateOTP();
  const updatedUser = await prisma.user.update({
    where: { mobileNumber: data.mobileNumber },
    data: { otp, otpExpiresAt: new Date(Date.now() + 5 * 60 * 1000) },
  });

  const message = await client.messages.create({
    body: `use this code to signup ${otp}`,
    from: "(231) 758-5529",
    to: data.mobileNumber,
  });

  res.status(201).json({ msg: "OTP sent successfully", data: newUser });
});

exports.verifyUser = asyncHandler(async (req, res, next) => {
  const { mobileNumber, otp } = req.body;

  if (!mobileNumber || !otp) {
    return next(new ApiError("Mobile number and OTP are required", 400));
  }

  const user = await prisma.user.findUnique({
    where: { mobileNumber },
  });
  if (!user) {
    return next(new ApiError("User not found", 404));
  }

  if (user.otp !== otp) {
    return next(new ApiError("Invalid OTP", 400));
  }

  if (new Date() > user.otpExpiresAt) {
    return next(new ApiError("OTP has expired", 400));
  }
  await prisma.user.update({
    where: { mobileNumber },
    data: { otp: null, otpExpiresAt: null, IsVerified: true },
  });

  res.status(200).json({ msg: "User verified successfully" });
});

exports.sendOtp = asyncHandler(async (req, res, next) => {
  const { mobileNumber } = req.body;

  if (!mobileNumber) {
    return next(new ApiError("Mobile number is required", 400));
  }

  const user = await prisma.user.findUnique({
    where: { mobileNumber },
  });
  if (!user) {
    return next(new ApiError("User not found", 404));
  }

  const generateOTP = () =>
    Math.floor(100000 + Math.random() * 900000).toString();
  const otp = await generateOTP();
  await prisma.user.update({
    where: { mobileNumber },
    data: { otp, otpExpiresAt: new Date(Date.now() + 5 * 60 * 1000) },
  });

  const message = await client.messages.create({
    body: `use this code to login ${otp}`,
    from: "(231) 758-5529",
    to: mobileNumber,
  });

  res.status(200).json({ msg: "OTP sent successfully" });
});

exports.login = asyncHandler(async (req, res, next) => {
  const { mobileNumber, otp } = req.body;

  if (!mobileNumber || !otp) {
    return next(new ApiError("Mobile number and OTP are required", 400));
  }

  const user = await prisma.user.findUnique({
    where: { mobileNumber },
  });
  if (!user) {
    return next(new ApiError("User not found", 404));
  }

  if (user.otp !== otp) {
    return next(new ApiError("Invalid OTP", 400));
  }

  if (new Date() > user.otpExpiresAt) {
    return next(new ApiError("OTP has expired", 400));
  }

  // Generate JWT token
  const token = jwt.sign(
    { id: user.id, mobileNumber, type: user.type },
    process.env.JWT_SECRET,
    { expiresIn: "365d" }
  );

  await prisma.user.update({
    where: { mobileNumber },
    data: { otp: null, otpExpiresAt: null },
  });

  res.status(200).json({ token });
});
