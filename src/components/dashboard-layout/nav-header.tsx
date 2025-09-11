import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "../ui/breadcrumb";
import { Separator } from "../ui/separator";
import { SidebarTrigger } from "../ui/sidebar";
import { NavActions } from "./nav-actions";

export default function NavHeader() {
  return (
    <header className="flex h-14 shrink-0 items-center gap-2 sticky top-0 bg-background z-50 rounded-t-xl shadow-sm">
      <div className="flex flex-1 items-center gap-2 px-3">
        <SidebarTrigger />
        <Separator
          orientation="vertical"
          className="mr-2 data-[orientation=vertical]:h-4"
        />
      </div>
      <div className="ml-auto px-3">
        <NavActions />
      </div>
    </header>
  );
}
