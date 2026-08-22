"use client";

import React, { useState } from "react";
import { jsPDF } from "jspdf";
import { SalaryBreakdownData, PayrollRecordStatus } from "@/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  Download,
  Printer,
  FileCheck,
  Building,
  CreditCard,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Receipt,
  User,
  Sparkles,
  ShieldCheck,
  Loader2,
} from "lucide-react";

export interface PayslipEmployeeMeta {
  employeeId: string;
  name: string;
  department: string;
  designation: string;
  email?: string;
  joiningDate?: string | Date | null;
  bankName?: string | null;
  accountNumber?: string | null;
  paymentMethod?: string | null;
  totalDays: number;
  payableDays: number;
  lopDays: number;
}

export interface PayslipProps {
  month: number;
  year: number;
  employee: PayslipEmployeeMeta;
  breakdown: SalaryBreakdownData;
  currency?: string;
  status?: PayrollRecordStatus;
  showDownloadButton?: boolean;
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

/**
 * Generate and download high-resolution PDF Payslip via client-side jsPDF
 */
export function generatePayslipPDF({
  month,
  year,
  employee,
  breakdown,
  currency = "USD",
  status = "Paid",
}: {
  month: number;
  year: number;
  employee: PayslipEmployeeMeta;
  breakdown: SalaryBreakdownData;
  currency?: string;
  status?: PayrollRecordStatus;
}) {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const monthName = MONTH_NAMES[month - 1] || "Month";
  const periodStr = `${monthName} ${year}`;
  const pageWidth = 210;
  const leftMargin = 14;
  const rightMargin = 196;
  const contentWidth = rightMargin - leftMargin;

  // --- 1. TOP HEADER BANNER ---
  doc.setFillColor(15, 23, 42); // slate-900
  doc.roundedRect(leftMargin, 12, contentWidth, 26, 3, 3, "F");

  // Company Branding
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("DAYFLOW HRMS", leftMargin + 8, 22);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(148, 163, 184); // slate-400
  doc.text("Enterprise Human Resource & Compensation Engine", leftMargin + 8, 28);
  doc.text("Section 3.6 Automated Payroll Core", leftMargin + 8, 33);

  // Payslip Title on Right
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text("OFFICIAL SALARY SLIP", rightMargin - 8, 22, { align: "right" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(199, 210, 254); // indigo-200
  doc.text(`Period: ${periodStr}`, rightMargin - 8, 28, { align: "right" });

  const statusLabel = status.toUpperCase();
  doc.setFontSize(8);
  if (status === "Paid") {
    doc.setTextColor(52, 211, 153); // emerald-400
  } else if (status === "Approved") {
    doc.setTextColor(129, 140, 248); // indigo-400
  } else {
    doc.setTextColor(251, 191, 36); // amber-400
  }
  doc.text(`Status: ${statusLabel}`, rightMargin - 8, 33, { align: "right" });

  // --- 2. EMPLOYEE & ATTENDANCE DETAILS BOX ---
  let yPos = 43;
  doc.setFillColor(248, 250, 252); // slate-50
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.roundedRect(leftMargin, yPos, contentWidth, 42, 2, 2, "FD");

  // Section Header
  doc.setFillColor(241, 245, 249); // slate-100
  doc.rect(leftMargin, yPos, contentWidth, 7, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85); // slate-700
  doc.text("EMPLOYEE SUMMARY & ATTENDANCE RECONCILIATION", leftMargin + 4, yPos + 5);

  // Left Column Meta
  yPos += 12;
  const col1X = leftMargin + 4;
  const col2X = leftMargin + 66;
  const col3X = leftMargin + 130;

  doc.setFontSize(8);
  
  // Row 1
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 116, 139);
  doc.text("Employee Name:", col1X, yPos);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  doc.text(employee.name, col1X + 24, yPos);

  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 116, 139);
  doc.text("Employee ID:", col2X, yPos);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  doc.text(employee.employeeId, col2X + 20, yPos);

  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 116, 139);
  doc.text("Total Month Days:", col3X, yPos);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  doc.text(`${employee.totalDays || 30} Days`, col3X + 28, yPos);

  // Row 2
  yPos += 6.5;
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 116, 139);
  doc.text("Department:", col1X, yPos);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  doc.text(employee.department, col1X + 24, yPos);

  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 116, 139);
  doc.text("Designation:", col2X, yPos);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  doc.text(employee.designation, col2X + 20, yPos);

  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 116, 139);
  doc.text("Payable Days:", col3X, yPos);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(16, 185, 129); // emerald-600
  doc.text(`${employee.payableDays} Days`, col3X + 28, yPos);

  // Row 3
  yPos += 6.5;
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 116, 139);
  doc.text("Bank Name:", col1X, yPos);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  doc.text(employee.bankName || "Corporate Payroll Bank", col1X + 24, yPos);

  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 116, 139);
  doc.text("Account No:", col2X, yPos);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  doc.text(employee.accountNumber || "**** **** 3819", col2X + 20, yPos);

  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 116, 139);
  doc.text("LOP Deductions:", col3X, yPos);
  doc.setFont("helvetica", "bold");
  if (employee.lopDays > 0) {
    doc.setTextColor(225, 29, 72); // rose-600
    doc.text(`${employee.lopDays} Days`, col3X + 28, yPos);
  } else {
    doc.setTextColor(15, 23, 42);
    doc.text("0 Days", col3X + 28, yPos);
  }

  // Row 4
  yPos += 6.5;
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 116, 139);
  doc.text("Payment Mode:", col1X, yPos);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  doc.text(employee.paymentMethod || "Bank Transfer", col1X + 24, yPos);

  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 116, 139);
  doc.text("Email:", col2X, yPos);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  doc.text(employee.email || "employee@dayflow.com", col2X + 20, yPos);

  // --- 3. TWO-COLUMN ITEMIZED BREAKDOWN TABLE ---
  yPos = 90;
  const colWidth = (contentWidth - 6) / 2; // 88mm each
  const earningsX = leftMargin;
  const deductionsX = leftMargin + colWidth + 6;

  // --- COLUMN 1: EARNINGS ---
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(earningsX, yPos, colWidth, 75, 2, 2, "FD");

  // Earnings Header
  doc.setFillColor(238, 242, 255); // indigo-50
  doc.rect(earningsX, yPos, colWidth, 7, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(67, 56, 202); // indigo-700
  doc.text("EARNINGS & ALLOWANCES", earningsX + 4, yPos + 5);
  doc.text("AMOUNT", earningsX + colWidth - 4, yPos + 5, { align: "right" });

  let eY = yPos + 14;
  const earningsList = [
    { label: "Basic Salary (50%)", amount: breakdown.basic },
    { label: "House Rent Allowance (HRA 20%)", amount: breakdown.hra },
    { label: "Special Allowance (30%)", amount: breakdown.specialAllowance },
  ];

  doc.setFontSize(8);
  for (const item of earningsList) {
    doc.setFont("helvetica", "normal");
    doc.setTextColor(51, 65, 85);
    doc.text(item.label, earningsX + 4, eY);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(15, 23, 42);
    doc.text(formatCurrency(item.amount, currency), earningsX + colWidth - 4, eY, { align: "right" });
    eY += 9;
  }

  // Total Gross Earnings Line
  eY = yPos + 64;
  doc.setDrawColor(226, 232, 240);
  doc.line(earningsX + 4, eY - 3, earningsX + colWidth - 4, eY - 3);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text("TOTAL GROSS SALARY", earningsX + 4, eY + 3);
  doc.setTextColor(79, 70, 229); // indigo-600
  doc.text(formatCurrency(breakdown.grossSalary, currency), earningsX + colWidth - 4, eY + 3, { align: "right" });

  // --- COLUMN 2: DEDUCTIONS ---
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(deductionsX, yPos, colWidth, 75, 2, 2, "FD");

  // Deductions Header
  doc.setFillColor(255, 241, 242); // rose-50
  doc.rect(deductionsX, yPos, colWidth, 7, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(190, 18, 60); // rose-700
  doc.text("STATUTORY DEDUCTIONS & LOP", deductionsX + 4, yPos + 5);
  doc.text("AMOUNT", deductionsX + colWidth - 4, yPos + 5, { align: "right" });

  let dY = yPos + 14;
  const deductionsList = [
    { label: "Provident Fund (PF - 12% of Basic)", amount: breakdown.pf },
    { label: "Employee State Insurance (ESI - 0.75%)", amount: breakdown.esi },
    { label: "Professional Tax (PT - Flat 200)", amount: breakdown.pt },
    {
      label: `Loss of Pay (${employee.lopDays} Day${employee.lopDays === 1 ? "" : "s"} LOP)`,
      amount: breakdown.lopDeduction,
      isLop: true,
    },
  ];

  doc.setFontSize(8);
  for (const item of deductionsList) {
    doc.setFont("helvetica", "normal");
    doc.setTextColor(51, 65, 85);
    doc.text(item.label, deductionsX + 4, dY);
    doc.setFont("helvetica", "bold");
    if (item.amount > 0) {
      doc.setTextColor(225, 29, 72); // rose-600
      doc.text(`-${formatCurrency(item.amount, currency)}`, deductionsX + colWidth - 4, dY, { align: "right" });
    } else {
      doc.setTextColor(100, 116, 139);
      doc.text(formatCurrency(0, currency), deductionsX + colWidth - 4, dY, { align: "right" });
    }
    dY += 9;
  }

  // Total Deductions Line
  dY = yPos + 64;
  doc.setDrawColor(226, 232, 240);
  doc.line(deductionsX + 4, dY - 3, deductionsX + colWidth - 4, dY - 3);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text("TOTAL DEDUCTIONS", deductionsX + 4, dY + 3);
  doc.setTextColor(225, 29, 72); // rose-600
  doc.text(`-${formatCurrency(breakdown.totalDeductions, currency)}`, deductionsX + colWidth - 4, dY + 3, { align: "right" });

  // --- 4. NET SALARY CALLOUT HERO BANNER ---
  yPos = 171;
  doc.setFillColor(240, 253, 244); // emerald-50
  doc.setDrawColor(187, 247, 208); // emerald-200
  doc.roundedRect(leftMargin, yPos, contentWidth, 24, 3, 3, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(22, 101, 52); // emerald-800
  doc.text("NET TAKE-HOME PAYABLE SALARY", leftMargin + 8, yPos + 10);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text("Gross Earnings minus Statutory PF, ESI, PT, and Attendance Loss-of-Pay deductions", leftMargin + 8, yPos + 17);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(5, 150, 105); // emerald-600
  doc.text(formatCurrency(breakdown.netPay, currency), rightMargin - 8, yPos + 14, { align: "right" });

  // --- 5. STATUTORY & VERIFICATION FOOTER ---
  yPos = 205;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(leftMargin, yPos, contentWidth, 36, 2, 2, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(51, 65, 85);
  doc.text("STATUTORY DECLARATION & AUDIT VERIFICATION", leftMargin + 6, yPos + 6);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text(
    "• Deductions calculated under Section 3.6 Statutory Payroll Rules (PF @ 12% of Basic, ESI @ 0.75%, PT Flat 200).",
    leftMargin + 6,
    yPos + 12
  );
  doc.text(
    "• Loss-of-Pay (LOP) reconciled automatically from verified biometric / web check-in attendance logs.",
    leftMargin + 6,
    yPos + 17
  );
  doc.text(
    "• This is a computer-generated salary slip authenticated by Dayflow HRMS. No physical signature is required.",
    leftMargin + 6,
    yPos + 22
  );
  doc.text(
    `• Generated on: ${formatDate(new Date())} | Confidential record for ${employee.name} (${employee.employeeId}).`,
    leftMargin + 6,
    yPos + 27
  );

  // Bottom Watermark
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text("Dayflow HRMS • Enterprise Compensation Module • Confidential", pageWidth / 2, 285, { align: "center" });

  // Save the PDF file
  const fileName = `Dayflow_Payslip_${employee.employeeId}_${monthName}_${year}.pdf`;
  doc.save(fileName);
}

export function PayslipDocument({
  month,
  year,
  employee,
  breakdown,
  currency = "USD",
  status = "Paid",
  showDownloadButton = true,
}: PayslipProps) {
  const [downloading, setDownloading] = useState(false);
  const monthName = MONTH_NAMES[month - 1] || "Month";

  const handleDownloadPDF = async () => {
    try {
      setDownloading(true);
      // Small timeout to allow UI spinner feedback
      await new Promise((resolve) => setTimeout(resolve, 300));
      generatePayslipPDF({
        month,
        year,
        employee,
        breakdown,
        currency,
        status,
      });
    } catch (err) {
      console.error("Failed to generate PDF payslip:", err);
    } finally {
      setDownloading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Action Header Card */}
      {showDownloadButton && (
        <div className="p-5 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
          <div className="flex items-center gap-3.5">
            <div className="p-3 rounded-2xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
              <Receipt className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">Monthly Payslip Document</h3>
                <span
                  className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                    status === "Paid"
                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                      : status === "Approved"
                      ? "bg-indigo-500/10 text-indigo-300 border-indigo-500/30"
                      : "bg-amber-500/10 text-amber-400 border-amber-500/30"
                  }`}
                >
                  {status}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Official statement for {monthName} {year} • Section 3.6 Automated Engine
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
            >
              <Printer className="w-4 h-4" />
              <span>Print</span>
            </button>

            <button
              onClick={handleDownloadPDF}
              disabled={downloading}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50"
            >
              {downloading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Generating PDF...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Download PDF Payslip</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Styled Printable / Screen Payslip Document */}
      <div className="rounded-3xl border border-slate-800 bg-[#0e1424] overflow-hidden shadow-2xl p-6 sm:p-8 space-y-6">
        
        {/* Document Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white font-bold shadow-md shadow-indigo-600/30">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white tracking-tight">Dayflow HRMS</h2>
              <p className="text-[11px] text-slate-400">Enterprise Human Resource & Compensation Engine</p>
            </div>
          </div>

          <div className="sm:text-right">
            <span className="text-[10px] uppercase font-bold tracking-widest text-indigo-400 block">
              Salary Statement
            </span>
            <div className="text-base font-bold text-white">
              {monthName} {year}
            </div>
          </div>
        </div>

        {/* Employee Summary & Attendance Reconciliation Meta Grid */}
        <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-4">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
            <User className="w-3.5 h-3.5 text-indigo-400" />
            <span>Employee Summary & Attendance Reconciliation</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div>
              <span className="text-slate-500 block text-[10px]">Employee ID</span>
              <strong className="text-indigo-300 font-mono">{employee.employeeId}</strong>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">Full Name</span>
              <strong className="text-white">{employee.name}</strong>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">Department</span>
              <strong className="text-slate-200">{employee.department}</strong>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">Designation</span>
              <strong className="text-slate-200">{employee.designation}</strong>
            </div>

            <div>
              <span className="text-slate-500 block text-[10px]">Month Total Days</span>
              <strong className="text-white font-mono">{employee.totalDays || 30} Days</strong>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">Final Payable Days</span>
              <strong className="text-emerald-400 font-mono">{employee.payableDays} Days</strong>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">Loss of Pay (LOP)</span>
              <strong className={employee.lopDays > 0 ? "text-rose-400 font-mono" : "text-slate-400 font-mono"}>
                {employee.lopDays} Days
              </strong>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">Payment Mode</span>
              <strong className="text-slate-200">{employee.paymentMethod || "Bank Transfer"}</strong>
            </div>
          </div>
        </div>

        {/* Two-Column Itemized Grid: Earnings vs Deductions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          
          {/* Column 1: Earnings */}
          <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <span className="font-bold text-white text-xs uppercase tracking-wider">Earnings & Allowances</span>
              <span className="text-[10px] font-semibold text-emerald-400">Additions (+)</span>
            </div>

            <div className="space-y-3 text-xs font-mono">
              <div className="flex items-center justify-between text-slate-300">
                <span>Basic Salary (50%):</span>
                <span className="font-bold text-white">
                  {formatCurrency(breakdown.basic, currency)}
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span>House Rent Allowance (HRA 20%):</span>
                <span className="font-bold text-white">
                  {formatCurrency(breakdown.hra, currency)}
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span>Special Allowance (30%):</span>
                <span className="font-bold text-white">
                  {formatCurrency(breakdown.specialAllowance, currency)}
                </span>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex items-center justify-between font-bold font-mono text-sm">
              <span className="text-white">Total Gross Salary:</span>
              <span className="text-indigo-400">
                {formatCurrency(breakdown.grossSalary, currency)}
              </span>
            </div>
          </div>

          {/* Column 2: Deductions */}
          <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <span className="font-bold text-white text-xs uppercase tracking-wider">Statutory & LOP Deductions</span>
              <span className="text-[10px] font-semibold text-rose-400">Deductions (-)</span>
            </div>

            <div className="space-y-3 text-xs font-mono">
              <div className="flex items-center justify-between text-slate-300">
                <span title="12% of Basic Pay">Provident Fund (PF):</span>
                <span className="font-semibold text-rose-400">
                  -{formatCurrency(breakdown.pf, currency)}
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span title="0.75% of Gross if Gross <= 21,000">ESI (0.75%):</span>
                <span className="font-semibold text-rose-400">
                  -{formatCurrency(breakdown.esi, currency)}
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span title="Flat 200 Standard Tax">Professional Tax (PT):</span>
                <span className="font-semibold text-rose-400">
                  -{formatCurrency(breakdown.pt, currency)}
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span>Loss of Pay ({employee.lopDays}d):</span>
                <span className="font-semibold text-rose-400">
                  -{formatCurrency(breakdown.lopDeduction, currency)}
                </span>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex items-center justify-between font-bold font-mono text-sm">
              <span className="text-white">Total Deductions:</span>
              <span className="text-rose-400">
                -{formatCurrency(breakdown.totalDeductions, currency)}
              </span>
            </div>
          </div>

        </div>

        {/* Net Pay Callout Banner */}
        <div className="p-6 rounded-2xl bg-gradient-to-r from-emerald-950/60 via-slate-950 to-indigo-950/60 border border-emerald-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg">
          <div>
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider block">
              Net Take-Home Payable Compensation
            </span>
            <p className="text-[11px] text-slate-300 mt-0.5">
              Net Salary = Gross Salary - (PF + ESI + PT + Loss of Pay Deductions)
            </p>
          </div>

          <div className="sm:text-right">
            <div className="text-3xl font-black text-emerald-400 font-mono">
              {formatCurrency(breakdown.netPay, currency)}
            </div>
            <span className="text-[10px] text-slate-400 font-mono">
              Direct Deposit • {employee.bankName || "Corporate Payroll Bank"}
            </span>
          </div>
        </div>

        {/* Document Footer Verification Note */}
        <div className="pt-4 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[10px] text-slate-400">
          <div>
            <span>Dayflow HRMS Section 3.6 Automated Compensation Engine</span>
          </div>
          <div>
            <span>Computer-generated document • No signature required</span>
          </div>
        </div>

      </div>
    </div>
  );
}

export default PayslipDocument;
