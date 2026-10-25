"use client";

import { useState, useEffect } from "react";
import { hcmApi } from "@/api/hcm";
import { Users, Search, Filter, Plus, FileSpreadsheet, Download, Eye, Edit3, X, CheckCircle, AlertTriangle } from "lucide-react";

interface EmployeesDirectoryProps {
  userRole: string;
}

export default function EmployeesDirectoryView({ userRole }: EmployeesDirectoryProps) {
  const isHRorAdmin = userRole === "HR" || userRole === "Admin";

  const [employees, setEmployees] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [designations, setDesignations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmMsg, setConfirmMsg] = useState("");

  // Search & Filter
  const [search, setSearch] = useState("");
  const [selectedDept, setSelectedDept] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");

  // Modals
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showCsvModal, setShowCsvModal] = useState(false);
  const [view360EmpId, setView360EmpId] = useState<string | null>(null);
  const [emp360Data, setEmp360Data] = useState<any>(null);
  const [loading360, setLoading360] = useState(false);

  // Register Form State
  const [empCode, setEmpCode] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [gender, setGender] = useState("male");
  const [department, setDepartment] = useState("");
  const [designation, setDesignation] = useState("");
  const [joiningDate, setJoiningDate] = useState("2026-01-15");
  const [basicSalary, setBasicSalary] = useState(100000);
  const [tempPassword, setTempPassword] = useState("Password@123");
  const [regLoading, setRegLoading] = useState(false);
  const [regError, setRegError] = useState("");

  // Self Edit Phone & Address (Employee)
  const [selfEditPhone, setSelfEditPhone] = useState("");
  const [selfEditAddress, setSelfEditAddress] = useState("");
  const [selfSaving, setSelfSaving] = useState(false);

  // CSV Dry Run State
  const [csvText, setCsvText] = useState("");
  const [dryRunResult, setDryRunResult] = useState<any>(null);
  const [dryRunLoading, setDryRunLoading] = useState(false);
  const [commitLoading, setCommitLoading] = useState(false);

  const loadDirectory = async () => {
    setLoading(true);
    try {
      const [empRes, deptRes, desigRes] = await Promise.all([
        hcmApi.getEmployees({
          search: search || undefined,
          department: selectedDept || undefined,
          status: selectedStatus || undefined,
        }),
        hcmApi.getDepartments(),
        hcmApi.getDesignations(),
      ]);

      setEmployees(empRes.employees || []);
      setDepartments(deptRes.departments || []);
      setDesignations(desigRes.designations || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDirectory();
  }, [selectedDept, selectedStatus]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadDirectory();
  };

  // Open Employee 360 View
  const handleOpen360 = async (id: string) => {
    setView360EmpId(id);
    setLoading360(true);
    try {
      const res = await hcmApi.getEmployee360(id);
      setEmp360Data(res);
      setSelfEditPhone(res.employee?.phone || "");
      setSelfEditAddress(res.employee?.address || "");
    } catch (err) {
      console.error(err);
    } finally {
      setLoading360(false);
    }
  };

  // Register Employee
  const handleRegisterEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegLoading(true);
    setRegError("");

    try {
      await hcmApi.registerEmployee({
        employeeCode: empCode,
        firstName,
        lastName,
        email,
        phone,
        address,
        gender,
        department,
        designation,
        joiningDate,
        basicSalary: Number(basicSalary),
        temporaryPassword: tempPassword,
      });

      setShowRegisterModal(false);
      // Reset form
      setEmpCode("");
      setFirstName("");
      setLastName("");
      setEmail("");
      setPhone("");
      setAddress("");
      loadDirectory();
    } catch (err: any) {
      setRegError(err.response?.data?.message || "Failed to register employee.");
    } finally {
      setRegLoading(false);
    }
  };

  // Confirm / Approve Pending Employee (Admin or HR)
  const handleConfirmEmployee = async (id: string) => {
    try {
      const res = await hcmApi.confirmEmployee(id);
      setConfirmMsg(res.message || "Employee confirmed and account activated successfully!");
      setTimeout(() => setConfirmMsg(""), 4000);
      loadDirectory();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to confirm employee.");
    }
  };

  // Self Profile Update (Phone & Address)
  const handleSaveSelf = async () => {
    setSelfSaving(true);
    try {
      await hcmApi.updateSelfProfile({ phone: selfEditPhone, address: selfEditAddress });
      if (view360EmpId) handleOpen360(view360EmpId);
      loadDirectory();
    } catch (err) {
      console.error(err);
    } finally {
      setSelfSaving(false);
    }
  };

  // Parse CSV text to row objects
  const parseCSVToRows = (raw: string) => {
    const lines = raw.trim().split("\n");
    if (lines.length < 2) return [];
    const headers = lines[0].split(",").map((h) => h.trim());
    const rows = [];
    for (let i = 1; i < lines.length; i++) {
      const parts = lines[i].split(",").map((p) => p.trim());
      if (parts.length >= headers.length) {
        const obj: any = {};
        headers.forEach((h, idx) => {
          obj[h] = parts[idx];
        });
        rows.push(obj);
      }
    }
    return rows;
  };

  const handleRunDryRun = async () => {
    setDryRunLoading(true);
    setDryRunResult(null);
    try {
      const rows = parseCSVToRows(csvText);
      const res = await hcmApi.csvDryRun(rows);
      setDryRunResult(res);
    } catch (err: any) {
      alert(err.response?.data?.message || "Dry run failed.");
    } finally {
      setDryRunLoading(false);
    }
  };

  const handleCommitCSV = async () => {
    if (!dryRunResult?.valid) return;
    setCommitLoading(true);
    try {
      const rows = parseCSVToRows(csvText);
      await hcmApi.csvCommit(rows);
      setShowCsvModal(false);
      setCsvText("");
      setDryRunResult(null);
      loadDirectory();
    } catch (err: any) {
      alert(err.response?.data?.message || "Commit failed.");
    } finally {
      setCommitLoading(false);
    }
  };

  const handleExportCSV = async () => {
    try {
      const res = await hcmApi.csvExport();
      const rows = res.data;
      if (!rows || rows.length === 0) {
        alert("No employees to export.");
        return;
      }
      const headers = Object.keys(rows[0]).join(",");
      const csvContent =
        "data:text/csv;charset=utf-8," +
        [headers, ...rows.map((r: any) => Object.values(r).join(","))].join("\n");
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `Employees_Export_${new Date().toISOString().split("T")[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Controls: Search, Filters, and Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
        <form onSubmit={handleSearchSubmit} className="flex-1 flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, code or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-300 pl-9 pr-3 py-1.5 text-xs outline-none focus:border-blue-600 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>
          <button
            type="submit"
            className="rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300"
          >
            Search
          </button>
        </form>

        <div className="flex flex-wrap items-center gap-2">
          {/* Department Filter */}
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="rounded-xl border border-slate-300 px-3 py-1.5 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          >
            <option value="">All Departments</option>
            {departments.map((d) => (
              <option key={d._id} value={d._id}>{d.name}</option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="rounded-xl border border-slate-300 px-3 py-1.5 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          >
            <option value="">All Statuses</option>
            <option value="pending_approval">Pending Approval</option>
            <option value="active">Active</option>
            <option value="probation">Probation</option>
            <option value="exited">Exited</option>
          </select>

          {isHRorAdmin && (
            <>
              <button
                onClick={() => setShowRegisterModal(true)}
                className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 transition"
              >
                <Plus className="h-4 w-4" /> Register Employee
              </button>

              <button
                onClick={() => setShowCsvModal(true)}
                className="flex items-center gap-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300"
                title="CSV Import with Dry Run"
              >
                <FileSpreadsheet className="h-4 w-4" /> Import CSV
              </button>

              <button
                onClick={handleExportCSV}
                className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                title="Export Directory to CSV"
              >
                <Download className="h-4 w-4" />
              </button>
            </>
          )}
        </div>
      </div>

      {confirmMsg && (
        <div className="flex items-center gap-2 rounded-xl bg-emerald-50 p-3 text-xs text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-800">
          <CheckCircle className="h-4 w-4 shrink-0 text-emerald-600" />
          <span className="font-semibold">{confirmMsg}</span>
        </div>
      )}

      {/* Directory Table */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500">
              <tr>
                <th className="p-3">Employee</th>
                <th className="p-3">Code</th>
                <th className="p-3">Department</th>
                <th className="p-3">Designation</th>
                <th className="p-3">Gross Salary</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {employees.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-slate-400">
                    No employees registered yet.
                  </td>
                </tr>
              ) : (
                employees.map((emp) => (
                  <tr key={emp._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                    <td className="p-3">
                      <div className="font-semibold text-slate-900 dark:text-white">
                        {emp.firstName} {emp.lastName}
                      </div>
                      <div className="text-[11px] text-slate-400">{emp.email}</div>
                    </td>
                    <td className="p-3 font-mono font-semibold text-blue-600">{emp.employeeCode}</td>
                    <td className="p-3 text-slate-700 dark:text-slate-300">{emp.department?.name || "-"}</td>
                    <td className="p-3 text-slate-700 dark:text-slate-300">{emp.designation?.title || "-"}</td>
                    <td className="p-3 font-semibold">
                      {isHRorAdmin ? `PKR ${emp.salaryStructure?.gross?.toLocaleString()}` : "Confidential"}
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        emp.status === "active"
                          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                          : emp.status === "pending_approval"
                          ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 animate-pulse border border-amber-300"
                          : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                      }`}>
                        {emp.status === "pending_approval" ? "PENDING APPROVAL" : emp.status?.toUpperCase()}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {isHRorAdmin && emp.status === "pending_approval" && (
                          <button
                            onClick={() => handleConfirmEmployee(emp._id)}
                            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 font-semibold text-[11px] shadow-xs"
                            title="Confirm and activate employee login"
                          >
                            <CheckCircle className="h-3.5 w-3.5" /> Confirm
                          </button>
                        )}
                        <button
                          onClick={() => handleOpen360(emp._id)}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-950/60 dark:text-blue-300 font-semibold text-[11px]"
                        >
                          <Eye className="h-3.5 w-3.5" /> 360 Profile
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* REGISTER EMPLOYEE MODAL */}
      {showRegisterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Register New Employee</h3>
              <button onClick={() => setShowRegisterModal(false)} className="p-1 text-slate-400">
                <X className="h-5 w-5" />
              </button>
            </div>

            {regError && (
              <div className="my-3 rounded-xl bg-red-50 p-3 text-xs text-red-600 border border-red-200">
                {regError}
              </div>
            )}

            <form onSubmit={handleRegisterEmployee} className="space-y-4 my-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Employee Code</label>
                  <input
                    type="text"
                    required
                    placeholder="EMP-004"
                    value={empCode}
                    onChange={(e) => setEmpCode(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs dark:bg-slate-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Official Email (Creates Login)</label>
                  <input
                    type="email"
                    required
                    placeholder="employee@saylani.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs dark:bg-slate-800 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">First Name</label>
                  <input
                    type="text"
                    required
                    placeholder="Ahmed"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs dark:bg-slate-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Last Name</label>
                  <input
                    type="text"
                    required
                    placeholder="Raza"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs dark:bg-slate-800 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Department</label>
                  <select
                    required
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs dark:bg-slate-800 dark:text-white"
                  >
                    <option value="">Select Department</option>
                    {departments.map((d) => (
                      <option key={d._id} value={d._id}>{d.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Designation</label>
                  <select
                    required
                    value={designation}
                    onChange={(e) => setDesignation(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs dark:bg-slate-800 dark:text-white"
                  >
                    <option value="">Select Designation</option>
                    {designations.map((d) => (
                      <option key={d._id} value={d._id}>{d.title}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Salary Structure Formula: Gross = 1.5 * Basic */}
              <div className="rounded-xl bg-slate-50 dark:bg-slate-800/60 p-3 border border-slate-200 dark:border-slate-800 space-y-2">
                <span className="text-xs font-bold text-slate-900 dark:text-white">Salary Structure (Formula: Gross = 1.5 × Basic)</span>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <label className="text-[11px] text-slate-500">Basic Salary</label>
                    <input
                      type="number"
                      required
                      min={1000}
                      value={basicSalary}
                      onChange={(e) => setBasicSalary(Number(e.target.value))}
                      className="w-full rounded border border-slate-300 px-2 py-1 dark:bg-slate-800"
                    />
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-500">HRA (40%) + Med (10%)</span>
                    <p className="mt-1 font-semibold text-slate-700 dark:text-slate-300">
                      PKR {Math.round(basicSalary * 0.5).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-500">Calculated Gross</span>
                    <p className="mt-1 font-bold text-blue-600">
                      PKR {Math.round(basicSalary * 1.5).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Temporary Password</label>
                  <input
                    type="text"
                    required
                    value={tempPassword}
                    onChange={(e) => setTempPassword(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs dark:bg-slate-800 dark:text-white font-mono"
                  />
                  <span className="text-[10px] text-slate-400">Must be changed on first sign-in</span>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Joining Date</label>
                  <input
                    type="date"
                    required
                    value={joiningDate}
                    onChange={(e) => setJoiningDate(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs dark:bg-slate-800 dark:text-white"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRegisterModal(false)}
                  className="flex-1 rounded-xl border border-slate-300 py-2.5 text-xs font-semibold text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={regLoading}
                  className="flex-1 rounded-xl bg-blue-600 py-2.5 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {regLoading ? "Registering..." : "Register Employee"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CSV DRY RUN & IMPORT MODAL */}
      {showCsvModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">CSV Import with Dry Run Validation</h3>
              <button onClick={() => setShowCsvModal(false)} className="p-1 text-slate-400">
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Paste CSV data below. Format required: <br />
              <code className="text-blue-600 bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded">
                employeeCode,firstName,lastName,email,department,basicSalary,joiningDate
              </code>
            </p>

            <textarea
              rows={6}
              value={csvText}
              onChange={(e) => setCsvText(e.target.value)}
              placeholder="employeeCode,firstName,lastName,email,department,basicSalary,joiningDate&#10;EMP-101,Hamza,Sheikh,hamza@saylani.com,Engineering,110000,2026-02-01&#10;EMP-102,Zainab,Malik,zainab@saylani.com,Human Resources,95000,2026-02-01"
              className="w-full rounded-xl border border-slate-300 p-3 font-mono text-xs dark:bg-slate-800 dark:text-white outline-none focus:border-blue-600"
            />

            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleRunDryRun}
                disabled={dryRunLoading || !csvText.trim()}
                className="flex-1 rounded-xl bg-slate-800 text-white py-2 text-xs font-semibold hover:bg-slate-900 transition disabled:opacity-50"
              >
                {dryRunLoading ? "Validating..." : "1. Run Dry-Run Validation"}
              </button>

              <button
                type="button"
                onClick={handleCommitCSV}
                disabled={commitLoading || !dryRunResult?.canCommit}
                className="flex-1 rounded-xl bg-blue-600 text-white py-2 text-xs font-semibold hover:bg-blue-700 transition disabled:opacity-40"
              >
                {commitLoading ? "Importing..." : "2. Commit & Register"}
              </button>
            </div>

            {/* Dry Run Results */}
            {dryRunResult && (
              <div className={`p-4 rounded-xl border text-xs ${
                dryRunResult.valid
                  ? "bg-emerald-50 border-emerald-200 text-emerald-900 dark:bg-emerald-950/40"
                  : "bg-red-50 border-red-200 text-red-900 dark:bg-red-950/40"
              }`}>
                <div className="flex items-center gap-2 font-bold mb-2">
                  {dryRunResult.valid ? <CheckCircle className="h-4 w-4 text-emerald-600" /> : <AlertTriangle className="h-4 w-4 text-red-600" />}
                  <span>{dryRunResult.valid ? "Validation Passed! Ready to commit." : "Validation Errors Detected:"}</span>
                </div>
                <p>Total Rows: {dryRunResult.totalRows} | Valid: {dryRunResult.validCount} | Errors: {dryRunResult.errorCount}</p>
                {dryRunResult.errors?.length > 0 && (
                  <ul className="mt-2 space-y-1 list-disc pl-5 text-[11px] text-red-700 dark:text-red-300">
                    {dryRunResult.errors.map((err: any, i: number) => (
                      <li key={i}>
                        Row {err.row}: [{err.field}] — {err.reason}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* EMPLOYEE 360 MODAL */}
      {view360EmpId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-600" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Employee 360° Profile
                </h3>
              </div>
              <button onClick={() => setView360EmpId(null)} className="p-1 text-slate-400">
                <X className="h-5 w-5" />
              </button>
            </div>

            {loading360 ? (
              <p className="text-center py-8 text-xs text-slate-400">Loading 360 details...</p>
            ) : emp360Data?.employee ? (
              <div className="space-y-4 text-xs">
                {/* Header card */}
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 flex justify-between items-center">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                      {emp360Data.employee.firstName} {emp360Data.employee.lastName}
                    </h4>
                    <p className="text-slate-500 font-mono">{emp360Data.employee.employeeCode} · {emp360Data.employee.email}</p>
                  </div>
                  <span className="bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 font-semibold px-2.5 py-1 rounded-full text-[10px]">
                    {emp360Data.employee.designation?.title || "Staff"} · {emp360Data.employee.department?.name}
                  </span>
                </div>

                {/* Self Editable phone & address */}
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
                  <span className="font-bold text-slate-900 dark:text-white">Contact & Address Details</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] text-slate-400 mb-1 block">Phone</label>
                      <input
                        type="text"
                        value={selfEditPhone}
                        onChange={(e) => setSelfEditPhone(e.target.value)}
                        className="w-full rounded border border-slate-300 px-3 py-1.5 text-xs dark:bg-slate-800 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-400 mb-1 block">Residential Address</label>
                      <input
                        type="text"
                        value={selfEditAddress}
                        onChange={(e) => setSelfEditAddress(e.target.value)}
                        className="w-full rounded border border-slate-300 px-3 py-1.5 text-xs dark:bg-slate-800 dark:text-white"
                      />
                    </div>
                  </div>
                  <button
                    onClick={handleSaveSelf}
                    disabled={selfSaving}
                    className="rounded-lg bg-blue-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-blue-700"
                  >
                    {selfSaving ? "Saving..." : "Update Contact Info"}
                  </button>
                </div>

                {/* Compensation Structure (if authorized) */}
                {isHRorAdmin && (
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 space-y-2">
                    <span className="font-bold text-slate-900 dark:text-white">Salary Structure (Confidential)</span>
                    <div className="grid grid-cols-4 gap-2 text-center text-xs">
                      <div className="p-2 bg-white dark:bg-slate-800 rounded">
                        <span className="text-slate-400 block text-[10px]">Basic</span>
                        <span className="font-bold">PKR {emp360Data.employee.salaryStructure?.basic?.toLocaleString()}</span>
                      </div>
                      <div className="p-2 bg-white dark:bg-slate-800 rounded">
                        <span className="text-slate-400 block text-[10px]">HRA (40%)</span>
                        <span className="font-bold">PKR {emp360Data.employee.salaryStructure?.hra?.toLocaleString()}</span>
                      </div>
                      <div className="p-2 bg-white dark:bg-slate-800 rounded">
                        <span className="text-slate-400 block text-[10px]">Medical (10%)</span>
                        <span className="font-bold">PKR {emp360Data.employee.salaryStructure?.medical?.toLocaleString()}</span>
                      </div>
                      <div className="p-2 bg-blue-50 dark:bg-blue-950/40 rounded">
                        <span className="text-blue-600 block text-[10px] font-bold">Gross (1.5x)</span>
                        <span className="font-bold text-blue-600">PKR {emp360Data.employee.salaryStructure?.gross?.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}

