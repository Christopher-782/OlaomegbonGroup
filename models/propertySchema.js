const mongoose = require("mongoose");

const propertySchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    address: { type: String },
    location: { type: String },
    description: { type: String },
    status: { type: String, default: "active" },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Property", propertySchema);
