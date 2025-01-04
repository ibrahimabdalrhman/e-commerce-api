const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const xss = require("xss-clean");
const hpp = require("hpp");
const rateLimit = require("express-rate-limit");
const dotenv = require("dotenv");
const ApiError = require("./utils/apiError");
const errorMiddleware = require("./middlewares/errorMiddleware");

dotenv.config();

const app = express();

// Security Middlewares
app.use(helmet()); // Set security headers
app.use(cors()); // Enable CORS
app.use(xss()); // Prevent XSS attacks
app.use(hpp()); // Prevent HTTP parameter pollution

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again later.",
});
app.use("/api", limiter);

// Body Parsing and Static Files
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static("uploads"));

// Routes
const userRoute = require("./routes/userRoute");
const categoryRoute = require("./routes/categoryRoute");
const productRoute = require("./routes/productRoute");
const cartRoute = require("./routes/cartRoute");
const orderRoute = require("./routes/orderRoute");
const authRoute = require("./routes/authRoute");
const reviewsRoute = require("./routes/reviewRoute");

app.use("/api/users", userRoute);
app.use("/api/categories", categoryRoute);
app.use("/api/products", productRoute);
app.use("/api/cart", cartRoute);
app.use("/api/orders", orderRoute);
app.use("/api/auth", authRoute);
app.use("/api/reviews", reviewsRoute);

// Handle Unhandled Routes
app.all("*", (req, res, next) => {
  next(new ApiError("Can't find this page", 404));
});

// Global Error Handler
app.use(errorMiddleware);

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on port ${port} in ${process.env.NODE_ENV} mode`);
});
