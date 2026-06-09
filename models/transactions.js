// models/transactions.js
const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema(
  {
    date: { type: Date, required: true, default: Date.now },
    type: {
      type: String,
      enum: ["income", "expense", "reimbursement", "reimbursement-withdrawal"],
      required: true,
    },
    description: { type: String, required: true, trim: true, maxlength: 500 },
    category: {
      type: String,
      enum: [
        "Materials",
        "Labour",
        "Equipment",
        "Consulting",
        "Client Payment",
        "Deposit",
        "Transfer",
        "Withdrawal",
        "Utilities",
        "Other",
        "Charges",
        "Reimbursement",
        "Reimbursement Withdrawal", // ← new
      ],
      default: "Other",
    },
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      default: null,
    },
    amount: { type: Number, required: true, min: 0 },
    charges: { type: Number, default: 0, min: 0 },
    netAmount: { type: Number, default: 0 },
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },
    method: {
      type: String,
      enum: ["Bank Transfer", "Cash", "Cheque", "POS"],
      default: "Bank Transfer",
    },
    reference: { type: String, trim: true, default: "" },
    loggedBy: { type: String, required: true, trim: true },
    // Track if this withdrawal was deducted from reimbursement balance
    deductedFromReimbursement: { type: Boolean, default: false },
  },
  { timestamps: true },
);

transactionSchema.index({ date: -1 });
transactionSchema.index({ companyId: 1 });
transactionSchema.index({ type: 1 });
transactionSchema.index({ category: 1 });

module.exports =
  mongoose.models.Transaction ||
  mongoose.model("Transaction", transactionSchema);
