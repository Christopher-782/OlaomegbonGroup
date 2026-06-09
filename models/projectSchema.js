const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    status: {
      type: String,
      enum: ["todo", "in-progress", "done"],
      default: "todo",
    },
    dueDate: Date,
  },
  { _id: true },
);

const projectSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    client: { type: String, required: true },
    pm: { type: String, required: true },
    budget: { type: Number, default: 0 },
    spent: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ["Planning", "Design", "Construction", "Completed"],
      default: "Planning",
    },
    phase: { type: String, default: "Phase 1" },
    start: { type: Date },
    end: { type: Date },
    tasks: [taskSchema],
    description: { type: String, default: "" },
    location: {
      address: { type: String, default: "" },
      city: { type: String, default: "" },
      state: { type: String, default: "" },
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Project", projectSchema);
