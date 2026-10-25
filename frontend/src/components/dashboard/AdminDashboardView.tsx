"use client";

import { useState, useEffect } from "react";
import { hcmApi } from "@/api/hcm";
import { Users, TrendingDown, DollarSign, Wallet, Sparkles, Building, ShieldCheck, History } from "lucide-react";

export default function AdminDashboardView() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<string[] | null>(null);
  const [summarizing, setSummarizing] = useState(false);

  // Exact Admin Theme Colors
  const theme = {
    bg: "#17191D",
    cardBg: "#24272D",
    text: "#E7E9ED",
    mutedText: "#9CA3AF",
    accent: "#7299D4",
    accentBg: "rgba(114, 153, 212, 0.15)",
    border: "#2C3038",
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await hcmApi.getAdminDashboard();
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
      const res = await hcmApi.summarizeDashboard(data.kpis, "Admin");
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
        <p className="text-xs" style={{ color: theme.mutedText }}>Loading Admin Dashboard metrics...</p>
      </div>
    );
  }

  const kpis = data?.kpis || {};
  const headcountByDept = data?.headcountByDept || [];
  const genderDist = data?.genderDist || [];
  const auditFeed = data?.auditFeed || [];

  return (
    <div className="space-y-6" style={{ color: theme.text }}>
      {/* Top Banner with AI Summary Button */}
      <div
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl shadow-sm border"
        style={{
          background: "linear-gradient(135deg, #1E232B 0%, #262D38 100%)",
          borderColor: theme.border,
        }}
      >
        <div>
          <span
            className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
            style={{ backgroundColor: theme.accentBg, color: theme.accent }}
          >
            Executive Command Center
          </span>
          <h2 className="text-xl font-extrabold mt-1" style={{ color: theme.text }}>Company-Level Overview</h2>
          <p className="text-xs mt-0.5" style={{ color: theme.mutedText }}>
            Real-time analytics aggregated across all departments & audit events
          </p>
        </div>

        <button
          onClick={handleSummarize}
          disabled={summarizing}
          className="flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold text-white transition shadow-sm hover:opacity-90 disabled:opacity-50"
          style={{ backgroundColor: theme.accent }}
        >
          <Sparkles className="h-4 w-4" />
          {summarizing ? "Generating Insights..." : "AI Dashboard Summary"}
        </button>
      </div>

      {/* AI Summary Card (if generated) */}
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
            <span>AI Executive Insights (Derived strictly from live records)</span>
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

      {/* 4 Core KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Headcount */}
        <div
          className="p-5 rounded-2xl border shadow-xs"
          style={{ backgroundColor: theme.cardBg, borderColor: theme.border }}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium" style={{ color: theme.mutedText }}>Active Headcount</span>
            <div className="p-2 rounded-xl" style={{ backgroundColor: theme.accentBg, color: theme.accent }}>
              <Users className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-extrabold" style={{ color: theme.text }}>
            {kpis.headcount || 0}
          </div>
          <p className="mt-1 text-[11px]" style={{ color: theme.mutedText }}>
            {kpis.active || 0} active · {kpis.probation || 0} probation
          </p>
        </div>

        {/* Attrition Rate */}
        <div
          className="p-5 rounded-2xl border shadow-xs"
          style={{ backgroundColor: theme.cardBg, borderColor: theme.border }}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium" style={{ color: theme.mutedText }}>Attrition Rate (YTD)</span>
            <div className="p-2 rounded-xl" style={{ backgroundColor: "rgba(16, 185, 129, 0.15)", color: "#10B981" }}>
              <TrendingDown className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-extrabold" style={{ color: theme.text }}>
            {kpis.attritionRate || 0}%
          </div>
          <p className="mt-1 text-[11px]" style={{ color: theme.mutedText }}>
            Formula: Exits ÷ Avg Headcount
          </p>
        </div>

        {/* Monthly Payroll Cost */}
        <div
          className="p-5 rounded-2xl border shadow-xs"
          style={{ backgroundColor: theme.cardBg, borderColor: theme.border }}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium" style={{ color: theme.mutedText }}>Net Payroll Cost</span>
            <div className="p-2 rounded-xl" style={{ backgroundColor: theme.accentBg, color: theme.accent }}>
              <DollarSign className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-extrabold" style={{ color: theme.text }}>
            PKR {kpis.payrollCost?.toLocaleString() || "0"}
          </div>
          <p className="mt-1 text-[11px]" style={{ color: theme.mutedText }}>
            Month: {kpis.latestPayrollMonth || "None"}
          </p>
        </div>

        {/* Average Gross Salary */}
        <div
          className="p-5 rounded-2xl border shadow-xs"
          style={{ backgroundColor: theme.cardBg, borderColor: theme.border }}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium" style={{ color: theme.mutedText }}>Avg Gross Salary</span>
            <div className="p-2 rounded-xl" style={{ backgroundColor: "rgba(245, 158, 11, 0.15)", color: "#F59E0B" }}>
              <Wallet className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-extrabold" style={{ color: theme.text }}>
            PKR {kpis.avgSalary?.toLocaleString() || "0"}
          </div>
          <p className="mt-1 text-[11px]" style={{ color: theme.mutedText }}>Mean across active team</p>
        </div>
      </div>

      {/* Breakdown Grids */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Headcount by Department */}
        <div
          className="p-5 rounded-2xl border shadow-xs"
          style={{ backgroundColor: theme.cardBg, borderColor: theme.border }}
        >
          <div className="flex items-center justify-between mb-4 border-b pb-2" style={{ borderColor: theme.border }}>
            <h3 className="text-sm font-bold flex items-center gap-2" style={{ color: theme.text }}>
              <Building className="h-4 w-4" style={{ color: theme.accent }} />
              Headcount by Department
            </h3>
            <span className="text-xs" style={{ color: theme.mutedText }}>{headcountByDept.length} Depts</span>
          </div>

          {headcountByDept.length === 0 ? (
            <p className="text-center py-8 text-xs" style={{ color: theme.mutedText }}>No departments or employees added yet.</p>
          ) : (
            <div className="space-y-3">
              {headcountByDept.map((d: any, idx: number) => {
                const pct = kpis.headcount ? Math.round((d.count / kpis.headcount) * 100) : 0;
                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between text-xs font-medium">
                      <span style={{ color: theme.text }}>{d.departmentName}</span>
                      <span style={{ color: theme.mutedText }}>{d.count} ({pct}%)</span>
                    </div>
                    <div className="h-2 w-full rounded-full overflow-hidden" style={{ backgroundColor: "#17191D" }}>
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${pct}%`, backgroundColor: theme.accent }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Gender Breakdown & Diversity */}
        <div
          className="p-5 rounded-2xl border shadow-xs"
          style={{ backgroundColor: theme.cardBg, borderColor: theme.border }}
        >
          <div className="flex items-center justify-between mb-4 border-b pb-2" style={{ borderColor: theme.border }}>
            <h3 className="text-sm font-bold flex items-center gap-2" style={{ color: theme.text }}>
              <ShieldCheck className="h-4 w-4" style={{ color: theme.accent }} />
              Workforce Demographics
            </h3>
            <span className="text-xs" style={{ color: theme.mutedText }}>Diversity</span>
          </div>

          <div className="grid grid-cols-3 gap-3 text-center my-4">
            {["male", "female", "other"].map((g) => {
              const item = genderDist.find((x: any) => x._id === g);
              const count = item?.count || 0;
              return (
                <div
                  key={g}
                  className="p-3 rounded-xl border"
                  style={{ backgroundColor: "#1D2026", borderColor: theme.border }}
                >
                  <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: theme.mutedText }}>{g}</span>
                  <p className="text-xl font-bold mt-1" style={{ color: theme.text }}>{count}</p>
                </div>
              );
            })}
          </div>
          <p className="text-[11px] text-center" style={{ color: theme.mutedText }}>
            Zero data pre-loaded: numbers update automatically as employees are registered.
          </p>
        </div>
      </div>

      {/* Audit Feed */}
      <div
        className="p-5 rounded-2xl border shadow-xs"
        style={{ backgroundColor: theme.cardBg, borderColor: theme.border }}
      >
        <div className="flex items-center justify-between mb-3 border-b pb-2" style={{ borderColor: theme.border }}>
          <h3 className="text-sm font-bold flex items-center gap-2" style={{ color: theme.text }}>
            <History className="h-4 w-4" style={{ color: theme.accent }} />
            Live Audit Stream (Admin Only)
          </h3>
          <span className="text-xs" style={{ color: theme.mutedText }}>Latest Actions</span>
        </div>

        <div className="divide-y max-h-60 overflow-y-auto" style={{ borderColor: theme.border }}>
          {auditFeed.length === 0 ? (
            <p className="text-center py-6 text-xs" style={{ color: theme.mutedText }}>No audit logs recorded yet.</p>
          ) : (
            auditFeed.map((log: any) => (
              <div
                key={log._id}
                className="py-2.5 flex items-center justify-between text-xs"
                style={{ borderColor: theme.border }}
              >
                <div>
                  <span className="font-semibold" style={{ color: theme.text }}>{log.actor?.email}</span>
                  <span
                    className="ml-2 font-mono text-[10px] px-1.5 py-0.5 rounded"
                    style={{ backgroundColor: theme.accentBg, color: theme.accent }}
                  >
                    {log.action}
                  </span>
                  <span className="ml-2" style={{ color: theme.mutedText }}>on {log.entity}</span>
                </div>
                <span className="text-[11px]" style={{ color: theme.mutedText }}>
                  {new Date(log.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
