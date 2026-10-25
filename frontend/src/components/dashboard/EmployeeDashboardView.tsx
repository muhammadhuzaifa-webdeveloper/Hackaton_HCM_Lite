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

  // Exact Employee Theme Colors
  const theme = {
    bg: "#F7F8F5",
    surface: "#FFFFFF",
    text: "#293A31",
    muted: "#566E61",
    accent: "#428367",
    accentBg: "rgba(66, 131, 103, 0.12)",
    border: "#E4E8E1",
  };

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
      <div className="flex h-64 items-center justify-center">
        <p className="text-xs" style={{ color: theme.muted }}>Loading personal self-service dashboard...</p>
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
    <div className="space-y-6" style={{ color: theme.text }}>
      {/* Check-In / Check-Out Action Widget */}
      <div
        className="p-6 rounded-2xl border shadow-xs"
        style={{ backgroundColor: theme.surface, borderColor: theme.border }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b" style={{ borderColor: theme.border }}>
          <div>
            <span
              className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
              style={{ backgroundColor: theme.accentBg, color: theme.accent }}
            >
              Today: {todayStatus?.date}
            </span>
            <h2 className="text-lg font-extrabold mt-1" style={{ color: theme.text }}>
              Daily Attendance Check-In
            </h2>
            <p className="text-xs mt-0.5" style={{ color: theme.muted }}>
              Office starts at 09:00 AM (15m grace period). Server stamps exact time.
            </p>
          </div>

          {/* Current Status Badge */}
          <div className="flex items-center gap-2">
            <span className="text-xs" style={{ color: theme.muted }}>Current Status:</span>
            {isCheckedOut ? (
              <span className="rounded-full px-3 py-1 text-xs font-bold bg-slate-100 text-slate-700">
                Checked Out ({attendance.status?.toUpperCase()})
              </span>
            ) : isCheckedIn ? (
              <span
                className={`rounded-full px-3 py-1 text-xs font-bold ${
                  attendance.status === "late"
                    ? "bg-amber-100 text-amber-800"
                    : "bg-emerald-100 text-emerald-800"
                }`}
              >
                Checked In · {attendance.status?.toUpperCase()}
              </span>
            ) : (
              <span className="rounded-full px-3 py-1 text-xs font-bold bg-red-100 text-red-800">
                Not Checked In
              </span>
            )}
          </div>
        </div>

        {statusMsg && (
          <div className="mt-4 flex items-center gap-2 rounded-xl bg-emerald-50 p-3 text-xs text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
            <span>{statusMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div className="mt-4 flex items-center gap-2 rounded-xl bg-red-50 p-3 text-xs text-red-600 border border-red-200">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* 1. Quick Web Check-In */}
          <button
            onClick={handleWebCheckIn}
            disabled={isCheckedIn || checkingIn}
            className="flex items-center justify-center gap-2 rounded-xl py-3 text-xs font-bold text-white transition disabled:opacity-40 disabled:cursor-not-allowed shadow-xs"
            style={{ backgroundColor: theme.accent }}
          >
            <Clock className="h-4 w-4" />
            {isCheckedIn ? "Checked In" : checkingIn ? "Recording..." : "Web Check-In"}
          </button>

          {/* 2. Biometric Camera + Face Attendance (Strict Verification) */}
          <button
            onClick={() => setShowCameraModal(true)}
            disabled={isCheckedIn}
            className="flex items-center justify-center gap-2 rounded-xl py-3 text-xs font-bold text-white transition disabled:opacity-40 disabled:cursor-not-allowed shadow-xs"
            style={{ backgroundColor: "#2D6A4F" }}
          >
            <Camera className="h-4 w-4" />
            Biometric Camera Attendance
          </button>

          {/* 3. Check-Out */}
          <button
            onClick={handleWebCheckOut}
            disabled={!isCheckedIn || isCheckedOut || checkingOut}
            className="flex items-center justify-center gap-2 rounded-xl border py-3 text-xs font-bold transition disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ borderColor: theme.border, color: theme.text, backgroundColor: "#F7F8F5" }}
          >
            <CheckCircle2 className="h-4 w-4" />
            {isCheckedOut ? "Checked Out" : checkingOut ? "Recording..." : "Check-Out"}
          </button>
        </div>

        {/* Timestamps details */}
        {isCheckedIn && (
          <div className="mt-4 flex flex-wrap gap-4 text-xs border-t pt-3" style={{ borderColor: theme.border, color: theme.muted }}>
            <span>In: {new Date(attendance.checkIn).toLocaleTimeString()}</span>
            {attendance.checkOut && (
              <span>Out: {new Date(attendance.checkOut).toLocaleTimeString()}</span>
            )}
            {attendance.durationMinutes > 0 && (
              <span>Duration: {attendance.durationMinutes} mins</span>
            )}
            <span>Source: {attendance.source}</span>
          </div>
        )}
      </div>

      {/* 4 Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Hours This Week */}
        <div
          className="p-5 rounded-2xl border shadow-xs"
          style={{ backgroundColor: theme.surface, borderColor: theme.border }}
        >
          <span className="text-xs font-medium" style={{ color: theme.muted }}>Hours This Week</span>
          <div className="mt-1 text-2xl font-extrabold" style={{ color: theme.text }}>
            {hoursThisWeek} / 40 h
          </div>
          <div className="mt-2 h-1.5 w-full rounded-full overflow-hidden" style={{ backgroundColor: "#EAF0EC" }}>
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${Math.min(100, (hoursThisWeek / 40) * 100)}%`,
                backgroundColor: theme.accent,
              }}
            ></div>
          </div>
        </div>

        {/* Late Count */}
        <div
          className="p-5 rounded-2xl border shadow-xs"
          style={{ backgroundColor: theme.surface, borderColor: theme.border }}
        >
          <span className="text-xs font-medium" style={{ color: theme.muted }}>Late Count (This Month)</span>
          <div className="mt-1 text-2xl font-extrabold text-amber-600">{lateCount}</div>
          <p className="mt-1 text-[11px]" style={{ color: theme.muted }}>
            {lateCount >= 3 ? "⚠️ 3+ lates: 0.5 day deduction" : `${3 - lateCount} lates until penalty`}
          </p>
        </div>

        {/* Leave Balance Quick Card */}
        <div
          className="p-5 rounded-2xl border shadow-xs"
          style={{ backgroundColor: theme.surface, borderColor: theme.border }}
        >
          <span className="text-xs font-medium" style={{ color: theme.muted }}>Leave Balance (Annual)</span>
          <div className="mt-1 text-2xl font-extrabold" style={{ color: theme.accent }}>
            {leaveBalances.find((b: any) => b.name === "annual")?.remaining || 14} days
          </div>
          <button
            onClick={() => onNavigateTab("leave")}
            className="mt-1 text-[11px] font-semibold hover:underline flex items-center gap-1"
            style={{ color: theme.accent }}
          >
            Apply Leave / View Balances <ArrowRight className="h-3 w-3" />
          </button>
        </div>

        {/* Last Payslip Quick Card */}
        <div
          className="p-5 rounded-2xl border shadow-xs"
          style={{ backgroundColor: theme.surface, borderColor: theme.border }}
        >
          <span className="text-xs font-medium" style={{ color: theme.muted }}>Last Net Payslip</span>
          <div className="mt-1 text-2xl font-extrabold text-emerald-700">
            {lastPayslip ? `PKR ${lastPayslip.netPay?.toLocaleString()}` : "Not finalized"}
          </div>
          <button
            onClick={() => onNavigateTab("payslips")}
            className="mt-1 text-[11px] font-semibold hover:underline flex items-center gap-1 text-emerald-700"
          >
            View Payslips <ArrowRight className="h-3 w-3" />
          </button>
        </div>
      </div>

      {/* Leave Balances Grid */}
      <div
        className="p-5 rounded-2xl border shadow-xs"
        style={{ backgroundColor: theme.surface, borderColor: theme.border }}
      >
        <div className="flex items-center justify-between mb-3 border-b pb-2" style={{ borderColor: theme.border }}>
          <h3 className="text-sm font-bold flex items-center gap-2" style={{ color: theme.text }}>
            <Calendar className="h-4 w-4" style={{ color: theme.accent }} />
            My Yearly Leave Quotas
          </h3>
          <button
            onClick={() => onNavigateTab("leave")}
            className="text-xs font-semibold hover:underline"
            style={{ color: theme.accent }}
          >
            Open Smart Leave Form
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {leaveBalances.map((b: any) => (
            <div
              key={b.leaveTypeId}
              className="p-3 rounded-xl border text-xs"
              style={{ backgroundColor: "#F7F9F6", borderColor: theme.border }}
            >
              <span className="font-semibold" style={{ color: theme.text }}>{b.displayName}</span>
              <p className="text-lg font-bold mt-1" style={{ color: theme.accent }}>
                {b.remaining} {b.name === "unpaid" ? "" : "left"}
              </p>
              <p className="text-[10px]" style={{ color: theme.muted }}>Used: {b.used} / Quota: {b.quota || "∞"}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Announcements Feed */}
      <div
        className="p-5 rounded-2xl border shadow-xs"
        style={{ backgroundColor: theme.surface, borderColor: theme.border }}
      >
        <div className="flex items-center justify-between mb-3 border-b pb-2" style={{ borderColor: theme.border }}>
          <h3 className="text-sm font-bold flex items-center gap-2" style={{ color: theme.text }}>
            <Bell className="h-4 w-4 text-amber-500" />
            Company Announcements
          </h3>
          <span className="text-xs" style={{ color: theme.muted }}>{announcements.length} Posts</span>
        </div>

        {announcements.length === 0 ? (
          <p className="text-center py-6 text-xs" style={{ color: theme.muted }}>No active company announcements.</p>
        ) : (
          <div className="space-y-3">
            {announcements.map((a: any) => (
              <div
                key={a._id}
                className="p-3.5 rounded-xl border text-xs"
                style={{ backgroundColor: "#F9FAF8", borderColor: theme.border }}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold" style={{ color: theme.text }}>{a.title}</span>
                  <span className="text-[10px]" style={{ color: theme.muted }}>
                    {new Date(a.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <p className="mt-1" style={{ color: theme.muted }}>{a.message}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Camera Check-In Modal */}
      <CameraCheckInModal
        isOpen={showCameraModal}
        onClose={() => setShowCameraModal(false)}
        onSuccess={loadData}
      />
    </div>
  );
}
