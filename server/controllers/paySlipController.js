import PaySlip from "../models/PaySlip.js";

// CREATE payslip
export const createPaySlip = async (req, res) => {
  try {
    const newSlip = await PaySlip.create(req.body);
    res.json({ success: true, data: newSlip });
  } catch (err) {
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