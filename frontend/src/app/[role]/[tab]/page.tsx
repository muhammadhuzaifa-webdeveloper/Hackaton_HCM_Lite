"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import SidebarLayout from "@/components/dashboard/SidebarLayout";

// Views
import AdminDashboardView from "@/components/dashboard/AdminDashboardView";
import HRDashboardView from "@/components/dashboard/HRDashboardView";
import EmployeeDashboardView from "@/components/dashboard/EmployeeDashboardView";
import OrgSetupView from "@/components/dashboard/OrgSetupView";
import UserAccountsView from "@/components/dashboard/UserAccountsView";
import EmployeesDirectoryView from "@/components/dashboard/EmployeesDirectoryView";
import AttendanceBoardView from "@/components/dashboard/AttendanceBoardView";
import LeaveManagementView from "@/components/dashboard/LeaveManagementView";
import PayrollManagementView from "@/components/dashboard/PayrollManagementView";
import AnnouncementsView from "@/components/dashboard/AnnouncementsView";
import AuditLogsView from "@/components/dashboard/AuditLogsView";

export default function DynamicRoleTabPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading } = useAuth();

  const urlRole = (params?.role as string)?.toLowerCase();
  const activeTab = (params?.tab as string)?.toLowerCase() || "overview";

  // Enforce role consistency with URL
  useEffect(() => {
    if (!loading && user) {
      const userRoleLower = user.role.toLowerCase();
      if (urlRole !== userRoleLower) {
        // Redirect to user's authorized role URL
        router.replace(`/${userRoleLower}/${activeTab}`);
      }
    }
  }, [user, loading, urlRole, activeTab, router]);

  if (loading || !user) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  const role = user.role as "Admin" | "HR" | "Employee";

  // Tab View Dispatcher
  const renderTabContent = () => {
    if (role === "Admin") {
      switch (activeTab) {
        case "overview":
          return <AdminDashboardView />;
        case "setup":
          return <OrgSetupView userRole="Admin" />;
        case "users":
          return <UserAccountsView />;
        case "employees":
          return <EmployeesDirectoryView userRole="Admin" />;
        case "attendance":
          return <AttendanceBoardView userRole="Admin" />;
        case "leave":
          return <LeaveManagementView userRole="Admin" />;
        case "payroll":
          return <PayrollManagementView userRole="Admin" />;
        case "audit":
          return <AuditLogsView />;
        case "announcements":
          return <AnnouncementsView userRole="Admin" />;
        default:
          return <AdminDashboardView />;
      }
    } else if (role === "HR") {
      switch (activeTab) {
        case "overview":
          return <HRDashboardView />;
        case "employees":
          return <EmployeesDirectoryView userRole="HR" />;
        case "attendance":
          return <AttendanceBoardView userRole="HR" />;
        case "leave":
          return <LeaveManagementView userRole="HR" />;
        case "payroll":
          return <PayrollManagementView userRole="HR" />;
        case "announcements":
          return <AnnouncementsView userRole="HR" />;
        default:
          return <HRDashboardView />;
      }
    } else {
      // Employee
      switch (activeTab) {
        case "overview":
          return (
            <EmployeeDashboardView
              onNavigateTab={(t) => router.push(`/employee/${t}`)}
            />
          );
        case "attendance":
          return <AttendanceBoardView userRole="Employee" />;
        case "leave":
          return <LeaveManagementView userRole="Employee" />;
        case "payslips":
          return <PayrollManagementView userRole="Employee" />;
        case "profile":
          return <EmployeesDirectoryView userRole="Employee" />;
        case "announcements":
          return <AnnouncementsView userRole="Employee" />;
        default:
          return (
            <EmployeeDashboardView
              onNavigateTab={(t) => router.push(`/employee/${t}`)}
            />
          );
      }
    }
  };

  return (
    <ProtectedRoute>
      <SidebarLayout role={role} activeTab={activeTab}>
        {renderTabContent()}
      </SidebarLayout>
    </ProtectedRoute>
  );
}
