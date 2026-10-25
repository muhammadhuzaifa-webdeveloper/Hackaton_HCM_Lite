import mongoose from "mongoose";

const payrollItemSchema = new mongoose.Schema({
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Employee",
    required: true,
  },
  employeeCode: { type: String, required: true },
  employeeName: { type: String, required: true },
  department: { type: String, default: "" },
  designation: { type: String, default: "" },
  basicSalary: { type: Number, required: true },
  hra: { type: Number, default: 0 },
  medical: { type: Number, default: 0 },
  grossSalary: { type: Number, required: true },
  workingDaysInMonth: { type: Number, required: true },
  perDayRate: { type: Number, required: true },
  absentDays: { type: Number, default: 0 },
  halfDays: { type: Number, default: 0 },
  unpaidLeaveDays: { type: Number, default: 0 },
  lateDays: { type: Number, default: 0 },
  latePenaltyDays: { type: Number, default: 0 },
  proratedDays: { type: Number, default: 0 },
  deductions: { type: Number, default: 0 },
  annualGross: { type: Number, default: 0 },
  annualTax: { type: Number, default: 0 },
  monthlyTax: { type: Number, default: 0 },
  netPay: { type: Number, required: true },
});

const payrollRunSchema = new mongoose.Schema(
  {
    month: {
      type: String, // YYYY-MM
      required: true,
      unique: true,
    },
    totalEmployees: { type: Number, default: 0 },
    totalWorkingDays: { type: Number, default: 0 },
    totalGross: { type: Number, default: 0 },
    totalDeductions: { type: Number, default: 0 },
    totalTax: { type: Number, default: 0 },
    totalNet: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ["draft", "finalized"],
      default: "draft",
    },
    preparedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    finalizedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    finalizedAt: {
      type: Date,
    },
    items: [payrollItemSchema],
  },
  { timestamps: true }
);

export default mongoose.model("PayrollRun", payrollRunSchema);
