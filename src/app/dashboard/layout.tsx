import { AppSidebar } from "@/components/dashboard-layout/app-sidebar";
import NavHeader from "@/components/dashboard-layout/nav-header";

import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <NavHeader />
        <main>{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
