"use client";

import { useState, useEffect } from "react";
import { hcmApi } from "@/api/hcm";
import { Users, CheckCircle, Clock, CalendarX, AlertCircle, Sparkles, UserX, Award } from "lucide-react";

export default function HRDashboardView() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<string[] | null>(null);
  const [summarizing, setSummarizing] = useState(false);

  // Exact HR Theme Colors
  const theme = {
    bg: "#F5F7FA",
    cardBg: "#FFFFFF",
    text: "#253247",
    mutedText: "#64748B",
    accent: "#356AC3",
    accentBg: "rgba(53, 106, 195, 0.12)",
    border: "#E2E8F0",
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await hcmApi.getHRDashboard();
      setData(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSummarize = async () => {
    if (!data?.kpis) return;
    setSummarizing(true);
    try {
      const res = await hcmApi.summarizeDashboard(data.kpis, "HR");
      setSummary(res.bullets || []);
    } catch (err) {
      console.error(err);
    } finally {
      setSummarizing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-xs" style={{ color: theme.mutedText }}>Loading HR People Operations metrics...</p>
      </div>
    );
  }

  const kpis = data?.kpis || {};
  const topLateComers = data?.topLateComers || [];
  const leaveByType = data?.leaveByType || [];

  return (
    <div className="space-y-6" style={{ color: theme.text }}>
      {/* Top Banner with AI Summary */}
      <div
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl text-white shadow-sm border"
        style={{
          background: "linear-gradient(135deg, #356AC3 0%, #204C99 100%)",
          borderColor: theme.accent,
        }}
      >
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider bg-white/20 px-2.5 py-0.5 rounded-full">
            People Operations Center
          </span>
          <h2 className="text-xl font-extrabold mt-1 text-white">HR Operations Dashboard</h2>
          <p className="text-xs text-blue-100 mt-0.5">
            Daily attendance, leave utilization, absenteeism & pending approvals
          </p>
        </div>

        <button
          onClick={handleSummarize}
          disabled={summarizing}
          className="flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-xs font-bold transition shadow-sm hover:bg-blue-50 disabled:opacity-50"
          style={{ color: theme.accent }}
        >
          <Sparkles className="h-4 w-4" style={{ color: theme.accent }} />
          {summarizing ? "Generating Insights..." : "AI Operations Summary"}
        </button>
      </div>

      {/* AI Summary Card */}
      {summary && (
        <div
          className="p-4 rounded-2xl border"
          style={{
            backgroundColor: theme.cardBg,
            borderColor: theme.accent,
          }}
        >
          <div className="flex items-center gap-2 text-xs font-bold mb-2" style={{ color: theme.accent }}>
            <Sparkles className="h-4 w-4" />
            <span>AI Operations Insights (3–5 bullets based strictly on live numbers)</span>
          </div>
          <ul className="space-y-1.5 text-xs">
            {summary.map((b, i) => (
              <li key={i} className="flex items-start gap-2">
                <span style={{ color: theme.accent }} className="font-bold">•</span>
                <span style={{ color: theme.text }}>{b}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Core 5 KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        {/* Headcount */}
        <div
          className="p-5 rounded-2xl border shadow-xs"
          style={{ backgroundColor: theme.cardBg, borderColor: theme.border }}
        >
          <span className="text-[11px] font-semibold" style={{ color: theme.mutedText }}>Active Staff</span>
          <div className="mt-1 text-2xl font-extrabold" style={{ color: theme.text }}>
            {kpis.totalHeadcount || 0}
          </div>
          <p className="mt-1 text-[10px]" style={{ color: theme.mutedText }}>Company workforce</p>
        </div>

        {/* Present Today */}
        <div
          className="p-5 rounded-2xl border shadow-xs"
          style={{ backgroundColor: theme.cardBg, borderColor: theme.border }}
        >
          <span className="text-[11px] font-semibold" style={{ color: theme.mutedText }}>Present Today</span>
          <div className="mt-1 text-2xl font-extrabold text-emerald-600">
            {kpis.presentToday || 0}
          </div>
          <p className="mt-1 text-[10px] text-emerald-600">On-time check-ins</p>
        </div>

        {/* Late Today */}
        <div
          className="p-5 rounded-2xl border shadow-xs"
          style={{ backgroundColor: theme.cardBg, borderColor: theme.border }}
        >
          <span className="text-[11px] font-semibold" style={{ color: theme.mutedText }}>Late Today</span>
          <div className="mt-1 text-2xl font-extrabold text-amber-600">
            {kpis.lateToday || 0}
          </div>
          <p className="mt-1 text-[10px] text-amber-600">After 09:15 grace</p>
        </div>

        {/* On Leave Today */}
        <div
          className="p-5 rounded-2xl border shadow-xs"
          style={{ backgroundColor: theme.cardBg, borderColor: theme.border }}
        >
          <span className="text-[11px] font-semibold" style={{ color: theme.mutedText }}>On Leave Today</span>
          <div className="mt-1 text-2xl font-extrabold" style={{ color: theme.accent }}>
            {kpis.onLeaveToday || 0}
          </div>
          <p className="mt-1 text-[10px]" style={{ color: theme.accent }}>Approved leaves</p>
        </div>

        {/* Pending Approvals */}
        <div
          className="p-5 rounded-2xl border shadow-xs col-span-2 sm:col-span-1"
          style={{ backgroundColor: theme.cardBg, borderColor: theme.border }}
        >
          <span className="text-[11px] font-semibold" style={{ color: theme.mutedText }}>Pending Inbox</span>
          <div className="mt-1 text-2xl font-extrabold text-purple-600">
            {kpis.pendingApprovals || 0}
          </div>
          <p className="mt-1 text-[10px] text-purple-600 font-medium">
            {kpis.pendingLeaves || 0} leaves · {kpis.pendingCorrections || 0} corrections
          </p>
        </div>
      </div>

      {/* Attendance Rate Progress Banner */}
      <div
        className="p-5 rounded-2xl border shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        style={{ backgroundColor: theme.cardBg, borderColor: theme.border }}
      >
        <div>
          <h3 className="text-sm font-bold" style={{ color: theme.text }}>
            Daily Attendance Rate: {kpis.attendanceRate || 0}%
          </h3>
          <p className="text-xs mt-0.5" style={{ color: theme.mutedText }}>
            Formula: (Present + Late + Missing Checkout + 0.5 × Half Day) ÷ (Working Headcount − On Leave)
          </p>
        </div>
        <div className="w-full sm:w-64 h-3 rounded-full overflow-hidden" style={{ backgroundColor: "#EBF1F7" }}>
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${Math.min(100, kpis.attendanceRate || 0)}%`,
              backgroundColor: theme.accent,
            }}
          ></div>
        </div>
      </div>

      {/* 2 Detail Cards: Top 5 Late-Comers & Leave Utilization */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top 5 Late Comers */}
        <div
          className="p-5 rounded-2xl border shadow-xs"
          style={{ backgroundColor: theme.cardBg, borderColor: theme.border }}
        >
          <div className="flex items-center justify-between mb-4 border-b pb-2" style={{ borderColor: theme.border }}>
            <h3 className="text-sm font-bold flex items-center gap-2" style={{ color: theme.text }}>
              <Clock className="h-4 w-4 text-amber-500" />
              Top Late-Comers This Month
            </h3>
            <span className="text-[10px] font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
              Penalty: 3 lates = 0.5 day
            </span>
          </div>

          {topLateComers.length === 0 ? (
            <p className="text-center py-8 text-xs" style={{ color: theme.mutedText }}>
              No late-comers recorded for this month. Perfect punctuality!
            </p>
          ) : (
            <div className="divide-y" style={{ borderColor: theme.border }}>
              {topLateComers.map((t: any, idx: number) => (
                <div key={idx} className="py-2.5 flex items-center justify-between text-xs" style={{ borderColor: theme.border }}>
                  <div>
                    <span className="font-semibold" style={{ color: theme.text }}>{t.employeeName}</span>
                    <span className="ml-2 font-mono text-[10px]" style={{ color: theme.mutedText }}>{t.employeeCode}</span>
                    <span className="ml-2" style={{ color: theme.mutedText }}>({t.department || "General"})</span>
                  </div>
                  <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-800">
                    {t.lateCount} time(s)
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Leave Utilization by Type */}
        <div
          className="p-5 rounded-2xl border shadow-xs"
          style={{ backgroundColor: theme.cardBg, borderColor: theme.border }}
        >
          <div className="flex items-center justify-between mb-4 border-b pb-2" style={{ borderColor: theme.border }}>
            <h3 className="text-sm font-bold flex items-center gap-2" style={{ color: theme.text }}>
              <CalendarX className="h-4 w-4" style={{ color: theme.accent }} />
              Approved Leaves by Type
            </h3>
            <span className="text-xs" style={{ color: theme.mutedText }}>This Month</span>
          </div>

          {leaveByType.length === 0 ? (
            <p className="text-center py-8 text-xs" style={{ color: theme.mutedText }}>
              No approved leaves for this month yet.
            </p>
          ) : (
            <div className="space-y-3">
              {leaveByType.map((l: any, idx: number) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 rounded-xl border text-xs"
                  style={{ backgroundColor: "#F8FAFC", borderColor: theme.border }}
                >
                  <span className="font-semibold" style={{ color: theme.text }}>{l.leaveTypeName}</span>
                  <span className="font-bold" style={{ color: theme.accent }}>{l.totalDays} working day(s)</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
