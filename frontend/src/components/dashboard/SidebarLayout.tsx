"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import NotificationsDropdown from "./NotificationsDropdown";
import AiAssistantDrawer from "./AiAssistantDrawer";

import {
  Building2,
  LayoutDashboard,
  Users,
  Clock,
  Calendar,
  DollarSign,
  Settings,
  Shield,
  Bell,
  History,
  Sparkles,
  LogOut,
  UserCheck,
  Menu,
  X,
} from "lucide-react";

interface SidebarLayoutProps {
  role: "Admin" | "HR" | "Employee";
  activeTab: string;
  children: React.ReactNode;
}

export default function SidebarLayout({ role, activeTab, children }: SidebarLayoutProps) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [aiDrawerOpen, setAiDrawerOpen] = useState(false);

  // Exact Theme Variables specified by user:
  // Admin: Bg #17191D, Sidebar #24272D, Text #E7E9ED, Accent #7299D4
  // HR: Bg #F5F7FA, Sidebar #FFFFFF, Text #253247, Accent #356AC3
  // Employee: Bg #F7F8F5, Surface #FFFFFF, Text #293A31, Accent #428367
  const themes = {
    Admin: {
      bg: "#17191D",
      sidebarBg: "#24272D",
      cardBg: "#1E2127",
      text: "#E7E9ED",
      mutedText: "#9CA3AF",
      accent: "#7299D4",
      accentBg: "rgba(114, 153, 212, 0.18)",
      border: "#2C3038",
      roleBadge: "bg-purple-950/80 text-purple-300 border border-purple-800",
    },
    HR: {
      bg: "#F5F7FA",
      sidebarBg: "#FFFFFF",
      cardBg: "#FFFFFF",
      text: "#253247",
      mutedText: "#64748B",
      accent: "#356AC3",
      accentBg: "rgba(53, 106, 195, 0.12)",
      border: "#E2E8F0",
      roleBadge: "bg-blue-100 text-blue-800 border border-blue-200",
    },
    Employee: {
      bg: "#F7F8F5",
      sidebarBg: "#FFFFFF",
      cardBg: "#FFFFFF",
      text: "#293A31",
      mutedText: "#566E61",
      accent: "#428367",
      accentBg: "rgba(66, 131, 103, 0.14)",
      border: "#E4E8E1",
      roleBadge: "bg-emerald-100 text-emerald-800 border border-emerald-200",
    },
  };

  const currentTheme = themes[role] || themes.Employee;

  // Nav tabs by role
  const getNavTabs = () => {
    if (role === "Admin") {
      return [
        { key: "overview", label: "Executive Overview", icon: LayoutDashboard },
        { key: "setup", label: "Organization Setup", icon: Settings },
        { key: "users", label: "User Accounts", icon: Shield },
        { key: "employees", label: "Employees Directory", icon: Users },
        { key: "attendance", label: "Daily Attendance", icon: Clock },
        { key: "leave", label: "Leave Approvals", icon: Calendar },
        { key: "payroll", label: "Monthly Payroll", icon: DollarSign },
        { key: "audit", label: "Audit Log Trail", icon: History },
        { key: "announcements", label: "Announcements", icon: Bell },
      ];
    } else if (role === "HR") {
      return [
        { key: "overview", label: "Operations Overview", icon: LayoutDashboard },
        { key: "employees", label: "Employees Directory", icon: Users },
        { key: "attendance", label: "Daily Attendance Board", icon: Clock },
        { key: "leave", label: "Leave Approval Inbox", icon: Calendar },
        { key: "payroll", label: "Monthly Payroll Draft", icon: DollarSign },
        { key: "announcements", label: "Announcements", icon: Bell },
      ];
    } else {
      // Employee
      return [
        { key: "overview", label: "My Dashboard", icon: LayoutDashboard },
        { key: "attendance", label: "My Attendance", icon: Clock },
        { key: "leave", label: "Leave & Smart Form", icon: Calendar },
        { key: "payslips", label: "My Payslips", icon: DollarSign },
        { key: "profile", label: "My 360° Profile", icon: UserCheck },
        { key: "announcements", label: "Company Updates", icon: Bell },
      ];
    }
  };

  const navTabs = getNavTabs();
  const rolePath = role.toLowerCase();

  const handleNavigate = (tabKey: string) => {
    router.push(`/${rolePath}/${tabKey}`);
    setMobileMenuOpen(false);
  };

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  return (
    <div
      className={`min-h-screen flex ${role === "Admin" ? "dark theme-admin" : role === "HR" ? "theme-hr" : "theme-employee"}`}
      style={{
        backgroundColor: currentTheme.bg,
        color: currentTheme.text,
      }}
    >
      {/* MOBILE TOP BAR */}
      <div
        className="lg:hidden fixed top-0 inset-x-0 h-14 z-40 flex items-center justify-between px-4 border-b"
        style={{
          backgroundColor: currentTheme.sidebarBg,
          borderColor: currentTheme.border,
        }}
      >
        <div className="flex items-center gap-2">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-1.5 rounded-lg text-slate-500 hover:bg-black/5"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          <span className="font-extrabold text-sm tracking-tight">HCM Lite</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setAiDrawerOpen(true)}
            className="p-1.5 rounded-lg text-white text-xs font-bold flex items-center gap-1 px-2.5"
            style={{ backgroundColor: currentTheme.accent }}
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>AI</span>
          </button>
          <NotificationsDropdown />
        </div>
      </div>

      {/* SIDEBAR (Desktop Fixed & Mobile Drawer) */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 flex flex-col border-r transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{
          backgroundColor: currentTheme.sidebarBg,
          borderColor: currentTheme.border,
        }}
      >
        {/* Brand / Logo */}
        <div className="p-5 border-b flex items-center justify-between" style={{ borderColor: currentTheme.border }}>
          <div className="flex items-center gap-3">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-xl text-white font-bold shadow-sm"
              style={{ backgroundColor: currentTheme.accent }}
            >
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-base font-extrabold leading-none tracking-tight">HCM Lite</h1>
              <span className="text-[10px] opacity-70 block mt-1">Saylani Hackathon 2026</span>
            </div>
          </div>

          <button
            onClick={() => setMobileMenuOpen(false)}
            className="lg:hidden p-1 text-slate-400 hover:text-slate-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Current Role Identity Card */}
        <div className="p-4 border-b" style={{ borderColor: currentTheme.border }}>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider opacity-60">Active Role</span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${currentTheme.roleBadge}`}>
              {role}
            </span>
          </div>
          <div className="mt-2 text-xs font-bold truncate">{user?.email}</div>
          <div className="text-[10px] opacity-60 font-mono mt-0.5">Path: /{rolePath}/{activeTab}</div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {navTabs.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.key;
            return (
              <button
                key={item.key}
                onClick={() => handleNavigate(item.key)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition text-left ${
                  isActive ? "shadow-xs" : "opacity-80 hover:opacity-100 hover:bg-black/5 dark:hover:bg-white/5"
                }`}
                style={
                  isActive
                    ? {
                        backgroundColor: currentTheme.accentBg,
                        color: currentTheme.accent,
                        borderLeft: `4px solid ${currentTheme.accent}`,
                        fontWeight: "700",
                      }
                    : {
                        color: currentTheme.text,
                      }
                }
              >
                <Icon
                  className="h-4 w-4 shrink-0"
                  style={{ color: isActive ? currentTheme.accent : currentTheme.mutedText }}
                />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* AI Assistant Quick Trigger */}
        <div className="p-3 border-t" style={{ borderColor: currentTheme.border }}>
          <button
            onClick={() => setAiDrawerOpen(true)}
            className="w-full flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold text-white shadow-sm transition hover:opacity-95"
            style={{ backgroundColor: currentTheme.accent }}
          >
            <Sparkles className="h-4 w-4" />
            <span>Ask AI Assistant</span>
          </button>
        </div>

        {/* Bottom Profile & Logout */}
        <div className="p-4 border-t flex items-center justify-between" style={{ borderColor: currentTheme.border }}>
          <div className="flex items-center gap-2">
            <NotificationsDropdown />
            <div className="text-left">
              <span className="text-[11px] font-bold block truncate max-w-[110px]">{user?.email?.split("@")[0]}</span>
              <span className="text-[10px] opacity-60 capitalize">{role}</span>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="p-2 rounded-xl opacity-70 hover:opacity-100 hover:text-red-500 transition"
            title="Sign Out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        {/* Top Header Bar on Desktop */}
        <header
          className="sticky top-0 z-30 h-16 border-b px-6 flex items-center justify-between backdrop-blur-md"
          style={{
            backgroundColor: `${currentTheme.bg}E6`,
            borderColor: currentTheme.border,
          }}
        >
          <div>
            <div className="flex items-center gap-2 text-xs opacity-60">
              <span className="capitalize">{role} Portal</span>
              <span>/</span>
              <span className="font-semibold capitalize text-slate-800 dark:text-slate-200">
                {activeTab.replace("-", " ")}
              </span>
            </div>
            <h2 className="text-sm font-extrabold capitalize mt-0.5">
              {navTabs.find((t) => t.key === activeTab)?.label || activeTab}
            </h2>
          </div>
        </header>

        {/* Page View Body */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl">{children}</div>
        </main>
      </div>

      {/* AI Assistant Drawer */}
      <AiAssistantDrawer
        userRole={role}
        isOpen={aiDrawerOpen}
        onClose={() => setAiDrawerOpen(false)}
      />
    </div>
  );
}

