import type { Metadata } from "next";
import "./globals.css";
import QueryProvider from "@/api/QueryProvider";
import { AuthProvider } from "@/context/AuthContext";

export const metadata: Metadata = {
  title: "HCM Lite — AI-Assisted Human Capital Management",
  description: "Web-based Human Capital Management system for Admin, HR, and Employees with AI Assistant",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased font-sans">
        <QueryProvider>
          <AuthProvider>{children}</AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
