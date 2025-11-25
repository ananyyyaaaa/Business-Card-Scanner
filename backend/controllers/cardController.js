// const { createWorker } = require("tesseract.js");
import Card from "../models/Card.js";
import Exhibition from '../models/Exhibition.js';
import path from "path";
import fs from "fs";
import runOCR from "../utils/ocr.js";
import { parseOCRText } from "../utils/parserService.js";

// const { parseOCRText } = require("../utils/parseOCR");

import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


// ---------------- OCR Extraction Route ----------------

export const extractOCR = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: "No image uploaded",
      });
    }

    const imagePath = req.file.path;
    console.log("Starting OCR for:", imagePath);

    // Run OCR using optimized function
    const extractedText = await runOCR(imagePath);
    console.log("Extracted Text:", extractedText);

    // Parse fields
    const parsedData = parseOCRText(extractedText);

    // Cleanup temp file
    if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);

    return res.json({
      success: true,
      extractedText,
      fields: {
        name: parsedData.name || "",
        email: parsedData.email || "",
        phone: parsedData.phone || "",
        website: parsedData.website || "",
        company: parsedData.company || "",
        address: parsedData.address || "",
        extras: parsedData.extras || {}
      }

    });

  } catch (err) {
    console.error("OCR error:", err.message);
    return res.status(500).json({
      success: false,
      error: "OCR failed",
      details: err.message
    });
  }
};


// ---------------- Manual save route ----------------
export const saveEntry = async (req, res) => {
  try {
    const exhibitionId = req.body.exhibitionId ?? req.body.fields?.exhibitionId;
    if (exhibitionId) {
      const exhibition = await Exhibition.findById(exhibitionId);
      if (!exhibition) return res.status(404).json({ success: false, message: 'Exhibition not found' });
      const now = new Date();
      if (now < exhibition.startTime || now > exhibition.endTime) {
        return res.status(403).json({ success: false, message: 'This exhibition is not currently live. Cannot save new cards.' });
      }
    }

    console.log("=== Save Entry Request ===");
    console.log("Files received:", req.files);
    console.log("Body:", req.body);

    let fields = {};

    // Parse fields JSON (from frontend)
    if (req.body.fields) {
      try {
        fields = JSON.parse(req.body.fields);
      } catch (e) {
        console.warn("Invalid JSON in fields");
      }
    }

    // Direct fields override JSON fields (optional)
    fields = {
      name: req.body.name ?? fields.name ?? "",
      email: req.body.email ?? fields.email ?? "",
      phone: req.body.phone ?? fields.phone ?? "",
      address: req.body.address ?? fields.address ?? "",
      website: req.body.website ?? fields.website ?? "",
      company: req.body.company ?? fields.company ?? "",
      extras: req.body.extras ?? fields.extras ?? {}
    };

    console.log("Final parsed fields:", fields);

    // ---------------- FILE HANDLING ----------------
    let image = "";
    let imageMime = "";
    let audio = "";

    const allFiles = Object.values(req.files || {}).flat();

    const imgFile = allFiles.find(f => f.mimetype.startsWith("image/"));
    const audFile = allFiles.find(f => f.mimetype.startsWith("audio/"));

    if (imgFile) {
      const imgPath = path.join(__dirname, "..", "uploads", imgFile.filename);
      const buffer = fs.readFileSync(imgPath);
      imageMime = imgFile.mimetype;
      image = `data:${imageMime};base64,${buffer.toString("base64")}`;
      fs.unlinkSync(imgPath);
    }

    if (audFile) {
      const audPath = path.join(__dirname, "..", "uploads", audFile.filename);
      const buffer = fs.readFileSync(audPath);
      audio = `data:${audFile.mimetype};base64,${buffer.toString("base64")}`;
      fs.unlinkSync(audPath);
    }

    // Fallback in case frontend sends base64 directly
    if (!image && fields.image) image = fields.image;
    if (!audio && fields.audio) audio = fields.audio;

    // ---------------- SAVE TO DB ----------------
    const card = await Card.create({
      ...fields,
      exhibitionId: req.body.exhibitionId ?? fields.exhibitionId ?? null,
      createdBy: req.body.createdBy ?? fields.createdBy ?? '',
      image,
      imageMime,
      audio
    });

    return res.status(201).json({ success: true, data: card });

  } catch (error) {
    console.error("Save failed:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};


// ---------------- Fetch all saved cards ----------------
export const getAllCards = async (_req, res) => {
  try {
    const { exhibitionId } = _req.query || {};
    const filter = {};
    if (exhibitionId) filter.exhibitionId = exhibitionId;
    const cards = await Card.find(filter).sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: cards });
  } catch (error) {
    console.error("Fetch failed:", error);
    res.status(500).json({ success: false, message: "Failed to fetch cards", error: error.message });
  }
};

export const updateCardDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const { fields = {} } = req.body || {};

    if (!id) {
      return res.status(400).json({ success: false, message: 'Card ID is required' });
    }

    const allowedFields = ['name', 'email', 'phone', 'address', 'website', 'company', 'extras'];
    const update = {};

    allowedFields.forEach((field) => {
      if (fields[field] !== undefined) {
        update[field] = fields[field];
      }
    });

    if (Object.keys(update).length === 0) {
      return res.status(400).json({ success: false, message: 'No valid fields provided to update' });
    }

    const updated = await Card.findByIdAndUpdate(id, update, { new: true });
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Card not found' });
    }

    return res.json({ success: true, data: updated });
  } catch (error) {
    console.error('Update card error:', error);
    res.status(500).json({ success: false, message: 'Failed to update card', error: error.message });
  }
};
