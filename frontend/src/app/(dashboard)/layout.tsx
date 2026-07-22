import DashboardSidebar from "@/components/layout/dashboard/DashboardSidebar";
import DashboardHeader from "@/components/layout/dashboard/DashboardHeader";
import SessionExpiryHandler from "@/components/auth/SessionExpiryHandler";
import RoleGuard from "@/components/auth/RoleGuard";
import ChatWidget from "@/components/assistant/ChatWidget";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      <SessionExpiryHandler />
      <RoleGuard />
      <DashboardSidebar />
      <div className="flex-1 md:ml-64 flex flex-col min-h-screen min-w-0 relative">
        <DashboardHeader />
        <main className="flex-1 min-w-0 overflow-x-hidden p-6">
          {children}
        </main>
      </div>
      <ChatWidget />
    </div>
  );
}
