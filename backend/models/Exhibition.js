import mongoose from 'mongoose';

const exhibitionSchema = new mongoose.Schema({
  name: { type: String, required: true },
  startTime: { type: Date, required: true },
  endTime: { type: Date, required: true },
  timezone: { type: String, required: true },
  country: { type: String, required: true },
  createdBy: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now },
  duplicatedFrom: { type: mongoose.Schema.Types.ObjectId, ref: 'Exhibition', default: null }
});

export default mongoose.models.Exhibition || mongoose.model('Exhibition', exhibitionSchema);
