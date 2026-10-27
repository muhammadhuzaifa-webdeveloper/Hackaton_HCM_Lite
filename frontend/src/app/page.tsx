"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { authApi } from "@/api/auth";
import { Building2, ShieldCheck, Clock, MapPin, ArrowRight, Sparkles } from "lucide-react";

export default function HomePage() {
  const { user, loading: authLoading, setUser } = useAuth();
  const router = useRouter();

  const [checkingSetup, setCheckingSetup] = useState(true);
  const [isSetup, setIsSetup] = useState<boolean | null>(null);

  // Setup form states
  const [companyName, setCompanyName] = useState("Saylani Tech Solutions");
  const [adminEmail, setAdminEmail] = useState("muhammadhuzaifa22056@gmail.com");
  const [adminPassword, setAdminPassword] = useState("Cycle@#$500");
  const [officeStartTime, setOfficeStartTime] = useState("09:00");
  const [graceTimeMinutes, setGraceTimeMinutes] = useState(15);
  const [latitude, setLatitude] = useState(24.8607);
  const [longitude, setLongitude] = useState(67.0011);
  const [radiusMeters, setRadiusMeters] = useState(150);
  const [officeAddress, setOfficeAddress] = useState("Zaitoon Ashraf IT Park, Karachi");

  const [setupError, setSetupError] = useState("");
  const [setupLoading, setSetupLoading] = useState(false);

  useEffect(() => {
    async function checkStatus() {
      try {
        const res = await authApi.getSetupStatus();
        setIsSetup(res.isSetup);
        if (res.isSetup) {
          if (user) {
            router.push("/dashboard");
          } else if (!authLoading) {
            router.push("/login");
          }
        }
      } catch (err) {
        console.warn("Setup check error:", err);
        setIsSetup(false);
      } finally {
        setCheckingSetup(false);
      }
    }

    if (!authLoading) {
      checkStatus();
    }
  }, [user, authLoading, router]);

  const handleInitialize = async (e: React.FormEvent) => {
    e.preventDefault();
    setSetupError("");
    setSetupLoading(true);

    try {
      const res = await authApi.initializeSetup({
        companyName,
        adminEmail,
        adminPassword,
        officeStartTime,
        graceTimeMinutes: Number(graceTimeMinutes),
        latitude: Number(latitude),
        longitude: Number(longitude),
        radiusMeters: Number(radiusMeters),
        officeAddress,
      });

      if (res.accessToken) {
        localStorage.setItem("accessToken", res.accessToken);
        setUser(res.user);
      }
      router.push("/dashboard");
    } catch (err: any) {
      setSetupError(err.response?.data?.message || "Failed to initialize company setup.");
    } finally {
      setSetupLoading(false);
    }
  };

  if (authLoading || checkingSetup) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Checking HCM Lite installation status...</p>
        </div>
      </div>
    );
  }

  // If already setup and reached here, prompt to login or dashboard
  if (isSetup) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-6 bg-gray-50 dark:bg-gray-950">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-lg border border-gray-200 dark:border-gray-800 dark:bg-gray-900">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-100 text-blue-600 dark:bg-blue-900/40">
            <Building2 className="h-7 w-7" />
          </div>
          <h1 className="mt-4 text-2xl font-bold text-gray-900 dark:text-white">HCM Lite</h1>
          <p className="mt-2 text-sm text-gray-500">Human Capital Management & AI Assistant</p>
          <button
            onClick={() => router.push(user ? "/dashboard" : "/login")}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700 transition"
          >
            {user ? "Go to Dashboard" : "Sign In to Portal"}
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  // FIRST RUN SETUP WIZARD
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-10 px-4">
      <div className="mx-auto max-w-2xl">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 text-xs font-semibold mb-3">
            <Sparkles className="h-3.5 w-3.5" />
            Fresh Install Detected — Starts Empty
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">HCM Lite First-Run Setup</h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            Welcome to the Saylani Hackathon HCM system. Set up your company profile and master Admin account to begin.
          </p>
        </div>

        {setupError && (
          <div className="mb-6 rounded-xl bg-red-50 p-4 text-sm text-red-600 border border-red-200 dark:bg-red-950/40 dark:border-red-800">
            {setupError}
          </div>
        )}

        <form onSubmit={handleInitialize} className="rounded-2xl bg-white p-8 shadow-sm border border-slate-200 dark:border-slate-800 dark:bg-slate-900 space-y-6">
          {/* Step 1: Company Profile */}
          <div>
            <div className="flex items-center gap-2 text-slate-900 dark:text-white font-semibold text-base mb-3 border-b pb-2 dark:border-slate-800">
              <Building2 className="h-5 w-5 text-blue-600" />
              <span>1. Company Profile</span>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Company Name</label>
                <input
                  type="text"
                  required
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-600 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Office Address</label>
                <input
                  type="text"
                  required
                  value={officeAddress}
                  onChange={(e) => setOfficeAddress(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-600 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* Step 2: Master Admin Login */}
          <div>
            <div className="flex items-center gap-2 text-slate-900 dark:text-white font-semibold text-base mb-3 border-b pb-2 dark:border-slate-800">
              <ShieldCheck className="h-5 w-5 text-blue-600" />
              <span>2. Master Administrator Account</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Admin Email</label>
                <input
                  type="email"
                  required
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-600 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Admin Password</label>
                <input
                  type="password"
                  required
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-600 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* Step 3: Office Rules & Timing */}
          <div>
            <div className="flex items-center gap-2 text-slate-900 dark:text-white font-semibold text-base mb-3 border-b pb-2 dark:border-slate-800">
              <Clock className="h-5 w-5 text-blue-600" />
              <span>3. Working Hours & Grace Period</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Office Start Time</label>
                <input
                  type="time"
                  required
                  value={officeStartTime}
                  onChange={(e) => setOfficeStartTime(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-600 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Grace Period (Minutes)</label>
                <input
                  type="number"
                  required
                  min={0}
                  max={60}
                  value={graceTimeMinutes}
                  onChange={(e) => setGraceTimeMinutes(Number(e.target.value))}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-600 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
                <span className="text-[11px] text-slate-500">Late marked after {officeStartTime} + {graceTimeMinutes}m</span>
              </div>
            </div>
          </div>

          {/* Step 4: Office Geofence (Bonus Camera Attendance) */}
          <div>
            <div className="flex items-center gap-2 text-slate-900 dark:text-white font-semibold text-base mb-3 border-b pb-2 dark:border-slate-800">
              <MapPin className="h-5 w-5 text-blue-600" />
              <span>4. Geofence Location (Camera Attendance Verification)</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Latitude</label>
                <input
                  type="number"
                  step="any"
                  required
                  value={latitude}
                  onChange={(e) => setLatitude(Number(e.target.value))}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-600 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Longitude</label>
                <input
                  type="number"
                  step="any"
                  required
                  value={longitude}
                  onChange={(e) => setLongitude(Number(e.target.value))}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-600 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Radius (Meters)</label>
                <input
                  type="number"
                  required
                  min={10}
                  max={5000}
                  value={radiusMeters}
                  onChange={(e) => setRadiusMeters(Number(e.target.value))}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-600 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={setupLoading}
            className="w-full rounded-xl bg-blue-600 py-3.5 text-sm font-semibold text-white shadow-md hover:bg-blue-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {setupLoading ? "Initializing HCM Lite..." : "Complete Setup & Launch Dashboard"}
            <ArrowRight className="h-4 w-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
