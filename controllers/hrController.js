const Employee = require("../models/employeeSchema");

// GET all employees
exports.getAllEmployees = async (req, res) => {
  try {
    const employees = await Employee.find().sort({ createdAt: -1 });
    res.status(200).json(employees);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET single employee by ID
exports.getEmployeeById = async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }
    res.status(200).json(employee);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST create new employee
exports.createEmployee = async (req, res) => {
  try {
    const { staffId } = req.body;

    // Check for duplicate staffId
    const existing = await Employee.findOne({ staffId });
    if (existing) {
      return res.status(400).json({ message: "Staff ID already exists" });
    }

    const employee = new Employee(req.body);
    const saved = await employee.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// PUT update employee
exports.updateEmployee = async (req, res) => {
  try {
    const updated = await Employee.findByIdAndUpdate(
      req.params.id,
      req.body,
      { returnDocument: "after" }, // FIXED: replaced deprecated `new: true`
    );
    if (!updated) {
      return res.status(404).json({ message: "Employee not found" });
    }
    res.status(200).json(updated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// DELETE employee
exports.deleteEmployee = async (req, res) => {
  try {
    const deleted = await Employee.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: "Employee not found" });
    }
    res.status(200).json({ message: "Employee deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getTodayHRReport = async (req, res) => {
  try {
    const Employee = require("../models/employeeSchema");

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    const employeesAddedToday = await Employee.find({
      createdAt: {
        $gte: startOfToday,
        $lte: endOfToday,
      },
    }).sort({ createdAt: -1 });

    const employeesUpdatedToday = await Employee.find({
      updatedAt: {
        $gte: startOfToday,
        $lte: endOfToday,
      },
      createdAt: {
        $lt: startOfToday,
      },
    }).sort({ updatedAt: -1 });

    const activeEmployees = await Employee.countDocuments({
      status: "active",
    });

    const inactiveEmployees = await Employee.countDocuments({
      status: "inactive",
    });

    res.status(200).json({
      newEmployees: employeesAddedToday.length,
      updatedEmployees: employeesUpdatedToday.length,
      activeEmployees,
      inactiveEmployees,
      employeesAddedToday,
      employeesUpdatedToday,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
