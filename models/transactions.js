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

    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },

    category: {
      type: String,
      enum: [
        "Materials",
        "Labour",
        "Equipment",
        "Consulting",
        "Client Payment",
        "Deposit",
        "Progress Payment",
        "Retention Release",
        "Transfer",
        "Withdrawal",
        "Utilities",
        "Other",
        "Charges",
        "Reimbursement",
        "Reimbursement Withdrawal",
      ],
      default: "Other",
    },

    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      default: null,
    },

    projectName: {
      type: String,
      trim: true,
      default: "",
    },

    propertyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Property",
      default: null,
    },

    propertyName: {
      type: String,
      trim: true,
      default: "",
    },

    amount: {
      type: Number,
      required: true,
      min: 0,
    },

    charges: {
      type: Number,
      default: 0,
      min: 0,
    },

    netAmount: {
      type: Number,
      default: 0,
    },

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

    reference: {
      type: String,
      trim: true,
      default: "",
    },

    loggedBy: {
      type: String,
      required: true,
      trim: true,
    },

    deductedFromReimbursement: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

transactionSchema.pre("save", function () {
  this.amount = Number(this.amount || 0);
  this.charges = Number(this.charges || 0);
  this.netAmount = this.amount - this.charges;
});

transactionSchema.index({ date: -1 });
transactionSchema.index({ companyId: 1 });
transactionSchema.index({ type: 1 });
transactionSchema.index({ category: 1 });
transactionSchema.index({ projectId: 1 });
transactionSchema.index({ propertyId: 1 });

module.exports =
  mongoose.models.Transaction ||
  mongoose.model("Transaction", transactionSchema);
