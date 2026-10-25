"use client";

import { useState, useEffect } from "react";
import { hcmApi } from "@/api/hcm";
import { Calendar, Plus, Sparkles, Check, X, CheckCircle, Clock, AlertTriangle } from "lucide-react";

interface LeaveProps {
  userRole: string;
}

export default function LeaveManagementView({ userRole }: LeaveProps) {
  const isAdmin = userRole === "Admin";
  const isHR = userRole === "HR";
  const isHRorAdmin = isHR || isAdmin;

  const [balances, setBalances] = useState<any[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Apply Form
  const [selectedType, setSelectedType] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");
  const [applying, setApplying] = useState(false);
  const [applyError, setApplyError] = useState("");
  const [applySuccess, setApplySuccess] = useState("");

  // Smart Leave NLP input
  const [smartPrompt, setSmartPrompt] = useState("");
  const [parsingSmart, setParsingSmart] = useState(false);

  // Review comment state (HR/Admin)
  const [reviewComment, setReviewComment] = useState("");
  const [activeReviewId, setActiveReviewId] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [balRes, reqRes, typeRes] = await Promise.all([
        hcmApi.getMyBalances().catch(() => ({ balances: [] })),
        hcmApi.getLeaveRequests().catch(() => ({ requests: [] })),
        hcmApi.getLeaveTypes().catch(() => ({ leaveTypes: [] })),
      ]);

      const bals = balRes.balances || [];
      const types = typeRes.leaveTypes || [];

      setBalances(bals);
      setRequests(reqRes.requests || []);
      setLeaveTypes(types);

      if (bals.length > 0 && !selectedType) {
        setSelectedType(bals[0].leaveTypeId);
      } else if (types.length > 0 && !selectedType) {
        setSelectedType(types[0]._id);
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

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    setApplying(true);
    setApplyError("");
    setApplySuccess("");

    try {
      const res = await hcmApi.applyLeave({
        leaveTypeId: selectedType,
        startDate,
        endDate,
        reason,
      });

      setApplySuccess(res.message || "Leave application submitted successfully!");
      setReason("");
      loadData();
    } catch (err: any) {
      setApplyError(err.response?.data?.message || "Failed to submit leave.");
    } finally {
      setApplying(false);
    }
  };

  const handleSmartLeaveParse = async () => {
    if (!smartPrompt.trim()) return;
    setParsingSmart(true);
    setApplyError("");

    try {
      const res = await hcmApi.smartLeave(smartPrompt);
      if (res.leaveTypeId) setSelectedType(res.leaveTypeId);
      if (res.startDate) setStartDate(res.startDate);
      if (res.endDate) setEndDate(res.endDate);
      if (res.reason) setReason(res.reason);
      setSmartPrompt("");
    } catch (err: any) {
      setApplyError("Could not auto-parse smart leave. Please fill fields manually.");
    } finally {
      setParsingSmart(false);
    }
  };

  const handleCancelLeave = async (id: string) => {
    if (!confirm("Are you sure you want to cancel this leave application?")) return;
    try {
      await hcmApi.cancelLeave(id);
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to cancel leave.");
    }
  };

  const handleReviewLeave = async (action: "approved" | "rejected") => {
    if (!activeReviewId) return;
    try {
      await hcmApi.reviewLeave(activeReviewId, { action, reviewComment });
      setActiveReviewId(null);
      setReviewComment("");
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.message || "Action failed.");
    }
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
      {/* Leave Quota Balances */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {balances.map((b) => (
          <div key={b.leaveTypeId} className={`p-4 rounded-2xl border shadow-xs ${cardBg}`}>
            <span className={`text-[11px] font-semibold ${isAdmin ? "text-slate-400" : "text-slate-500"}`}>{b.displayName}</span>
            <div className="mt-1 text-2xl font-bold">
              {b.remaining} {b.name === "unpaid" ? "" : "days"}
            </div>
            <p className={`mt-1 text-[10px] ${isAdmin ? "text-slate-500" : "text-slate-400"}`}>
              Used: {b.used} / Quota: {b.quota || "Unlimited"}
            </p>
          </div>
        ))}
      </div>

      {/* Smart Leave Prompt Box (Employee self-service NLP) */}
      <div className={`p-5 rounded-2xl border shadow-xs ${isAdmin ? "bg-slate-900 border-slate-800 text-white" : "bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 text-slate-900"}`}>
        <div className={`flex items-center gap-2 mb-2 text-xs font-bold ${isAdmin ? "text-blue-400" : "text-blue-900"}`}>
          <Sparkles className="h-4 w-4 text-blue-500" />
          <span>Smart Leave Assistant (Natural Language: English & Roman Urdu)</span>
        </div>
        <p className={`text-xs mb-3 ${isAdmin ? "text-slate-400" : "text-slate-600"}`}>
          Type your leave in plain words (e.g. &ldquo;Need next Monday and Tuesday off for sister&apos;s wedding&rdquo; or &ldquo;Mujhe 2 din ki casual chutti chahiye&rdquo;). The AI will automatically pre-fill your form!
        </p>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Type your leave request in plain words..."
            value={smartPrompt}
            onChange={(e) => setSmartPrompt(e.target.value)}
            className={`flex-1 rounded-xl border px-3 py-2 text-xs outline-none focus:border-blue-500 ${inputBg}`}
          />
          <button
            type="button"
            onClick={handleSmartLeaveParse}
            disabled={parsingSmart || !smartPrompt.trim()}
            className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 transition disabled:opacity-50"
          >
            {parsingSmart ? "Parsing..." : "Pre-fill Form"}
          </button>
        </div>
      </div>

      {/* Apply Leave Form */}
      <div className={`p-6 rounded-2xl border shadow-xs space-y-4 ${cardBg}`}>
        <div className={`flex items-center gap-2 border-b pb-2 ${isAdmin ? "border-slate-800" : "border-slate-100"}`}>
          <Calendar className="h-4 w-4 text-blue-500" />
          <h3 className="text-sm font-bold">Apply for Leave</h3>
        </div>

        {applySuccess && (
          <div className={`flex items-center gap-2 rounded-xl p-3 text-xs border ${isAdmin ? "bg-emerald-950/40 text-emerald-400 border-emerald-900" : "bg-emerald-50 text-emerald-600 border-emerald-200"}`}>
            <CheckCircle className="h-4 w-4 shrink-0" />
            <span>{applySuccess}</span>
          </div>
        )}

        {applyError && (
          <div className={`flex items-center gap-2 rounded-xl p-3 text-xs border ${isAdmin ? "bg-red-950/40 text-red-400 border-red-900" : "bg-red-50 text-red-600 border-red-200"}`}>
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>{applyError}</span>
          </div>
        )}

        <form onSubmit={handleApply} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className={`block text-xs font-semibold mb-1 ${isAdmin ? "text-slate-300" : "text-slate-700"}`}>
                Leave Category
              </label>
              <select
                required
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className={`w-full rounded-xl border px-3 py-2 text-xs outline-none focus:border-blue-500 ${inputBg}`}
              >
                {balances.length > 0 ? (
                  balances.map((b) => (
                    <option key={b.leaveTypeId} value={b.leaveTypeId}>
                      {b.displayName} ({b.remaining} days left)
                    </option>
                  ))
                ) : leaveTypes.length > 0 ? (
                  leaveTypes.map((t) => (
                    <option key={t._id} value={t._id}>
                      {t.displayName} ({t.yearlyQuota} days quota)
                    </option>
                  ))
                ) : (
                  <>
                    <option value="annual">Annual Leave (14 days)</option>
                    <option value="sick">Sick Leave (8 days)</option>
                    <option value="casual">Casual Leave (10 days)</option>
                    <option value="unpaid">Unpaid Leave</option>
                  </>
                )}
              </select>
            </div>

            <div>
              <label className={`block text-xs font-semibold mb-1 ${isAdmin ? "text-slate-300" : "text-slate-700"}`}>
                Start Date
              </label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className={`w-full rounded-xl border px-3 py-1.5 text-xs outline-none focus:border-blue-500 ${inputBg}`}
              />
            </div>

            <div>
              <label className={`block text-xs font-semibold mb-1 ${isAdmin ? "text-slate-300" : "text-slate-700"}`}>
                End Date
              </label>
              <input
                type="date"
                required
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className={`w-full rounded-xl border px-3 py-1.5 text-xs outline-none focus:border-blue-500 ${inputBg}`}
              />
            </div>
          </div>

          <div>
            <label className={`block text-xs font-semibold mb-1 ${isAdmin ? "text-slate-300" : "text-slate-700"}`}>
              Reason for Absence
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Family wedding, fever & doctor appointment..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className={`w-full rounded-xl border px-3 py-2 text-xs outline-none focus:border-blue-500 ${inputBg}`}
            />
          </div>

          <div className="flex justify-between items-center pt-2">
            <span className="text-[11px] text-slate-400">
              * Automatically skips weekends and public holidays. Overlaps are strictly checked.
            </span>
            <button
              type="submit"
              disabled={applying}
              className="rounded-xl bg-blue-600 px-6 py-2.5 text-xs font-semibold text-white hover:bg-blue-700 transition disabled:opacity-50"
            >
              {applying ? "Submitting..." : "Submit Leave Request"}
            </button>
          </div>
        </form>
      </div>

      {/* Leave Requests & HR Approval Inbox */}
      <div className={`rounded-2xl border shadow-xs overflow-hidden ${cardBg}`}>
        <div className={`p-4 border-b flex justify-between items-center ${isAdmin ? "border-slate-800" : "border-slate-100"}`}>
          <h3 className="text-sm font-bold">
            {isHRorAdmin ? "Leave Approval Inbox & Applications" : "My Leave History"}
          </h3>
          <span className="text-xs text-slate-400">{requests.length} Requests</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className={`border-b ${isAdmin ? "border-slate-800" : "border-slate-200"} ${tableHeaderBg}`}>
              <tr>
                <th className="p-3">Employee</th>
                <th className="p-3">Type</th>
                <th className="p-3">Duration</th>
                <th className="p-3">Dates</th>
                <th className="p-3">Reason</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${dividerColor}`}>
              {requests.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-slate-400">
                    No leave requests found.
                  </td>
                </tr>
              ) : (
                requests.map((r) => (
                  <tr key={r._id} className={`${rowHoverBg} transition-colors`}>
                    <td className="p-3 font-semibold">
                      {r.employee ? `${r.employee.firstName} ${r.employee.lastName}` : "Self"}
                    </td>
                    <td className={`p-3 font-medium ${isAdmin ? "text-slate-300" : "text-slate-700"}`}>
                      {r.leaveType?.displayName}
                    </td>
                    <td className="p-3 font-bold text-blue-500">
                      {r.workingDays} working day(s)
                    </td>
                    <td className="p-3 font-mono text-[11px] text-slate-400">
                      {r.startDate} → {r.endDate}
                    </td>
                    <td className={`p-3 max-w-xs truncate ${isAdmin ? "text-slate-300" : "text-slate-600"}`}>
                      {r.reason}
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        r.status === "approved"
                          ? (isAdmin ? "bg-emerald-950 text-emerald-300 border border-emerald-900" : "bg-emerald-100 text-emerald-800")
                          : r.status === "pending"
                          ? (isAdmin ? "bg-amber-950 text-amber-300 border border-amber-900" : "bg-amber-100 text-amber-800")
                          : (isAdmin ? "bg-red-950 text-red-300 border border-red-900" : "bg-red-100 text-red-800")
                      }`}>
                        {r.status?.toUpperCase()}
                      </span>
                    </td>
                    <td className="p-3 text-right space-x-1.5">
                      {isHRorAdmin && r.status === "pending" ? (
                        <button
                          onClick={() => setActiveReviewId(r._id)}
                          className="px-2.5 py-1 rounded bg-blue-600 text-white font-semibold text-[11px] hover:bg-blue-700"
                        >
                          Review Inbox
                        </button>
                      ) : r.status === "pending" ? (
                        <button
                          onClick={() => handleCancelLeave(r._id)}
                          className={`px-2.5 py-1 rounded text-[11px] ${isAdmin ? "bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
                        >
                          Cancel
                        </button>
                      ) : (
                        <span className="text-slate-400 text-[11px]">Decided</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* HR / Admin Review Modal */}
      {activeReviewId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-2xl bg-slate-900 border border-slate-800 p-5 shadow-2xl text-white space-y-3">
            <h4 className="text-sm font-bold mb-2">Review Leave Application</h4>
            <textarea
              rows={3}
              placeholder="Approval / Rejection comment..."
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-800 p-2 text-xs text-white placeholder:text-slate-500 mb-4 outline-none focus:border-slate-500"
            />
            <div className="flex gap-2">
              <button
                onClick={() => handleReviewLeave("rejected")}
                className="flex-1 rounded-xl bg-red-600 py-2 text-xs font-semibold text-white hover:bg-red-700 transition-colors"
              >
                Reject Leave
              </button>
              <button
                onClick={() => handleReviewLeave("approved")}
                className="flex-1 rounded-xl bg-emerald-600 py-2 text-xs font-semibold text-white hover:bg-emerald-700 transition-colors"
              >
                Approve Leave
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}