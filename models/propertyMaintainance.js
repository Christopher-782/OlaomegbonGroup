const mongoose = require("mongoose");

const maintenanceSchema = new mongoose.Schema(
  {
    // Property reference (populated from Property collection)
    property: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Property",
      required: false,
    },
    // Fallback property name for display when populate isn't used
    propertyName: {
      type: String,
    },
    // Legacy property ID fallback
    propertyId: {
      type: String,
    },

    // Issue title (maps to frontend "issue" field)
    title: {
      type: String,
      required: true,
    },

    // Issue description
    description: {
      type: String,
      required: true,
    },

    // Category of maintenance
    category: {
      type: String,
      enum: [
        "plumbing",
        "electrical",
        "structural",
        "painting",
        "security",
        "cleaning",
        "other",
      ],
      default: "other",
    },

    // Priority level
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
    },

    // Urgency (frontend compatibility)
    urgency: {
      type: String,
      enum: ["Normal", "High", "Urgent"],
      default: "Normal",
    },

    // Status
    status: {
      type: String,
      enum: [
        "pending_approval",
        "approved",
        "rejected",
        "in_progress",
        "completed",
        // Legacy frontend statuses
        "open",
        "in-progress",
        "resolved",
      ],
      default: "open",
    },

    // Who reported the issue
    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    // Who logged the ticket (frontend compatibility)
    loggedBy: {
      type: String,
    },

    // Date logged
    logged: {
      type: Date,
      default: Date.now,
    },

    // Date completed
    completed: {
      type: Date,
    },

    // Assigned person/contractor
    assigned: {
      type: String,
    },

    assignedContractor: {
      name: String,
      phone: String,
      company: String,
    },

    // Estimated cost
    estimatedCost: {
      type: Number,
      default: 0,
    },

    // Materials used
    materials: [
      {
        item: String,
        quantity: Number,
        cost: Number,
      },
    ],

    // Approval tracking
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    approvalDate: {
      type: Date,
    },

    // Images
    images: [
      {
        type: String,
      },
    ],

    // Dates
    startDate: Date,
    completionDate: Date,

    // Notes / resolution
    notes: String,
    resolution: String,
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("MaintenanceRequest", maintenanceSchema);
