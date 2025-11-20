const mongoose = require("mongoose");
const winston = require("winston");

const connectDB = async () => {
  try {
    if (!process.env.MONGO_URI) {
      winston.error("Error: MONGO_URI environment variable is not defined.");
      process.exit(1);
    }
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    winston.info("MongoDB Connected");
  } catch (err) {
    console.error("MongoDB connection error:", err.message);
    winston.error(`MongoDB connection error: ${err.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
