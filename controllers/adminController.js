const Project = require("../models/projectSchema");
const Procurement = require("../models/procurementSChema");
const Maintenance = require("../models/propertyMaintainance");
const Invoice = require("../models/invoiceSchema");
const Transaction = require("../models/transactions");
const Expense = require("../models/expense");
// ==========================================
// 1. PROJECTS & TASK MANAGEMENT
// ==========================================

// GET all projects
exports.getAllProjects = async (req, res) => {
  try {
    const projects = await Project.find().sort({ createdAt: -1 });
    res.json(projects);
  } catch (error) {
    console.error("getAllProjects error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// CREATE a new project
exports.createProject = async (req, res) => {
  console.log("=== CREATE PROJECT ===");
  console.log("Request body:", req.body);

  try {
    // Validate required fields
    const { name, client, pm } = req.body;
    if (!name || !client || !pm) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: name, client, and pm are required",
        received: req.body,
      });
    }

    // Handle tasks if provided
    const projectData = { ...req.body };
    if (projectData.tasks && Array.isArray(projectData.tasks)) {
      // Validate each task has a title
      projectData.tasks = projectData.tasks.filter(
        (t) => t.title && t.title.trim(),
      );
    }

    const project = await Project.create(projectData);
    console.log(
      "Project created:",
      project._id,
      "with",
      project.tasks?.length || 0,
      "tasks",
    );
    res.status(201).json({ success: true, project });
  } catch (error) {
    console.error("createProject error:", error.message);
    if (error.name === "ValidationError") {
      const details = Object.keys(error.errors).map((k) => ({
        field: k,
        message: error.errors[k].message,
      }));
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        details,
      });
    }
    res.status(400).json({ success: false, message: error.message });
  }
};

// UPDATE an existing project
exports.updateProject = async (req, res) => {
  console.log("=== UPDATE PROJECT ===");
  console.log("Project ID:", req.params.id);
  console.log("Update body:", req.body);

  try {
    const project = await Project.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }
    res.json({ success: true, project });
  } catch (error) {
    console.error("updateProject error:", error.message);
    if (error.name === "ValidationError") {
      const details = Object.keys(error.errors).map((k) => ({
        field: k,
        message: error.errors[k].message,
      }));
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        details,
      });
    }
    res.status(400).json({ success: false, message: error.message });
  }
};

// CREATE a task inside a project
exports.createTask = async (req, res) => {
  console.log("=== CREATE TASK ===");
  console.log("Project ID:", req.params.id);
  console.log("Task data:", req.body);

  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    const newTask = {
      title: req.body.title,
      status: req.body.status || "todo",
      dueDate: req.body.dueDate,
    };

    project.tasks.push(newTask);

    // If project was Completed and new task is added, move back to Construction
    if (project.status === "Completed" && newTask.status !== "done") {
      project.status = "Construction";
    }

    await project.save();

    // Return the last added task (which has the generated _id)
    const createdTask = project.tasks[project.tasks.length - 1];
    res.status(201).json({ success: true, task: createdTask });
  } catch (error) {
    console.error("createTask error:", error.message);
    res.status(400).json({ success: false, message: error.message });
  }
};

// UPDATE a specific task
exports.updateTask = async (req, res) => {
  console.log("=== UPDATE TASK ===");
  console.log("Task ID:", req.params.id);
  console.log("Update data:", req.body);

  try {
    const project = await Project.findOneAndUpdate(
      { "tasks._id": req.params.id },
      { $set: { "tasks.$": req.body } },
      { returnDocument: "after" },
    );
    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    // Auto-mark project as Completed if all tasks are done
    if (project.tasks && project.tasks.length > 0) {
      const allDone = project.tasks.every((t) => t.status === "done");
      const anyInProgress = project.tasks.some(
        (t) => t.status === "in-progress",
      );

      if (allDone && project.status !== "Completed") {
        project.status = "Completed";
        await project.save();
        console.log("Auto-marked project as Completed:", project._id);
      } else if (anyInProgress && project.status === "Planning") {
        project.status = "Construction";
        await project.save();
        console.log("Auto-moved project to Construction:", project._id);
      }
    }

    res.json({ success: true, project });
  } catch (error) {
    console.error("updateTask error:", error.message);
    res.status(400).json({ success: false, message: error.message });
  }
};

// DELETE a specific task
exports.deleteTask = async (req, res) => {
  console.log("=== DELETE TASK ===");
  console.log("Task ID:", req.params.id);

  try {
    const project = await Project.findOneAndUpdate(
      { "tasks._id": req.params.id },
      { $pull: { tasks: { _id: req.params.id } } },
      { returnDocument: "after" },
    );
    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }
    res.json({ success: true, message: "Task deleted successfully" });
  } catch (error) {
    console.error("deleteTask error:", error.message);
    res.status(400).json({ success: false, message: error.message });
  }
};

// ==========================================
// 2. PROCUREMENT
// ==========================================

exports.getAllProcurement = async (req, res) => {
  try {
    const items = await Procurement.find().sort({ createdAt: -1 });
    res.json(items);
  } catch (error) {
    console.error("getAllProcurement error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createProcurement = async (req, res) => {
  console.log("=== CREATE PROCUREMENT ===");
  console.log("Request body:", req.body);

  try {
    // Map frontend field names to schema field names
    const procurementData = {
      title: req.body.item || req.body.title || "Untitled Request",
      vendor: req.body.vendor || "",
      category: req.body.category || "Other",
      totalAmount: req.body.amount || req.body.totalAmount || 0,
      project: req.body.projectId || req.body.project || null,
      urgency: req.body.urgency || "Normal",
      justification: req.body.justification || "",
      requestor: req.body.requestor || "Staff",
      status: req.body.status || "pending",
      // Keep original fields too for compatibility
      item: req.body.item || "",
      projectId: req.body.projectId || "",
      amount: req.body.amount || 0,
    };

    console.log("Mapped procurement data:", procurementData);
    const procurement = await Procurement.create(procurementData);
    res.status(201).json({ success: true, procurement });
  } catch (error) {
    console.error("createProcurement error:", error.message);
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.approveProcurement = async (req, res) => {
  try {
    const procurement = await Procurement.findById(req.params.id);
    if (!procurement) {
      return res.status(404).json({
        success: false,
        message: "Request not found",
      });
    }

    procurement.status = "approved";
    procurement.approvedBy = req.user ? req.user.name : "Admin";
    procurement.approvalDate = new Date();

    await procurement.save();
    res.json({ success: true, message: "Approved", procurement });
  } catch (error) {
    console.error("approveProcurement error:", error.message);
    res.status(400).json({ success: false, message: error.message });
  }
};

// ==========================================
// 3. MAINTENANCE & PROPERTIES
// ==========================================

// GET single invoice by ID
exports.getInvoiceById = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id).populate({
      path: "project",
      select: "name",
      strictPopulate: false,
    });

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: "Invoice not found",
      });
    }
    res.json({ success: true, invoice });
  } catch (error) {
    console.error("getInvoiceById error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
exports.createRequest = async (req, res) => {
  console.log("=== CREATE MAINTENANCE ===");
  console.log("Request body:", req.body);

  try {
    const request = await Maintenance.create(req.body);
    res.status(201).json({ success: true, request });
  } catch (error) {
    console.error("createRequest error:", error.message);
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.getProperties = async (req, res) => {
  try {
    // Try to fetch from Property model first (if it exists)
    let Property;
    try {
      Property = require("../models/propertySchema");
    } catch (e) {
      console.log(
        "Property model not found, falling back to maintenance aggregation",
      );
    }

    if (Property) {
      const properties = await Property.find().sort({ createdAt: -1 });
      if (properties && properties.length > 0) {
        return res.json(properties);
      }
    }

    // Fallback: fetch distinct properties from maintenance records
    const properties = await Maintenance.aggregate([
      {
        $group: {
          _id: "$property",
          name: { $first: "$property" },
          address: { $first: "$propertyAddress" },
          ticketCount: { $sum: 1 },
          openCount: {
            $sum: { $cond: [{ $eq: ["$status", "open"] }, 1, 0] },
          },
        },
      },
      {
        $project: {
          _id: 0,
          id: "$_id",
          name: 1,
          address: { $ifNull: ["$address", "Location details pending"] },
          ticketCount: 1,
          openCount: 1,
        },
      },
    ]);

    res.json(properties || []);
  } catch (error) {
    console.error("getProperties error:", error);
    // Return empty array instead of 500 to prevent frontend crash
    res.json([]);
  }
};

// ==========================================
// 4. INVOICES
// ==========================================

exports.getAllInvoices = async (req, res) => {
  try {
    const invoices = await Invoice.find().sort({ createdAt: -1 });
    res.json(invoices);
  } catch (error) {
    console.error("getAllInvoices error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.generateInvoice = async (req, res) => {
  console.log("=== GENERATE INVOICE ===");
  console.log("Request body:", req.body);

  try {
    const items = (req.body.items || []).map((item) => {
      const quantity = Number(item.quantity ?? item.qty ?? 1);
      const unitCost = Number(item.unitCost ?? item.rate ?? 0);
      return {
        description: item.description ?? item.desc ?? "",
        quantity,
        unitCost,
        amount: quantity * unitCost,
      };
    });

    const totalAmount =
      Number(req.body.totalAmount) ||
      items.reduce((sum, i) => sum + i.amount, 0);

    const invoice = await Invoice.create({
      invoiceNumber: req.body.invoiceNumber || "INV-" + Date.now(),
      project: req.body.project || req.body.projectId || null, // Handle both field names
      client: req.body.client || "",
      items,
      totalAmount,
      status: req.body.status || "pending",
      dueDate: req.body.dueDate || null,
      issueDate: req.body.issueDate || new Date(),
      bankAccount: req.body.bankAccount || null,
      notes: req.body.notes || "",
    });

    res.status(201).json({ success: true, invoice });
  } catch (error) {
    console.error("generateInvoice error:", error);
    res.status(400).json({ success: false, message: error.message });
  }
};
// ==========================================
// 5. DASHBOARD HELPERS
// ==========================================

exports.getActivity = async (req, res) => {
  try {
    const activities = [
      {
        text: "New Project: Riviera Heights",
        time: "2 hours ago",
        icon: "plus",
        color: "#d1fae5",
        iconColor: "#059669",
      },
      {
        text: "Procurement Approved",
        time: "5 hours ago",
        icon: "check",
        color: "#dbeafe",
        iconColor: "#2563eb",
      },
    ];
    res.json(activities);
  } catch (error) {
    console.error("getActivity error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==========================================
// 6. ADDITIONAL CONTROLLERS (Missing Exports)
// ==========================================

// REJECT PROCUREMENT
exports.rejectProcurement = async (req, res) => {
  try {
    const { id } = req.params;
    const procurement = await Procurement.findByIdAndUpdate(
      id,
      { status: "rejected", rejectedAt: new Date() },
      { returnDocument: "after" },
    );
    if (!procurement) {
      return res
        .status(404)
        .json({ success: false, message: "Request not found" });
    }
    res.json({ success: true, message: "Rejected", procurement });
  } catch (error) {
    console.error("rejectProcurement error:", error.message);
    res.status(400).json({ success: false, message: error.message });
  }
};
// GET all maintenance tickets
exports.getAllMaintenance = async (req, res) => {
  try {
    let tickets;

    try {
      tickets = await Maintenance.find()
        .populate("property", "name address location")
        .sort({ createdAt: -1 });
    } catch (populateError) {
      console.warn("Property populate failed:", populateError.message);
      tickets = await Maintenance.find().sort({ createdAt: -1 });
    }

    res.json(tickets);
  } catch (error) {
    console.error("getAllMaintenance error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
// CREATE MAINTENANCE (standalone)
exports.createMaintenance = async (req, res) => {
  console.log("=== CREATE MAINTENANCE ===");
  console.log("Request body:", req.body);
  try {
    const maintenance = await Maintenance.create(req.body);
    res.status(201).json({ success: true, maintenance });
  } catch (error) {
    console.error("createMaintenance error:", error.message);
    res.status(400).json({ success: false, message: error.message });
  }
};

// UPDATE MAINTENANCE
exports.updateMaintenance = async (req, res) => {
  try {
    const { id } = req.params;
    const maintenance = await Maintenance.findByIdAndUpdate(id, req.body, {
      returnDocument: "after",
    });
    if (!maintenance) {
      return res
        .status(404)
        .json({ success: false, message: "Maintenance ticket not found" });
    }
    res.json({ success: true, maintenance });
  } catch (error) {
    console.error("updateMaintenance error:", error.message);
    res.status(400).json({ success: false, message: error.message });
  }
};

// DELETE MAINTENANCE
exports.deleteMaintenance = async (req, res) => {
  try {
    await Maintenance.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Maintenance ticket deleted" });
  } catch (error) {
    console.error("deleteMaintenance error:", error.message);
    res.status(400).json({ success: false, message: error.message });
  }
};

// GET ALL PROPERTIES (standalone)
exports.getAllProperties = async (req, res) => {
  try {
    let Property;
    try {
      Property = require("../models/propertySchema");
    } catch (e) {
      console.log("Property model not found");
      return res.json([]);
    }
    const properties = await Property.find().sort({ createdAt: -1 });
    res.json(properties || []);
  } catch (error) {
    console.error("getAllProperties error:", error);
    res.json([]);
  }
};

// CREATE PROPERTY
exports.createProperty = async (req, res) => {
  try {
    const Property = require("../models/propertySchema");
    const property = await Property.create(req.body);
    res.status(201).json({ success: true, property });
  } catch (error) {
    console.error("createProperty error:", error.message);
    res.status(400).json({ success: false, message: error.message });
  }
};

// UPDATE PROPERTY
exports.updateProperty = async (req, res) => {
  try {
    const Property = require("../models/propertySchema");
    const property = await Property.findByIdAndUpdate(req.params.id, req.body, {
      returnDocument: "after",
    });
    if (!property) {
      return res
        .status(404)
        .json({ success: false, message: "Property not found" });
    }
    res.json({ success: true, property });
  } catch (error) {
    console.error("updateProperty error:", error.message);
    res.status(400).json({ success: false, message: error.message });
  }
};

// DELETE PROPERTY
exports.deleteProperty = async (req, res) => {
  try {
    const Property = require("../models/propertySchema");
    await Property.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Property deleted" });
  } catch (error) {
    console.error("deleteProperty error:", error.message);
    res.status(400).json({ success: false, message: error.message });
  }
};

// UPDATE INVOICE
exports.updateInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findByIdAndUpdate(req.params.id, req.body, {
      returnDocument: "after",
    });
    if (!invoice) {
      return res
        .status(404)
        .json({ success: false, message: "Invoice not found" });
    }
    res.json({ success: true, invoice });
  } catch (error) {
    console.error("updateInvoice error:", error.message);
    res.status(400).json({ success: false, message: error.message });
  }
};

// DELETE INVOICE
exports.deleteInvoice = async (req, res) => {
  try {
    await Invoice.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Invoice deleted" });
  } catch (error) {
    console.error("deleteInvoice error:", error.message);
    res.status(400).json({ success: false, message: error.message });
  }
};

// GET single invoice by ID
exports.getInvoiceById = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id).populate({
      path: "project",
      select: "name",
      strictPopulate: false,
    });

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: "Invoice not found",
      });
    }

    res.json({ success: true, invoice });
  } catch (error) {
    console.error("getInvoiceById error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
// GET all transactions
exports.getTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.find()
      .sort({ date: -1 })
      .populate({ path: "projectId", select: "name", strictPopulate: false });
    res.json(transactions);
  } catch (error) {
    console.error("getTransactions error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// CREATE a transaction
exports.createTransaction = async (req, res) => {
  try {
    const data = req.body;

    if (data.category === "Charges") {
      data.type = "income";
    }
    if (data.category === "Reimbursement") {
      data.type = "reimbursement";
    }

    data.netAmount = (data.amount || 0) - (data.charges || 0);

    const transaction = await Transaction.create(data);
    res.status(201).json({ success: true, transaction });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// GET all expenses
exports.getExpenses = async (req, res) => {
  try {
    const expenses = await Expense.find()
      .sort({ date: -1 })
      .populate({ path: "projectId", select: "name", strictPopulate: false });
    res.json(expenses);
  } catch (error) {
    console.error("getExpenses error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// CREATE an expense
exports.createExpense = async (req, res) => {
  try {
    const expense = await Expense.create(req.body);
    res.status(201).json({ success: true, expense });
  } catch (error) {
    console.error("createExpense error:", error.message);
    res.status(400).json({ success: false, message: error.message });
  }
};

// Optional: UPDATE expense (for approving / rejecting)
exports.updateExpense = async (req, res) => {
  try {
    const expense = await Expense.findByIdAndUpdate(req.params.id, req.body, {
      returnDocument: "after",
    });
    if (!expense) {
      return res
        .status(404)
        .json({ success: false, message: "Expense not found" });
    }
    res.json({ success: true, expense });
  } catch (error) {
    console.error("updateExpense error:", error.message);
    res.status(400).json({ success: false, message: error.message });
  }
};

const Company = require("../models/company");

// --- COMPANY CRUD ---
exports.getCompanies = async (req, res) => {
  try {
    const companies = await Company.find().sort({ name: 1 });
    res.json(companies);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createCompany = async (req, res) => {
  try {
    const company = await Company.create(req.body);
    res.status(201).json({ success: true, company });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.updateCompany = async (req, res) => {
  try {
    const company = await Company.findByIdAndUpdate(req.params.id, req.body, {
      returnDocument: "after",
    });
    if (!company)
      return res
        .status(404)
        .json({ success: false, message: "Company not found" });
    res.json({ success: true, company });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.deleteCompany = async (req, res) => {
  try {
    await Company.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Company deleted" });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// --- PROCUREMENT REPORT BY PROJECT ---
exports.getProcurementByProject = async (req, res) => {
  try {
    const result = await Procurement.aggregate([
      {
        $group: {
          _id: "$project",
          totalAmount: { $sum: "$totalAmount" },
          count: { $sum: 1 },
          approved: {
            $sum: { $cond: [{ $eq: ["$status", "approved"] }, 1, 0] },
          },
          pending: { $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] } },
          rejected: {
            $sum: { $cond: [{ $eq: ["$status", "rejected"] }, 1, 0] },
          },
        },
      },
      {
        $lookup: {
          from: "projects",
          localField: "_id",
          foreignField: "_id",
          as: "projectData",
        },
      },
      { $unwind: { path: "$projectData", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          projectId: "$_id",
          projectName: "$projectData.name",
          totalAmount: 1,
          count: 1,
          approved: 1,
          pending: 1,
          rejected: 1,
        },
      },
    ]);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
// controllers/adminController.js

const ReimbursementAccount = require("../models/reimbursementAccount");

// Helper: Get or create reimbursement account
async function getOrCreateReimbursementAccount(companyId) {
  let account = await ReimbursementAccount.findOne({ companyId });
  if (!account) {
    account = await ReimbursementAccount.create({ companyId, balance: 0 });
  }
  return account;
}

// CREATE a transaction — updated to handle reimbursements
exports.createTransaction = async (req, res) => {
  try {
    const data = req.body;

    // Auto-set type based on category
    if (data.category === "Charges") {
      data.type = "income";
    }
    if (data.category === "Reimbursement") {
      data.type = "reimbursement";
    }
    if (data.category === "Reimbursement Withdrawal") {
      data.type = "reimbursement-withdrawal";
    }

    data.netAmount = (data.amount || 0) - (data.charges || 0);

    // Handle reimbursement deposit (increases the pool)
    if (data.type === "reimbursement") {
      const account = await getOrCreateReimbursementAccount(data.companyId);
      account.balance += data.amount;
      account.totalReceived += data.amount;
      await account.save();
    }

    // Handle reimbursement withdrawal (decreases the pool, NOT an expense)
    if (data.type === "reimbursement-withdrawal") {
      const account = await getOrCreateReimbursementAccount(data.companyId);

      if (account.balance < data.amount) {
        return res.status(400).json({
          success: false,
          message: `Insufficient reimbursement balance. Available: ₦${account.balance.toLocaleString()}, Requested: ₦${data.amount.toLocaleString()}`,
        });
      }

      account.balance -= data.amount;
      account.totalWithdrawn += data.amount;
      await account.save();

      data.deductedFromReimbursement = true;
    }

    const transaction = await Transaction.create(data);
    res.status(201).json({ success: true, transaction });
  } catch (error) {
    console.error("createTransaction error:", error);
    res.status(400).json({ success: false, message: error.message });
  }
};

// GET reimbursement account balance
exports.getReimbursementBalance = async (req, res) => {
  try {
    const { companyId } = req.query;
    if (!companyId) {
      return res
        .status(400)
        .json({ success: false, message: "companyId required" });
    }
    const account = await getOrCreateReimbursementAccount(companyId);
    res.json({ success: true, balance: account.balance, account });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
