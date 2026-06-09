const mongoose = require("mongoose");

const expenseSchema = new mongoose.Schema(
  {
    date: { type: Date, required: true, default: Date.now },
    vendor: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true, maxlength: 500 },
    category: {
      type: String,
      enum: [
        "Materials",
        "Labour",
        "Equipment",
        "Transport",
        "Utilities",
        "Subcontractor",
        "Deposit",
        "Transfer",
        "Withdrawal",
        "Other",
      ],
      default: "Other",
    },
    amount: { type: Number, required: true, min: 0 },
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      default: null,
    }, // optional link
    method: {
      type: String,
      enum: ["Bank Transfer", "Cash", "Cheque", "POS"],
      default: "Bank Transfer",
    },
    reference: { type: String, trim: true, default: "" },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    loggedBy: { type: String, required: true, trim: true },
  },
  { timestamps: true },
);

expenseSchema.index({ date: -1 });
expenseSchema.index({ companyId: 1 });
expenseSchema.index({ status: 1 });
expenseSchema.index({ vendor: 1 });

module.exports =
  mongoose.models.Expense || mongoose.model("Expense", expenseSchema);
