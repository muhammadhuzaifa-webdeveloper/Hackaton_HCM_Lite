"use client";

import { useState, useEffect } from "react";
import { hcmApi } from "@/api/hcm";
import {
  Calendar,
  Sparkles,
  Check,
  X,
  CheckCircle,
  Clock,
  AlertTriangle,
  Send,
  Zap,
  Filter,
  ArrowRight,
  Info,
  CalendarCheck,
  HelpCircle,
} from "lucide-react";

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

  // Apply Form State
  const [selectedType, setSelectedType] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");
  const [applying, setApplying] = useState(false);
  const [applyError, setApplyError] = useState("");
  const [applySuccess, setApplySuccess] = useState("");

  // AI Smart Leave Input
  const [smartPrompt, setSmartPrompt] = useState("");
  const [parsingSmart, setParsingSmart] = useState(false);
  const [autoSubmitting, setAutoSubmitting] = useState(false);
  const [aiHighlight, setAiHighlight] = useState(false);

  // Filter & Review State
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");
  const [reviewComment, setReviewComment] = useState("");
  const [activeReviewId, setActiveReviewId] = useState<string | null>(null);

  const quickTemplates = [
    { label: "🩺 Doctor Visit", prompt: "Need 1 day sick leave tomorrow for doctor checkup and fever" },
    { label: "💍 Family Wedding", prompt: "Need 2 days off next Monday and Tuesday for family wedding ceremony" },
    { label: "🏖️ Weekend Extension", prompt: "Need 1 day annual leave on Friday for personal family travel" },
    { label: "🤒 Urgent Medical Rest", prompt: "Not feeling well today, need immediate sick leave for today" },
  ];

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

  const handleApply = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
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

  const handleSmartLeaveParse = async (promptText?: string) => {
    const textToParse = promptText || smartPrompt;
    if (!textToParse.trim()) return;
    setParsingSmart(true);
    setApplyError("");
    setApplySuccess("");

    try {
      const res = await hcmApi.smartLeave(textToParse);
      if (res.leaveTypeId) setSelectedType(res.leaveTypeId);
      if (res.startDate) setStartDate(res.startDate);
      if (res.endDate) setEndDate(res.endDate);
      if (res.reason) setReason(res.reason);

      setAiHighlight(true);
      setTimeout(() => setAiHighlight(false), 2500);

      setApplySuccess(`AI parsed request: ${res.leaveTypeName || "Leave"} from ${res.startDate} to ${res.endDate}!`);
      if (!promptText) setSmartPrompt("");
    } catch (err: any) {
      setApplyError("Could not auto-parse request. Please fill the fields manually.");
    } finally {
      setParsingSmart(false);
    }
  };

  // Instant AI 1-Click Auto Parse & Direct Submit
  const handleInstantAiSubmit = async (promptText?: string) => {
    const text = promptText || smartPrompt;
    if (!text.trim()) return;
    setAutoSubmitting(true);
    setApplyError("");
    setApplySuccess("");

    try {
      const parsed = await hcmApi.smartLeave(text);
      if (!parsed.startDate || !parsed.endDate) {
        throw new Error("Unable to determine leave dates from prompt.");
      }

      const res = await hcmApi.applyLeave({
        leaveTypeId: parsed.leaveTypeId || selectedType,
        startDate: parsed.startDate,
        endDate: parsed.endDate,
        reason: parsed.reason || text,
      });

      setApplySuccess(`⚡ AI Instant Submitted: ${parsed.leaveTypeName || "Leave"} (${parsed.startDate} to ${parsed.endDate}) submitted successfully!`);
      setSmartPrompt("");
      setReason("");
      loadData();
    } catch (err: any) {
      setApplyError(err.response?.data?.message || err.message || "AI auto-submit failed.");
    } finally {
      setAutoSubmitting(false);
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

  const filteredRequests = requests.filter((r) => {
    if (statusFilter === "all") return true;
    return r.status === statusFilter;
  });

  // Dynamic Theme Styling
  const cardBg = isAdmin
    ? "bg-[#111726]/90 border-slate-800 text-slate-100 backdrop-blur-md"
    : "bg-white border-slate-200/90 text-slate-900 shadow-xs";

  const inputBg = isAdmin
    ? "bg-slate-900/80 border-slate-700/80 text-white placeholder:text-slate-500 focus:border-cyan-500"
    : "bg-slate-50 border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-blue-500";

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* 1. LEAVE QUOTA BALANCES BENTO */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        {balances.map((b) => {
          const quota = b.quota || 14;
          const remaining = b.remaining || 0;
          const pct = Math.min(Math.round((remaining / quota) * 100), 100);

          return (
            <div
              key={b.leaveTypeId}
              className={`p-4 sm:p-5 rounded-2xl border transition-all duration-300 hover:-translate-y-1 ${cardBg}`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider truncate">
                  {b.displayName}
                </span>
                <span className="text-[10px] font-bold text-blue-500 bg-blue-500/10 px-2 py-0.5 rounded-full">
                  {b.name === "unpaid" ? "Flex" : `${quota}d Quota`}
                </span>
              </div>
              <div className="mt-2 text-2xl sm:text-3xl font-black tracking-tight">
                {b.remaining}{" "}
                <span className="text-xs font-normal text-slate-400">
                  {b.name === "unpaid" ? "" : "days"}
                </span>
              </div>
              <div className="mt-3 h-1.5 w-full bg-slate-800/20 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-700"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <p className="mt-2 text-[10px] text-slate-400 flex justify-between">
                <span>Used: {b.used}d</span>
                <span>Remaining: {b.remaining}d</span>
              </p>
            </div>
          );
        })}
      </div>

      {/* 2. AI SMART LEAVE COPILOT & SUBMIT */}
      <div
        className={`relative overflow-hidden rounded-3xl border p-5 sm:p-6 transition-all shadow-lg ${
          isAdmin
            ? "border-cyan-500/30 bg-gradient-to-br from-[#0D1527] via-[#101C35] to-[#0A0E1A] text-white"
            : "border-blue-200 bg-gradient-to-br from-blue-50 via-indigo-50/70 to-white text-slate-900"
        }`}
      >
        {/* Glowing aura */}
        <div className="pointer-events-none absolute -top-16 -right-16 h-56 w-56 rounded-full bg-cyan-500/15 blur-3xl" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-blue-500/20">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-600/15 text-blue-500 border border-blue-500/30">
              <Sparkles className="h-3.5 w-3.5 text-blue-400 animate-spin" style={{ animationDuration: "4s" }} />
              <span>AI Leave Copilot & Auto-Submit</span>
            </div>
            <h2 className="text-lg sm:text-xl font-extrabold mt-1.5 tracking-tight">
              Natural Language Leave Submission
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Type in plain English or Roman Urdu. AI extracts leave category, dates, working day math, and can auto-submit directly!
            </p>
          </div>

          <span className="text-[11px] font-mono font-medium text-slate-400 bg-slate-800/40 px-3 py-1 rounded-lg border border-slate-700/50 self-start md:self-auto">
            Bilingual: EN / Roman Urdu Supported
          </span>
        </div>

        {/* Quick Suggestion Chips */}
        <div className="relative z-10 mt-4 flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-semibold text-slate-400">Quick AI Prompts:</span>
          {quickTemplates.map((item, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                setSmartPrompt(item.prompt);
                handleSmartLeaveParse(item.prompt);
              }}
              className="text-xs font-medium px-3 py-1 rounded-xl bg-white/60 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 hover:border-blue-500 hover:text-blue-500 transition-all hover:-translate-y-0.5 active:scale-95"
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Natural Language Input Deck */}
        <div className="relative z-10 mt-4 flex flex-col sm:flex-row gap-2.5">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="e.g. 'Need 2 days off next Monday and Tuesday for sister wedding' or 'Mujhe kal doctor appointment ke liye sick leave chahiye'..."
              value={smartPrompt}
              onChange={(e) => setSmartPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSmartLeaveParse();
                }
              }}
              className={`w-full rounded-2xl border px-4 py-3 text-xs outline-none transition-all shadow-inner ${inputBg}`}
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleSmartLeaveParse()}
              disabled={parsingSmart || !smartPrompt.trim()}
              className="flex items-center justify-center gap-2 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white px-4 py-3 text-xs font-bold shadow-md transition-all active:scale-95 disabled:opacity-50"
            >
              <Sparkles className="h-4 w-4" />
              <span>{parsingSmart ? "Parsing..." : "Pre-fill Form"}</span>
            </button>

            <button
              type="button"
              onClick={() => handleInstantAiSubmit()}
              disabled={autoSubmitting || !smartPrompt.trim()}
              className="flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white px-5 py-3 text-xs font-extrabold shadow-md shadow-emerald-900/20 transition-all active:scale-95 disabled:opacity-50"
            >
              <Zap className="h-4 w-4 text-emerald-200" />
              <span>{autoSubmitting ? "Submitting..." : "⚡ AI Auto-Submit"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. LEAVE APPLICATION FORM */}
      <div
        className={`p-6 rounded-3xl border transition-all duration-300 ${cardBg} ${
          aiHighlight ? "ring-2 ring-blue-500 shadow-xl" : ""
        }`}
      >
        <div className="flex items-center justify-between pb-3 border-b border-slate-200/80 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500">
              <Calendar className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold">Standard Leave Application Form</h3>
              <p className="text-[11px] text-slate-400">Review parameters or submit custom dates</p>
            </div>
          </div>

          {aiHighlight && (
            <span className="text-[11px] font-bold text-emerald-500 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20 animate-pulse">
              ✨ Pre-filled by AI
            </span>
          )}
        </div>

        {applySuccess && (
          <div className="mt-4 flex items-center gap-2 rounded-2xl p-3.5 text-xs font-medium border bg-emerald-500/10 text-emerald-500 border-emerald-500/30 animate-fade-in-up">
            <CheckCircle className="h-4 w-4 shrink-0" />
            <span>{applySuccess}</span>
          </div>
        )}

        {applyError && (
          <div className="mt-4 flex items-center gap-2 rounded-2xl p-3.5 text-xs font-medium border bg-rose-500/10 text-rose-500 border-rose-500/30 animate-fade-in-up">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>{applyError}</span>
          </div>
        )}

        <form onSubmit={handleApply} className="mt-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div>
              <label className="block text-xs font-semibold mb-1 text-slate-400">
                Leave Category
              </label>
              <select
                required
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className={`w-full rounded-xl border px-3 py-2 text-xs outline-none transition ${inputBg}`}
              >
                {balances.length > 0 ? (
                  balances.map((b) => (
                    <option key={b.leaveTypeId} value={b.leaveTypeId}>
                      {b.displayName} ({b.remaining}d remaining)
                    </option>
                  ))
                ) : leaveTypes.length > 0 ? (
                  leaveTypes.map((t) => (
                    <option key={t._id} value={t._id}>
                      {t.displayName} ({t.yearlyQuota}d quota)
                    </option>
                  ))
                ) : (
                  <>
                    <option value="annual">Annual Leave</option>
                    <option value="sick">Sick Leave</option>
                    <option value="casual">Casual Leave</option>
                    <option value="unpaid">Unpaid Leave</option>
                  </>
                )}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1 text-slate-400">
                Start Date
              </label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className={`w-full rounded-xl border px-3 py-2 text-xs outline-none transition ${inputBg}`}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1 text-slate-400">
                End Date
              </label>
              <input
                type="date"
                required
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className={`w-full rounded-xl border px-3 py-2 text-xs outline-none transition ${inputBg}`}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1 text-slate-400">
              Reason / Justification
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Family wedding ceremony, severe flu & doctor rest..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className={`w-full rounded-xl border px-3 py-2 text-xs outline-none transition ${inputBg}`}
            />
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
            <span className="text-[11px] text-slate-400">
              * Overlaps with prior leaves are blocked automatically. Excludes weekends & designated public holidays.
            </span>
            <button
              type="submit"
              disabled={applying}
              className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-500 px-6 py-2.5 text-xs font-bold text-white transition-all shadow-md active:scale-95 disabled:opacity-50"
            >
              <Send className="h-3.5 w-3.5" />
              <span>{applying ? "Submitting..." : "Submit Leave Application"}</span>
            </button>
          </div>
        </form>
      </div>

      {/* 4. LEAVE REQUESTS INBOX & HISTORY */}
      <div className={`rounded-3xl border overflow-hidden ${cardBg}`}>
        <div className="p-4 sm:p-5 border-b border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold">
              {isHRorAdmin ? "Leave Approval Inbox & Management" : "My Leave History & Status"}
            </h3>
            <p className="text-[11px] text-slate-400">
              {filteredRequests.length} total applications shown
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl">
            {(["all", "pending", "approved", "rejected"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setStatusFilter(tab)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold capitalize transition-all ${
                  statusFilter === tab
                    ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-slate-400">
              <tr>
                <th className="p-3.5">Employee</th>
                <th className="p-3.5">Leave Category</th>
                <th className="p-3.5">Duration</th>
                <th className="p-3.5">Dates</th>
                <th className="p-3.5">Reason</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400">
                    No leave requests found under &apos;{statusFilter}&apos;.
                  </td>
                </tr>
              ) : (
                filteredRequests.map((r) => {
                  const isPending = r.status === "pending";
                  const isApproved = r.status === "approved";
                  const isRejected = r.status === "rejected";

                  return (
                    <tr key={r._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="p-3.5 font-semibold">
                        {r.employee ? `${r.employee.firstName} ${r.employee.lastName}` : "Self"}
                        <span className="block text-[10px] text-slate-400 font-mono">
                          {r.employee?.employeeCode}
                        </span>
                      </td>
                      <td className="p-3.5 font-medium">
                        {r.leaveType?.displayName}
                      </td>
                      <td className="p-3.5 font-bold text-blue-500">
                        {r.workingDays} day(s)
                      </td>
                      <td className="p-3.5 font-mono text-[11px] text-slate-400">
                        {r.startDate} → {r.endDate}
                      </td>
                      <td className="p-3.5 max-w-xs truncate text-slate-500 dark:text-slate-400" title={r.reason}>
                        {r.reason}
                      </td>
                      <td className="p-3.5">
                        {isPending && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20">
                            <Clock className="h-3 w-3 animate-pulse" /> Pending
                          </span>
                        )}
                        {isApproved && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                            <Check className="h-3 w-3" /> Approved
                          </span>
                        )}
                        {isRejected && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-500/10 text-rose-500 border border-rose-500/20">
                            <X className="h-3 w-3" /> Rejected
                          </span>
                        )}
                      </td>
                      <td className="p-3.5 text-right">
                        {isHRorAdmin && isPending ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => {
                                setActiveReviewId(r._id);
                                handleReviewLeave("approved");
                              }}
                              className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] transition shadow-xs"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => {
                                setActiveReviewId(r._id);
                                handleReviewLeave("rejected");
                              }}
                              className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-[11px] transition shadow-xs"
                            >
                              Reject
                            </button>
                          </div>
                        ) : isPending ? (
                          <button
                            onClick={() => handleCancelLeave(r._id)}
                            className="text-slate-400 hover:text-rose-500 font-semibold text-[11px] transition"
                          >
                            Cancel
                          </button>
                        ) : (
                          <span className="text-[11px] text-slate-400 font-mono">Finalized</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
