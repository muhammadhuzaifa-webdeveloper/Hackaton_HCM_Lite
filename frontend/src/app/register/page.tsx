"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { authApi } from "@/api/auth";
import {
  Building2,
  Lock,
  Mail,
  User,
  Phone,
  MapPin,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  Sparkles,
  Eye,
  EyeOff,
  Zap,
} from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [employeeCode, setEmployeeCode] = useState("");

  // Live Password Strength Calculation
  const getPasswordStrength = (pwd: string) => {
    let score = 0;
    if (pwd.length >= 8) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    return score;
  };

  const pwdScore = getPasswordStrength(password);
  const strengthLabels = ["Weak", "Fair", "Good", "Strong"];
  const strengthColors = ["bg-rose-500", "bg-amber-500", "bg-blue-500", "bg-emerald-500"];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");
    setLoading(true);

    try {
      const res = await authApi.registerEmployeePublic({
        firstName,
        lastName,
        email,
        password,
        phone,
        address,
      });

      setSuccessMsg(
        res.message ||
          "Registration submitted successfully! Your account is pending confirmation by Master Admin. Once accepted, you can sign in."
      );
      if (res.employeeCode) setEmployeeCode(res.employeeCode);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to submit registration. Please verify details.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 sm:p-6 overflow-hidden bg-gradient-to-br from-[#0B0F19] via-[#0F172A] to-[#0A0D14] text-slate-100">
      {/* Ambient background glowing orbs */}
      <div className="pointer-events-none absolute -top-32 -left-32 h-96 w-96 rounded-full bg-cyan-500/15 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-indigo-500/15 blur-3xl" />
      <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[500px] rounded-full bg-emerald-500/10 blur-[140px]" />

      <div className="relative z-10 w-full max-w-lg space-y-6 animate-fade-in-up">
        {/* Header Branding */}
        <div className="text-center space-y-2">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-xl shadow-emerald-500/20 border border-emerald-400/30">
            <Building2 className="h-7 w-7" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Employee Enrollment Portal
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-sm mx-auto">
            Join Saylani Hackathon HCM Enterprise. Official registrations are reviewed by Master Admin.
          </p>
        </div>

        {/* Main Registration Card */}
        <div className="rounded-3xl border border-slate-800 bg-[#111726]/85 p-6 sm:p-8 backdrop-blur-xl shadow-2xl">
          {successMsg ? (
            <div className="space-y-5 text-center py-4 animate-fade-in-up">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
                <CheckCircle2 className="h-9 w-9" />
              </div>

              <div className="space-y-2">
                <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/60 px-3 py-1 rounded-full border border-emerald-800/40">
                  Application Submitted · {employeeCode || "EMP-NEW"}
                </span>
                <h2 className="text-xl font-extrabold text-white">
                  Registration Awaiting Admin Confirmation
                </h2>
                <p className="text-xs text-slate-300 max-w-md mx-auto leading-relaxed">
                  {successMsg}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 text-left text-xs space-y-2 text-slate-400">
                <div className="flex items-center gap-2 text-slate-200 font-semibold">
                  <ShieldCheck className="h-4 w-4 text-emerald-400" />
                  <span>Security & Verification Policy</span>
                </div>
                <p className="text-[11px] leading-relaxed">
                  To safeguard company records, new employee profiles require one-click confirmation by the Master Admin before the account can log in.
                </p>
              </div>

              <button
                type="button"
                onClick={() => router.push("/login")}
                className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 py-3.5 text-xs font-extrabold text-white shadow-lg transition-all active:scale-95"
              >
                <span>Return to Sign In</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              {/* Info banner */}
              <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-blue-950/40 border border-blue-800/50 text-blue-200 text-xs">
                <Sparkles className="h-4 w-4 text-cyan-400 shrink-0 mt-0.5" />
                <span className="leading-relaxed text-[11px]">
                  All self-registered employees enter <strong>pending_approval</strong> status. Your request will be instantly visible to the Master Admin for activation.
                </span>
              </div>

              {error && (
                <div className="flex items-center gap-2 rounded-2xl p-3 bg-rose-950/50 border border-rose-800/60 text-rose-200 text-xs animate-fade-in-up">
                  <AlertTriangle className="h-4 w-4 text-rose-400 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Name Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="reg-first-name" className="block text-xs font-semibold text-slate-300 mb-1">
                    First Name <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                    <input
                      id="reg-first-name"
                      type="text"
                      required
                      autoComplete="given-name"
                      enterKeyHint="next"
                      placeholder="e.g. Zeeshan"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="w-full rounded-xl border border-slate-700 bg-slate-900/80 pl-9 pr-3 py-2.5 text-xs text-white placeholder:text-slate-500 outline-none focus:border-cyan-500 transition-colors shadow-inner"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="reg-last-name" className="block text-xs font-semibold text-slate-300 mb-1">
                    Last Name <span className="text-rose-400">*</span>
                  </label>
                  <input
                    id="reg-last-name"
                    type="text"
                    required
                    autoComplete="family-name"
                    enterKeyHint="next"
                    placeholder="e.g. Ahmed"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-900/80 px-3 py-2.5 text-xs text-white placeholder:text-slate-500 outline-none focus:border-cyan-500 transition-colors shadow-inner"
                  />
                </div>
              </div>

              {/* Corporate Email */}
              <div>
                <label htmlFor="reg-email" className="block text-xs font-semibold text-slate-300 mb-1">
                  Corporate Email Address <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                  <input
                    id="reg-email"
                    type="email"
                    required
                    autoComplete="email"
                    spellCheck="false"
                    enterKeyHint="next"
                    placeholder="name@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-900/80 pl-9 pr-3 py-2.5 text-xs text-white placeholder:text-slate-500 outline-none focus:border-cyan-500 transition-colors shadow-inner"
                  />
                </div>
              </div>

              {/* Password & Live Strength Meter */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label htmlFor="reg-password" className="block text-xs font-semibold text-slate-300">
                    Password <span className="text-rose-400">*</span>
                  </label>
                  {password && (
                    <span className="text-[10px] font-mono font-semibold text-slate-400">
                      Strength: <span className="text-white">{strengthLabels[pwdScore - 1] || "Too Short"}</span>
                    </span>
                  )}
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                  <input
                    id="reg-password"
                    type={showPassword ? "text" : "password"}
                    required
                    autoComplete="new-password"
                    enterKeyHint="next"
                    placeholder="Min. 8 chars with uppercase, number & symbol"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-900/80 pl-9 pr-10 py-2.5 text-xs text-white placeholder:text-slate-500 outline-none focus:border-cyan-500 transition-colors shadow-inner"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>

                {/* Password strength bar */}
                {password && (
                  <div className="mt-2 flex gap-1 h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                    {[1, 2, 3, 4].map((step) => (
                      <div
                        key={step}
                        className={`h-full flex-1 rounded-full transition-all duration-300 ${
                          pwdScore >= step ? strengthColors[pwdScore - 1] : "bg-slate-800"
                        }`}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Optional Phone & Address */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="reg-phone" className="block text-xs font-semibold text-slate-300 mb-1">
                    Phone Number
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                    <input
                      id="reg-phone"
                      type="tel"
                      autoComplete="tel"
                      enterKeyHint="next"
                      placeholder="+92 300 1234567"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full rounded-xl border border-slate-700 bg-slate-900/80 pl-9 pr-3 py-2.5 text-xs text-white placeholder:text-slate-500 outline-none focus:border-cyan-500 transition-colors shadow-inner"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="reg-address" className="block text-xs font-semibold text-slate-300 mb-1">
                    City / Address
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                    <input
                      id="reg-address"
                      type="text"
                      autoComplete="street-address"
                      enterKeyHint="done"
                      placeholder="Karachi, Pakistan"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="w-full rounded-xl border border-slate-700 bg-slate-900/80 pl-9 pr-3 py-2.5 text-xs text-white placeholder:text-slate-500 outline-none focus:border-cyan-500 transition-colors shadow-inner"
                    />
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 py-3.5 text-xs font-extrabold text-white shadow-lg shadow-emerald-900/30 transition-all active:scale-95 disabled:opacity-50 mt-2"
              >
                <Zap className="h-4 w-4 text-emerald-200" />
                <span>{loading ? "Registering Employee..." : "Submit Registration (Pending Confirmation)"}</span>
              </button>
            </form>
          )}

          {/* Switch to Login Link */}
          <div className="mt-6 pt-5 border-t border-slate-800 text-center">
            <p className="text-xs text-slate-400">
              Already have an activated account?{" "}
              <Link
                href="/login"
                className="font-bold text-cyan-400 hover:text-cyan-300 underline underline-offset-4 transition"
              >
                Sign In directly
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
