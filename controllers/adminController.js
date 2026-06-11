const fs = require("fs");
const path = require("path");

const Project = require("../models/projectSchema");
const Procurement = require("../models/procurementSChema");
const Maintenance = require("../models/propertyMaintainance");
const Invoice = require("../models/invoiceSchema");
const Transaction = require("../models/transactions");
const Expense = require("../models/expense");
const Company = require("../models/company");
const ReimbursementAccount = require("../models/reimbursementAccount");
const Employee = require("../models/employeeSchema");
const cloudinary = require("../config/cloudinary");

function uploadPdfToCloudinary(file, folder = "olaomegbon/guarantor-forms") {
  return new Promise((resolve, reject) => {
    const safeName = file.originalname
      .replace(/\s+/g, "-")
      .replace(/[^a-zA-Z0-9.\-_]/g, "");

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "raw",
        public_id: `guarantor-${Date.now()}-${safeName.replace(".pdf", "")}`,
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      },
    );

    uploadStream.end(file.buffer);
  });
}

// ==========================================
// HELPERS
// ==========================================

function toNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function getUserName(req) {
  return req.user?.name || req.user?.email || "Admin";
}

async function getOrCreateReimbursementAccount(companyId) {
  let account = await ReimbursementAccount.findOne({ companyId });

  if (!account) {
    account = await ReimbursementAccount.create({
      companyId,
      balance: 0,
      totalReceived: 0,
      totalWithdrawn: 0,
    });
  }

  return account;
}

// ==========================================
// 1. PROJECTS & TASK MANAGEMENT
// ==========================================

exports.getAllProjects = async (req, res) => {
  try {
    const projects = await Project.find().sort({ createdAt: -1 });
    res.json(projects);
  } catch (error) {
    console.error("getAllProjects error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createProject = async (req, res) => {
  console.log("=== CREATE PROJECT ===");
  console.log("Request body:", req.body);

  try {
    const { name, client, pm } = req.body;

    if (!name || !client || !pm) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: name, client, and pm are required",
        received: req.body,
      });
    }

    const initialBudget = toNumber(req.body.budget, 0);

    const projectData = {
      ...req.body,
      budget: initialBudget,
      originalBudget: toNumber(req.body.originalBudget, initialBudget),
      spent: toNumber(req.body.spent, 0),
      incomeReceived: toNumber(req.body.incomeReceived, 0),
    };

    if (projectData.tasks && Array.isArray(projectData.tasks)) {
      projectData.tasks = projectData.tasks.filter(
        (task) => task.title && task.title.trim(),
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
      const details = Object.keys(error.errors).map((key) => ({
        field: key,
        message: error.errors[key].message,
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

exports.updateProject = async (req, res) => {
  console.log("=== UPDATE PROJECT ===");
  console.log("Project ID:", req.params.id);
  console.log("Update body:", req.body);

  try {
    const updateData = { ...req.body };

    if (updateData.budget !== undefined) {
      updateData.budget = toNumber(updateData.budget, 0);
    }

    if (updateData.spent !== undefined) {
      updateData.spent = toNumber(updateData.spent, 0);
    }

    if (updateData.incomeReceived !== undefined) {
      updateData.incomeReceived = toNumber(updateData.incomeReceived, 0);
    }

    const project = await Project.findByIdAndUpdate(req.params.id, updateData, {
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
      const details = Object.keys(error.errors).map((key) => ({
        field: key,
        message: error.errors[key].message,
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

exports.addProjectBudget = async (req, res) => {
  try {
    const { amount, note, recordedBy } = req.body;
    const numericAmount = toNumber(amount, 0);

    if (numericAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Amount must be greater than 0",
      });
    }

    const project = await Project.findByIdAndUpdate(
      req.params.id,
      {
        $inc: {
          budget: numericAmount,
        },
        $push: {
          budgetEntries: {
            amount: numericAmount,
            note: note || "",
            recordedBy: recordedBy || getUserName(req),
            date: new Date(),
          },
        },
      },
      { new: true, runValidators: true },
    );

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    res.json({
      success: true,
      message: "Budget added successfully",
      project,
    });
  } catch (error) {
    console.error("addProjectBudget error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to add project budget",
      error: error.message,
    });
  }
};

exports.addProjectIncome = async (req, res) => {
  try {
    const { amount, source, note, recordedBy } = req.body;
    const numericAmount = toNumber(amount, 0);

    if (numericAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Amount must be greater than 0",
      });
    }

    const project = await Project.findByIdAndUpdate(
      req.params.id,
      {
        $inc: {
          incomeReceived: numericAmount,
        },
        $push: {
          incomeEntries: {
            amount: numericAmount,
            source: source || "Client Payment",
            note: note || "",
            recordedBy: recordedBy || getUserName(req),
            date: new Date(),
          },
        },
      },
      { new: true, runValidators: true },
    );

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    res.json({
      success: true,
      message: "Income added successfully",
      project,
    });
  } catch (error) {
    console.error("addProjectIncome error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to add project income",
      error: error.message,
    });
  }
};

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

    if (!req.body.title || !req.body.title.trim()) {
      return res.status(400).json({
        success: false,
        message: "Task title is required",
      });
    }

    const newTask = {
      title: req.body.title.trim(),
      status: req.body.status || "todo",
      dueDate: req.body.dueDate || null,
    };

    project.tasks.push(newTask);

    if (project.status === "Completed" && newTask.status !== "done") {
      project.status = "Construction";
    }

    await project.save();

    const createdTask = project.tasks[project.tasks.length - 1];

    res.status(201).json({ success: true, task: createdTask, project });
  } catch (error) {
    console.error("createTask error:", error.message);
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.updateTask = async (req, res) => {
  console.log("=== UPDATE TASK ===");
  console.log("Task ID:", req.params.id);
  console.log("Update data:", req.body);

  try {
    const project = await Project.findOne({ "tasks._id": req.params.id });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    const task = project.tasks.id(req.params.id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    if (req.body.title !== undefined) task.title = req.body.title;
    if (req.body.status !== undefined) task.status = req.body.status;
    if (req.body.dueDate !== undefined) task.dueDate = req.body.dueDate;

    if (project.tasks && project.tasks.length > 0) {
      const allDone = project.tasks.every((item) => item.status === "done");
      const anyInProgress = project.tasks.some(
        (item) => item.status === "in-progress",
      );

      if (allDone) {
        project.status = "Completed";
      } else if (anyInProgress && project.status === "Planning") {
        project.status = "Construction";
      }
    }

    await project.save();

    res.json({ success: true, project });
  } catch (error) {
    console.error("updateTask error:", error.message);
    res.status(400).json({ success: false, message: error.message });
  }
};

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

    res.json({
      success: true,
      message: "Task deleted successfully",
      project,
    });
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
    const items = await Procurement.find()
      .populate({
        path: "project",
        select: "name budget spent",
        strictPopulate: false,
      })
      .sort({ createdAt: -1 });

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
    const totalAmount = toNumber(req.body.amount || req.body.totalAmount, 0);
    const projectId = req.body.projectId || req.body.project || null;

    if (!req.body.item && !req.body.title) {
      return res.status(400).json({
        success: false,
        message: "Procurement item/title is required",
      });
    }

    if (totalAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Procurement amount must be greater than 0",
      });
    }

    const procurementData = {
      title: req.body.item || req.body.title || "Untitled Request",
      vendor: req.body.vendor || "",
      category: req.body.category || "Other",
      totalAmount,
      project: projectId,
      urgency: req.body.urgency || "Normal",
      justification: req.body.justification || "",
      requestor: req.body.requestor || getUserName(req),
      status: req.body.status || "pending",

      // Compatibility fields for your current frontend/schema
      item: req.body.item || req.body.title || "",
      projectId: projectId || "",
      amount: totalAmount,
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

    if (procurement.status === "approved") {
      return res.status(400).json({
        success: false,
        message: "This procurement has already been approved",
      });
    }

    const amount = toNumber(procurement.totalAmount || procurement.amount, 0);
    const projectId = procurement.project || procurement.projectId || null;

    if (projectId && amount > 0) {
      const project = await Project.findById(projectId);

      if (!project) {
        return res.status(404).json({
          success: false,
          message: "Attached project was not found",
        });
      }

      const availableBalance =
        toNumber(project.budget, 0) - toNumber(project.spent, 0);

      if (amount > availableBalance) {
        return res.status(400).json({
          success: false,
          message: `Insufficient project budget. Available: ₦${availableBalance.toLocaleString()}, Requested: ₦${amount.toLocaleString()}`,
        });
      }

      project.spent = toNumber(project.spent, 0) + amount;
      await project.save();
    }

    procurement.status = "approved";
    procurement.approvedBy = getUserName(req);
    procurement.approvalDate = new Date();

    await procurement.save();

    res.json({
      success: true,
      message: "Procurement approved and project budget deducted",
      procurement,
    });
  } catch (error) {
    console.error("approveProcurement error:", error.message);
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.rejectProcurement = async (req, res) => {
  try {
    const procurement = await Procurement.findByIdAndUpdate(
      req.params.id,
      {
        status: "rejected",
        rejectedAt: new Date(),
        rejectedBy: getUserName(req),
      },
      { returnDocument: "after" },
    );

    if (!procurement) {
      return res.status(404).json({
        success: false,
        message: "Request not found",
      });
    }

    res.json({ success: true, message: "Rejected", procurement });
  } catch (error) {
    console.error("rejectProcurement error:", error.message);
    res.status(400).json({ success: false, message: error.message });
  }
};

// ==========================================
// 3. MAINTENANCE & PROPERTIES
// ==========================================

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

exports.createRequest = exports.createMaintenance;

exports.updateMaintenance = async (req, res) => {
  try {
    const maintenance = await Maintenance.findByIdAndUpdate(
      req.params.id,
      req.body,
      { returnDocument: "after" },
    );

    if (!maintenance) {
      return res.status(404).json({
        success: false,
        message: "Maintenance ticket not found",
      });
    }

    res.json({ success: true, maintenance });
  } catch (error) {
    console.error("updateMaintenance error:", error.message);
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.deleteMaintenance = async (req, res) => {
  try {
    const maintenance = await Maintenance.findByIdAndDelete(req.params.id);

    if (!maintenance) {
      return res.status(404).json({
        success: false,
        message: "Maintenance ticket not found",
      });
    }

    res.json({ success: true, message: "Maintenance ticket deleted" });
  } catch (error) {
    console.error("deleteMaintenance error:", error.message);
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.getAllProperties = async (req, res) => {
  try {
    let Property;

    try {
      Property = require("../models/propertySchema");
    } catch (error) {
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

exports.getProperties = exports.getAllProperties;

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

exports.updateProperty = async (req, res) => {
  try {
    const Property = require("../models/propertySchema");

    const property = await Property.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });

    if (!property) {
      return res.status(404).json({
        success: false,
        message: "Property not found",
      });
    }

    res.json({ success: true, property });
  } catch (error) {
    console.error("updateProperty error:", error.message);
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.deleteProperty = async (req, res) => {
  try {
    const Property = require("../models/propertySchema");
    const property = await Property.findByIdAndDelete(req.params.id);

    if (!property) {
      return res.status(404).json({
        success: false,
        message: "Property not found",
      });
    }

    res.json({ success: true, message: "Property deleted" });
  } catch (error) {
    console.error("deleteProperty error:", error.message);
    res.status(400).json({ success: false, message: error.message });
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

exports.getInvoiceById = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);

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

exports.generateInvoice = async (req, res) => {
  console.log("=== GENERATE INVOICE ===");
  console.log("Request body:", req.body);

  try {
    const items = (req.body.items || []).map((item) => {
      const quantity = toNumber(item.quantity ?? item.qty, 1);
      const unitCost = toNumber(item.unitCost ?? item.rate, 0);

      return {
        description: item.description ?? item.desc ?? "",
        quantity,
        unitCost,
        amount: quantity * unitCost,
      };
    });

    const totalAmount =
      toNumber(req.body.totalAmount, 0) ||
      items.reduce((sum, item) => sum + toNumber(item.amount, 0), 0);

    const invoice = await Invoice.create({
      invoiceNumber: req.body.invoiceNumber || "INV-" + Date.now(),
      project: req.body.project || req.body.projectId || null,
      propertyId: req.body.propertyId || null,
      propertyName: req.body.propertyName || "",
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

exports.updateInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: "Invoice not found",
      });
    }

    res.json({ success: true, invoice });
  } catch (error) {
    console.error("updateInvoice error:", error.message);
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.deleteInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findByIdAndDelete(req.params.id);

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: "Invoice not found",
      });
    }

    res.json({ success: true, message: "Invoice deleted" });
  } catch (error) {
    console.error("deleteInvoice error:", error.message);
    res.status(400).json({ success: false, message: error.message });
  }
};

// ==========================================
// 5. DASHBOARD HELPERS
// ==========================================

exports.getActivity = async (req, res) => {
  try {
    const [latestProjects, latestProcurement, latestTransactions] =
      await Promise.all([
        Project.find().sort({ createdAt: -1 }).limit(3),
        Procurement.find().sort({ updatedAt: -1 }).limit(3),
        Transaction.find().sort({ createdAt: -1 }).limit(3),
      ]);

    const activities = [
      ...latestProjects.map((project) => ({
        text: `Project: ${project.name}`,
        time: project.createdAt
          ? new Date(project.createdAt).toLocaleString()
          : "Recently",
        icon: "plus",
        color: "#d1fae5",
        iconColor: "#059669",
      })),
      ...latestProcurement.map((item) => ({
        text: `Procurement ${item.status || "updated"}: ${
          item.title || item.item || "Request"
        }`,
        time: item.updatedAt
          ? new Date(item.updatedAt).toLocaleString()
          : "Recently",
        icon: item.status === "approved" ? "check" : "file-text",
        color: item.status === "approved" ? "#dbeafe" : "#fef3c7",
        iconColor: item.status === "approved" ? "#2563eb" : "#d97706",
      })),
      ...latestTransactions.map((transaction) => ({
        text: `${transaction.type || "Transaction"}: ${transaction.description}`,
        time: transaction.createdAt
          ? new Date(transaction.createdAt).toLocaleString()
          : "Recently",
        icon: transaction.type === "income" ? "trending-up" : "receipt",
        color: transaction.type === "income" ? "#d1fae5" : "#fee2e2",
        iconColor: transaction.type === "income" ? "#059669" : "#dc2626",
      })),
    ].slice(0, 8);

    res.json(activities);
  } catch (error) {
    console.error("getActivity error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==========================================
// 6. TRANSACTIONS
// ==========================================

exports.getTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.find()
      .sort({ date: -1, createdAt: -1 })
      .populate({ path: "projectId", select: "name", strictPopulate: false })
      .populate({ path: "companyId", select: "name", strictPopulate: false });

    res.json(transactions);
  } catch (error) {
    console.error("getTransactions error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createTransaction = async (req, res) => {
  try {
    const data = { ...req.body };

    data.amount = toNumber(data.amount, 0);
    data.charges = toNumber(data.charges, 0);
    data.netAmount = data.amount - data.charges;

    if (data.amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Amount must be greater than 0",
      });
    }

    if (!data.loggedBy) {
      data.loggedBy = getUserName(req);
    }

    if (data.category === "Charges") {
      data.type = "income";
    }

    if (data.category === "Reimbursement") {
      data.type = "reimbursement";
    }

    if (
      data.category === "Reimbursement Withdrawal" ||
      data.type === "transaction"
    ) {
      data.type = "reimbursement-withdrawal";
    }

    const incomeCategories = [
      "Client Payment",
      "Deposit",
      "Progress Payment",
      "Retention Release",
      "Charges",
    ];

    if (!data.type) {
      data.type = incomeCategories.includes(data.category)
        ? "income"
        : data.category === "Reimbursement"
          ? "reimbursement"
          : "reimbursement-withdrawal";
    }

    if (data.type === "reimbursement") {
      if (!data.companyId) {
        return res.status(400).json({
          success: false,
          message: "companyId is required for reimbursement",
        });
      }

      const account = await getOrCreateReimbursementAccount(data.companyId);
      account.balance = toNumber(account.balance, 0) + data.amount;
      account.totalReceived = toNumber(account.totalReceived, 0) + data.amount;
      await account.save();
    }

    if (data.type === "reimbursement-withdrawal") {
      if (!data.companyId) {
        return res.status(400).json({
          success: false,
          message: "companyId is required for reimbursement withdrawal",
        });
      }

      const account = await getOrCreateReimbursementAccount(data.companyId);

      if (toNumber(account.balance, 0) < data.amount) {
        return res.status(400).json({
          success: false,
          message: `Insufficient reimbursement balance. Available: ₦${toNumber(
            account.balance,
            0,
          ).toLocaleString()}, Requested: ₦${data.amount.toLocaleString()}`,
        });
      }

      account.balance = toNumber(account.balance, 0) - data.amount;
      account.totalWithdrawn =
        toNumber(account.totalWithdrawn, 0) + data.amount;
      await account.save();

      data.deductedFromReimbursement = true;
    }

    const transaction = await Transaction.create(data);

    if (data.type === "income" && data.projectId) {
      await Project.findByIdAndUpdate(
        data.projectId,
        {
          $inc: {
            incomeReceived: data.netAmount,
          },
          $push: {
            incomeEntries: {
              amount: data.netAmount,
              source: data.category || "Client Payment",
              note: data.description || "",
              recordedBy: data.loggedBy || getUserName(req),
              date: data.date || new Date(),
            },
          },
        },
        { new: true, runValidators: true },
      );
    }

    res.status(201).json({ success: true, transaction });
  } catch (error) {
    console.error("createTransaction error:", error);
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.getReimbursementBalance = async (req, res) => {
  try {
    const { companyId } = req.query;

    if (!companyId) {
      return res.status(400).json({
        success: false,
        message: "companyId required",
      });
    }

    const account = await getOrCreateReimbursementAccount(companyId);

    res.json({
      success: true,
      balance: account.balance,
      account,
    });
  } catch (error) {
    console.error("getReimbursementBalance error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==========================================
// 7. EXPENSES
// ==========================================

exports.getExpenses = async (req, res) => {
  try {
    const expenses = await Expense.find()
      .sort({ date: -1, createdAt: -1 })
      .populate({ path: "projectId", select: "name", strictPopulate: false });

    res.json(expenses);
  } catch (error) {
    console.error("getExpenses error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createExpense = async (req, res) => {
  try {
    const expense = await Expense.create(req.body);
    res.status(201).json({ success: true, expense });
  } catch (error) {
    console.error("createExpense error:", error.message);
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.updateExpense = async (req, res) => {
  try {
    const expense = await Expense.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: "Expense not found",
      });
    }

    res.json({ success: true, expense });
  } catch (error) {
    console.error("updateExpense error:", error.message);
    res.status(400).json({ success: false, message: error.message });
  }
};

// ==========================================
// EMPLOYEES
// ==========================================

exports.getEmployees = async (req, res) => {
  try {
    const employees = await Employee.find().sort({ createdAt: -1 });
    res.json(employees);
  } catch (error) {
    console.error("getEmployees error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createEmployee = async (req, res) => {
  try {
    const employee = await Employee.create(req.body);
    res.status(201).json({ success: true, employee });
  } catch (error) {
    console.error("createEmployee error:", error.message);

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Staff ID already exists",
      });
    }

    res.status(400).json({ success: false, message: error.message });
  }
};

exports.updateEmployee = async (req, res) => {
  try {
    const employee = await Employee.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
      });
    }

    res.json({ success: true, employee });
  } catch (error) {
    console.error("updateEmployee error:", error.message);

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Staff ID already exists",
      });
    }

    res.status(400).json({ success: false, message: error.message });
  }
};

exports.deleteEmployee = async (req, res) => {
  try {
    const employee = await Employee.findByIdAndDelete(req.params.id);

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
      });
    }

    res.json({ success: true, message: "Employee deleted" });
  } catch (error) {
    console.error("deleteEmployee error:", error.message);
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.uploadEmployeeGuarantorForms = async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
      });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Please upload at least one PDF guarantor form",
      });
    }

    if (req.files.length > 2) {
      return res.status(400).json({
        success: false,
        message: "You can only upload two guarantor forms",
      });
    }

    // Delete old guarantor forms from Cloudinary
    if (employee.guarantorForms && employee.guarantorForms.length > 0) {
      for (const form of employee.guarantorForms) {
        if (form.publicId) {
          try {
            await cloudinary.uploader.destroy(form.publicId, {
              resource_type: "raw",
            });
          } catch (deleteError) {
            console.warn(
              "Could not delete old Cloudinary PDF:",
              deleteError.message,
            );
          }
        }
      }
    }

    const uploadedForms = [];

    for (const file of req.files) {
      const result = await uploadPdfToCloudinary(file);

      uploadedForms.push({
        publicId: result.public_id,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        url: result.secure_url,
        uploadedAt: new Date(),
      });
    }

    employee.guarantorForms = uploadedForms;
    await employee.save();

    res.json({
      success: true,
      message: "Guarantor forms uploaded successfully",
      employee,
    });
  } catch (error) {
    console.error("uploadEmployeeGuarantorForms error:", error.message);

    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// ==========================================
// 8. COMPANIES
// ==========================================

exports.getCompanies = async (req, res) => {
  try {
    const companies = await Company.find().sort({ name: 1 });
    res.json(companies);
  } catch (error) {
    console.error("getCompanies error:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createCompany = async (req, res) => {
  try {
    const company = await Company.create(req.body);
    res.status(201).json({ success: true, company });
  } catch (error) {
    console.error("createCompany error:", error.message);
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.updateCompany = async (req, res) => {
  try {
    const company = await Company.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!company) {
      return res.status(404).json({
        success: false,
        message: "Company not found",
      });
    }

    res.json({ success: true, company });
  } catch (error) {
    console.error("updateCompany error:", error.message);
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.deleteCompany = async (req, res) => {
  try {
    const company = await Company.findByIdAndDelete(req.params.id);

    if (!company) {
      return res.status(404).json({
        success: false,
        message: "Company not found",
      });
    }

    res.json({ success: true, message: "Company deleted" });
  } catch (error) {
    console.error("deleteCompany error:", error.message);
    res.status(400).json({ success: false, message: error.message });
  }
};

// ==========================================
// 9. PROCUREMENT REPORT
// ==========================================

exports.getProcurementByProject = async (req, res) => {
  try {
    const result = await Procurement.aggregate([
      {
        $group: {
          _id: "$project",
          totalAmount: { $sum: "$totalAmount" },
          approvedAmount: {
            $sum: {
              $cond: [{ $eq: ["$status", "approved"] }, "$totalAmount", 0],
            },
          },
          count: { $sum: 1 },
          approved: {
            $sum: { $cond: [{ $eq: ["$status", "approved"] }, 1, 0] },
          },
          pending: {
            $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] },
          },
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
      {
        $unwind: {
          path: "$projectData",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          projectId: "$_id",
          projectName: "$projectData.name",
          projectBudget: "$projectData.budget",
          projectSpent: "$projectData.spent",
          availableBalance: {
            $subtract: [
              { $ifNull: ["$projectData.budget", 0] },
              { $ifNull: ["$projectData.spent", 0] },
            ],
          },
          totalAmount: 1,
          approvedAmount: 1,
          count: 1,
          approved: 1,
          pending: 1,
          rejected: 1,
        },
      },
      { $sort: { projectName: 1 } },
    ]);

    res.json(result);
  } catch (error) {
    console.error("getProcurementByProject error:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};
