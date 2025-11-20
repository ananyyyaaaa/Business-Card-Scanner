// const mongoose = require("mongoose");
import mongoose from "mongoose";

const cardSchema = new mongoose.Schema({
  name: { type: String, default: "" },
  email: { type: String, default: "" },
  phone: { type: String, default: "" },
  website: { type: String, default: "" },  
  address: { type: String, default: "" },
  company: { type: String, default: "" },  
  extras: { type: mongoose.Schema.Types.Mixed, default: {} },
  image: { type: String, default: "" },
  imageMime: { type: String, default: "" },
  audio: { type: String, default: "" },
  exhibitionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Exhibition', default: null },
  createdBy: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now },
});


// module.exports = mongoose.models.Card || mongoose.model("Card", cardSchema);
export default mongoose.models.Card || mongoose.model("Card", cardSchema);
