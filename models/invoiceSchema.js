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

    client: {
      type: String,
      required: true,
      trim: true,
    },

    items: [
      {
        description: String,
        quantity: {
          type: Number,
          default: 1,
        },
        unitCost: {
          type: Number,
          default: 0,
        },
        amount: Number,
      },
    ],

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

    bankAccount: {
      bankName: String,
      accountName: String,
      accountNumber: String,
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("Invoice", invoiceSchema);
