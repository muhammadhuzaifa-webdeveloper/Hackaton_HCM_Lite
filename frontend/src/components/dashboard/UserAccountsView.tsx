"use client";

import { useState, useEffect } from "react";
import { hcmApi } from "@/api/hcm";
import { Users, UserPlus, KeyRound, ShieldAlert, CheckCircle, XCircle } from "lucide-react";

export default function UserAccountsView() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // New User form (Admin or HR)
  const [newEmail, setNewEmail] = useState("");
  const [newPasswordVal, setNewPasswordVal] = useState("Password@123");
  const [newRole, setNewRole] = useState<"Admin" | "HR">("Admin");
  const [creating, setCreating] = useState(false);

  // Reset password modal
  const [resetUserId, setResetUserId] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState("Password@123");

  const [message, setMessage] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const loadUsers = async () => {
    setLoading(true);
    try {
      const res = await hcmApi.getUsers();
      setUsers(res.users || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setMessage("");
    setErrorMsg("");

    try {
      await hcmApi.createUser({ email: newEmail, password: newPasswordVal, role: newRole });
      setMessage(`${newRole} account created successfully for ${newEmail}`);
      setNewEmail("");
      loadUsers();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || `Failed to create ${newRole} account.`);
    } finally {
      setCreating(false);
    }
  };

  const handleToggleStatus = async (id: string) => {
    try {
      await hcmApi.toggleUserStatus(id);
      loadUsers();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || "Failed to update account status.");
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetUserId) return;

    try {
      await hcmApi.resetUserPassword(resetUserId, newPassword);
      setMessage("Password reset successfully. The user must change password on next sign-in.");
      setResetUserId(null);
      loadUsers();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || "Failed to reset password.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Create Admin or HR Account Card */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 shadow-xs">
        <div className="flex items-center gap-2 mb-3 border-b border-slate-100 dark:border-slate-800 pb-2">
          <UserPlus className="h-4 w-4 text-purple-600" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">Create Administrative Account (Admin or HR)</h3>
        </div>

        {message && (
          <div className="mb-3 rounded-xl bg-emerald-50 p-3 text-xs text-emerald-600 border border-emerald-200 dark:bg-emerald-950/40">
            {message}
          </div>
        )}

        {errorMsg && (
          <div className="mb-3 rounded-xl bg-red-50 p-3 text-xs text-red-600 border border-red-200 dark:bg-red-950/40">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleCreateUser} className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div className="sm:col-span-1">
            <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">Account Role</label>
            <select
              value={newRole}
              onChange={(e) => setNewRole(e.target.value as "Admin" | "HR")}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs outline-none focus:border-purple-600 dark:border-slate-700 dark:bg-slate-800 dark:text-white font-bold"
            >
              <option value="Admin">Admin (Full Control)</option>
              <option value="HR">HR (People Operations)</option>
            </select>
          </div>

          <div className="sm:col-span-1">
            <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">Email Address</label>
            <input
              type="email"
              required
              placeholder="e.g. coadmin@saylani.com"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs outline-none focus:border-purple-600 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>

          <div className="sm:col-span-1">
            <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">Password</label>
            <input
              type="password"
              required
              placeholder="Password (default Password@123)"
              value={newPasswordVal}
              onChange={(e) => setNewPasswordVal(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs outline-none focus:border-purple-600 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>

          <div className="sm:col-span-1 flex items-end">
            <button
              type="submit"
              disabled={creating}
              className="w-full rounded-xl bg-purple-600 px-4 py-2 text-xs font-semibold text-white hover:bg-purple-700 transition disabled:opacity-50"
            >
              {creating ? "Creating..." : `Create ${newRole}`}
            </button>
          </div>
        </form>
      </div>

      {/* Users Table */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="h-4 w-4 text-purple-600" />
            System User Logins ({users.length})
          </h3>
          <span className="text-xs text-slate-400">Admin Governance</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500">
              <tr>
                <th className="p-3">User Email</th>
                <th className="p-3">Role</th>
                <th className="p-3">Linked Employee</th>
                <th className="p-3">Status</th>
                <th className="p-3">First Login Security</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {users.map((u) => (
                <tr key={u._id}>
                  <td className="p-3 font-semibold text-slate-900 dark:text-white">{u.email}</td>
                  <td className="p-3">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        u.role === "Admin"
                          ? "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300"
                          : u.role === "HR"
                          ? "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300"
                          : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                      }`}
                    >
                      {u.role}
                    </span>
                  </td>
                  <td className="p-3 text-slate-500">
                    {u.employeeId ? `${u.employeeId.firstName} ${u.employeeId.lastName} (${u.employeeId.employeeCode})` : "-"}
                  </td>
                  <td className="p-3">
                    <span
                      className={`inline-flex items-center gap-1 font-semibold ${
                        u.isActive !== false ? "text-emerald-600" : "text-red-500"
                      }`}
                    >
                      {u.isActive !== false ? <CheckCircle className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
                      {u.isActive !== false ? "Active" : "Deactivated"}
                    </span>
                  </td>
                  <td className="p-3">
                    {u.mustChangePassword ? (
                      <span className="text-[10px] font-semibold text-amber-600 bg-amber-50 dark:bg-amber-950 px-2 py-0.5 rounded-full">
                        Password Change Required
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-400">Changed / Secured</span>
                    )}
                  </td>
                  <td className="p-3 text-right space-x-2">
                    {u.role !== "Admin" && (
                      <button
                        onClick={() => handleToggleStatus(u._id)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition ${
                          u.isActive !== false
                            ? "bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-950 dark:text-red-300"
                            : "bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                        }`}
                      >
                        {u.isActive !== false ? "Deactivate" : "Activate"}
                      </button>
                    )}
                    <button
                      onClick={() => setResetUserId(u._id)}
                      className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
                    >
                      Reset Password
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Reset Password Modal */}
      {resetUserId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-2">Reset User Password</h4>
            <p className="text-xs text-slate-500 mb-4">
              The user will be required to change this temporary password on their next sign-in.
            </p>
            <form onSubmit={handleResetPassword} className="space-y-3">
              <input
                type="password"
                required
                placeholder="New temporary password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs dark:bg-slate-800 dark:text-white"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setResetUserId(null)}
                  className="flex-1 rounded-xl border border-slate-300 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-xl bg-blue-600 py-2 text-xs font-semibold text-white hover:bg-blue-700"
                >
                  Save & Reset
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

