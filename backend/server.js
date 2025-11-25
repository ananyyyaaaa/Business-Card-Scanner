import express from "express";
import cors from "cors";
import dotenv from "dotenv";
dotenv.config();
import connectDB from "./config/db.js";
import cardRoutes from "./routes/cardRoutes.js";
import exhibitionRoutes from "./routes/exhibitionRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log("Created uploads directory");
}

const app = express();

// Trust proxy headers (Render/NGINX) so req.protocol/host reflect external URL
app.set("trust proxy", true);

// ---------------- Mongoose Connection ----------------
// Connect to database - handle errors gracefully
connectDB().catch((err) => {
  console.error('Failed to connect to MongoDB:', err);
  // Don't exit in production - let the server start and retry
  if (process.env.NODE_ENV === 'production') {
    console.error('Server will continue but database operations may fail');
  } else {
    process.exit(1);
  }
});

// ---------------- Middleware ----------------
const allowedOrigins = process.env.FRONTEND_URL 
  ? [process.env.FRONTEND_URL]
  : ['https://yourbusinesscardscanner.onrender.com', 'http://localhost:5173'];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, Postman, etc.)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin) || process.env.NODE_ENV !== 'production') {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);
app.use(express.json());

// ---------------- Static File Serving ----------------
// Note: Since images are now stored as base64 in DB, this is no longer needed for images.
// Keeping for potential future use or other static files.
app.use(
  "/uploads",
  express.static(path.join(__dirname, "uploads"), {
    setHeaders: (res, filePath) => {
      if (filePath.endsWith(".m4a")) {
        res.set("Content-Type", "audio/mp4");
      } else if (filePath.endsWith(".mp3")) {
        res.set("Content-Type", "audio/mpeg");
      } else if (filePath.endsWith(".ogg")) {
        res.set("Content-Type", "audio/ogg");
      } else if (filePath.endsWith(".wav")) {
        res.set("Content-Type", "audio/wav");
      } else if (filePath.endsWith(".mp4")) {
        res.set("Content-Type", "video/mp4");
      }

      res.set("Content-Disposition", "inline");
      res.set("Accept-Ranges", "bytes"); // allows streaming
    },
  })
);

// ---------------- Routes ----------------
// Root route - health check
app.get("/", (req, res) => {
  res.json({
    message: "BizCard API Server",
    status: "running",
    version: "1.0.0",
    endpoints: {
      cards: "/api/cards",
      exhibitions: "/api/exhibitions",
      users: "/api/users",
      admin: "/api/admin",
    },
  });
});

// Health check endpoint for monitoring
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

app.use("/api/cards", cardRoutes);
app.use("/api/exhibitions", exhibitionRoutes);
app.use("/api/users", userRoutes);
app.use("/api/admin", adminRoutes);

// ---------------- Server ----------------
const PORT = process.env.PORT || 5000;

// Error handler for unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Promise Rejection:', err);
});

// Error handler for uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`MongoDB URI: ${process.env.MONGO_URI ? 'Set' : 'Not set'}`);
  console.log(`Frontend URL: ${process.env.FRONTEND_URL || 'Not set'}`);
});
