"use client";

import { useState, useEffect } from "react";
import { hcmApi } from "@/api/hcm";
import { History, Shield, Filter, Search } from "lucide-react";

interface AuditLogsProps {
  userRole?: string;
}

export default function AuditLogsView({ userRole = "Admin" }: AuditLogsProps) {
  const isAdmin = userRole === "Admin";

  const [logs, setLogs] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedAction, setSelectedAction] = useState("");
  const [selectedEntity, setSelectedEntity] = useState("");
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const res = await hcmApi.getAuditLogs({
        action: selectedAction || undefined,
        entity: selectedEntity || undefined,
      });
      setLogs(res.logs || []);
      setTotal(res.total || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [selectedAction, selectedEntity]);

  // Dynamic Theme Styling based on userRole
  const cardBg = isAdmin 
    ? "bg-slate-900 border-slate-800 text-white" 
    : "bg-white border-slate-200 text-slate-900";

  const tableHeaderBg = isAdmin ? "bg-slate-800/80 text-slate-400" : "bg-slate-50 text-slate-500";
  const rowHoverBg = isAdmin ? "hover:bg-slate-800/40" : "hover:bg-slate-50/50";
  const dividerColor = isAdmin ? "divide-slate-800" : "divide-slate-100";
  const inputBg = isAdmin 
    ? "bg-slate-800 border-slate-700 text-white" 
    : "bg-slate-50 border-slate-300 text-slate-900";

  return (
    <div className="space-y-6">
      {/* Header Info Banner */}
      <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl border shadow-xs ${cardBg}`}>
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-xl ${isAdmin ? "bg-slate-800 text-purple-400" : "bg-purple-50 text-purple-600"}`}>
            <History className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold">
              Immutable System Audit Trail ({total} Events)
            </h3>
            <p className={`text-xs ${isAdmin ? "text-slate-400" : "text-slate-500"}`}>
              Strictly non-editable & non-deletable log of all creations, approvals, and payroll finalizations
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2">
          <select
            value={selectedEntity}
            onChange={(e) => setSelectedEntity(e.target.value)}
            className={`rounded-xl border px-3 py-1.5 text-xs focus:outline-none ${inputBg}`}
          >
            <option value="">All Entities</option>
            <option value="Employee">Employee</option>
            <option value="Attendance">Attendance</option>
            <option value="LeaveRequest">LeaveRequest</option>
            <option value="PayrollRun">PayrollRun</option>
            <option value="CompanySetting">CompanySetting</option>
          </select>
        </div>
      </div>

      {/* Logs Table */}
      <div className={`rounded-2xl border shadow-xs overflow-hidden ${cardBg}`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className={`border-b ${isAdmin ? "border-slate-800" : "border-slate-200"} ${tableHeaderBg}`}>
              <tr>
                <th className="p-3">Timestamp</th>
                <th className="p-3">Actor</th>
                <th className="p-3">Role</th>
                <th className="p-3">Action</th>
                <th className="p-3">Entity</th>
                <th className="p-3 text-right">State Snapshot</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${dividerColor}`}>
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-slate-400">Loading audit trail...</td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-slate-400">No audit events recorded yet.</td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log._id} className={`${rowHoverBg} transition-colors`}>
                    <td className="p-3 font-mono text-[11px] text-slate-400">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className={`p-3 font-semibold ${isAdmin ? "text-white" : "text-slate-900"}`}>
                      {log.actor?.email}
                    </td>
                    <td className="p-3">
                      <span className={`font-mono text-[10px] px-2 py-0.5 rounded border ${isAdmin ? "bg-slate-800 border-slate-700 text-slate-300" : "bg-slate-100 border-slate-200 text-slate-700"}`}>
                        {log.actor?.role}
                      </span>
                    </td>
                    <td className="p-3 font-mono font-semibold text-blue-500">
                      {log.action}
                    </td>
                    <td className={`p-3 ${isAdmin ? "text-slate-300" : "text-slate-700"}`}>
                      {log.entity} {log.entityId ? `#${log.entityId.slice(-4)}` : ""}
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => setExpandedLogId(expandedLogId === log._id ? null : log._id)}
                        className="text-[11px] font-semibold text-purple-500 hover:underline"
                      >
                        {expandedLogId === log._id ? "Hide JSON" : "View JSON"}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Expanded Snapshot JSON Drawer / Modal */}
      {expandedLogId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-800 p-5 shadow-2xl text-white space-y-3">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <h4 className="text-sm font-bold">Audit State Snapshot (JSON)</h4>
              <button onClick={() => setExpandedLogId(null)} className="text-xs text-slate-400 hover:text-white">Close</button>
            </div>
            {(() => {
              const log = logs.find((l) => l._id === expandedLogId);
              return (
                <div className="space-y-3 max-h-96 overflow-y-auto text-xs font-mono">
                  {log?.before && (
                    <div>
                      <span className="text-red-400 font-bold block mb-1">State BEFORE:</span>
                      <pre className="p-2.5 rounded bg-slate-950 border border-slate-800 overflow-x-auto text-[11px] text-slate-300">
                        {JSON.stringify(log.before, null, 2)}
                      </pre>
                    </div>
                  )}
                  {log?.after && (
                    <div>
                      <span className="text-emerald-400 font-bold block mb-1">State AFTER:</span>
                      <pre className="p-2.5 rounded bg-slate-950 border border-slate-800 overflow-x-auto text-[11px] text-slate-300">
                        {JSON.stringify(log.after, null, 2)}
                      </pre>
                    </div>
                  )}
                  {!log?.before && !log?.after && (
                    <p className="text-slate-400 text-center py-4">No before/after delta payload stored.</p>
                  )}
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}