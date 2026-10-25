// utils/pdfGenerator.js
import PDFDocument from "pdfkit";

export function generatePayslipPDF(payrollItem, month, companyName = "HCM Lite", stream) {
  const doc = new PDFDocument({ size: "A4", margin: 40 });
  doc.pipe(stream);

  // Header
  doc
    .fontSize(22)
    .fillColor("#1e3a8a")
    .text(companyName.toUpperCase(), { align: "center" })
    .moveDown(0.2);

  doc
    .fontSize(14)
    .fillColor("#475569")
    .text(`CONFIDENTIAL PAYSLIP - ${month}`, { align: "center" })
    .moveDown(0.8);

  // Divider line
  doc
    .strokeColor("#cbd5e1")
    .lineWidth(1)
    .moveTo(40, doc.y)
    .lineTo(555, doc.y)
    .stroke()
    .moveDown(0.8);

  // Employee Information Table
  const startY = doc.y;
  doc.fontSize(10).fillColor("#1e293b");

  // Left Column
  doc.text(`Employee Code: ${payrollItem.employeeCode}`, 45, startY);
  doc.text(`Employee Name: ${payrollItem.employeeName}`, 45, startY + 16);
  doc.text(`Department: ${payrollItem.department || "General"}`, 45, startY + 32);
  doc.text(`Designation: ${payrollItem.designation || "Staff"}`, 45, startY + 48);

  // Right Column
  doc.text(`Payroll Month: ${month}`, 320, startY);
  doc.text(`Working Days in Month: ${payrollItem.workingDaysInMonth}`, 320, startY + 16);
  doc.text(`Per Day Rate: PKR ${payrollItem.perDayRate?.toLocaleString()}`, 320, startY + 32);
  doc.text(
    `Attendance Notes: ${payrollItem.absentDays} Absents, ${payrollItem.lateDays} Lates, ${payrollItem.halfDays} Half Days`,
    320,
    startY + 48
  );

  doc.y = startY + 75;

  // Earnings & Deductions Box
  doc
    .rect(40, doc.y, 515, 20)
    .fill("#f1f5f9");

  doc
    .fontSize(10)
    .fillColor("#0f172a")
    .text("EARNINGS & ALLOWANCES", 50, doc.y + 5)
    .text("DEDUCTIONS & TAXES", 320, doc.y + 5);

  doc.moveDown(1.5);
  const detailY = doc.y;

  // Left Column (Earnings)
  doc.fillColor("#334155").fontSize(10);
  doc.text("Basic Salary:", 50, detailY);
  doc.text(`PKR ${payrollItem.basicSalary?.toLocaleString()}`, 200, detailY, { align: "right", width: 80 });

  doc.text("House Rent (HRA 40%):", 50, detailY + 20);
  doc.text(`PKR ${payrollItem.hra?.toLocaleString()}`, 200, detailY + 20, { align: "right", width: 80 });

  doc.text("Medical Allowance (10%):", 50, detailY + 40);
  doc.text(`PKR ${payrollItem.medical?.toLocaleString()}`, 200, detailY + 40, { align: "right", width: 80 });

  doc
    .strokeColor("#e2e8f0")
    .moveTo(50, detailY + 60)
    .lineTo(280, detailY + 60)
    .stroke();

  doc.fontSize(10).fillColor("#0f172a").text("Gross Salary:", 50, detailY + 68);
  doc.text(`PKR ${payrollItem.grossSalary?.toLocaleString()}`, 200, detailY + 68, { align: "right", width: 80 });

  // Right Column (Deductions)
  doc.fillColor("#334155").fontSize(10);
  doc.text(`Absent / Half Day Deductions:`, 320, detailY);
  doc.text(`PKR ${payrollItem.deductions?.toLocaleString()}`, 470, detailY, { align: "right", width: 75 });

  doc.text(`Income Tax (Monthly):`, 320, detailY + 20);
  doc.text(`PKR ${payrollItem.monthlyTax?.toLocaleString()}`, 470, detailY + 20, { align: "right", width: 75 });

  if (payrollItem.latePenaltyDays > 0) {
    doc.text(`Late Penalty Days:`, 320, detailY + 40);
    doc.text(`${payrollItem.latePenaltyDays} days`, 470, detailY + 40, { align: "right", width: 75 });
  }

  const totalDeductions = (payrollItem.deductions || 0) + (payrollItem.monthlyTax || 0);
  doc
    .strokeColor("#e2e8f0")
    .moveTo(320, detailY + 60)
    .lineTo(545, detailY + 60)
    .stroke();

  doc.fontSize(10).fillColor("#dc2626").text("Total Deductions:", 320, detailY + 68);
  doc.text(`PKR ${totalDeductions?.toLocaleString()}`, 470, detailY + 68, { align: "right", width: 75 });

  // Net Pay Highlight Box
  const netY = detailY + 105;
  doc
    .rect(40, netY, 515, 45)
    .fill("#1e3a8a");

  doc
    .fontSize(13)
    .fillColor("#ffffff")
    .text("NET SALARY PAYABLE", 60, netY + 15);

  doc
    .fontSize(16)
    .fillColor("#ffffff")
    .text(`PKR ${payrollItem.netPay?.toLocaleString()}`, 350, netY + 13, { align: "right", width: 190 });

  // Annual projection footer
  doc
    .fontSize(9)
    .fillColor("#64748b")
    .text(
      `* Annualized Gross: PKR ${payrollItem.annualGross?.toLocaleString()} | Projected Annual Tax: PKR ${payrollItem.annualTax?.toLocaleString()}`,
      45,
      netY + 65
    )
    .text(
      "This is a system-generated payslip from HCM Lite and does not require a physical signature.",
      45,
      netY + 80
    );

  doc.end();
}
