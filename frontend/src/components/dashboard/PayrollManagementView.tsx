"use client";

import { useState, useEffect } from "react";
import { hcmApi } from "@/api/hcm";
import { DollarSign, Lock, Download, FileText, CheckCircle, AlertTriangle, Eye, ArrowDownToLine } from "lucide-react";

interface PayrollProps {
  userRole: string;
}

export default function PayrollManagementView({ userRole }: PayrollProps) {
  const isAdmin = userRole === "Admin";
  const isHR = userRole === "HR";
  const isHRorAdmin = isAdmin || isHR;

  const [month, setMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const [runs, setRuns] = useState<any[]>([]);
  const [selectedRun, setSelectedRun] = useState<any>(null);
  const [myPayslips, setMyPayslips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [drafting, setDrafting] = useState(false);
  const [finalizing, setFinalizing] = useState(false);
  const [msg, setMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const loadData = async () => {
    setLoading(true);
    try {
      if (isHRorAdmin) {
        const res = await hcmApi.getPayrollRuns();
        setRuns(res.runs || []);
        if (res.runs?.length > 0 && !selectedRun) {
          setSelectedRun(res.runs[0]);
        }
      } else {
        const res = await hcmApi.getMyPayslips();
        setMyPayslips(res.payslips || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleGenerateDraft = async () => {
    setDrafting(true);
    setMsg("");
    setErrorMsg("");

    try {
      const res = await hcmApi.createPayrollDraft(month);
      setMsg(res.message || `Payroll draft generated for ${month}`);
      setSelectedRun(res.payrollRun);
      loadData();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || "Failed to generate payroll draft.");
    } finally {
      setDrafting(false);
    }
  };

  const handleFinalize = async (id: string) => {
    if (!isAdmin) return;
    if (!confirm("Are you sure you want to finalize this payroll? Once finalized, it will be PERMANENTLY LOCKED and cannot be edited.")) {
      return;
    }

    setFinalizing(true);
    setMsg("");
    setErrorMsg("");

    try {
      const res = await hcmApi.finalizePayrollRun(id);
      setMsg(res.message || "Payroll finalized and locked.");
      loadData();
      if (selectedRun?._id === id) {
        setSelectedRun({ ...selectedRun, status: "finalized" });
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || "Failed to finalize payroll.");
    } finally {
      setFinalizing(false);
    }
  };

  const handleDownloadPDF = (runId: string, employeeId: string, code: string) => {
    const url = hcmApi.downloadPayslipPDFUrl(runId, employeeId);
    window.open(url, "_blank");
  };

  // Dynamic Theme Styling based on userRole
  const cardBg = isAdmin 
    ? "bg-slate-900 border-slate-800 text-white" 
    : "bg-white border-slate-200 text-slate-900";

  const tableHeaderBg = isAdmin ? "bg-slate-800/80 text-slate-400" : "bg-slate-50 text-slate-500";
  const rowHoverBg = isAdmin ? "hover:bg-slate-800/40" : "hover:bg-slate-50/50";
  const dividerColor = isAdmin ? "divide-slate-800" : "divide-slate-100";
  const inputBg = isAdmin 
    ? "bg-slate-800 border-slate-700 text-white placeholder:text-slate-500" 
    : "bg-slate-50 border-slate-300 text-slate-900 placeholder:text-slate-400";

  return (
    <div className="space-y-6">
      {msg && (
        <div className="flex items-center gap-2 rounded-xl bg-emerald-50 p-3 text-xs text-emerald-600 border border-emerald-200 dark:bg-emerald-950/40">
          <CheckCircle className="h-4 w-4 shrink-0" />
          <span>{msg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="flex items-center gap-2 rounded-xl bg-red-50 p-3 text-xs text-red-600 border border-red-200 dark:bg-red-950/40">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* HR & ADMIN MANAGEMENT VIEW */}
      {isHRorAdmin ? (
        <>
          {/* Top Generator Card */}
          <div className={`p-5 rounded-2xl border shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${cardBg}`}>
            <div>
              <h3 className="text-sm font-bold flex items-center gap-2">
                <DollarSign className={`h-4 w-4 ${isAdmin ? "text-emerald-400" : "text-emerald-600"}`} />
                Monthly Payroll Engine
              </h3>
              <p className={`text-xs ${isAdmin ? "text-slate-400" : "text-slate-500"}`}>
                Gross = 1.5 × Basic · Deductions (Absent, Unpaid, 0.5×Half-day, 3 Lates penalty) · 5-Slab Tax
              </p>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="month"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                className={`rounded-xl border px-3 py-1.5 text-xs focus:outline-none ${inputBg}`}
              />
              <button
                onClick={handleGenerateDraft}
                disabled={drafting}
                className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 transition disabled:opacity-50"
              >
                {drafting ? "Calculating..." : "Run Monthly Draft"}
              </button>
            </div>
          </div>

          {/* Runs Selector Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            <span className="text-xs font-bold text-slate-400">Available Runs:</span>
            {runs.length === 0 ? (
              <span className="text-xs text-slate-400">No payroll runs yet. Click &apos;Run Monthly Draft&apos; above.</span>
            ) : (
              runs.map((r) => (
                <button
                  key={r._id}
                  onClick={() => setSelectedRun(r)}
                  className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
                    selectedRun?._id === r._id
                      ? (isAdmin ? "bg-white text-slate-900" : "bg-slate-900 text-white")
                      : (isAdmin ? "bg-slate-800 text-slate-200 border border-slate-700" : "bg-white text-slate-700 border border-slate-200")
                  }`}
                >
                  {r.status === "finalized" && <Lock className="h-3 w-3 text-amber-500" />}
                  <span>{r.month}</span>
                  <span className="text-[10px] opacity-70 uppercase">({r.status})</span>
                </button>
              ))
            )}
          </div>

          {/* Selected Run Details */}
          {selectedRun && (
            <div className="space-y-4">
              {/* Summary KPIs */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className={`p-4 rounded-xl border ${cardBg}`}>
                  <span className={`text-[11px] ${isAdmin ? "text-slate-400" : "text-slate-500"}`}>Total Employees</span>
                  <p className="text-xl font-bold mt-1">
                    {selectedRun.totalEmployees}
                  </p>
                </div>
                <div className={`p-4 rounded-xl border ${cardBg}`}>
                  <span className={`text-[11px] ${isAdmin ? "text-slate-400" : "text-slate-500"}`}>Total Gross</span>
                  <p className="text-xl font-bold mt-1">
                    PKR {selectedRun.totalGross?.toLocaleString()}
                  </p>
                </div>
                <div className={`p-4 rounded-xl border ${cardBg}`}>
                  <span className={`text-[11px] ${isAdmin ? "text-slate-400" : "text-slate-500"}`}>Total Deductions & Tax</span>
                  <p className="text-xl font-bold text-red-500 mt-1">
                    PKR {((selectedRun.totalDeductions || 0) + (selectedRun.totalTax || 0)).toLocaleString()}
                  </p>
                </div>
                <div className={`p-4 rounded-xl border ${isAdmin ? "bg-emerald-950/40 border-emerald-900" : "bg-emerald-50 border-emerald-200"}`}>
                  <span className={`text-[11px] font-semibold ${isAdmin ? "text-emerald-300" : "text-emerald-800"}`}>Net Pay Distribution</span>
                  <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                    PKR {selectedRun.totalNet?.toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Finalize Lock Action (Admin ONLY) */}
              <div className={`flex justify-between items-center p-4 rounded-2xl border ${isAdmin ? "bg-slate-800/60 border-slate-800" : "bg-slate-50 border-slate-200"}`}>
                <div>
                  <span className="text-xs font-bold">
                    Run Status: <span className="uppercase text-blue-500">{selectedRun.status}</span>
                  </span>
                  <p className={`text-[11px] ${isAdmin ? "text-slate-400" : "text-slate-500"}`}>
                    {selectedRun.status === "finalized"
                      ? "Locked by Administrator. Payslips are distributed to employees."
                      : "HR can review this draft. Only the Admin can lock and finalize."}
                  </p>
                </div>

                {isAdmin && selectedRun.status !== "finalized" && (
                  <button
                    onClick={() => handleFinalize(selectedRun._id)}
                    disabled={finalizing}
                    className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700 shadow-sm"
                  >
                    <Lock className="h-4 w-4" />
                    {finalizing ? "Locking..." : "Finalize & Lock Payroll"}
                  </button>
                )}
              </div>

              {/* Items Breakdown Table */}
              <div className={`rounded-2xl border shadow-xs overflow-hidden ${cardBg}`}>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className={`border-b ${isAdmin ? "border-slate-800" : "border-slate-200"} ${tableHeaderBg}`}>
                      <tr>
                        <th className="p-3">Employee</th>
                        <th className="p-3">Basic</th>
                        <th className="p-3">Gross (1.5x)</th>
                        <th className="p-3">Daily Rate</th>
                        <th className="p-3">Deductions</th>
                        <th className="p-3">Income Tax</th>
                        <th className="p-3 font-bold text-emerald-600">Net Pay</th>
                        <th className="p-3 text-right">PDF Payslip</th>
                      </tr>
                    </thead>
                    <tbody className={`divide-y ${dividerColor}`}>
                      {selectedRun.items?.map((it: any) => (
                        <tr key={it.employee} className={`${rowHoverBg} transition-colors`}>
                          <td className="p-3">
                            <span className="font-semibold">{it.employeeName}</span>
                            <span className="font-mono text-[10px] text-slate-400 block">{it.employeeCode}</span>
                          </td>
                          <td className="p-3 font-mono">PKR {it.basicSalary?.toLocaleString()}</td>
                          <td className="p-3 font-mono font-semibold">PKR {it.grossSalary?.toLocaleString()}</td>
                          <td className={`p-3 font-mono ${isAdmin ? "text-slate-400" : "text-slate-500"}`}>PKR {it.perDayRate?.toLocaleString()}</td>
                          <td className="p-3 font-mono text-red-500">PKR {it.deductions?.toLocaleString()}</td>
                          <td className={`p-3 font-mono ${isAdmin ? "text-slate-300" : "text-slate-600"}`}>PKR {it.monthlyTax?.toLocaleString()}</td>
                          <td className="p-3 font-mono font-bold text-emerald-600">PKR {it.netPay?.toLocaleString()}</td>
                          <td className="p-3 text-right">
                            <button
                              onClick={() => handleDownloadPDF(selectedRun._id, it.employee, it.employeeCode)}
                              className={`flex items-center gap-1 ml-auto px-2.5 py-1 rounded-lg font-semibold text-[11px] ${
                                isAdmin 
                                  ? "bg-slate-800 text-blue-400 hover:bg-slate-700 border border-slate-700" 
                                  : "bg-blue-50 text-blue-600 hover:bg-blue-100"
                              }`}
                            >
                              <ArrowDownToLine className="h-3.5 w-3.5" /> PDF
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </>
      ) : (
        /* EMPLOYEE VIEW: My Confidential Payslips */
        <div className={`rounded-2xl border shadow-xs overflow-hidden ${cardBg}`}>
          <div className={`p-4 border-b flex justify-between items-center ${isAdmin ? "border-slate-800" : "border-slate-100"}`}>
            <h3 className="text-sm font-bold flex items-center gap-2">
              <FileText className="h-4 w-4 text-blue-500" />
              My Confidential Payslips
            </h3>
            <span className="text-xs text-slate-400">{myPayslips.length} Finalized Runs</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className={`border-b ${isAdmin ? "border-slate-800" : "border-slate-200"} ${tableHeaderBg}`}>
                <tr>
                  <th className="p-3">Month</th>
                  <th className="p-3">Gross Salary</th>
                  <th className="p-3">Deductions</th>
                  <th className="p-3">Monthly Tax</th>
                  <th className="p-3 font-bold text-emerald-600">Net Salary</th>
                  <th className="p-3 text-right">Download PDF</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${dividerColor}`}>
                {myPayslips.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-slate-400">
                      No finalized payslips available yet. Once Admin finalizes the monthly run, your payslip will appear here.
                    </td>
                  </tr>
                ) : (
                  myPayslips.map((p) => (
                    <tr key={p.payrollRunId} className={`${rowHoverBg} transition-colors`}>
                      <td className="p-3 font-bold">{p.month}</td>
                      <td className="p-3 font-mono">PKR {p.grossSalary?.toLocaleString()}</td>
                      <td className="p-3 font-mono text-red-500">PKR {p.deductions?.toLocaleString()}</td>
                      <td className="p-3 font-mono">PKR {p.monthlyTax?.toLocaleString()}</td>
                      <td className="p-3 font-mono font-bold text-emerald-600">PKR {p.netPay?.toLocaleString()}</td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => handleDownloadPDF(p.payrollRunId, p.employee, p.employeeCode)}
                          className="flex items-center gap-1.5 ml-auto px-3 py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 font-semibold text-xs transition-colors"
                        >
                          <Download className="h-3.5 w-3.5" /> Download PDF
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}