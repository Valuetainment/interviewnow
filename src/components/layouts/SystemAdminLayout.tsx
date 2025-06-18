import React from "react";
import { Outlet } from "react-router-dom";
import { SystemAdminSidebar } from "@/components/system-admin/SystemAdminSidebar";
import { SystemAdminHeader } from "@/components/system-admin/SystemAdminHeader";

export const SystemAdminLayout: React.FC = () => {
  return (
    <div className="flex h-screen bg-gray-100">
      <SystemAdminSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <SystemAdminHeader />
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
