"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

export default function RoleIndexPage() {
  const params = useParams();
  const router = useRouter();
  const role = (params?.role as string)?.toLowerCase() || "employee";

  useEffect(() => {
    router.replace(`/${role}/overview`);
  }, [role, router]);

  return (
    <div className="flex h-screen items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
    </div>
  );
}
