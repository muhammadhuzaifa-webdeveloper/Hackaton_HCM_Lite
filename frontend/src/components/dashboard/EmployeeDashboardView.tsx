"use client";

import { useState, useEffect } from "react";
import { hcmApi } from "@/api/hcm";
import {
  Clock,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  FileText,
  Bell,
  Sparkles,
  Camera,
  ArrowRight,
  ShieldCheck,
  Flame,
  Award,
  Wallet,
  CalendarPlus,
  RefreshCw,
  LogOut,
  Zap,
} from "lucide-react";
import CameraCheckInModal from "./CameraCheckInModal";

interface EmployeeDashboardProps {
  onOpenAI?: () => void;
  onNavigateTab?: (tab: string) => void;
}

export default function EmployeeDashboardView({
  onOpenAI = () => {},
  onNavigateTab = () => {},
}: EmployeeDashboardProps) {
  const [data, setData] = useState<any>(null);
  const [todayStatus, setTodayStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [checkingIn, setCheckingIn] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [currentTime, setCurrentTime] = useState("");

  const loadData = async () => {
    setLoading(true);
    try {
      const [dash, today] = await Promise.all([
        hcmApi.getEmployeeDashboard(),
        hcmApi.getMyTodayStatus(),
      ]);
      setData(dash);
      setTodayStatus(today);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleWebCheckIn = async () => {
    setCheckingIn(true);
    setStatusMsg("");
    setErrorMsg("");
    try {
      const res = await hcmApi.checkIn({ source: "web" });
      setStatusMsg(res.message || "Checked in successfully!");
      loadData();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || "Check-in failed.");
    } finally {
      setCheckingIn(false);
    }
  };

  const handleWebCheckOut = async () => {
    setCheckingOut(true);
    setStatusMsg("");
    setErrorMsg("");
    try {
      const res = await hcmApi.checkOut();
      setStatusMsg(res.message || "Checked out successfully!");
      loadData();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || "Check-out failed.");
    } finally {
      setCheckingOut(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-80 flex-col items-center justify-center gap-3">
        <div className="relative flex h-12 w-12 items-center justify-center">
          <div className="absolute inset-0 rounded-full border-2 border-emerald-500/20 border-t-emerald-600 animate-spin" />
          <Clock className="h-5 w-5 text-emerald-600 animate-pulse" />
        </div>
        <p className="text-xs font-semibold tracking-wide text-slate-500">
          Loading Personal Self-Service Sanctuary...
        </p>
      </div>
    );
  }

  const attendance = todayStatus?.attendance;
  const isCheckedIn = Boolean(attendance?.checkIn);
  const isCheckedOut = Boolean(attendance?.checkOut);

  const hoursThisWeek = data?.hoursThisWeek || 0;
  const lateCount = data?.lateCountThisMonth || 0;
  const leaveBalances = data?.leaveBalances || [];
  const lastPayslip = data?.lastPayslip;
  const announcements = data?.announcements || [];

  return (
    <div className="space-y-6 text-slate-800 animate-fade-in-up">
      {/* 1. INTERACTIVE BIOMETRIC ATTENDANCE COMMAND DECK */}
      <div className="relative overflow-hidden rounded-3xl border border-emerald-200/80 bg-gradient-to-br from-emerald-800 via-teal-800 to-emerald-950 p-6 sm:p-7 text-white shadow-xl shadow-emerald-900/10">
        {/* Soft background ambient blur circles */}
        <div className="pointer-events-none absolute -top-20 -right-20 h-72 w-72 rounded-full bg-emerald-400/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-20 h-72 w-72 rounded-full bg-teal-400/15 blur-3xl" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 bg-emerald-700/60 backdrop-blur-md px-3 py-1 rounded-full text-xs font-semibold text-emerald-200 border border-emerald-600/40">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
              </span>
              <span>{todayStatus?.date || "Today"} · Live Work Shift</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
              Personal Attendance & Work Hub
            </h1>
            <p className="text-xs sm:text-sm text-emerald-100/90 max-w-xl">
              Shift begins at 09:00 AM (15-min grace window). Official biometric AI face verification and timestamping.
            </p>
          </div>

          {/* Real-time Clock Card */}
          <div className="flex items-center gap-4 bg-emerald-900/60 backdrop-blur-md border border-emerald-700/50 px-5 py-3.5 rounded-2xl">
            <div className="text-right">
              <div className="text-[11px] font-medium text-emerald-300 uppercase tracking-wider">
                Current Time
              </div>
              <div className="font-mono text-xl sm:text-2xl font-black text-white tracking-wide">
                {currentTime}
              </div>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-700/50 border border-emerald-500/30">
              <Clock className="h-6 w-6 text-emerald-300" />
            </div>
          </div>
        </div>

        {/* Status Alerts */}
        {statusMsg && (
          <div className="relative mt-4 flex items-center gap-2 bg-emerald-500/20 border border-emerald-400/40 text-emerald-100 p-3 rounded-xl text-xs font-medium animate-fade-in-up">
            <CheckCircle2 className="h-4 w-4 text-emerald-300 shrink-0" />
            <span>{statusMsg}</span>
          </div>
        )}
        {errorMsg && (
          <div className="relative mt-4 flex items-center gap-2 bg-rose-500/20 border border-rose-400/40 text-rose-100 p-3 rounded-xl text-xs font-medium animate-fade-in-up">
            <AlertTriangle className="h-4 w-4 text-rose-300 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Biometric Interactive Action Center */}
        <div className="relative mt-6 pt-5 border-t border-emerald-700/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* Shift State Pill */}
          <div className="flex items-center gap-3">
            <div className="text-xs">
              <span className="text-emerald-300 block text-[10px] uppercase font-bold tracking-wider">
                Shift Status
              </span>
              <div className="font-bold text-sm text-white flex items-center gap-2 mt-0.5">
                {isCheckedOut ? (
                  <span className="inline-flex items-center gap-1.5 text-slate-300 bg-emerald-900/80 px-2.5 py-1 rounded-lg border border-emerald-700/60">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                    Shift Completed Today ({attendance.workHours ? `${attendance.workHours.toFixed(1)} hrs` : "Done"})
                  </span>
                ) : isCheckedIn ? (
                  <span className="inline-flex items-center gap-1.5 text-emerald-200 bg-emerald-700/50 px-2.5 py-1 rounded-lg border border-emerald-500/60">
                    <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                    Checked In at {new Date(attendance.checkIn).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-amber-200 bg-amber-900/50 px-2.5 py-1 rounded-lg border border-amber-700/60">
                    <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
                    Awaiting Check-In
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            {!isCheckedIn ? (
              <>
                <button
                  onClick={() => setShowCameraModal(true)}
                  className="relative group flex items-center gap-2.5 px-5 py-3 rounded-2xl bg-white text-emerald-900 font-extrabold text-xs shadow-lg shadow-emerald-950/30 hover:bg-emerald-50 hover:shadow-xl transition-all duration-200 active:scale-95"
                >
                  <Camera className="h-4 w-4 text-emerald-700 group-hover:scale-110 transition-transform" />
                  <span>Biometric Camera Scan</span>
                </button>

                <button
                  onClick={handleWebCheckIn}
                  disabled={checkingIn}
                  className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-emerald-700/60 hover:bg-emerald-700 border border-emerald-600/50 text-white font-bold text-xs transition-all active:scale-95 disabled:opacity-50"
                >
                  <Zap className="h-3.5 w-3.5 text-emerald-300" />
                  <span>{checkingIn ? "Checking In..." : "1-Click Desk Check-In"}</span>
                </button>
              </>
            ) : !isCheckedOut ? (
              <button
                onClick={handleWebCheckOut}
                disabled={checkingOut}
                className="flex items-center gap-2.5 px-5 py-3 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs shadow-lg shadow-rose-950/30 transition-all duration-200 active:scale-95 disabled:opacity-50"
              >
                <LogOut className="h-4 w-4" />
                <span>{checkingOut ? "Ending Shift..." : "End Shift / Check-Out"}</span>
              </button>
            ) : (
              <div className="text-xs text-emerald-200 font-semibold bg-emerald-900/60 px-4 py-2.5 rounded-xl border border-emerald-700/50">
                All daily attendance duties finalized
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 2. EMPLOYEE SANCTUARY SCORECARD TILES */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Weekly Work Hours */}
        <div className="group rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs hover:shadow-md hover:-translate-y-1 transition-all duration-200">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold text-slate-500">Weekly Logged Hours</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 group-hover:scale-110 transition-transform">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-3xl font-extrabold text-slate-900 flex items-baseline gap-1.5">
            {hoursThisWeek.toFixed(1)} <span className="text-xs text-slate-400 font-medium">/ 40 hrs</span>
          </div>
          <div className="mt-3 h-2 w-full rounded-full bg-slate-100 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-700"
              style={{ width: `${Math.min((hoursThisWeek / 40) * 100, 100)}%` }}
            />
          </div>
        </div>

        {/* Punctuality Rating & Streak */}
        <div className="group rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs hover:shadow-md hover:-translate-y-1 transition-all duration-200">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold text-slate-500">Punctuality Score</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-50 text-amber-600 group-hover:scale-110 transition-transform">
              <Flame className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-3xl font-extrabold text-slate-900 flex items-baseline gap-2">
            {lateCount === 0 ? "100%" : `${Math.max(100 - lateCount * 10, 60)}%`}
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              {lateCount === 0 ? "5-Day Streak 🔥" : `${lateCount} Late days`}
            </span>
          </div>
          <p className="mt-2 text-[11px] text-slate-500">Monthly on-time consistency rating</p>
        </div>

        {/* Available Annual Leaves */}
        <div className="group rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs hover:shadow-md hover:-translate-y-1 transition-all duration-200">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold text-slate-500">Paid Leave Balance</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-teal-50 text-teal-600 group-hover:scale-110 transition-transform">
              <Calendar className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-3xl font-extrabold text-slate-900">
            {leaveBalances.reduce((acc: number, b: any) => acc + (b.remainingDays || 0), 0)}
            <span className="text-xs text-slate-400 font-medium ml-1">Days Left</span>
          </div>
          <p className="mt-2 text-[11px] text-teal-700 font-semibold cursor-pointer hover:underline" onClick={() => onNavigateTab("leave")}>
            Apply for Time Off →
          </p>
        </div>

        {/* Compensation & Payslip */}
        <div className="group rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs hover:shadow-md hover:-translate-y-1 transition-all duration-200">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold text-slate-500">Latest Disbursed Pay</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 text-blue-600 group-hover:scale-110 transition-transform">
              <Wallet className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-extrabold text-slate-900 truncate">
            {lastPayslip ? `PKR ${lastPayslip.netSalary?.toLocaleString()}` : "Active Cycle"}
          </div>
          <p className="mt-2 text-[11px] text-slate-500">
            {lastPayslip?.month || "Standard Monthly Payroll"}
          </p>
        </div>
      </div>

      {/* 3. DUAL COLUMN DETAILS (LEAVE BALANCES & ANNOUNCEMENTS) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Leave Allowance Portfolio */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
                <CalendarPlus className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Leave Balance Portfolio</h3>
                <p className="text-[11px] text-slate-500">Your categorized annual entitlement breakdown</p>
              </div>
            </div>
            <button
              onClick={() => onNavigateTab("leave")}
              className="text-xs font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200/60 transition-all hover:bg-emerald-100"
            >
              + Apply Leave
            </button>
          </div>

          {leaveBalances.length === 0 ? (
            <div className="py-10 text-center text-xs text-slate-400">
              No leave quotas assigned for current tenure yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {leaveBalances.map((bal: any, idx: number) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl border border-slate-100 bg-slate-50/70 hover:bg-emerald-50/50 hover:border-emerald-200 transition-all"
                >
                  <div className="text-xs font-bold text-slate-700">
                    {bal.leaveType?.name || "General"}
                  </div>
                  <div className="mt-2 text-2xl font-black text-emerald-700">
                    {bal.remainingDays}
                    <span className="text-[11px] text-slate-400 font-normal ml-1">/ {bal.allocatedDays}</span>
                  </div>
                  <p className="mt-1 text-[10px] text-slate-500 font-medium">Days remaining</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Company Announcements & Community Board */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-blue-50 text-blue-700">
                <Bell className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Company Announcements</h3>
                <p className="text-[11px] text-slate-500">Official updates from Human Resources & Executive Board</p>
              </div>
            </div>
            <button
              onClick={() => onNavigateTab("announcements")}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              All Notices <ArrowRight className="h-3 w-3" />
            </button>
          </div>

          {announcements.length === 0 ? (
            <div className="py-10 text-center text-xs text-slate-400">
              No active company broadcasts at this moment.
            </div>
          ) : (
            <div className="space-y-3">
              {announcements.slice(0, 3).map((item: any, idx: number) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/60 hover:bg-blue-50/40 hover:border-blue-100 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800">{item.title}</span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-600 line-clamp-2">{item.content}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Camera Check-In Biometric Modal */}
      {showCameraModal && (
        <CameraCheckInModal
          isOpen={showCameraModal}
          onClose={() => setShowCameraModal(false)}
          onSuccess={() => {
            setShowCameraModal(false);
            setStatusMsg("Biometric verification verified! Attendance marked.");
            loadData();
          }}
        />
      )}
    </div>
  );
}
