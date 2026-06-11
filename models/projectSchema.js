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

const budgetEntrySchema = new mongoose.Schema(
  {
    amount: { type: Number, required: true, min: 0 },
    note: { type: String, default: "" },
    date: { type: Date, default: Date.now },
    recordedBy: { type: String, default: "" },
  },
  { _id: true },
);

const incomeEntrySchema = new mongoose.Schema(
  {
    amount: { type: Number, required: true, min: 0 },
    source: { type: String, default: "Client Payment" },
    note: { type: String, default: "" },
    date: { type: Date, default: Date.now },
    recordedBy: { type: String, default: "" },
  },
  { _id: true },
);

const projectSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    client: { type: String, required: true },
    pm: { type: String, required: true },

    originalBudget: { type: Number, default: 0 },
    budget: { type: Number, default: 0 },
    spent: { type: Number, default: 0 },

    incomeReceived: { type: Number, default: 0 },

    budgetEntries: [budgetEntrySchema],
    incomeEntries: [incomeEntrySchema],

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

projectSchema.pre("save", function (next) {
  if (this.isNew && !this.originalBudget) {
    this.originalBudget = this.budget || 0;
  }

  next();
});

module.exports = mongoose.model("Project", projectSchema);
