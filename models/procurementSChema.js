const mongoose = require("mongoose");

const procurementSchema = new mongoose.Schema(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ConstructionProject",
      required: true,
    },

    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    title: {
      type: String,
      required: true,
    },

    // Vendor / Supplier Info
    vendor: {
      type: String,
      default: "",
    },

    category: {
      type: String,
      enum: [
        "Materials",
        "Equipment",
        "Electrical",
        "Safety",
        "Facade",
        "Other",
      ],
      default: "Other",
    },

    urgency: {
      type: String,
      enum: ["Normal", "High", "Urgent"],
      default: "Normal",
    },

    items: [
      {
        name: String,
        quantity: Number,
        unitPrice: Number,
      },
    ],

    totalAmount: {
      type: Number,
      required: true,
    },

    purpose: String,

    justification: {
      type: String,
      default: "",
    },

    requestor: {
      type: String,
      default: "Staff",
    },

    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },

    directorComment: {
      type: String,
    },

    approvedBy: { type: String },

    approvedByName: {
      type: String,
      default: "",
    },

    approvalDate: Date,

    // Payment / Account Details for Vendor
    paymentDetails: {
      accountName: {
        type: String,
        default: "",
      },
      bankName: {
        type: String,
        default: "",
      },
      accountNumber: {
        type: String,
        default: "",
      },
      sortCode: {
        type: String,
        default: "",
      },
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("Procurement", procurementSchema);
