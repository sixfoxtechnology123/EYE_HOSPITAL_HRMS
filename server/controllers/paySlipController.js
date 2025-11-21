// paySlipController.js
import PaySlip from "../models/PaySlip.js";
import Employee from "../models/Employee.js";

// Helper function to update employee earnings and deductions
const updateEmployeePayDetails = async (employeeId, earnings, deductions) => {
  const updatedEarnings = earnings.map(e => ({
    _id: e._id || undefined, // preserve _id if exists
    headName: e.headName,
    headType: e.type || "",
    value: Number(e.amount) || 0
  }));

  const updatedDeductions = deductions.map(d => ({
    _id: d._id || undefined,
    headName: d.headName,
    headType: d.type || "",
    value: Number(d.amount) || 0
  }));

  await Employee.findByIdAndUpdate(
    employeeId,
    {
      $set: {
        earnings: updatedEarnings,
        deductions: updatedDeductions
      }
    },
    { new: true, upsert: true }
  );
};

// CREATE Payslip
export const createPaySlip = async (req, res) => {
  try {
    const { employeeId, earnings, deductions, month, year, payDetails } = req.body;

    if (!month || !year) return res.status(400).json({ error: "Month & Year required" });

    const employee = await Employee.findOne({ employeeID: employeeId.toUpperCase() });
    if (!employee) return res.status(404).json({ error: "Employee not found" });

    const mappedEarnings = earnings.map(e => ({
      headName: e.headName,
      type: e.type || "FIXED",
      amount: Number(e.amount || 0)
    }));

    const mappedDeductions = deductions.map(d => ({
      headName: d.headName,
      type: d.type || "FIXED",
      amount: Number(d.amount || 0)
    }));

    const newSlip = await PaySlip.create({
      employeeId: employee.employeeID,
      employeeName: `${employee.salutation} ${employee.firstName} ${employee.lastName || ""}`.trim(),
      month,
      year,
      earnings: mappedEarnings,
      deductions: mappedDeductions,
      payDetails: payDetails || {}
    });

    //  Update Employee top-level earnings & deductions
    await updateEmployeePayDetails(employee._id, mappedEarnings, mappedDeductions);

    res.json({ success: true, data: newSlip });

  } catch (err) {
    console.error("Error creating payslip:", err);
    res.status(500).json({ error: err.message || "Failed to create payslip" });
  }
};

// UPDATE Payslip
export const updatePaySlip = async (req, res) => {
  try {
    const { payslipId } = req.params;
    const { earnings, deductions, payDetails, month, year } = req.body;

    if (!month || !year) return res.status(400).json({ error: "Month & Year required" });

    const payslip = await PaySlip.findById(payslipId);
    if (!payslip) return res.status(404).json({ error: "PaySlip not found" });

    const mappedEarnings = earnings.map(e => ({
      headName: e.headName,
      type: e.type || "FIXED",
      amount: Number(e.amount || 0)
    }));

    const mappedDeductions = deductions.map(d => ({
      headName: d.headName, // ✅ fixed: use d instead of e
      type: d.type || "FIXED",
      amount: Number(d.amount || 0)
    }));

    payslip.earnings = mappedEarnings;
    payslip.deductions = mappedDeductions;
    payslip.payDetails = payDetails || payslip.payDetails;
    payslip.month = month;
    payslip.year = year;

    await payslip.save();

    // ✅ Update Employee top-level earnings & deductions
    await updateEmployeePayDetails(payslip.employeeId, mappedEarnings, mappedDeductions);

    res.json({ success: true, data: payslip });

  } catch (err) {
    console.error("Error updating payslip:", err);
    res.status(500).json({ error: err.message || "Failed to update payslip" });
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
