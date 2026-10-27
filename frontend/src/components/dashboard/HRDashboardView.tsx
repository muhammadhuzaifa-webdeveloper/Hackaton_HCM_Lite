"use client";

import { useState, useEffect } from "react";
import { hcmApi } from "@/api/hcm";
import {
  Users,
  CheckCircle,
  Clock,
  CalendarX,
  AlertCircle,
  Sparkles,
  UserX,
  Award,
  ArrowRight,
  TrendingUp,
  UserCheck,
  CalendarCheck,
  Briefcase,
  FileSpreadsheet,
  AlertTriangle,
  Sun,
  Moon,
  Coffee,
} from "lucide-react";

interface HRDashboardProps {
  onNavigateTab?: (tab: string) => void;
}

export default function HRDashboardView({ onNavigateTab = () => {} }: HRDashboardProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<string[] | null>(null);
  const [summarizing, setSummarizing] = useState(false);
  const [greeting, setGreeting] = useState("Good day");

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
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Good morning");
    else if (hour < 17) setGreeting("Good afternoon");
    else setGreeting("Good evening");
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
      <div className="flex h-80 flex-col items-center justify-center gap-3">
        <div className="relative flex h-12 w-12 items-center justify-center">
          <div className="absolute inset-0 rounded-full border-2 border-blue-500/20 border-t-blue-600 animate-spin" />
          <Users className="h-5 w-5 text-blue-600 animate-pulse" />
        </div>
        <p className="text-xs font-semibold tracking-wide text-slate-500">
          Syncing People Operations & Workforce Roster...
        </p>
      </div>
    );
  }

  const kpis = data?.kpis || {};
  const topLateComers = data?.topLateComers || [];
  const leaveByType = data?.leaveByType || [];

  const totalHeadcount = kpis.totalHeadcount || 1;
  const presentRate = Math.round(((kpis.presentToday || 0) / totalHeadcount) * 100);

  return (
    <div className="space-y-6 text-slate-800 animate-fade-in-up">
      {/* 1. SCANDINAVIAN GLASS BENTO HERO */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-700 p-6 sm:p-7 text-white shadow-xl shadow-blue-500/10">
        {/* Soft background glow circles */}
        <div className="pointer-events-none absolute -top-16 -right-16 h-64 w-64 rounded-full bg-white/10 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-16 -left-16 h-64 w-64 rounded-full bg-indigo-900/30 blur-2xl" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-md px-3 py-1 rounded-full text-xs font-semibold text-blue-100 border border-white/20">
              <Coffee className="h-3.5 w-3.5" />
              <span>{greeting}, People Operations Team</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Workforce Pulse & Culture Suite
            </h1>
            <p className="text-xs sm:text-sm text-blue-100/90 max-w-xl">
              Daily active presence, shift compliance, pending leave requests, and talent retention telemetry.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleSummarize}
              disabled={summarizing}
              className="flex items-center gap-2.5 rounded-2xl bg-white px-5 py-3 text-xs font-bold text-blue-700 shadow-md hover:bg-blue-50 hover:shadow-lg transition-all duration-200 active:scale-95 disabled:opacity-60"
            >
              <Sparkles className="h-4 w-4 text-blue-600 animate-spin" style={{ animationDuration: "3s" }} />
              <span>{summarizing ? "Analyzing Metrics..." : "AI Operations Brief"}</span>
            </button>
          </div>
        </div>

        {/* AI Operations Brief Card */}
        {summary && (
          <div className="relative mt-5 rounded-2xl bg-white/95 p-5 text-slate-800 shadow-lg backdrop-blur-md animate-fade-in-up">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-xs font-bold text-blue-700">
                <Sparkles className="h-4 w-4" />
                <span>AI Workforce Intelligence Insights</span>
              </div>
              <button
                onClick={() => setSummary(null)}
                className="text-xs text-slate-400 hover:text-slate-600 font-medium"
              >
                Dismiss
              </button>
            </div>
            <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2.5 text-xs text-slate-700">
              {summary.map((bullet, i) => (
                <div key={i} className="flex items-start gap-2 bg-blue-50/70 p-2.5 rounded-xl border border-blue-100/60">
                  <span className="text-blue-600 font-bold mt-0.5">•</span>
                  <span className="leading-relaxed">{bullet}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 2. LIVE BENTO KPI METRIC TILES */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 sm:gap-4">
        {/* Total Workforce */}
        <div className="group rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs hover:shadow-md hover:-translate-y-1 transition-all duration-200">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold text-slate-500">Active Roster</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 text-blue-600 group-hover:scale-110 transition-transform">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl sm:text-3xl font-extrabold text-slate-900">
            {kpis.totalHeadcount || 0}
          </div>
          <p className="mt-1 text-[11px] text-slate-500 font-medium">Enrolled staff</p>
        </div>

        {/* Present Today */}
        <div className="group rounded-2xl border border-emerald-100 bg-gradient-to-b from-emerald-50/50 to-white p-5 shadow-xs hover:shadow-md hover:-translate-y-1 transition-all duration-200">
          <div className="flex items-center justify-between text-emerald-600">
            <span className="text-xs font-semibold text-emerald-800">Present Today</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 group-hover:scale-110 transition-transform">
              <CheckCircle className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl sm:text-3xl font-extrabold text-emerald-700 flex items-baseline gap-1.5">
            {kpis.presentToday || 0}
            <span className="text-xs font-bold text-emerald-600">({presentRate}%)</span>
          </div>
          <p className="mt-1 text-[11px] text-emerald-600 font-medium">Checked in on schedule</p>
        </div>

        {/* Late Today */}
        <div className="group rounded-2xl border border-amber-100 bg-gradient-to-b from-amber-50/50 to-white p-5 shadow-xs hover:shadow-md hover:-translate-y-1 transition-all duration-200">
          <div className="flex items-center justify-between text-amber-600">
            <span className="text-xs font-semibold text-amber-800">Late Arrivals</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-100 text-amber-700 group-hover:scale-110 transition-transform">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl sm:text-3xl font-extrabold text-amber-700">
            {kpis.lateToday || 0}
          </div>
          <p className="mt-1 text-[11px] text-amber-600 font-medium">&gt; 09:15 AM check-in</p>
        </div>

        {/* On Leave */}
        <div className="group rounded-2xl border border-indigo-100 bg-gradient-to-b from-indigo-50/50 to-white p-5 shadow-xs hover:shadow-md hover:-translate-y-1 transition-all duration-200">
          <div className="flex items-center justify-between text-indigo-600">
            <span className="text-xs font-semibold text-indigo-800">On Leave</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700 group-hover:scale-110 transition-transform">
              <CalendarX className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl sm:text-3xl font-extrabold text-indigo-700">
            {kpis.onLeaveToday || 0}
          </div>
          <p className="mt-1 text-[11px] text-indigo-600 font-medium">Approved leaves</p>
        </div>

        {/* Absent */}
        <div className="group rounded-2xl border border-rose-100 bg-gradient-to-b from-rose-50/50 to-white p-5 shadow-xs hover:shadow-md hover:-translate-y-1 transition-all duration-200 col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between text-rose-600">
            <span className="text-xs font-semibold text-rose-800">Unaccounted</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-100 text-rose-700 group-hover:scale-110 transition-transform">
              <UserX className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl sm:text-3xl font-extrabold text-rose-700">
            {kpis.absentToday || 0}
          </div>
          <p className="mt-1 text-[11px] text-rose-600 font-medium">No check-in recorded</p>
        </div>
      </div>

      {/* 3. DUAL WORKFORCE ANALYTICS PANELS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Punctuality & Late Comers Watchlist */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
                <AlertTriangle className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Punctuality Watchlist</h3>
                <p className="text-[11px] text-slate-500">Top repeated late arrivals this calendar month</p>
              </div>
            </div>
            <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200/60">
              Grace Period: 15 mins
            </span>
          </div>

          {topLateComers.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">
              <UserCheck className="mx-auto h-8 w-8 text-emerald-400 mb-2 opacity-60" />
              <span>Flawless punctuality! No recurring late check-ins recorded.</span>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {topLateComers.map((item: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between py-3 group">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 font-bold text-xs text-slate-600 border border-slate-200">
                      {item.employee?.firstName?.[0] || "E"}
                      {item.employee?.lastName?.[0] || ""}
                    </div>
                    <div>
                      <div className="font-semibold text-xs text-slate-800 group-hover:text-blue-600 transition-colors">
                        {item.employee?.firstName} {item.employee?.lastName}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        {item.employee?.employeeCode} · {item.employee?.department?.name || "General"}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-0.5 text-xs font-bold text-rose-700 border border-rose-200/60">
                      <Clock className="h-3 w-3" />
                      {item.count} Late Days
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Leave Utilization Breakdown */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
                <CalendarCheck className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Leave Utilization by Category</h3>
                <p className="text-[11px] text-slate-500">Approved employee leave allocation overview</p>
              </div>
            </div>
            <button
              onClick={() => onNavigateTab("leave")}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              Manage <ArrowRight className="h-3 w-3" />
            </button>
          </div>

          {leaveByType.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">
              No leave requests filed for the current period.
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-3">
                {leaveByType.map((item: any, idx: number) => {
                  const colors = [
                    { bg: "bg-blue-500", text: "text-blue-600", light: "bg-blue-50" },
                    { bg: "bg-indigo-500", text: "text-indigo-600", light: "bg-indigo-50" },
                    { bg: "bg-violet-500", text: "text-violet-600", light: "bg-violet-50" },
                    { bg: "bg-emerald-500", text: "text-emerald-600", light: "bg-emerald-50" },
                  ];
                  const c = colors[idx % colors.length];
                  return (
                    <div key={idx} className="space-y-1.5">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-slate-700">{item.leaveType?.name || "General Leave"}</span>
                        <span className="text-slate-900">{item.count} Days Approved</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${c.bg} transition-all duration-700`}
                          style={{ width: `${Math.min(item.count * 15, 100)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-600 font-medium">Automated Leave Deductions:</span>
                <span className="font-bold text-emerald-700">Active · Standard Proration</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
