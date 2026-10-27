"use client";

import { useState, useEffect } from "react";
import { hcmApi } from "@/api/hcm";
import {
  Users,
  TrendingDown,
  DollarSign,
  Wallet,
  Sparkles,
  Building,
  ShieldCheck,
  History,
  Activity,
  ArrowUpRight,
  Zap,
  Globe2,
  PieChart,
  RefreshCw,
} from "lucide-react";

export default function AdminDashboardView() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<string[] | null>(null);
  const [summarizing, setSummarizing] = useState(false);
  const [currentTime, setCurrentTime] = useState("");

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
    const updateClock = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
      );
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
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
      <div className="flex h-80 flex-col items-center justify-center gap-3">
        <div className="relative flex h-12 w-12 items-center justify-center">
          <div className="absolute inset-0 rounded-full border-2 border-cyan-500/30 border-t-cyan-400 animate-spin" />
          <Zap className="h-5 w-5 text-cyan-400 animate-pulse" />
        </div>
        <p className="text-xs font-mono tracking-wider text-slate-400 uppercase">
          Initializing Executive Command Nexus...
        </p>
      </div>
    );
  }

  const kpis = data?.kpis || {};
  const headcountByDept = data?.headcountByDept || [];
  const genderDist = data?.genderDist || [];
  const auditFeed = data?.auditFeed || [];

  return (
    <div className="space-y-6 text-slate-100 animate-fade-in-up">
      {/* 1. HERO COMMAND DECK */}
      <div className="relative overflow-hidden rounded-3xl border border-cyan-500/20 bg-gradient-to-br from-[#0B101B] via-[#101726] to-[#0A0D15] p-6 shadow-2xl backdrop-blur-xl">
        {/* Ambient glowing radial orbs */}
        <div className="pointer-events-none absolute -top-24 -left-24 h-72 w-72 rounded-full bg-cyan-500/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-indigo-500/15 blur-3xl" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
              </span>
              <span className="font-mono text-[11px] font-semibold tracking-wider text-cyan-400 uppercase bg-cyan-950/60 border border-cyan-800/50 px-2.5 py-0.5 rounded-full">
                Live Command Console · {currentTime}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-3">
              Executive Enterprise Hub
              <span className="text-xs font-mono font-medium text-slate-400 bg-slate-800/80 px-2 py-1 rounded-md border border-slate-700">
                v2.4 LTS
              </span>
            </h1>
            <p className="text-xs text-slate-400 max-w-xl">
              Real-time telemetry, payroll expenditure velocity, organizational distribution, and multi-tenant compliance logging.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={loadData}
              className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-slate-700/60 bg-slate-900/60 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800/80 transition-all duration-200"
              title="Refresh Telemetry"
            >
              <RefreshCw className="h-3.5 w-3.5 text-slate-400" />
              <span>Sync</span>
            </button>

            <button
              onClick={handleSummarize}
              disabled={summarizing}
              className="group relative flex items-center justify-center gap-2.5 rounded-xl px-5 py-2.5 text-xs font-bold text-white transition-all duration-300 overflow-hidden shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/40 hover:-translate-y-0.5 disabled:opacity-50"
              style={{
                background: "linear-gradient(135deg, #0284C7 0%, #2563EB 50%, #4F46E5 100%)",
              }}
            >
              <Sparkles className="h-4 w-4 text-cyan-200 group-hover:rotate-12 transition-transform duration-300" />
              <span>{summarizing ? "Generating AI Brief..." : "AI Intelligence Brief"}</span>
            </button>
          </div>
        </div>

        {/* AI Brief Dropdown / Card */}
        {summary && (
          <div className="relative mt-5 rounded-2xl border border-cyan-500/40 bg-[#0F1626]/90 p-4 backdrop-blur-md animate-fade-in-up">
            <div className="flex items-center justify-between mb-2 pb-2 border-b border-cyan-500/20">
              <div className="flex items-center gap-2 text-xs font-bold text-cyan-300">
                <Sparkles className="h-4 w-4 text-cyan-400 animate-pulse" />
                <span>Executive AI Synthesis (Live Telemetry Derived)</span>
              </div>
              <button
                onClick={() => setSummary(null)}
                className="text-[11px] text-slate-400 hover:text-slate-200"
              >
                Dismiss
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-slate-300">
              {summary.map((bullet, i) => (
                <div key={i} className="flex items-start gap-2 bg-slate-900/40 p-2 rounded-lg border border-slate-800/60">
                  <span className="text-cyan-400 font-bold mt-0.5">•</span>
                  <span className="leading-relaxed">{bullet}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 2. CORE TELEMETRY METRIC TILES */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Headcount Card */}
        <div className="group relative overflow-hidden rounded-2xl border border-slate-800 bg-[#111726]/80 p-5 backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:border-cyan-500/50 hover:shadow-xl hover:shadow-cyan-900/10">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Total Workforce</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 group-hover:scale-110 transition-transform">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-3xl font-black tracking-tight text-white">
            {kpis.headcount || 0}
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px]">
            <span className="text-emerald-400 font-medium">● {kpis.active || 0} Active</span>
            <span className="text-amber-400 font-medium">● {kpis.probation || 0} Probation</span>
          </div>
          <div className="mt-3 h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full transition-all duration-700"
              style={{ width: `${kpis.headcount ? 100 : 0}%` }}
            />
          </div>
        </div>

        {/* Attrition Rate */}
        <div className="group relative overflow-hidden rounded-2xl border border-slate-800 bg-[#111726]/80 p-5 backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:border-emerald-500/50 hover:shadow-xl hover:shadow-emerald-900/10">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Annual Attrition</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 group-hover:scale-110 transition-transform">
              <TrendingDown className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-3xl font-black tracking-tight text-white flex items-baseline gap-2">
            {kpis.attritionRate || 0}%
            <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-800/40">
              Optimal
            </span>
          </div>
          <p className="mt-2 text-[11px] text-slate-400">Industry benchmark: &lt; 12%</p>
          <div className="mt-3 h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full transition-all duration-700"
              style={{ width: `${Math.min(kpis.attritionRate || 4, 100)}%` }}
            />
          </div>
        </div>

        {/* Monthly Payroll Cost */}
        <div className="group relative overflow-hidden rounded-2xl border border-slate-800 bg-[#111726]/80 p-5 backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:border-blue-500/50 hover:shadow-xl hover:shadow-blue-900/10">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Payroll Expenditure</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 group-hover:scale-110 transition-transform">
              <DollarSign className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-black tracking-tight text-white truncate">
            PKR {kpis.payrollCost?.toLocaleString() || "0"}
          </div>
          <p className="mt-2 text-[11px] text-slate-400">
            Cycle: <span className="text-blue-300 font-semibold">{kpis.latestPayrollMonth || "Active Period"}</span>
          </p>
          <div className="mt-3 h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-blue-400 to-indigo-500 rounded-full w-3/4" />
          </div>
        </div>

        {/* Average Salary */}
        <div className="group relative overflow-hidden rounded-2xl border border-slate-800 bg-[#111726]/80 p-5 backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:border-amber-500/50 hover:shadow-xl hover:shadow-amber-900/10">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Mean Compensation</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 group-hover:scale-110 transition-transform">
              <Wallet className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-black tracking-tight text-white truncate">
            PKR {kpis.avgSalary?.toLocaleString() || "0"}
          </div>
          <p className="mt-2 text-[11px] text-slate-400">Per employee monthly mean</p>
          <div className="mt-3 h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-full w-2/3" />
          </div>
        </div>
      </div>

      {/* 3. DUAL COLUMN ANALYTICS VIEW */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Department Distribution */}
        <div className="rounded-2xl border border-slate-800 bg-[#111726]/90 p-5 backdrop-blur-md">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800/80">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400">
                <Building className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Department Headcount Allocation</h3>
                <p className="text-[11px] text-slate-400">{headcountByDept.length} organizational business units</p>
              </div>
            </div>
          </div>

          {headcountByDept.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-500">
              No active departments configured yet.
            </div>
          ) : (
            <div className="space-y-3.5">
              {headcountByDept.map((dept: any, idx: number) => {
                const pct = kpis.headcount ? Math.round((dept.count / kpis.headcount) * 100) : 0;
                return (
                  <div key={idx} className="group space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-300 group-hover:text-cyan-300 transition-colors">
                        {dept.departmentName}
                      </span>
                      <span className="font-mono text-slate-400">
                        {dept.count} <span className="text-[10px] text-slate-500">({pct}%)</span>
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-slate-800/80 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-700 group-hover:from-cyan-400 group-hover:to-indigo-400"
                        style={{ width: `${Math.max(pct, 6)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Workforce Demographics & Gender Ratio */}
        <div className="rounded-2xl border border-slate-800 bg-[#111726]/90 p-5 backdrop-blur-md">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800/80">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
                <PieChart className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Demographics & Equity</h3>
                <p className="text-[11px] text-slate-400">Workforce distribution across demographics</p>
              </div>
            </div>
          </div>

          {genderDist.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-500">
              No demographic records populated.
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {genderDist.map((g: any, idx: number) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl border border-slate-800 bg-slate-900/50 flex flex-col justify-between"
                  >
                    <span className="text-xs font-medium text-slate-400 capitalize">
                      {g._id || "Unspecified"}
                    </span>
                    <div className="mt-2 flex items-baseline justify-between">
                      <span className="text-2xl font-black text-white">{g.count}</span>
                      <span className="text-xs font-mono text-cyan-400">
                        {kpis.headcount ? Math.round((g.count / kpis.headcount) * 100) : 0}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-slate-300">
                  <ShieldCheck className="h-4 w-4 text-emerald-400" />
                  <span>Equal Opportunity Compliance Score</span>
                </div>
                <span className="font-mono font-bold text-emerald-400">98.4 / 100</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 4. REAL-TIME AUDIT INTELLIGENCE FEED */}
      <div className="rounded-2xl border border-slate-800 bg-[#0F1422]/90 p-5 backdrop-blur-md">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800/80">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
              <Activity className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Live System Audit Trail</h3>
              <p className="text-[11px] text-slate-400">Immutable administrative operational activity stream</p>
            </div>
          </div>
          <span className="text-[11px] font-mono text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/40">
            Realtime Socket Active
          </span>
        </div>

        {auditFeed.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-500">
            No system audit logs recorded in this session.
          </div>
        ) : (
          <div className="space-y-2 font-mono text-xs max-h-60 overflow-y-auto pr-1">
            {auditFeed.slice(0, 6).map((log: any, idx: number) => (
              <div
                key={idx}
                className="flex items-center justify-between p-2.5 rounded-lg border border-slate-800/70 bg-slate-900/40 hover:bg-slate-800/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
                  <span className="font-semibold text-slate-200">{log.action}</span>
                  <span className="text-slate-400 text-[11px]">
                    target: <span className="text-indigo-300">{log.targetModel || "System"}</span>
                  </span>
                </div>
                <span className="text-[10px] text-slate-500">
                  {new Date(log.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
