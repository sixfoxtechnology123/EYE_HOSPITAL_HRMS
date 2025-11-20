// paySlipController.js
import PaySlip from "../models/PaySlip.js";
import Employee from "../models/Employee.js";

// CREATE payslip
export const createPaySlip = async (req, res) => {
  try {
    const { employeeId } = req.body;

    // Fetch employee data to prefill earnings/deductions
    const employee = await Employee.findOne({ employeeID: employeeId.toUpperCase() });
    if (!employee) {
      return res.status(404).json({ success: false, message: "Employee not found" });
    }

const newSlip = await PaySlip.create({
  ...req.body,
  employeeName: employee.firstName + " " + employee.lastName,
  // Use earnings/deductions from request if provided, else fallback to employee defaults
  earnings: req.body.earnings || employee.earnings,
  deductions: req.body.deductions || employee.deductions,
});


    res.json({ success: true, data: newSlip });
  } catch (err) {
    console.error("Error creating payslip:", err);
    res.status(500).json({ error: "Failed to create payslip" });
  }
};

// GET all payslips
export const getAllPaySlips = async (req, res) => {
  try {
    const slips = await PaySlip.find().sort({ createdAt: 1 });
    res.json({ success: true, data: slips });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch payslips" });
  }
};

// GET payslip by employee + month + year
export const getPaySlipByEmp = async (req, res) => {
  const { employeeId, month, year } = req.query;

  try {
    const slip = await PaySlip.findOne({ employeeId, month, year });
    res.json({ success: true, data: slip });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch employee payslip" });
  }
};

// UPDATE payslip by ID
export const updatePaySlip = async (req, res) => {
  const { id } = req.params;
  try {
    const updatedSlip = await PaySlip.findByIdAndUpdate(id, req.body, { new: true });
    if (!updatedSlip) {
      return res.status(404).json({ error: "Payslip not found" });
    }
    res.json({ success: true, data: updatedSlip });
  } catch (err) {
    res.status(500).json({ error: "Failed to update payslip" });
  }
};

// DELETE payslip by ID
export const deletePaySlip = async (req, res) => {
  const { id } = req.params;
  try {
    const deletedSlip = await PaySlip.findByIdAndDelete(id);
    if (!deletedSlip) {
      return res.status(404).json({ error: "Payslip not found" });
    }
    res.json({ success: true, message: "Payslip deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete payslip" });
  }
};

// GET employee by employeeID (for frontend prefill)
export const getEmployeeById = async (req, res) => {
  try {
    const employeeId = req.params.employeeId.toUpperCase();

    const employee = await Employee.findOne({ employeeID: employeeId });
    if (!employee) {
      return res.status(404).json({ success: false, message: "Employee not found" });
    }

    res.json({ success: true, data: employee });
  } catch (err) {
    console.error("Error fetching employee:", err);
    res.status(500).json({ error: "Server Error" });
  }
};
