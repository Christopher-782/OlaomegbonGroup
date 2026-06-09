const mongoose = require("mongoose");

const companySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, unique: true },
    address: { type: String, default: "" },
    contactPerson: { type: String, default: "" },
    phone: { type: String, default: "" },
    email: { type: String, default: "" },
    registrationNumber: { type: String, default: "" },
    notes: { type: String, default: "" },
  },
  { timestamps: true },
);

module.exports =
  mongoose.models.Company || mongoose.model("Company", companySchema);
