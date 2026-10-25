import api from "@/lib/api";

export const hcmApi = {
  // --- Module 2: Org Setup & Company Settings ---
  getCompanySettings: () => api.get("/setup/company").then((r) => r.data),
  updateCompanySettings: (data: any) => api.put("/setup/company", data).then((r) => r.data),

  getDepartments: () => api.get("/setup/departments").then((r) => r.data),
  createDepartment: (data: any) => api.post("/setup/departments", data).then((r) => r.data),
  deleteDepartment: (id: string) => api.delete(`/setup/departments/${id}`).then((r) => r.data),

  getDesignations: () => api.get("/setup/designations").then((r) => r.data),
  createDesignation: (data: any) => api.post("/setup/designations", data).then((r) => r.data),
  deleteDesignation: (id: string) => api.delete(`/setup/designations/${id}`).then((r) => r.data),

  getLeaveTypes: () => api.get("/setup/leave-types").then((r) => r.data),
  updateLeaveType: (id: string, data: any) => api.put(`/setup/leave-types/${id}`, data).then((r) => r.data),

  getHolidays: () => api.get("/setup/holidays").then((r) => r.data),
  createHoliday: (data: any) => api.post("/setup/holidays", data).then((r) => r.data),
  deleteHoliday: (id: string) => api.delete(`/setup/holidays/${id}`).then((r) => r.data),

  // User Accounts
  getUsers: () => api.get("/setup/users").then((r) => r.data),
  createUser: (data: { email: string; password: string; role?: "Admin" | "HR" }) =>
    api.post("/setup/users", data).then((r) => r.data),
  createHRUser: (data: any) => api.post("/setup/users/hr", data).then((r) => r.data),
  toggleUserStatus: (id: string) => api.patch(`/setup/users/${id}/status`).then((r) => r.data),
  resetUserPassword: (id: string, newPassword: string) =>
    api.post(`/setup/users/${id}/reset-password`, { newPassword }).then((r) => r.data),

  // --- Module 3: Employees ---
  getEmployees: (params?: any) => api.get("/employees", { params }).then((r) => r.data),
  registerEmployee: (data: any) => api.post("/employees", data).then((r) => r.data),
  registerEmployeePublic: (data: any) => api.post("/auth/register-employee", data).then((r) => r.data),
  confirmEmployee: (id: string) => api.patch(`/employees/${id}/confirm`).then((r) => r.data),
  getEmployee360: (id: string) => api.get(`/employees/${id}/360`).then((r) => r.data),
  updateEmployee: (id: string, data: any) => api.put(`/employees/${id}`, data).then((r) => r.data),
  updateSelfProfile: (data: any) => api.patch("/employees/self", data).then((r) => r.data),
  csvDryRun: (rows: any[]) => api.post("/employees/csv-dry-run", { rows }).then((r) => r.data),
  csvCommit: (rows: any[]) => api.post("/employees/csv-commit", { rows }).then((r) => r.data),
  csvExport: () => api.get("/employees/csv-export").then((r) => r.data),

  // --- Module 4: Attendance ---
  getMyTodayStatus: () => api.get("/attendance/today").then((r) => r.data),
  checkIn: (data?: any) => api.post("/attendance/check-in", data || {}).then((r) => r.data),
  checkOut: () => api.post("/attendance/check-out").then((r) => r.data),
  getDailyBoard: (params?: any) => api.get("/attendance/board", { params }).then((r) => r.data),
  manualMarkAttendance: (data: { employeeId: string; date: string; status: string }) =>
    api.post("/attendance/manual-mark", data).then((r) => r.data),
  getAttendanceCalendar: (params?: any) => api.get("/attendance/calendar", { params }).then((r) => r.data),
  requestCorrection: (data: any) => api.post("/attendance/correction", data).then((r) => r.data),
  reviewCorrection: (id: string, data: any) => api.patch(`/attendance/correction/${id}`, data).then((r) => r.data),

  // --- Module 5: Leave ---
  getMyBalances: (employeeId?: string) =>
    api.get("/leave/balances", { params: employeeId ? { employeeId } : {} }).then((r) => r.data),
  getLeaveRequests: (params?: any) => api.get("/leave/requests", { params }).then((r) => r.data),
  applyLeave: (data: any) => api.post("/leave/apply", data).then((r) => r.data),
  cancelLeave: (id: string) => api.patch(`/leave/requests/${id}/cancel`).then((r) => r.data),
  reviewLeave: (id: string, data: any) => api.patch(`/leave/requests/${id}/review`, data).then((r) => r.data),

  // --- Module 6: Payroll ---
  createPayrollDraft: (month: string) => api.post("/payroll/draft", { month }).then((r) => r.data),
  getPayrollRuns: () => api.get("/payroll/runs").then((r) => r.data),
  getPayrollRunById: (id: string) => api.get(`/payroll/runs/${id}`).then((r) => r.data),
  finalizePayrollRun: (id: string) => api.post(`/payroll/runs/${id}/finalize`).then((r) => r.data),
  getMyPayslips: () => api.get("/payroll/my-payslips").then((r) => r.data),
  downloadPayslipPDFUrl: (runId: string, employeeId: string) =>
    `${api.defaults.baseURL}/payroll/runs/${runId}/payslip/${employeeId}/pdf`,

  // --- Module 7: Dashboards ---
  getAdminDashboard: (params?: any) => api.get("/dashboard/admin", { params }).then((r) => r.data),
  getHRDashboard: (params?: any) => api.get("/dashboard/hr", { params }).then((r) => r.data),
  getEmployeeDashboard: () => api.get("/dashboard/employee").then((r) => r.data),

  // --- Module 8: AI Assistant ---
  chatAI: (prompt: string) => api.post("/ai/chat", { prompt }).then((r) => r.data),
  summarizeDashboard: (kpis: any, role: string) =>
    api.post("/ai/summarize", { kpis, role }).then((r) => r.data),
  smartLeave: (prompt: string) => api.post("/ai/smart-leave", { prompt }).then((r) => r.data),

  // --- Module 9: Comms & Audit ---
  getAnnouncements: () => api.get("/comms/announcements").then((r) => r.data),
  createAnnouncement: (data: any) => api.post("/comms/announcements", data).then((r) => r.data),
  deleteAnnouncement: (id: string) => api.delete(`/comms/announcements/${id}`).then((r) => r.data),

  getNotifications: () => api.get("/comms/notifications").then((r) => r.data),
  markNotificationRead: (id: string) => api.patch(`/comms/notifications/${id}/read`).then((r) => r.data),
  markAllNotificationsRead: () => api.patch("/comms/notifications/read-all").then((r) => r.data),

  getAuditLogs: (params?: any) => api.get("/comms/audit", { params }).then((r) => r.data),
};
