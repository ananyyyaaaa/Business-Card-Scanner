import mongoose from "mongoose";
import winston from "winston";

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/bizcard'; // Fallback for local dev
    if (!mongoUri) {
      winston.error("Error: MONGO_URI environment variable is not defined.");
      process.exit(1);
    }
    await mongoose.connect(mongoUri, {
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

export default connectDB;
