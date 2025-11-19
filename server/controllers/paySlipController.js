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
    const slips = await PaySlip.find().sort({ createdAt: -1 });
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
