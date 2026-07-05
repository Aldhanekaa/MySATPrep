"use client";

import * as React from "react";
import {
  ArrowDownUpIcon,
  BookAIcon,
  BookCopyIcon,
  BookMarkedIcon,
  BrainCircuitIcon,
  CheckCircleIcon,
  ClockIcon,
  GraduationCapIcon,
  HistoryIcon,
  Home,
  HomeIcon,
  LandmarkIcon,
  LogInIcon,
  RabbitIcon,
  SettingsIcon,
  TrendingUpIcon,
  UserCircleIcon,
} from "lucide-react";

import { NavMain } from "@/components/dashboard-layout/nav-main";
import { NavProjects } from "@/components/dashboard-layout/nav-projects";
import { NavSecondary } from "@/components/dashboard-layout/nav-secondary";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
} from "@/components/ui/sidebar";

import { TeamSwitcher as AssessmentSwitcher } from "@/components/dashboard-layout/assessment-switcher";
import { useAssessment } from "@/contexts/assessment-context";
import {
  useResolvedBookmarks,
  useResolvedPracticeStatistics,
} from "@/hooks/use-resolved-user-data";
import { useAppSelector } from "@/lib/redux/hooks";
import {
  selectAuthLoading,
  selectIsAuthenticated,
  selectSessionChecked,
  selectUser,
} from "@/lib/redux/selectors";
import { AuthModals } from "@/components/auth/AuthModals";
import { SidebarAuthUser } from "@/components/dashboard-layout/sidebar-auth-user";
// import { SidebarFooterNews } from "./app-footer-news";

function SidebarAuthLoading() {
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <div
          aria-busy="true"
          aria-label="Checking account session"
          className="flex items-center gap-3 rounded-md px-3 py-2"
        >
          <div className="size-8 shrink-0 rounded-lg bg-sidebar-accent/60 animate-pulse" />
          <div className="grid flex-1 gap-2">
            <SidebarMenuSkeleton className="h-3" />
            <SidebarMenuSkeleton className="h-2.5 max-w-28" />
          </div>
        </div>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { state, getAssessmentKey } = useAssessment();
  const authLoading = useAppSelector(selectAuthLoading);
  const sessionChecked = useAppSelector(selectSessionChecked);
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const user = useAppSelector(selectUser);
  const savedQuestions = useResolvedBookmarks()[0];
  const practiceStatistics = useResolvedPracticeStatistics();

  const [authModal, setAuthModal] = React.useState<"signin" | "signup" | null>(
    null,
  );

  const savedQuestionsCount = React.useMemo(() => {
    const assessmentKey = getAssessmentKey(state.selectedAssessment);
    return (savedQuestions[assessmentKey] || []).length;
  }, [savedQuestions, state.selectedAssessment, getAssessmentKey]);

  const answeredQuestionsCount = React.useMemo(() => {
    const assessmentKey = getAssessmentKey(state.selectedAssessment);
    const assessmentStats = practiceStatistics[assessmentKey];
    return assessmentStats?.answeredQuestionsDetailed?.length ?? 0;
  }, [practiceStatistics, state.selectedAssessment, getAssessmentKey]);

  const isCheckingSession = authLoading || !sessionChecked;

  const data = {
    user: {
      name: user?.name ?? "Guest",
      email: user?.email ?? "",
    },
    navMain: [
      {
        title: "Home",
        url: "/dashboard",
        icon: Home,
        isActive: true,
      },

      {
        title: "SAT Vocabs",
        url: "/dashboard/vocabs",
        icon: BookAIcon,
      },
      {
        title: "Question Bank Tracker",
        url: "/dashboard/tracker",
        icon: TrendingUpIcon,
      },
      {
        title: "Bookmarked Questions",
        url: "/dashboard/bookmarks",
        icon: BookMarkedIcon,
        badge: savedQuestionsCount > 0 ? savedQuestionsCount : undefined,
      },
      {
        title: "Answered Questions",
        url: "/dashboard/answered",
        icon: CheckCircleIcon,
        badge: answeredQuestionsCount > 0 ? answeredQuestionsCount : undefined,
      },
      {
        title: "Practice Sessions",
        url: "/dashboard/sessions",
        icon: ClockIcon,
      },
      {
        title: "Export Import Data",
        url: "/dashboard/export-import",
        icon: ArrowDownUpIcon,
      },
      {
        title: "Preferences",
        url: "/dashboard/preferences",
        icon: SettingsIcon,
      },
      {
        title: "Account",
        url: "/dashboard/account",
        icon: UserCircleIcon,
      },
    ],

    navSecondary: [
      {
        title: "Home Page",
        url: "/",
        icon: HomeIcon,
      },
    ],
    explore: [
      {
        name: "SAT Suite Questionbank",
        url: "/questionbank",
        icon: LandmarkIcon,
      },
      {
        name: "SAT Vocabs Flashcards",
        url: "/dashboard/vocabs/learn",
        icon: BookCopyIcon,
      },
      {
        name: "SAT Vocabs Practice",
        url: "/dashboard/vocabs/practice",
        icon: BrainCircuitIcon,
      },

      {
        name: "Practice Rush",
        url: "/practice",
        icon: RabbitIcon,
      },
      {
        name: "Review Practice",
        url: "/review",
        icon: HistoryIcon,
      },

      // {
      //   name: "SAT Vocabs",
      //   url: "#",
      //   icon: Frame,
      // },
      // {
      //   name: "Learn Desmos",
      //   url: "#",
      //   icon: Frame,
      // },
      {
        name: "Resources",
        url: "/resources",
        icon: GraduationCapIcon,
      },
    ],
  };

  return (
    <Sidebar variant="inset" collapsible="icon" {...props}>
      <SidebarHeader>
        <AssessmentSwitcher teams={[]} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavProjects projects={data.explore} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        {isCheckingSession ? (
          <SidebarAuthLoading />
        ) : isAuthenticated && user ? (
          <SidebarAuthUser user={data.user} />
        ) : (
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                size="lg"
                onClick={() => setAuthModal("signin")}
                className="gap-3"
                tooltip="Sign In"
              >
                <LogInIcon className="size-5 shrink-0" />
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">Sign In</span>
                  <span className="truncate text-xs text-muted-foreground">
                    Save your progress
                  </span>
                </div>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        )}
      </SidebarFooter>

      {/* Auth modals — rendered outside SidebarContent to avoid z-index issues */}
      <AuthModals
        openModal={authModal}
        onClose={() => setAuthModal(null)}
        callbackURL="/dashboard"
      />
    </Sidebar>
  );
}
