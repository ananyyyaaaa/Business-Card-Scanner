import mongoose from 'mongoose';

const adminSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  name: {
    type: String,
    default: 'Admin',
  },
  password: {
    type: String,
    required: true,
  },
}, { timestamps: true });

export default mongoose.model('Admin', adminSchema);

