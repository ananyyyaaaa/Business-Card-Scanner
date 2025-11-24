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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Trust proxy headers (Render/NGINX) so req.protocol/host reflect external URL
app.set("trust proxy", true);

// ---------------- Mongoose Connection ----------------
connectDB();

// ---------------- Middleware ----------------
app.use(
  cors({
    origin: process.env.FRONTEND_URL, // Allow all origins for now (adjust for production security)
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
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
app.use("/api/cards", cardRoutes);
app.use("/api/exhibitions", exhibitionRoutes);
app.use("/api/users", userRoutes);
app.use("/api/admin", adminRoutes);

// ---------------- Server ----------------
const PORT = process.env.PORT || 5000;
app.listen(PORT, "0.0.0.0", () => console.log(`🚀 Server running on port ${PORT}`));
