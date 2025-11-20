import mongoose from 'mongoose';

const exhibitionSchema = new mongoose.Schema({
  name: { type: String, required: true },
  date: { type: Date, required: true },
  time: { type: String, default: '' },
  createdBy: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now },
  duplicatedFrom: { type: mongoose.Schema.Types.ObjectId, ref: 'Exhibition', default: null }
});

export default mongoose.models.Exhibition || mongoose.model('Exhibition', exhibitionSchema);
