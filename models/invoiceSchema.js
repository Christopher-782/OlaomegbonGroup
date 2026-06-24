const mongoose = require("mongoose");
const invoiceSchema = new mongoose.Schema(
  {
    property_Id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Property",
      default: null,
    },
    invoiceNumber: {
      type: String,
      unique: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ConstructionProject",
    },
    projectName: {
      type: String,
      trim: true,
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
    client: {
      type: String,
      required: true,
      trim: true,
    },
    subject: {
      type: String,
      enum: ["Maintenance", "On-going Construction"],
      default: "Maintenance",
    },
    items: [
      {
        description: {
          type: String,
          required: true,
          trim: true,
        },
        amount: {
          type: Number,
          required: true,
          default: 0,
        },
      },
    ],

    totalAmount: {
      type: Number,
      required: true,
      default: 0,
    },
    totalAmount: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ["paid", "unpaid", "pending"],
      default: "pending",
    },
    dueDate: Date,
    issueDate: {
      type: Date,
      default: Date.now,
    },
    notes: String,
    bankInformation: {
      bankName: String,
      accountName: String,
      accountNumber: String,
      branch: String,
      swiftCode: String,
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("Invoice", invoiceSchema);
