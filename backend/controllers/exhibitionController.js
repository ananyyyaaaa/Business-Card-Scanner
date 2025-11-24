import Exhibition from "../models/Exhibition.js";
import Card from "../models/Card.js";

export const createExhibition = async (req, res) => {
  try {
    const { name, startTime, endTime, timezone, country, createdBy } = req.body;
    if (!name || !startTime || !endTime || !timezone || !country) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }
    const ex = await Exhibition.create({
      name,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      timezone,
      country,
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
