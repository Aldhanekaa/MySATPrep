"use client";

import * as React from "react";
import {
  ArrowDownUpIcon,
  AudioWaveformIcon,
  BookAIcon,
  BookCopyIcon,
  BookMarkedIcon,
  BookOpen,
  Bot,
  BrainCircuitIcon,
  CheckCircleIcon,
  ClockIcon,
  Command,
  Frame,
  GalleryVerticalEnd,
  GraduationCapIcon,
  HistoryIcon,
  Home,
  HomeIcon,
  LandmarkIcon,
  Layers2Icon,
  LifeBuoy,
  Map,
  PieChart,
  RabbitIcon,
  Send,
  Settings2,
  SquareTerminal,
  TrendingUpIcon,
} from "lucide-react";

import { NavMain } from "@/components/dashboard-layout/nav-main";
import { NavProjects } from "@/components/dashboard-layout/nav-projects";
import { NavSecondary } from "@/components/dashboard-layout/nav-secondary";
import { NavUser } from "@/components/dashboard-layout/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
} from "@/components/ui/sidebar";

import { TeamSwitcher as AssessmentSwitcher } from "@/components/dashboard-layout/assessment-switcher";
import Link from "next/link";
import { Logo } from "../logo";
import { useAssessment } from "@/contexts/assessment-context";
import { useLocalStorage } from "@/lib/useLocalStorage";
import { SavedQuestions } from "@/types/savedQuestions";
import { PracticeStatistics } from "@/types/statistics";
import { useAppSelector } from "@/lib/redux/hooks";
import {
  selectIsAuthenticated,
  selectUserBookmarks,
  selectUserStatistics,
} from "@/lib/redux/selectors";
// import { SidebarFooterNews } from "./app-footer-news";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { state, getAssessmentKey } = useAssessment();
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const reduxBookmarks = useAppSelector(selectUserBookmarks);
  const reduxStatistics = useAppSelector(selectUserStatistics);

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
      name: "shadcn",
      email: "m@example.com",
      avatar: "/avatars/shadcn.jpg",
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
      {/* <SidebarFooter>
        <SidebarFooterNews />
      </SidebarFooter> */}
    </Sidebar>
  );
}
