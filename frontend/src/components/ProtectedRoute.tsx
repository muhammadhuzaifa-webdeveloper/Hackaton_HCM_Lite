"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Lock, ShieldAlert } from "lucide-react";

export default function ProtectedRoute({
  children,
  allowedRoles,
}: {
  children: React.ReactNode;
  allowedRoles?: Array<"Admin" | "HR" | "Employee">;
}) {
  const { user, loading, changePassword } = useAuth();
  const router = useRouter();

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwdError, setPwdError] = useState("");
  const [pwdLoading, setPwdLoading] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Loading HCM Lite...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  // First-Sign-in Mandatory Password Change
  if (user.mustChangePassword) {
    const handleMandatoryPasswordChange = async (e: React.FormEvent) => {
      e.preventDefault();
      setPwdError("");
      if (newPassword.length < 6) {
        setPwdError("New password must be at least 6 characters.");
        return;
      }
      if (newPassword !== confirmPassword) {
        setPwdError("Passwords do not match.");
        return;
      }

      setPwdLoading(true);
      try {
        await changePassword({ newPassword });
      } catch (err: any) {
        setPwdError(err.response?.data?.message || "Failed to update password.");
      } finally {
        setPwdLoading(false);
      }
    };

    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100 p-4 dark:bg-gray-950">
        <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl border border-gray-200 dark:border-gray-800 dark:bg-gray-900">
          <div className="mb-4 flex items-center gap-3 text-amber-600">
            <ShieldAlert className="h-8 w-8" />
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">First Sign-In Setup</h2>
              <p className="text-xs text-gray-500">Security requirement: change your temporary password</p>
            </div>
          </div>

          <p className="text-sm text-gray-600 dark:text-gray-300 mb-5">
            Your account was registered with a temporary password. You must set a permanent secure password to continue.
          </p>

          {pwdError && (
            <div className="mb-4 rounded-lg bg-red-50 p-3 text-xs text-red-600 border border-red-200 dark:bg-red-950/30 dark:border-red-800">
              {pwdError}
            </div>
          )}

          <form onSubmit={handleMandatoryPasswordChange} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                New Permanent Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <input
                  type="password"
                  required
                  placeholder="At least 6 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 pl-9 pr-3 py-2 text-sm outline-none focus:border-blue-600 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Confirm New Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <input
                  type="password"
                  required
                  placeholder="Re-type new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 pl-9 pr-3 py-2 text-sm outline-none focus:border-blue-600 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={pwdLoading}
              className="w-full rounded-lg bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition disabled:opacity-50"
            >
              {pwdLoading ? "Saving..." : "Set New Password & Continue"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Check role authorization
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-6 text-center">
        <h2 className="text-2xl font-bold text-red-600">Access Denied</h2>
        <p className="mt-2 text-gray-600">Your role ({user.role}) is not authorized to view this page.</p>
        <button
          onClick={() => router.push("/dashboard")}
          className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm text-white"
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  return <>{children}</>;
}
