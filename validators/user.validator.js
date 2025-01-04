const { body, validationResult } = require("express-validator");
const prisma = require("@prisma/client").PrismaClient;
const prismaClient = new prisma();
const { validate } = require("../middlewares/validationMiddleware");

// Validation middleware for user creation
exports.validateCreateUser = [
  // Type validation
  body("type")
    .isIn(["CAFE", "RESTURANT", "CUSTOMER", "ADMIN"])
    .withMessage(
      "Type must be one of 'CAFE', 'RESTURANT', 'CUSTOMER', 'ADMIN'."
    ),

  // Full name validation
  body("fullName")
    .isLength({ min: 3, max: 100 })
    .withMessage("Full name must be between 3 and 100 characters."),

  // Email validation
  body("email")
    .isEmail()
    .withMessage("Email must be a valid email address.")
    .custom(async (value) => {
      // Check if the email is already registered
      const user = await prismaClient.user.findUnique({
        where: { email: value },
      });
      if (user) {
        throw new Error("Email is already registered.");
      }

      return true;
    }),

  // Mobile number validation
  body("mobileNumber")
    .matches(/^\+?\d{10,15}$/)
    .withMessage(
      "Mobile number must be a valid phone number with 10 to 15 digits."
    ),

  // Password validation
  body("password")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters long."),

  // Address validation
  body("address")
    .isLength({ min: 5 })
    .withMessage("Address must be at least 5 characters long."),

  // City validation
  body("city")
    .isLength({ min: 2 })
    .withMessage("City must be at least 2 characters long."),

  // Profile image URL validation (optional)
  body("profileImage")
    .optional()
    .isURL()
    .withMessage("Profile image must be a valid URL."),
  validate,
];

// Validation for sending OTP
exports.validateSendOtp = [
  body("mobileNumber").notEmpty().withMessage("Mobile number is required."),
  validate,
];

// Validation for verifying OTP
exports.validateVerifyOtp = [
  body("mobileNumber").notEmpty().withMessage("Mobile number is required."),
  body("otp").notEmpty().withMessage("OTP is required."),
  validate,
];
