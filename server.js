const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv").config();
const path = require("path");
const authRouter = require("./routes/authRoutes");
const adminRouter = require("./routes/adminRoutes");
const hrRouter = require("./routes/hrRoutes");
const app = express();
const PORT = process.env.PORT;

mongoose
  .connect(process.env.MONGO)
  .then(() => {
    console.log("Mongo connected");
  })
  .catch((err) => {
    console.log("Mongo failed to connect", err.message);
  });

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

// Home Route
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});
app.get("/admin", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "adminDashboard.html"));
});
app.get("/director", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "adminDashboard.html"));
});

app.get("/employees", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "adminDashboard.html"));
});

require("./models/propertySchema");
require("./models/projectSchema");
require("./models/procurementSChema");
require("./models/propertyMaintainance");
require("./models/invoiceSchema");
require("./models/transactions");
require("./models/expense");
require("./models/company");
require("./models/reimbursementAccount");

// Routes
app.use("/", authRouter);
app.use("/", adminRouter);
app.use("/api/admin", adminRouter);
app.use("/", hrRouter);
app.use("/employees", hrRouter);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

// Start Server
app.listen(PORT, () => {
  console.log(` Server running on port`);
});
