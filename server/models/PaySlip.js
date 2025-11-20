import mongoose from "mongoose";

const earningSchema = new mongoose.Schema({
  headName: { type: String, required: true },
  type: { type: String, required: true }, // add type
  amount: { type: Number, required: true },
});

const deductionSchema = new mongoose.Schema({
  headName: { type: String, required: true },
  type: { type: String, required: true }, // add type
  amount: { type: Number, required: true },
});

const paySlipSchema = new mongoose.Schema(
  {
    employeeId: { type: String, required: true },
    employeeName: { type: String, required: true },
    mobile: { type: String },
    email: { type: String },
    month: { type: String, required: true },
    year: { type: String, required: true },

    earnings: [earningSchema],
    deductions: [deductionSchema],

    grossSalary: Number,
    totalDeduction: Number,
    netSalary: Number,
  },
  { timestamps: true }
);

export default mongoose.model("PaySlip", paySlipSchema);
