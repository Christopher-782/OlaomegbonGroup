const mongoose = require("mongoose");

const employeeSchema = new mongoose.Schema(
  {
    staffId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    department: {
      type: String,
      enum: [
        "Engineering",
        "Operations",
        "Accounting",
        "Human Resources",
        "Sales",
        "Procurement",
        "Admin",
        "Other",
      ],
      default: "Other",
    },
    role: {
      type: String,
      trim: true,
    },
    salary: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ["Active", "On Leave", "Inactive"],
      default: "Active",
    },
    dateJoined: {
      type: String, // Matches frontend string input (YYYY-MM-DD)
    },
    emergencyContact: {
      type: String,
      trim: true,
    },
    address: {
      type: String,
      trim: true,
    },
    notes: {
      type: String,
      trim: true,
    },
    createdBy: {
      type: String,
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("Employee", employeeSchema);
