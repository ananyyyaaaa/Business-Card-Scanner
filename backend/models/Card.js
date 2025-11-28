// const mongoose = require("mongoose");
import mongoose from "mongoose";

const cardSchema = new mongoose.Schema({
  companyName: { type: String, default: "" },
  contactPerson: { type: String, default: "" },
  designation: { type: String, default: "" },
  mobile: { type: String, default: "" },
  email: { type: String, default: "" },
  address: { type: String, default: "" },
  website: { type: String, default: "" },
  typeOfVisitor: { type: String, default: "" }, // ENDUSER, DEALER, CONSULTANT, DOMESTIC, INTERNATIONAL
  interestedProducts: { type: [String], default: [] }, // Array of selected products
  remarks: { type: String, default: "" },

  images: { type: [String], default: [] }, // Array of base64 images (up to 5)
  audio: { type: String, default: "" },

  exhibitionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Exhibition', default: null },
  createdBy: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now },
});


// module.exports = mongoose.models.Card || mongoose.model("Card", cardSchema);
export default mongoose.models.Card || mongoose.model("Card", cardSchema);
