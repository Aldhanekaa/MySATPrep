import { AppSidebar } from "@/components/dashboard-layout/app-sidebar";
import NavHeader from "@/components/dashboard-layout/nav-header";
import Dialog02 from "@/components/ui/popup-tour";

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
        <main>
          <Dialog02 /> {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
