"use client";

import { useState, useEffect } from "react";
import { hcmApi } from "@/api/hcm";
import { Building2, Clock, MapPin, Calendar, Briefcase, Plus, Trash2, Check } from "lucide-react";

interface OrgSetupProps {
  userRole: string;
}

export default function OrgSetupView({ userRole }: OrgSetupProps) {
  const isAdmin = userRole === "Admin";

  const [activeTab, setActiveTab] = useState<"settings" | "departments" | "designations" | "leaves" | "holidays">("settings");
  const [loading, setLoading] = useState(true);

  // Settings state
  const [settings, setSettings] = useState<any>(null);
  const [companyName, setCompanyName] = useState("");
  const [officeStartTime, setOfficeStartTime] = useState("09:00");
  const [graceTimeMinutes, setGraceTimeMinutes] = useState(15);
  const [halfDayThresholdHours, setHalfDayThresholdHours] = useState(5);
  const [latitude, setLatitude] = useState(24.8607);
  const [longitude, setLongitude] = useState(67.0011);
  const [radiusMeters, setRadiusMeters] = useState(150);

  // Lists
  const [departments, setDepartments] = useState<any[]>([]);
  const [designations, setDesignations] = useState<any[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<any[]>([]);
  const [holidays, setHolidays] = useState<any[]>([]);

  // New form modals
  const [newDeptName, setNewDeptName] = useState("");
  const [newDeptCode, setNewDeptCode] = useState("");
  const [newDesigTitle, setNewDesigTitle] = useState("");
  const [newDesigDept, setNewDesigDept] = useState("");
  const [newHolidayName, setNewHolidayName] = useState("");
  const [newHolidayDate, setNewHolidayDate] = useState("");

  const [savingMsg, setSavingMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const loadAll = async () => {
    setLoading(true);
    try {
      const [settRes, deptRes, desigRes, leaveRes, holRes] = await Promise.all([
        hcmApi.getCompanySettings(),
        hcmApi.getDepartments(),
        hcmApi.getDesignations(),
        hcmApi.getLeaveTypes(),
        hcmApi.getHolidays(),
      ]);

      const s = settRes.settings;
      if (s) {
        setSettings(s);
        setCompanyName(s.companyName || "");
        setOfficeStartTime(s.officeStartTime || "09:00");
        setGraceTimeMinutes(s.graceTimeMinutes ?? 15);
        setHalfDayThresholdHours(s.halfDayThresholdHours ?? 5);
        setLatitude(s.officeLocation?.latitude ?? 24.8607);
        setLongitude(s.officeLocation?.longitude ?? 67.0011);
        setRadiusMeters(s.officeLocation?.radiusMeters ?? 150);
      }

      setDepartments(deptRes.departments || []);
      setDesignations(desigRes.designations || []);
      setLeaveTypes(leaveRes.leaveTypes || []);
      setHolidays(holRes.holidays || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;
    setSavingMsg("");
    setErrorMsg("");

    try {
      await hcmApi.updateCompanySettings({
        companyName,
        officeStartTime,
        graceTimeMinutes: Number(graceTimeMinutes),
        halfDayThresholdHours: Number(halfDayThresholdHours),
        officeLocation: {
          latitude: Number(latitude),
          longitude: Number(longitude),
          radiusMeters: Number(radiusMeters),
        },
      });
      setSavingMsg("Settings saved successfully.");
      setTimeout(() => setSavingMsg(""), 3000);
      loadAll();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || "Failed to update settings.");
    }
  };

  const handleCreateDept = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await hcmApi.createDepartment({ name: newDeptName, code: newDeptCode });
      setNewDeptName("");
      setNewDeptCode("");
      loadAll();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || "Failed to create department.");
    }
  };

  const handleDeleteDept = async (id: string) => {
    try {
      await hcmApi.deleteDepartment(id);
      loadAll();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || "Failed to delete department.");
    }
  };

  const handleCreateDesig = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await hcmApi.createDesignation({ title: newDesigTitle, department: newDesigDept || undefined });
      setNewDesigTitle("");
      setNewDesigDept("");
      loadAll();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || "Failed to create designation.");
    }
  };

  const handleDeleteDesig = async (id: string) => {
    try {
      await hcmApi.deleteDesignation(id);
      loadAll();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || "Failed to delete designation.");
    }
  };

  const handleCreateHoliday = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await hcmApi.createHoliday({ name: newHolidayName, date: newHolidayDate });
      setNewHolidayName("");
      setNewHolidayDate("");
      loadAll();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || "Failed to create holiday.");
    }
  };

  const handleDeleteHoliday = async (id: string) => {
    try {
      await hcmApi.deleteHoliday(id);
      loadAll();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || "Failed to delete holiday.");
    }
  };

  const handleUpdateQuota = async (id: string, quota: number) => {
    try {
      await hcmApi.updateLeaveType(id, { yearlyQuota: Number(quota) });
      loadAll();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || "Failed to update quota.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Sub Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
        {[
          { key: "settings", label: "Company & Rules", icon: Clock },
          { key: "departments", label: "Departments", icon: Building2 },
          { key: "designations", label: "Designations", icon: Briefcase },
          { key: "leaves", label: "Leave Types & Quotas", icon: Calendar },
          { key: "holidays", label: "Public Holidays", icon: Calendar },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => {
                setActiveTab(tab.key as any);
                setErrorMsg("");
              }}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition ${
                activeTab === tab.key
                  ? "bg-blue-600 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {savingMsg && (
        <div className="flex items-center gap-2 rounded-xl bg-emerald-50 p-3 text-xs text-emerald-600 border border-emerald-200 dark:bg-emerald-950/40">
          <Check className="h-4 w-4" />
          <span>{savingMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="rounded-xl bg-red-50 p-3 text-xs text-red-600 border border-red-200 dark:bg-red-950/40">
          {errorMsg}
        </div>
      )}

      {/* Tab 1: Company Settings */}
      {activeTab === "settings" && (
        <form onSubmit={handleSaveSettings} className="rounded-2xl bg-white p-6 shadow-xs border border-slate-200 dark:border-slate-800 dark:bg-slate-900 space-y-5">
          <div className="flex items-center justify-between border-b pb-3 dark:border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Office Timing & Geofence Rules</h3>
              <p className="text-xs text-slate-500">Stored as settings; applied to new attendance records</p>
            </div>
            {!isAdmin && (
              <span className="text-[10px] bg-slate-100 px-2.5 py-1 rounded-full text-slate-500">
                Read Only (HR View)
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Company Name</label>
              <input
                type="text"
                disabled={!isAdmin}
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-600 dark:border-slate-700 dark:bg-slate-800 dark:text-white disabled:opacity-60"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Office Start Time</label>
              <input
                type="time"
                disabled={!isAdmin}
                value={officeStartTime}
                onChange={(e) => setOfficeStartTime(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-600 dark:border-slate-700 dark:bg-slate-800 dark:text-white disabled:opacity-60"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Grace Period (Minutes)</label>
              <input
                type="number"
                disabled={!isAdmin}
                value={graceTimeMinutes}
                onChange={(e) => setGraceTimeMinutes(Number(e.target.value))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-600 dark:border-slate-700 dark:bg-slate-800 dark:text-white disabled:opacity-60"
              />
              <span className="text-[11px] text-slate-400">Late after {officeStartTime} + {graceTimeMinutes}m</span>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Half Day Threshold (Hours)</label>
              <input
                type="number"
                disabled={!isAdmin}
                value={halfDayThresholdHours}
                onChange={(e) => setHalfDayThresholdHours(Number(e.target.value))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-600 dark:border-slate-700 dark:bg-slate-800 dark:text-white disabled:opacity-60"
              />
              <span className="text-[11px] text-slate-400">Duration under {halfDayThresholdHours}h marked half-day</span>
            </div>
          </div>

          <div className="border-t pt-4 dark:border-slate-800">
            <h4 className="text-xs font-bold text-slate-900 dark:text-white mb-2">Office Geofence Location (Haversine Check)</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs text-slate-500 mb-1">Latitude</label>
                <input
                  type="number"
                  step="any"
                  disabled={!isAdmin}
                  value={latitude}
                  onChange={(e) => setLatitude(Number(e.target.value))}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white disabled:opacity-60"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Longitude</label>
                <input
                  type="number"
                  step="any"
                  disabled={!isAdmin}
                  value={longitude}
                  onChange={(e) => setLongitude(Number(e.target.value))}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white disabled:opacity-60"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Radius (Meters)</label>
                <input
                  type="number"
                  disabled={!isAdmin}
                  value={radiusMeters}
                  onChange={(e) => setRadiusMeters(Number(e.target.value))}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white disabled:opacity-60"
                />
              </div>
            </div>
          </div>

          {isAdmin && (
            <button
              type="submit"
              className="rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-semibold text-white hover:bg-blue-700 transition"
            >
              Save Company Rules
            </button>
          )}
        </form>
      )}

      {/* Tab 2: Departments */}
      {activeTab === "departments" && (
        <div className="space-y-4">
          {isAdmin && (
            <form onSubmit={handleCreateDept} className="flex gap-2 p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <input
                type="text"
                required
                placeholder="Department Name (e.g. Engineering)"
                value={newDeptName}
                onChange={(e) => setNewDeptName(e.target.value)}
                className="flex-1 rounded-lg border border-slate-300 px-3 py-1.5 text-xs dark:bg-slate-800 dark:text-white"
              />
              <input
                type="text"
                placeholder="Code (e.g. ENG)"
                value={newDeptCode}
                onChange={(e) => setNewDeptCode(e.target.value)}
                className="w-24 rounded-lg border border-slate-300 px-3 py-1.5 text-xs dark:bg-slate-800 dark:text-white"
              />
              <button
                type="submit"
                className="flex items-center gap-1 rounded-lg bg-blue-600 px-4 py-1.5 text-xs font-semibold text-white"
              >
                <Plus className="h-4 w-4" /> Add
              </button>
            </form>
          )}

          <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500">
                <tr>
                  <th className="p-3">Department Name</th>
                  <th className="p-3">Code</th>
                  {isAdmin && <th className="p-3 text-right">Action</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {departments.map((d) => (
                  <tr key={d._id}>
                    <td className="p-3 font-semibold text-slate-900 dark:text-white">{d.name}</td>
                    <td className="p-3 font-mono text-slate-500">{d.code || "-"}</td>
                    {isAdmin && (
                      <td className="p-3 text-right">
                        <button
                          onClick={() => handleDeleteDept(d._id)}
                          className="text-red-500 hover:text-red-700 p-1"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Designations */}
      {activeTab === "designations" && (
        <div className="space-y-4">
          {isAdmin && (
            <form onSubmit={handleCreateDesig} className="flex gap-2 p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <input
                type="text"
                required
                placeholder="Designation Title (e.g. Lead Architect)"
                value={newDesigTitle}
                onChange={(e) => setNewDesigTitle(e.target.value)}
                className="flex-1 rounded-lg border border-slate-300 px-3 py-1.5 text-xs dark:bg-slate-800 dark:text-white"
              />
              <select
                value={newDesigDept}
                onChange={(e) => setNewDesigDept(e.target.value)}
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs dark:bg-slate-800 dark:text-white"
              >
                <option value="">Select Dept (Optional)</option>
                {departments.map((d) => (
                  <option key={d._id} value={d._id}>{d.name}</option>
                ))}
              </select>
              <button
                type="submit"
                className="flex items-center gap-1 rounded-lg bg-blue-600 px-4 py-1.5 text-xs font-semibold text-white"
              >
                <Plus className="h-4 w-4" /> Add
              </button>
            </form>
          )}

          <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500">
                <tr>
                  <th className="p-3">Designation Title</th>
                  <th className="p-3">Department</th>
                  {isAdmin && <th className="p-3 text-right">Action</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {designations.map((d) => (
                  <tr key={d._id}>
                    <td className="p-3 font-semibold text-slate-900 dark:text-white">{d.title}</td>
                    <td className="p-3 text-slate-500">{d.department?.name || "General"}</td>
                    {isAdmin && (
                      <td className="p-3 text-right">
                        <button
                          onClick={() => handleDeleteDesig(d._id)}
                          className="text-red-500 hover:text-red-700 p-1"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: Leave Types & Quotas */}
      {activeTab === "leaves" && (
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 space-y-4">
          <div className="border-b pb-2 dark:border-slate-800">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Leave Types & Yearly Quotas</h3>
            <p className="text-xs text-slate-500">Section 3: Annual 14, Sick 8, Casual 10, Unpaid unlimited</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {leaveTypes.map((lt) => (
              <div key={lt._id} className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-900 dark:text-white text-xs">{lt.displayName}</span>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${lt.isPaid ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300" : "bg-slate-200 text-slate-700"}`}>
                    {lt.isPaid ? "Paid Leave" : "Unpaid"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500">Yearly Quota (Days):</span>
                  {isAdmin ? (
                    <input
                      type="number"
                      min={0}
                      defaultValue={lt.yearlyQuota}
                      onBlur={(e) => handleUpdateQuota(lt._id, Number(e.target.value))}
                      className="w-20 rounded border border-slate-300 px-2 py-1 text-xs dark:bg-slate-800 dark:text-white"
                    />
                  ) : (
                    <span className="font-bold text-xs">{lt.name === "unpaid" ? "Unlimited" : `${lt.yearlyQuota} days`}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 5: Public Holidays */}
      {activeTab === "holidays" && (
        <div className="space-y-4">
          {isAdmin && (
            <form onSubmit={handleCreateHoliday} className="flex gap-2 p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <input
                type="text"
                required
                placeholder="Holiday Name (e.g. Eid-ul-Fitr)"
                value={newHolidayName}
                onChange={(e) => setNewHolidayName(e.target.value)}
                className="flex-1 rounded-lg border border-slate-300 px-3 py-1.5 text-xs dark:bg-slate-800 dark:text-white"
              />
              <input
                type="date"
                required
                value={newHolidayDate}
                onChange={(e) => setNewHolidayDate(e.target.value)}
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs dark:bg-slate-800 dark:text-white"
              />
              <button
                type="submit"
                className="flex items-center gap-1 rounded-lg bg-blue-600 px-4 py-1.5 text-xs font-semibold text-white"
              >
                <Plus className="h-4 w-4" /> Add
              </button>
            </form>
          )}

          <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500">
                <tr>
                  <th className="p-3">Holiday Name</th>
                  <th className="p-3">Date (YYYY-MM-DD)</th>
                  {isAdmin && <th className="p-3 text-right">Action</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {holidays.map((h) => (
                  <tr key={h._id}>
                    <td className="p-3 font-semibold text-slate-900 dark:text-white">{h.name}</td>
                    <td className="p-3 font-mono text-slate-500">{h.date}</td>
                    {isAdmin && (
                      <td className="p-3 text-right">
                        <button
                          onClick={() => handleDeleteHoliday(h._id)}
                          className="text-red-500 hover:text-red-700 p-1"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

