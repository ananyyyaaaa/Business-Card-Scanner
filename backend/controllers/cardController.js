// const { createWorker } = require("tesseract.js");
import Card from "../models/Card.js";
import Exhibition from '../models/Exhibition.js';
import path from "path";
import fs from "fs";
// import runOCR from "../utils/ocr.js";
import { parseBusinessCardImage } from "../utils/geminiClient.js";
import { parseOCRText } from "../utils/parserService.js";

// const { parseOCRText } = require("../utils/parseOCR");

import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


const safeUnlink = (filePath) => {
  fs.unlink(filePath, (err) => {
    if (err && err.code !== 'ENOENT') {
      console.warn('Failed to remove temp file:', filePath, err.message);
    }
  });
};

const toStandardFields = (src = {}) => ({
  companyName: src.companyName || src.company || "",
  contactPerson: src.contactPerson || src.name || "",
  designation: src.designation || src.title || "",
  email: src.email || "",
  mobile: src.mobile || src.phone || "",
  website: src.website || "",
  address: src.address || "",
  typeOfVisitor: src.typeOfVisitor || "",
  interestedProducts: Array.isArray(src.interestedProducts) ? src.interestedProducts : [],
  remarks: src.remarks || (Array.isArray(src.interestedProducts) ? src.interestedProducts.join(", ") : ""),
});

const hydrateMissingFields = (primary, fallback) => {
  const merged = { ...primary };
  Object.keys(fallback).forEach((key) => {
    const value = merged[key];
    if (
      (value === undefined || value === null || value === "" || (Array.isArray(value) && !value.length)) &&
      fallback[key]
    ) {
      merged[key] = fallback[key];
    }
  });
  return merged;
};

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
    console.log("Sending image to Gemini:", imagePath);

    const imageBuffer = fs.readFileSync(imagePath);
    const base64Image = imageBuffer.toString("base64");
    const mimeType = req.file.mimetype || "image/jpeg";

    const { fields, rawText } = await parseBusinessCardImage(base64Image, mimeType);
    let normalizedFields = toStandardFields(fields);

    if (rawText) {
      const needsFallback = [
        normalizedFields.companyName,
        normalizedFields.contactPerson,
        normalizedFields.mobile,
        normalizedFields.address,
      ].some((v) => !v);

      if (needsFallback) {
        try {
          const heuristic = await parseOCRText(rawText);
          const heuristicFields = toStandardFields(heuristic);
          normalizedFields = hydrateMissingFields(normalizedFields, heuristicFields);
        } catch (fallbackError) {
          console.warn("Heuristic fallback failed:", fallbackError.message);
        }
      }
    }

    if (fs.existsSync(imagePath)) safeUnlink(imagePath);

    return res.json({
      success: true,
      extractedText: rawText || "",
      fields: normalizedFields
    });

  } catch (err) {
    console.error("OCR error:", err.message);
    if (req.file?.path) {
      safeUnlink(req.file.path);
    }
    return res.status(500).json({
      success: false,
      error: "LLM extraction failed",
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

    // New fields structure
    let interestedProducts = fields.interestedProducts || [];
    if (req.body.interestedProducts !== undefined) {
      if (Array.isArray(req.body.interestedProducts)) {
        interestedProducts = req.body.interestedProducts;
      } else if (typeof req.body.interestedProducts === 'string' && req.body.interestedProducts.trim()) {
        try {
          interestedProducts = JSON.parse(req.body.interestedProducts);
          if (!Array.isArray(interestedProducts)) {
            interestedProducts = interestedProducts ? [String(interestedProducts)] : [];
          }
        } catch (e) {
          interestedProducts = req.body.interestedProducts
            .split(',')
            .map((item) => item.trim())
            .filter(Boolean);
        }
      } else {
        interestedProducts = [];
      }
    }

    const newFields = {
      companyName: req.body.companyName ?? fields.companyName ?? "",
      contactPerson: req.body.contactPerson ?? fields.contactPerson ?? "",
      designation: req.body.designation ?? fields.designation ?? "",
      mobile: req.body.mobile ?? fields.mobile ?? "",
      email: req.body.email ?? fields.email ?? "",
      address: req.body.address ?? fields.address ?? "",
      website: req.body.website ?? fields.website ?? "",
      typeOfVisitor: req.body.typeOfVisitor ?? fields.typeOfVisitor ?? "",
      interestedProducts,
      remarks: req.body.remarks ?? fields.remarks ?? "",
    };
    fields = { ...newFields };
    console.log("Final parsed fields:", fields);

    // ---------------- FILE HANDLING ----------------
    let images = [];
    let audio = "";

    const allFiles = Object.values(req.files || {}).flat();

    // Handle multiple images (up to 5)
    const imgFiles = allFiles.filter(f => f.mimetype.startsWith("image/")).slice(0, 5);
    
    for (const imgFile of imgFiles) {
      const imgPath = path.join(__dirname, "..", "uploads", imgFile.filename);
      const buffer = fs.readFileSync(imgPath);
      const imageMime = imgFile.mimetype;
      const image = `data:${imageMime};base64,${buffer.toString("base64")}`;
      images.push(image);
      safeUnlink(imgPath);
    }

    // Handle audio
    const audFile = allFiles.find(f => f.mimetype.startsWith("audio/"));
    if (audFile) {
      const audPath = path.join(__dirname, "..", "uploads", audFile.filename);
      const buffer = fs.readFileSync(audPath);
      audio = `data:${audFile.mimetype};base64,${buffer.toString("base64")}`;
      safeUnlink(audPath);
    }

    // Fallback in case frontend sends base64 directly
    if (images.length === 0 && fields.images && Array.isArray(fields.images)) {
      images = fields.images;
    }
    if (!audio && fields.audio) audio = fields.audio;

    // ---------------- SAVE TO DB ----------------
    const card = await Card.create({
      ...fields,
      exhibitionId: req.body.exhibitionId ?? fields.exhibitionId ?? null,
      createdBy: req.body.createdBy ?? fields.createdBy ?? '',
      images,
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

    const allowedFields = [
      'companyName', 'contactPerson', 'designation', 'mobile', 'email', 
      'address', 'website', 'typeOfVisitor', 'interestedProducts', 'remarks'
    ];
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
