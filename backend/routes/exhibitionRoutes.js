import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { createExhibition, listExhibitions, duplicateExhibition, getLiveExhibitions, getExhibitionCards, deleteExhibition, getExhibitionChecklist, updateExhibitionChecklist, updateExhibition } from '../controllers/exhibitionController.js';
import { protect } from '../middleware/auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Configure multer for PDF uploads
const uploadsDir = path.join(__dirname, "..", "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + "-" + uniqueSuffix + ext);
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'), false);
    }
  }
});

router.post('/', protect, createExhibition);
router.put('/:id', protect, updateExhibition);
router.get('/', protect, listExhibitions);
router.get('/live/today', protect, getLiveExhibitions);
router.post('/:id/duplicate', protect, duplicateExhibition);
router.get('/:id/checklist', protect, getExhibitionChecklist);
router.put('/:id/checklist', protect, upload.fields([
  { name: 'perfInvoice', maxCount: 1 },
  { name: 'payslip', maxCount: 4 },
  { name: 'standDesign', maxCount: 1 },
  { name: 'samplesPackingList', maxCount: 1 },
  { name: 'insuranceFile', maxCount: 1 }
]), updateExhibitionChecklist);
router.get('/:id/cards', protect, getExhibitionCards);
router.delete('/:id', protect, deleteExhibition);

export default router;
