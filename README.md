# HCM Lite — AI-Assisted Human Capital Management System
**Saylani Hackathon 2026 · Zaitoon Ashraf IT Park**  
A comprehensive web-based Human Capital Management system built for the daily work of an HR team, with an AI assistant that answers questions from real data.

---

## 🌟 Key Highlights & Implementation Overview

- **Starts Empty (Zero Preloaded Data):** Fresh install automatically triggers first-run setup for the company profile and Master Admin account.
- **Strict Role-Based Access Control (RBAC):** Server-side data scope guard for 3 distinct roles: **Admin**, **HR**, and **Employee**.
- **9 Modules & 25 Core Functionalities:** Auth, Org Setup, Employees Directory & 360°, Attendance (Web + Camera Face & GPS Geofence), Leave (Working days, holiday skip, 422 overlap/over-balance checks), Monthly Payroll (1.5× basic gross, deductions, 5-slab tax, PDF payslips), Real-Time Dashboards, AI Assistant (tool calling, policy Q&A, Roman Urdu, salary guardrails), and Communications & Audit Log.
- **Bonus Implementations (+10 Points):**
  - Camera attendance with real-time face detection + GPS location verification (Haversine geofence check on server).
  - AI Assistant understands both **English and Roman Urdu** (*"Mera leave balance kitna hai?", "Kaun late aya?"*).
  - Late penalty rule: 3 lates = 0.5 day deduction in monthly payroll.
  - Clean, simple, intuitive UI with responsive design (375px+).

---

## 🔑 Demo Accounts & Credentials (Quick Role Switcher)

On the Sign-In page (`http://localhost:3000/login`), quick-fill buttons are provided for instant evaluation:

| Role | Email | Password | Access Scope |
|---|---|---|---|
| **Admin** | `admin@saylani.com` | `Admin@12345` | Company setup, Office rules, Lock payroll, Immutable audit log, All company AI |
| **HR** | `hr@saylani.com` | `Password@123` | Register employees, Leave approval inbox, Attendance board, Monthly payroll draft |
| **Employee** | `ali@saylani.com` | `Password@123` | Web/Camera check-in, Smart leave form, Download PDF payslips, Own profile 360° |

*(Judges can either use these pre-tested demo accounts or start completely fresh from `/` to experience the First-Run Setup).*

---

## 🏗️ Architecture & Modules Tree

```
HCM Lite (9 Modules)
├── M1 Auth & Access: JWT token auth, bcrypt passwords, server-side data scope guard
├── M2 Org Setup: Office hours (09:00), grace period (15m), departments, designations, leave quotas, holidays
├── M3 Employees: Directory, server-side search, Employee 360°, CSV dry-run validation & export
├── M4 Attendance: Server-stamped check-in/out, 409 duplicate guard, camera face detection + GPS geofence
├── M5 Leave: Quotas (Annual 14, Sick 8, Casual 10, Unpaid ∞), working day calc (skips weekends/holidays), 422 validation
├── M6 Payroll Lite: Gross = 1.5× basic, working day rate, absent/half-day deductions, 5-slab annual tax, PDF payslips
├── M7 Dashboards: Server database aggregations for Admin, HR, and Employee dashboards
├── M8 AI Assistant: Real tool calling, 3-5 bullet dashboard summary, Smart Leave NLP parser, colleague salary privacy guardrail
└── M9 Comms & Audit: Broadcast announcements, personal in-app notifications, immutable audit log
```

---

## 🚀 How to Run the Project Locally (Under 5 Minutes)

### 1. Prerequisites
- **Node.js** >= 18
- **MongoDB** running locally on default port `27017`

### 2. Backend Setup
```bash
cd backend
npm install
npm start
```
*Backend runs at: `http://localhost:5001`*

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
*Frontend runs at: `http://localhost:3000`*

---

## 🧪 5-Minute Live Demo Walkthrough for Judges

1. **First-Run Experience:** Open `http://localhost:3000`. If starting fresh, the system presents the First-Run Setup wizard.
2. **One-Click Quick Login:** Open `http://localhost:3000/login` to see the accounts listed below the form. Click **Admin** to login.
3. **Admin Actions:**
   - Review executive KPIs (Headcount, Attrition YTD, Payroll Cost, Demographic breakdown).
   - Click **AI Dashboard Summary** to generate real insights from live database numbers.
   - Configure office hours, grace time (15 mins), and GPS office geofence.
   - Inspect the **Audit Log** verifying immutable tracking.
4. **HR Actions:**
   - Log in as `hr@saylani.com`.
   - Register a new employee with basic salary; note that login is created with a temporary password and gross is computed as $1.5 \times \text{basic}$.
   - Check the **Daily Attendance Board** and **Leave Approvals Inbox**.
   - Generate the **Monthly Payroll Draft**; review working days, tax slabs, and absent deductions.
5. **Employee Self-Service & AI:**
   - Log in as `ali@saylani.com`.
   - Perform Web Check-In or test **Camera + Face Detection + GPS Check-In**.
   - Use **Smart Leave**: type *"Need next Monday and Tuesday off for sister's wedding"* to see the pre-filled form.
   - Download personal **Confidential Payslip PDF**.
   - Open **AI Assistant** and ask:
     - *"What is my leave balance?"* (Returns own remaining quotas).
     - *"Mera leave balance kitna hai?"* (Understands Roman Urdu).
     - *"What is Sara's salary?"* (Politely refused per privacy policy!).
