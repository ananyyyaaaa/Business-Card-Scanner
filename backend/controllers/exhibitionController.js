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
      'logisticsQuote', 'logisticsPayment', 'logisticsAwb', 'logisticsSamples',
      'remarks', 'totalPayment'
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


    // Handle pallets array
    if (req.body.pallets) {
      try {
        const pallets = typeof req.body.pallets === 'string'
          ? JSON.parse(req.body.pallets)
          : req.body.pallets;
        if (Array.isArray(pallets)) {
          updateData.pallets = pallets;
        }
      } catch (e) {
        console.warn('Failed to parse pallets:', e.message);
      }
    }

    // Process files if uploaded
    const allFiles = Object.values(req.files || {}).flat();
    const allowedMimeTypes = ['application/pdf', 'image/jpeg', 'image/jpg'];
    const processedFiles = allFiles.filter(f => allowedMimeTypes.includes(f.mimetype));
    const newPayslips = [];
    const newTicketFiles = [];

    for (const file of processedFiles) {
      const filePath = path.join(__dirname, "..", "uploads", file.filename);
      if (fs.existsSync(filePath)) {
        const buffer = fs.readFileSync(filePath);
        const base64File = `data:${file.mimetype};base64,${buffer.toString("base64")}`;

        // Map file field names to database fields
        if (file.fieldname === 'perfInvoice') {
          updateData.perfInvoice = base64File;
        } else if (file.fieldname === 'payslip') {
          newPayslips.push(base64File);
        } else if (file.fieldname === 'ticketFile') {
          newTicketFiles.push(base64File);
        } else if (file.fieldname === 'standDesign') {
          updateData.standDesign = base64File;
        } else if (file.fieldname === 'samplesPackingList') {
          updateData.samplesPackingList = base64File;
        } else if (file.fieldname === 'insuranceFile') {
          updateData.insuranceFile = base64File;
        }

        // Clean up temp file
        fs.unlink(filePath, (err) => {
          if (err && err.code !== 'ENOENT') {
            console.warn('Failed to remove temp file:', filePath, err.message);
          }
        });
      }
    }

    // Keep existing PDFs if no new file was uploaded
    if (!updateData.perfInvoice && exhibition.perfInvoice) {
      updateData.perfInvoice = exhibition.perfInvoice;
    }
    // Handle structured deposits
    if (req.body.deposits) {
      try {
        let deposits = typeof req.body.deposits === 'string'
          ? JSON.parse(req.body.deposits)
          : req.body.deposits;

        if (Array.isArray(deposits)) {
          // Assign new payslips to entries missing them
          let fileIdx = 0;
          deposits = deposits.map(dep => {
            if (!dep.payslip && fileIdx < newPayslips.length) {
              return { ...dep, payslip: newPayslips[fileIdx++] };
            }
            return dep;
          });
          updateData.deposits = deposits;
        }
      } catch (e) {
        console.warn('Failed to parse deposits:', e.message);
        updateData.deposits = exhibition.deposits || [];
      }
    } else {
      updateData.deposits = exhibition.deposits || [];
    }

    // Handle structured tickets
    if (req.body.tickets) {
      try {
        let tickets = typeof req.body.tickets === 'string'
          ? JSON.parse(req.body.tickets)
          : req.body.tickets;

        if (Array.isArray(tickets)) {
          // Assign new ticket files to entries missing them
          let fileIdx = 0;
          tickets = tickets.map(t => {
            if (!t.file && fileIdx < newTicketFiles.length) {
              return { ...t, file: newTicketFiles[fileIdx++] };
            }
            return t;
          });
          updateData.tickets = tickets;
        }
      } catch (e) {
        console.warn('Failed to parse tickets:', e.message);
        updateData.tickets = exhibition.tickets || [];
      }
    } else {
      updateData.tickets = exhibition.tickets || [];
    }
    if (!updateData.standDesign && exhibition.standDesign) {
      updateData.standDesign = exhibition.standDesign;
    }
    if (!updateData.samplesPackingList && exhibition.samplesPackingList) {
      updateData.samplesPackingList = exhibition.samplesPackingList;
    }
    if (!updateData.insuranceFile && exhibition.insuranceFile) {
      updateData.insuranceFile = exhibition.insuranceFile;
    }

    // Convert string booleans to actual booleans
    const booleanFields = [
      'paymentChecklist', 'badgeChecklist', 'accommodationChecklist',
      'posterChecklist', 'samplesDispatchChecklist', 'insuranceChecklist'
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

export const updateExhibition = async (req, res) => {
  try {
    const { id } = req.params;
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

    const exhibition = await Exhibition.findById(id);
    if (!exhibition) {
      return res.status(404).json({ success: false, message: 'Exhibition not found' });
    }

    const updateData = {};
    if (name) updateData.name = name;
    if (startTime) updateData.startTime = new Date(startTime);
    if (endTime) updateData.endTime = new Date(endTime);
    if (timezone) updateData.timezone = timezone;
    if (country) updateData.country = country;
    if (locationType !== undefined) updateData.locationType = locationType;
    if (venue !== undefined) updateData.venue = venue;
    if (organizationDetails !== undefined) updateData.organizationDetails = organizationDetails;
    if (organizerContactPerson !== undefined) updateData.organizerContactPerson = organizerContactPerson;
    if (organizerEmail !== undefined) updateData.organizerEmail = organizerEmail;
    if (organizerMobile !== undefined) updateData.organizerMobile = organizerMobile;
    if (createdBy !== undefined) updateData.createdBy = createdBy;

    const updated = await Exhibition.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    return res.json({ success: true, data: updated });
  } catch (err) {
    console.error('Update exhibition error', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};
