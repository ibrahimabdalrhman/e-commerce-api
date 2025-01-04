const path = require("path");
const fs = require("fs");
const asyncHandler = require("express-async-handler");
const ApiError = require("./apiError");

const fsDeleteImage = (subPath,url) => {
  const imageFilename = path.basename(url);
  const imagePath = path.join(
    __dirname,
    `../uploads/${subPath}/${imageFilename}`
  );

  // Delete the file from the filesystem
  try {
    if (fs.existsSync(imagePath)) {
      fs.unlinkSync(imagePath); // This will delete the file
    } else {
      return next(new ApiError("Image file not found", 404));
    }
  } catch (err) {
    return next(new ApiError("Error deleting image file", 500));
  }
};

module.exports = fsDeleteImage;
