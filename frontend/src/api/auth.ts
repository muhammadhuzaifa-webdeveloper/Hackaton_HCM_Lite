import api from "@/lib/api";

export interface User {
  id: string;
  email: string;
  role: "Admin" | "HR" | "Employee";
  employeeId?: string | null;
  mustChangePassword?: boolean;
  employee?: {
    _id: string;
    employeeCode: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    address?: string;
    department?: { _id: string; name: string; code: string };
    designation?: { _id: string; title: string };
    salaryStructure?: {
      basic: number;
      hra: number;
      medical: number;
      gross: number;
    };
  } | null;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken?: string;
  user: User;
  message?: string;
}

export interface SetupStatusResponse {
  isSetup: boolean;
  companyName: string | null;
  officeStartTime?: string;
}

export const authApi = {
  login: (email: string, password: string) =>
    api.post<AuthResponse>("/auth/login", { email, password }).then((r) => r.data),

  logout: () => api.post("/auth/logout").then((r) => r.data),

  me: () => api.get<{ user: User }>("/auth/me").then((r) => r.data),

  changePassword: (data: { currentPassword?: string; newPassword: string }) =>
    api.post("/auth/change-password", data).then((r) => r.data),

  getSetupStatus: () =>
    api.get<SetupStatusResponse>("/setup/status").then((r) => r.data),

  initializeSetup: (data: any) =>
    api.post<AuthResponse>("/setup/initialize", data).then((r) => r.data),

  seedDemoData: () =>
    api.post<{ message: string; accounts: any }>("/setup/seed-demo").then((r) => r.data),

  registerEmployeePublic: (data: any) =>
    api.post("/auth/register-employee", data).then((r) => r.data),
};
