const express = require("express");
const router = express.Router();
const Transaction = require("../models/transactions");
const Expense = require("../models/expense");

const adminController = require("../controllers/adminController");

// ==================== PROJECTS ====================
router.get("/projects", adminController.getAllProjects);
router.post("/projects", adminController.createProject);
router.put("/projects/:id", adminController.updateProject);
router.put("/projects/:id/budget/add", adminController.addProjectBudget);
router.put("/projects/:id/income/add", adminController.addProjectIncome);

// ==================== PROJECT TASKS ====================
router.post("/projects/:id/tasks", adminController.createTask);
router.put("/tasks/:id", adminController.updateTask);
router.delete("/tasks/:id", adminController.deleteTask);

// ==================== PROCUREMENT ====================
router.get("/procurement", adminController.getAllProcurement);
router.post("/procurement", adminController.createProcurement);
router.put("/procurement/:id/approve", adminController.approveProcurement);
router.put("/procurement/:id/reject", adminController.rejectProcurement);

// ==================== MAINTENANCE ====================
router.get("/maintenance", adminController.getAllMaintenance);
router.post("/maintenance", adminController.createMaintenance);
router.put("/maintenance/:id", adminController.updateMaintenance);
router.delete("/maintenance/:id", adminController.deleteMaintenance);

// ==================== PROPERTIES ====================
router.get("/properties", adminController.getAllProperties);
router.post("/properties", adminController.createProperty);
router.put("/properties/:id", adminController.updateProperty);
router.delete("/properties/:id", adminController.deleteProperty);

// ==================== INVOICES ====================
router.get("/invoices", adminController.getAllInvoices);
router.get("/invoice/:id", adminController.getInvoiceById); // singular
router.get("/invoices/:id", adminController.getInvoiceById); // plural
router.post("/invoice", adminController.generateInvoice);
router.put("/invoice/:id", adminController.updateInvoice); // singular ← ADDED
router.put("/invoices/:id", adminController.updateInvoice); // plural
router.delete("/invoices/:id", adminController.deleteInvoice);

// ==================== ACTIVITY / DASHBOARD ====================
router.get("/activity", adminController.getActivity);

// --- TRANSACTIONS ---
router.get("/transactions", adminController.getTransactions);
router.post("/transactions", adminController.createTransaction);

// --- EXPENSES ---
router.get("/expenses", adminController.getExpenses);
router.post("/expenses", adminController.createExpense);
router.put("/expenses/:id", adminController.updateExpense);

// --- COMPANIES ---
router.get("/companies", adminController.getCompanies);
router.post("/companies", adminController.createCompany);
router.put("/companies/:id", adminController.updateCompany);
router.delete("/companies/:id", adminController.deleteCompany);

// --- PROCUREMENT REPORT ---
router.get("/procurement/report", adminController.getProcurementByProject);

// REIMBURSEMENT ROUTE
router.get("/reimbursement-balance", adminController.getReimbursementBalance);

module.exports = router;
