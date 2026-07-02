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
  TrendingUpIcon,
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
} from "@/components/ui/sidebar";

import { TeamSwitcher as AssessmentSwitcher } from "@/components/dashboard-layout/assessment-switcher";
import { useAssessment } from "@/contexts/assessment-context";
import { useLocalStorage } from "@/lib/useLocalStorage";
import { SavedQuestions } from "@/types/savedQuestions";
import { PracticeStatistics } from "@/types/statistics";
import { useAppSelector } from "@/lib/redux/hooks";
import {
  selectIsAuthenticated,
  selectUser,
  selectUserBookmarks,
  selectUserStatistics,
} from "@/lib/redux/selectors";
import { AuthModals } from "@/components/auth/AuthModals";
import { SidebarAuthUser } from "@/components/dashboard-layout/sidebar-auth-user";
// import { SidebarFooterNews } from "./app-footer-news";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { state, getAssessmentKey } = useAssessment();
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const user = useAppSelector(selectUser);
  const reduxBookmarks = useAppSelector(selectUserBookmarks);
  const reduxStatistics = useAppSelector(selectUserStatistics);

  const [authModal, setAuthModal] = React.useState<"signin" | "signup" | null>(
    null,
  );

  // Load saved questions from localStorage (used for unauthenticated users)
  const [savedQuestions] = useLocalStorage<SavedQuestions>(
    "savedQuestions",
    {},
  );

  // Load practice statistics from localStorage (used for unauthenticated users)
  const [practiceStatistics] = useLocalStorage<PracticeStatistics>(
    "practiceStatistics",
    {},
  );

  // Calculate saved questions count — from Redux for authenticated users, localStorage otherwise
  const savedQuestionsCount = React.useMemo(() => {
    if (isAuthenticated) {
      const assessmentKey = getAssessmentKey(state.selectedAssessment);
      return reduxBookmarks.filter((b) => b.assessment === assessmentKey)
        .length;
    }
    const assessmentKey = getAssessmentKey(state.selectedAssessment);
    const assessmentSavedQuestions = savedQuestions[assessmentKey] || [];
    return assessmentSavedQuestions.length;
  }, [
    isAuthenticated,
    reduxBookmarks,
    savedQuestions,
    state.selectedAssessment,
    getAssessmentKey,
  ]);

  // Calculate answered questions count — from Redux for authenticated users, localStorage otherwise
  const answeredQuestionsCount = React.useMemo(() => {
    const assessmentKey = getAssessmentKey(state.selectedAssessment);
    if (isAuthenticated) {
      const assessmentStats = reduxStatistics[assessmentKey];
      return assessmentStats?.answeredQuestionsDetailed?.length ?? 0;
    }
    const assessmentStats = practiceStatistics[assessmentKey];
    return assessmentStats?.answeredQuestionsDetailed?.length ?? 0;
  }, [
    isAuthenticated,
    reduxStatistics,
    practiceStatistics,
    state.selectedAssessment,
    getAssessmentKey,
  ]);

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
        {isAuthenticated && user ? (
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
