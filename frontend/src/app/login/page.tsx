"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { authApi } from "@/api/auth";
import {
  Building2,
  Lock,
  Mail,
  ArrowRight,
  Shield,
  Users,
  User,
  Sparkles,
  Check,
  UserPlus,
  Phone,
  Home,
  CheckCircle2,
} from "lucide-react";

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();

  const [mode, setMode] = useState<"login" | "register">("login");

  // Login Form
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [seedSuccess, setSeedSuccess] = useState("");

  // Register Form
  const [regFirstName, setRegFirstName] = useState("");
  const [regLastName, setRegLastName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regAddress, setRegAddress] = useState("");
  const [regLoading, setRegLoading] = useState(false);
  const [regSuccess, setRegSuccess] = useState("");
  const [regError, setRegError] = useState("");

  const handleSubmit = async (e?: React.FormEvent, customEmail?: string, customPassword?: string) => {
    if (e) e.preventDefault();
    setError("");
    setLoading(true);

    const loginEmail = customEmail || email;
    const loginPassword = customPassword || password;

    try {
      const loggedInUser = await login(loginEmail, loginPassword);
      const rolePath = loggedInUser.role.toLowerCase();
      router.push(`/${rolePath}/overview`);
    } catch (err: any) {
      setError(
        err.response?.data?.message || "Invalid email or password. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (roleEmail: string, rolePass: string) => {
    setEmail(roleEmail);
    setPassword(rolePass);
    handleSubmit(undefined, roleEmail, rolePass);
  };

  const handleRegisterEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError("");
    setRegSuccess("");
    setRegLoading(true);

    try {
      const res = await authApi.registerEmployeePublic({
        firstName: regFirstName,
        lastName: regLastName,
        email: regEmail,
        password: regPassword,
        phone: regPhone,
        address: regAddress,
      });

      setRegSuccess(
        res.message ||
          "Registration submitted successfully! Your account status is 'pending_approval'. Admin or HR will confirm your account before you can sign in."
      );

      // Clear fields
      setRegFirstName("");
      setRegLastName("");
      setRegEmail("");
      setRegPassword("");
      setRegPhone("");
      setRegAddress("");
      setEmail("");
      setPassword("");
    } catch (err: any) {
      setRegError(err.response?.data?.message || "Registration failed. Please check your details.");
    } finally {
      setRegLoading(false);
    }
  };

  const handleSeedDemo = async () => {
    setError("");
    setSeeding(true);
    try {
      const res = await authApi.seedDemoData();
      setSeedSuccess(res.message || "Demo database initialized!");
      setTimeout(() => setSeedSuccess(""), 4000);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to initialize demo data.");
    } finally {
      setSeeding(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950 p-4 py-8">
      <div className="w-full max-w-lg space-y-4">
        {/* Main Card */}
        <div className="rounded-2xl bg-white p-6 sm:p-8 shadow-sm border border-slate-200 dark:border-slate-800 dark:bg-slate-900">
          <div className="text-center mb-6">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md shadow-blue-500/20">
              <Building2 className="h-6 w-6" />
            </div>
            <h1 className="mt-3 text-2xl font-bold text-slate-900 dark:text-white">HCM Lite</h1>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Human Capital Management System & AI Assistant
            </p>

            {/* Mode Switcher Tabs */}
            <div className="mt-4 flex rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
              <button
                type="button"
                onClick={() => {
                  setMode("login");
                  setError("");
                }}
                className={`flex-1 rounded-lg py-1.5 text-xs font-semibold transition ${
                  mode === "login"
                    ? "bg-white text-slate-900 shadow-xs dark:bg-slate-900 dark:text-white"
                    : "text-slate-500 hover:text-slate-900 dark:text-slate-400"
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode("register");
                  setRegError("");
                  setEmail("");
                  setPassword("");
                }}
                className={`flex-1 rounded-lg py-1.5 text-xs font-semibold transition flex items-center justify-center gap-1.5 ${
                  mode === "register"
                    ? "bg-white text-slate-900 shadow-xs dark:bg-slate-900 dark:text-white"
                    : "text-slate-500 hover:text-slate-900 dark:text-slate-400"
                }`}
              >
                <UserPlus className="h-3.5 w-3.5" />
                <span>Register Employee</span>
              </button>
            </div>
          </div>

          {/* MODE 1: LOGIN */}
          {mode === "login" && (
            <>
              {error && (
                <div className="mb-4 rounded-xl bg-red-50 p-3 text-xs text-red-600 border border-red-200 dark:bg-red-950/40 dark:border-red-800">
                  {error}
                </div>
              )}

              {seedSuccess && (
                <div className="mb-4 flex items-center gap-2 rounded-xl bg-emerald-50 p-3 text-xs text-emerald-600 border border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-800">
                  <Check className="h-4 w-4" />
                  <span>{seedSuccess}</span>
                </div>
              )}

              <form onSubmit={(e) => handleSubmit(e)} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <input
                      type="email"
                      required
                      placeholder="name@saylani.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 pl-9 pr-3 py-2 text-sm outline-none focus:border-blue-600 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 pl-9 pr-3 py-2 text-sm outline-none focus:border-blue-600 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-xl bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm"
                >
                  {loading ? "Signing In..." : "Sign In to Portal"}
                  <ArrowRight className="h-4 w-4" />
                </button>
              </form>
            </>
          )}

          {/* MODE 2: REGISTER EMPLOYEE */}
          {mode === "register" && (
            <>
              {regError && (
                <div className="mb-4 rounded-xl bg-red-50 p-3 text-xs text-red-600 border border-red-200 dark:bg-red-950/40 dark:border-red-800">
                  {regError}
                </div>
              )}

              {regSuccess ? (
                <div className="space-y-4">
                  <div className="rounded-xl bg-emerald-50 p-4 border border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-800 text-center">
                    <CheckCircle2 className="h-8 w-8 text-emerald-600 mx-auto mb-2" />
                    <h3 className="text-sm font-bold text-emerald-800 dark:text-emerald-300">
                      Registration Submitted!
                    </h3>
                    <p className="mt-1 text-xs text-emerald-700 dark:text-emerald-400">
                      {regSuccess}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setMode("login");
                      setRegSuccess("");
                      setEmail("");
                      setPassword("");
                    }}
                    className="w-full rounded-xl bg-blue-600 py-2.5 text-xs font-bold text-white hover:bg-blue-700 transition"
                  >
                    Return to Sign In
                  </button>
                </div>
              ) : (
                <form onSubmit={handleRegisterEmployee} className="space-y-3">
                  <div className="rounded-lg bg-blue-50/70 p-2.5 text-[11px] text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-200 dark:border-blue-900">
                    ℹ️ New employee accounts are created with <strong>status: pending_approval</strong> and require confirmation by an Admin or HR before sign-in.
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        First Name
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Zeeshan"
                        value={regFirstName}
                        onChange={(e) => setRegFirstName(e.target.value)}
                        className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs outline-none focus:border-blue-600 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Last Name
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Ahmed"
                        value={regLastName}
                        onChange={(e) => setRegLastName(e.target.value)}
                        className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs outline-none focus:border-blue-600 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-400" />
                      <input
                        type="email"
                        required
                        placeholder="zeeshan@saylani.com"
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        className="w-full rounded-lg border border-slate-300 pl-8 pr-2.5 py-1.5 text-xs outline-none focus:border-blue-600 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-400" />
                      <input
                        type="password"
                        required
                        placeholder="Password@123"
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        className="w-full rounded-lg border border-slate-300 pl-8 pr-2.5 py-1.5 text-xs outline-none focus:border-blue-600 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Phone (Optional)
                      </label>
                      <div className="relative">
                        <Phone className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-400" />
                        <input
                          type="text"
                          placeholder="+92 300 1234567"
                          value={regPhone}
                          onChange={(e) => setRegPhone(e.target.value)}
                          className="w-full rounded-lg border border-slate-300 pl-8 pr-2.5 py-1.5 text-xs outline-none focus:border-blue-600 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Address (Optional)
                      </label>
                      <div className="relative">
                        <Home className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-400" />
                        <input
                          type="text"
                          placeholder="Karachi, Pakistan"
                          value={regAddress}
                          onChange={(e) => setRegAddress(e.target.value)}
                          className="w-full rounded-lg border border-slate-300 pl-8 pr-2.5 py-1.5 text-xs outline-none focus:border-blue-600 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                        />
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={regLoading}
                    className="w-full rounded-xl bg-emerald-600 py-2.5 text-xs font-bold text-white hover:bg-emerald-700 transition disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm mt-3"
                  >
                    {regLoading ? "Submitting Registration..." : "Submit Registration (Pending Confirmation)"}
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </form>
              )}
            </>
          )}
        </div>

        {/* DEMO ACCOUNTS & QUICK ROLE SWITCHER (Judges & Test Guide) */}
        <div className="rounded-2xl bg-white p-5 shadow-sm border border-slate-200 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between mb-3 border-b border-slate-100 dark:border-slate-800 pb-2">
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-blue-600" />
                Demo Credentials & Roles
              </h2>
              <p className="text-[11px] text-slate-500">Click any card below to auto-fill and sign in directly</p>
            </div>
            <button
              onClick={handleSeedDemo}
              disabled={seeding}
              className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:text-blue-300 px-2.5 py-1 rounded-lg transition"
            >
              {seeding ? "Seeding..." : "⚡ Seed Demo Data"}
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {/* 1. Admin */}
            <div
              onClick={() => handleQuickLogin("muhammadhuzaifa22056@gmail.com", "Cycle@#$500")}
              className="group flex flex-col justify-between p-3.5 rounded-xl border border-purple-200 bg-purple-50/50 hover:bg-purple-100/60 dark:border-purple-900/60 dark:bg-purple-950/30 dark:hover:bg-purple-900/40 cursor-pointer transition-all hover:-translate-y-0.5 active:scale-95 shadow-xs"
            >
              <div className="flex items-center justify-between">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-600 text-white shadow-xs">
                  <Shield className="h-3.5 w-3.5" />
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                  Master Admin
                </span>
              </div>
              <div className="mt-2.5">
                <span className="text-xs font-bold text-slate-900 dark:text-white block">Executive Command</span>
                <p className="text-[11px] font-mono text-slate-600 dark:text-slate-400 mt-0.5 truncate" title="muhammadhuzaifa22056@gmail.com">
                  muhammadhuzaifa22056@gmail.com
                </p>
                <p className="text-[10px] text-purple-700 dark:text-purple-300 font-mono mt-0.5">Pass: Cycle@#$500</p>
              </div>
            </div>

            {/* 2. HR */}
            <div
              onClick={() => handleQuickLogin("hr@saylani.com", "Password@123")}
              className="group flex flex-col justify-between p-3.5 rounded-xl border border-blue-200 bg-blue-50/50 hover:bg-blue-100/60 dark:border-blue-900/60 dark:bg-blue-950/30 dark:hover:bg-blue-900/40 cursor-pointer transition-all hover:-translate-y-0.5 active:scale-95 shadow-xs"
            >
              <div className="flex items-center justify-between">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600 text-white shadow-xs">
                  <Users className="h-3.5 w-3.5" />
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                  HR Portal
                </span>
              </div>
              <div className="mt-2.5">
                <span className="text-xs font-bold text-slate-900 dark:text-white block">People Operations</span>
                <p className="text-[11px] font-mono text-slate-600 dark:text-slate-400 mt-0.5">hr@saylani.com</p>
                <p className="text-[10px] text-blue-700 dark:text-blue-300 font-mono mt-0.5">Pass: Password@123</p>
              </div>
            </div>

            {/* 3. Employee (Ali Khan) */}
            <div
              onClick={() => handleQuickLogin("ali@saylani.com", "Password@123")}
              className="group flex flex-col justify-between p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/50 hover:bg-emerald-100/60 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:hover:bg-emerald-900/40 cursor-pointer transition-all hover:-translate-y-0.5 active:scale-95 shadow-xs"
            >
              <div className="flex items-center justify-between">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-xs">
                  <User className="h-3.5 w-3.5" />
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200">
                  Employee
                </span>
              </div>
              <div className="mt-2.5">
                <span className="text-xs font-bold text-slate-900 dark:text-white block">Ali Khan (Self-Service)</span>
                <p className="text-[11px] font-mono text-slate-600 dark:text-slate-400 mt-0.5">ali@saylani.com</p>
                <p className="text-[10px] text-emerald-700 dark:text-emerald-300 font-mono mt-0.5">Pass: Password@123</p>
              </div>
            </div>
          </div>

          <div className="mt-3.5 pt-3 border-t border-slate-100 dark:border-slate-800 text-center">
            <p className="text-[11px] text-slate-500">
              * Click any card above to instantly log in as Admin, HR, or Employee.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
