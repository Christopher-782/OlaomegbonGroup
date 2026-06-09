const mongoose = require("mongoose");

const reimbursementAccountSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },
    balance: { type: Number, default: 0, min: 0 },
    totalReceived: { type: Number, default: 0, min: 0 },
    totalWithdrawn: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true },
);

module.exports =
  mongoose.models.ReimbursementAccount ||
  mongoose.model("ReimbursementAccount", reimbursementAccountSchema);
