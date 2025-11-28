import Exhibition from "../models/Exhibition.js";
import Card from "../models/Card.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const createExhibition = async (req, res) => {
  try {
    const {
      name,
      startTime,
      endTime,
      timezone,
      country,
      locationType,
      venue,
      organizationDetails,
      organizerContactPerson,
      organizerEmail,
      organizerMobile,
      createdBy
    } = req.body;

    if (!name || !startTime || !endTime || !timezone || !country) {
      return res.status(400).json({ success: false, message: 'All required fields must be provided' });
    }

    const ex = await Exhibition.create({
      name,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      timezone,
      country,
      locationType: locationType || '',
      venue: venue || '',
      organizationDetails: organizationDetails || '',
      organizerContactPerson: organizerContactPerson || '',
      organizerEmail: organizerEmail || '',
      organizerMobile: organizerMobile || '',
      createdBy: createdBy || '',
    });
    return res.status(201).json({ success: true, data: ex });
  } catch (err) {
    console.error('Create exhibition error', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const listExhibitions = async (req, res) => {
  try {
    const items = await Exhibition.find().sort({ startTime: -1, createdAt: -1 });
    return res.json({ success: true, data: items });
  } catch (err) {
    console.error('List exhibitions error', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const duplicateExhibition = async (req, res) => {
  try {
    const { id } = req.params;
    const original = await Exhibition.findById(id);
    if (!original) return res.status(404).json({ success: false, message: 'Exhibition not found' });
    const dup = await Exhibition.create({
      name: original.name + ' (copy)',
      startTime: original.startTime,
      endTime: original.endTime,
      timezone: original.timezone,
      country: original.country,
      locationType: original.locationType,
      venue: original.venue,
      organizationDetails: original.organizationDetails,
      organizerContactPerson: original.organizerContactPerson,
      organizerEmail: original.organizerEmail,
      organizerMobile: original.organizerMobile,
      createdBy: req.body.createdBy || original.createdBy || '',
      duplicatedFrom: original._id,
    });
    return res.status(201).json({ success: true, data: dup });
  } catch (err) {
    console.error('Duplicate exhibition error', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const getLiveExhibitions = async (_req, res) => {
  try {
    const now = new Date();
    const items = await Exhibition.find({
      startTime: { $lte: now },
      endTime: { $gte: now },
    }).sort({ createdAt: -1 });
    return res.json({ success: true, data: items });
  } catch (err) {
    console.error('Get live exhibitions error', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const getExhibitionCards = async (req, res) => {
  try {
    const { id } = req.params;
    const cards = await Card.find({ exhibitionId: id }).sort({ createdAt: -1 });
    return res.json({ success: true, data: cards });
  } catch (err) {
    console.error('Get exhibition cards error', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const deleteExhibition = async (req, res) => {
  try {
    const { id } = req.params;
    const ex = await Exhibition.findByIdAndDelete(id);
    if (!ex) return res.status(404).json({ success: false, message: 'Exhibition not found' });
    // Remove associated cards to avoid orphaned data
    await Card.deleteMany({ exhibitionId: id });
    return res.json({ success: true, message: 'Exhibition and its cards deleted' });
  } catch (err) {
    console.error('Delete exhibition error', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const getExhibitionChecklist = async (req, res) => {
  try {
    const { id } = req.params;
    const exhibition = await Exhibition.findById(id);
    if (!exhibition) {
      return res.status(404).json({ success: false, message: 'Exhibition not found' });
    }
    return res.json({ success: true, data: exhibition });
  } catch (err) {
    console.error('Get exhibition checklist error', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const updateExhibitionChecklist = async (req, res) => {
  try {
    const { id } = req.params;
    const exhibition = await Exhibition.findById(id);
    if (!exhibition) {
      return res.status(404).json({ success: false, message: 'Exhibition not found' });
    }

    const updateData = {};

    // Process all text fields from FormData
    const textFields = [
      'standNumber', 'standType', 'dimensions', 'portalLink', 'portalId', 'portalPasscode',
      'accommodationDetails', 'ticketsDetails',
      'contractorCompany', 'contractorPerson', 'contractorEmail', 'contractorMobile',
      'contractorQuote', 'contractorAdvance', 'contractorBalance',
      'samplesPallet', 'samplesWeight', 'samplesDimensions',
      'logisticsCompany', 'logisticsContact', 'logisticsEmail', 'logisticsMobile',
      'logisticsQuote', 'logisticsPayment', 'logisticsAwb', 'logisticsSamples'
    ];

    textFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field] || '';
      }
    });

    // Handle exhibitors array
    if (req.body.exhibitors) {
      try {
        const exhibitors = typeof req.body.exhibitors === 'string' 
          ? JSON.parse(req.body.exhibitors) 
          : req.body.exhibitors;
        if (Array.isArray(exhibitors) && exhibitors.length > 0) {
          updateData.exhibitors = exhibitors;
        }
      } catch (e) {
        console.warn('Failed to parse exhibitors:', e.message);
      }
    }

    // Process PDF files if uploaded
    const allFiles = Object.values(req.files || {}).flat();
    const pdfFiles = allFiles.filter(f => f.mimetype === 'application/pdf');

    for (const pdfFile of pdfFiles) {
      const pdfPath = path.join(__dirname, "..", "uploads", pdfFile.filename);
      if (fs.existsSync(pdfPath)) {
        const buffer = fs.readFileSync(pdfPath);
        const base64Pdf = `data:${pdfFile.mimetype};base64,${buffer.toString("base64")}`;
        
        // Map file field names to database fields
        if (pdfFile.fieldname === 'perfInvoice') {
          updateData.perfInvoice = base64Pdf;
        } else if (pdfFile.fieldname === 'paymentProof') {
          updateData.paymentProof = base64Pdf;
        } else if (pdfFile.fieldname === 'standDesign') {
          updateData.standDesign = base64Pdf;
        } else if (pdfFile.fieldname === 'samplesPackingList') {
          updateData.samplesPackingList = base64Pdf;
        }
        
        // Clean up temp file
        fs.unlink(pdfPath, (err) => {
          if (err && err.code !== 'ENOENT') {
            console.warn('Failed to remove temp PDF file:', pdfPath, err.message);
          }
        });
      }
    }

    // Keep existing PDFs if no new file was uploaded
    if (!updateData.perfInvoice && exhibition.perfInvoice) {
      updateData.perfInvoice = exhibition.perfInvoice;
    }
    if (!updateData.paymentProof && exhibition.paymentProof) {
      updateData.paymentProof = exhibition.paymentProof;
    }
    if (!updateData.standDesign && exhibition.standDesign) {
      updateData.standDesign = exhibition.standDesign;
    }
    if (!updateData.samplesPackingList && exhibition.samplesPackingList) {
      updateData.samplesPackingList = exhibition.samplesPackingList;
    }

    // Convert string booleans to actual booleans
    const booleanFields = [
      'paymentChecklist', 'badgeChecklist', 'accommodationChecklist',
      'posterChecklist', 'samplesDispatchChecklist'
    ];
    booleanFields.forEach(field => {
      if (req.body[field] !== undefined) {
        const value = req.body[field];
        updateData[field] = value === 'true' || value === true || value === '1';
      } else {
        // Keep existing value if not provided
        updateData[field] = exhibition[field] || false;
      }
    });

    // Update the exhibition
    const updated = await Exhibition.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    return res.json({ success: true, data: updated });
  } catch (err) {
    console.error('Update exhibition checklist error', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};
