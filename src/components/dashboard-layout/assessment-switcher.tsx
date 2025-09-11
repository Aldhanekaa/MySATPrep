"use client";

import * as React from "react";
import { ChevronsUpDown, Plus, GraduationCap } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  useAssessment,
  assessmentWorkspaces,
} from "@/contexts/assessment-context";

export function TeamSwitcher({
  teams,
}: {
  teams: {
    name: string;
    logo: React.ElementType;
    plan: string;
  }[];
}) {
  const { isMobile } = useSidebar();
  const { state, setActiveAssessmentByWorkspace } = useAssessment();

  // Convert assessment to team format for display
  const activeTeam = React.useMemo(() => {
    if (!state.selectedAssessment) {
      return teams[0]; // Fallback to first team if no assessment found
    }
    return {
      name: state.selectedAssessment.name,
      logo: GraduationCap, // Use GraduationCap icon for assessments
      plan: state.selectedAssessment.plan,
    };
  }, [state.selectedAssessment, teams]);

  if (!activeTeam) {
    return null;
  }
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent  data-[state=open]:text-sidebar-accent-foreground"
            >
              <div className="bg-blue-500 text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                <activeTeam.logo className="size-4" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{activeTeam.name}</span>
                <span className="truncate text-xs">{activeTeam.plan}</span>
              </div>
              <ChevronsUpDown className="ml-auto" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            align="start"
            side={isMobile ? "bottom" : "right"}
            sideOffset={4}
          >
            <DropdownMenuLabel className="text-muted-foreground text-xs">
              Assessments
            </DropdownMenuLabel>
            {assessmentWorkspaces.map((assessment, index) => (
              <DropdownMenuItem
                key={assessment.name}
                onClick={() => setActiveAssessmentByWorkspace(assessment)}
                className="gap-2 p-2"
              >
                <div className="flex size-6 items-center justify-center rounded-md border">
                  <GraduationCap className="size-3.5 shrink-0" />
                </div>
                {assessment.name}
                <DropdownMenuShortcut>⌘{index + 1}</DropdownMenuShortcut>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
