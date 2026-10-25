"use client";

import { useState, useEffect } from "react";
import { hcmApi } from "@/api/hcm";
import { Clock, Calendar, CheckCircle, XCircle, AlertCircle, FileText, Check, X, Camera, Edit2 } from "lucide-react";
import CameraCheckInModal from "./CameraCheckInModal";

interface AttendanceBoardProps {
  userRole: string;
}

export default function AttendanceBoardView({ userRole }: AttendanceBoardProps) {
  const isAdmin = userRole === "Admin";
  const isHR = userRole === "HR";
  const isHRorAdmin = isHR || isAdmin;

  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [board, setBoard] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionMsg, setActionMsg] = useState("");

  // Correction Request Modal (Employee)
  const [showCorrectionModal, setShowCorrectionModal] = useState(false);
  const [corrDate, setCorrDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [corrReason, setCorrReason] = useState("");
  const [corrIn, setCorrIn] = useState("09:00");
  const [corrOut, setCorrOut] = useState("17:00");
  const [corrSubmitting, setCorrSubmitting] = useState(false);
  const [corrSuccess, setCorrSuccess] = useState("");

  // Review Correction (HR / Admin)
  const [reviewId, setReviewId] = useState<string | null>(null);
  const [reviewComment, setReviewComment] = useState("");

  // Camera Modal
  const [showCamera, setShowCamera] = useState(false);

  const loadBoard = async () => {
    setLoading(true);
    try {
      const res = await hcmApi.getDailyBoard({ date });
      setBoard(res?.board || []);
    } catch (err) {
      console.error(err);
      setBoard([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBoard();
  }, [date]);

  // Admin / HR: Mark employee attendance as present, absent, late, or half_day directly
  const handleManualMark = async (employeeId: string, status: string) => {
    if (!isHRorAdmin) return;
    try {
      const res = await hcmApi.manualMarkAttendance({ employeeId, date, status });
      setActionMsg(res.message || `Attendance updated to ${status}`);
      setTimeout(() => setActionMsg(""), 3000);
      loadBoard();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to update attendance.");
    }
  };

  const handleRequestCorrection = async (e: React.FormEvent) => {
    e.preventDefault();
    setCorrSubmitting(true);
    setCorrSuccess("");

    try {
      const checkInDateTime = new Date(`${corrDate}T${corrIn}:00`);
      const checkOutDateTime = new Date(`${corrDate}T${corrOut}:00`);

      await hcmApi.requestCorrection({
        date: corrDate,
        requestedCheckIn: checkInDateTime,
        requestedCheckOut: checkOutDateTime,
        reason: corrReason,
      });

      setCorrSuccess("Correction request submitted to HR for review.");
      setTimeout(() => {
        setShowCorrectionModal(false);
        setCorrSuccess("");
      }, 2000);
      loadBoard();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to submit correction.");
    } finally {
      setCorrSubmitting(false);
    }
  };

  const handleReviewCorrection = async (action: "approved" | "rejected") => {
    if (!reviewId) return;
    try {
      await hcmApi.reviewCorrection(reviewId, { action, reviewComment });
      setReviewId(null);
      setReviewComment("");
      loadBoard();
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
      {/* Top Bar: Date Selector & Actions */}
      <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl border shadow-xs ${cardBg}`}>
        <div className="flex items-center gap-3">
          <Clock className="h-5 w-5 text-blue-500" />
          <div>
            <h3 className="text-sm font-bold">Daily Attendance Board</h3>
            <p className={`text-xs ${isAdmin ? "text-slate-400" : "text-slate-500"}`}>
              {isHRorAdmin ? "Admin/HR can mark employees Present/Absent/Late directly" : "Live server check-in times"}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className={`rounded-xl border px-3 py-1.5 text-xs outline-none ${inputBg}`}
          />

          <button
            onClick={() => setShowCamera(true)}
            className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 transition"
          >
            <Camera className="h-4 w-4" /> Camera Face Check-In
          </button>

          <button
            onClick={() => setShowCorrectionModal(true)}
            className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
              isAdmin 
                ? "bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700" 
                : "bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200"
            }`}
          >
            <FileText className="h-4 w-4" /> Request Correction
          </button>
        </div>
      </div>

      {actionMsg && (
        <div className={`flex items-center gap-2 rounded-xl p-3 text-xs border ${isAdmin ? "bg-emerald-950/40 text-emerald-400 border-emerald-900" : "bg-emerald-50 text-emerald-600 border-emerald-200"}`}>
          <CheckCircle className="h-4 w-4 shrink-0" />
          <span>{actionMsg}</span>
        </div>
      )}

      {/* Attendance Board Table */}
      <div className={`rounded-2xl border shadow-xs overflow-hidden ${cardBg}`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className={`border-b ${isAdmin ? "border-slate-800" : "border-slate-200"} ${tableHeaderBg}`}>
              <tr>
                <th className="p-3">Employee</th>
                <th className="p-3">Check-In</th>
                <th className="p-3">Check-Out</th>
                <th className="p-3">Duration</th>
                <th className="p-3">Status</th>
                {isHRorAdmin && <th className="p-3">Admin/HR Action</th>}
                <th className="p-3">Source</th>
                {isHRorAdmin && <th className="p-3 text-right">Correction</th>}
              </tr>
            </thead>
            <tbody className={`divide-y ${dividerColor}`}>
              {loading ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-slate-400">Loading daily board...</td>
                </tr>
              ) : board.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-slate-400">No active employees found.</td>
                </tr>
              ) : (
                board.map((row) => (
                  <tr key={row.employee._id} className={`${rowHoverBg} transition-colors`}>
                    <td className="p-3">
                      <span className="font-semibold">
                        {row.employee.firstName} {row.employee.lastName}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400 block">{row.employee.employeeCode}</span>
                    </td>
                    <td className="p-3 font-mono">
                      {row.checkIn ? new Date(row.checkIn).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "-"}
                    </td>
                    <td className="p-3 font-mono">
                      {row.checkOut ? new Date(row.checkOut).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "-"}
                    </td>
                    <td className="p-3">
                      {row.durationMinutes > 0 ? `${Math.floor(row.durationMinutes / 60)}h ${row.durationMinutes % 60}m` : "-"}
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        row.status === "present"
                          ? (isAdmin ? "bg-emerald-950 text-emerald-300 border border-emerald-900" : "bg-emerald-100 text-emerald-800")
                          : row.status === "late"
                          ? (isAdmin ? "bg-amber-950 text-amber-300 border border-amber-900" : "bg-amber-100 text-amber-800")
                          : row.status === "half_day"
                          ? (isAdmin ? "bg-orange-950 text-orange-300 border border-orange-900" : "bg-orange-100 text-orange-800")
                          : row.status === "on_leave"
                          ? (isAdmin ? "bg-blue-950 text-blue-300 border border-blue-900" : "bg-blue-100 text-blue-800")
                          : (isAdmin ? "bg-red-950 text-red-300 border border-red-900" : "bg-red-100 text-red-800")
                      }`}>
                        {row.status?.toUpperCase()}
                      </span>
                    </td>

                    {/* Admin / HR Direct Mark Option */}
                    {isHRorAdmin && (
                      <td className="p-3">
                        <select
                          value={row.status}
                          onChange={(e) => handleManualMark(row.employee._id, e.target.value)}
                          className={`rounded-lg border px-2 py-1 text-[11px] font-semibold outline-none ${inputBg}`}
                        >
                          <option value="present">Mark Present</option>
                          <option value="absent">Mark Absent</option>
                          <option value="late">Mark Late</option>
                          <option value="half_day">Mark Half Day</option>
                        </select>
                      </td>
                    )}

                    <td className="p-3 font-mono text-[11px] text-slate-400">
                      {row.source || "-"}
                    </td>

                    {isHRorAdmin && (
                      <td className="p-3 text-right">
                        {row.attendance?.correctionRequest?.status === "pending" ? (
                          <button
                            onClick={() => setReviewId(row.attendance._id)}
                            className="bg-amber-500 text-white px-2.5 py-1 rounded text-[10px] font-bold hover:bg-amber-600 transition-colors"
                          >
                            Review Correction
                          </button>
                        ) : row.attendance?.correctionRequest?.status ? (
                          <span className="text-[10px] text-slate-400 capitalize">
                            Correction: {row.attendance.correctionRequest.status}
                          </span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* REQUEST CORRECTION MODAL */}
      {showCorrectionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl text-white">
            <h4 className="text-sm font-bold mb-2">Request Attendance Correction</h4>
            <p className="text-xs text-slate-400 mb-4">
              Forgot check-in or had power outage? Submit reason for HR approval.
            </p>

            {corrSuccess && (
              <div className="mb-3 rounded-xl bg-emerald-950/40 border border-emerald-900 p-3 text-xs text-emerald-400">
                {corrSuccess}
              </div>
            )}

            <form onSubmit={handleRequestCorrection} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold mb-1 text-slate-300">Date</label>
                <input
                  type="date"
                  required
                  value={corrDate}
                  onChange={(e) => setCorrDate(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs text-white outline-none focus:border-slate-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold mb-1 text-slate-300">Actual Check-In</label>
                  <input
                    type="time"
                    required
                    value={corrIn}
                    onChange={(e) => setCorrIn(e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs text-white outline-none focus:border-slate-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1 text-slate-300">Actual Check-Out</label>
                  <input
                    type="time"
                    required
                    value={corrOut}
                    onChange={(e) => setCorrOut(e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs text-white outline-none focus:border-slate-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1 text-slate-300">Reason for Correction</label>
                <textarea
                  required
                  rows={3}
                  placeholder="e.g. System glitch, electricity breakdown, or client meeting..."
                  value={corrReason}
                  onChange={(e) => setCorrReason(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 p-2 text-xs text-white placeholder:text-slate-500 outline-none focus:border-slate-500"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCorrectionModal(false)}
                  className="flex-1 rounded-xl border border-slate-700 bg-slate-800 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={corrSubmitting}
                  className="flex-1 rounded-xl bg-blue-600 py-2 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {corrSubmitting ? "Submitting..." : "Send Request"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REVIEW CORRECTION MODAL (HR / Admin) */}
      {reviewId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-2xl bg-slate-900 border border-slate-800 p-5 shadow-2xl text-white">
            <h4 className="text-sm font-bold mb-2">Review Attendance Correction</h4>
            <textarea
              rows={2}
              placeholder="Reviewer comment (optional)..."
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-800 p-2 text-xs text-white placeholder:text-slate-500 mb-3 outline-none focus:border-slate-500"
            />
            <div className="flex gap-2">
              <button
                onClick={() => handleReviewCorrection("rejected")}
                className="flex-1 rounded-xl bg-red-600 py-2 text-xs font-semibold text-white hover:bg-red-700 transition-colors"
              >
                Reject
              </button>
              <button
                onClick={() => handleReviewCorrection("approved")}
                className="flex-1 rounded-xl bg-emerald-600 py-2 text-xs font-semibold text-white hover:bg-emerald-700 transition-colors"
              >
                Approve
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Camera Check-In Modal */}
      <CameraCheckInModal
        isOpen={showCamera}
        onClose={() => setShowCamera(false)}
        onSuccess={loadBoard}
      />
    </div>
  );
}