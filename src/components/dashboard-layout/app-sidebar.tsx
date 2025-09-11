"use client";

import * as React from "react";
import {
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
import { SidebarFooterNews } from "./app-footer-news";
import { it } from "node:test";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { state, getAssessmentKey } = useAssessment();

  // Load saved questions to calculate badge count
  const [savedQuestions] = useLocalStorage<SavedQuestions>(
    "savedQuestions",
    {}
  );

  // Load practice statistics to calculate answered questions badge count
  const [practiceStatistics] = useLocalStorage<PracticeStatistics>(
    "practiceStatistics",
    {}
  );

  // Calculate saved questions count for current assessment
  const savedQuestionsCount = React.useMemo(() => {
    const assessmentKey = getAssessmentKey(state.selectedAssessment);
    const assessmentSavedQuestions = savedQuestions[assessmentKey] || [];
    return assessmentSavedQuestions.length;
  }, [savedQuestions, state.selectedAssessment, getAssessmentKey]);

  // Calculate answered questions count for current assessment
  const answeredQuestionsCount = React.useMemo(() => {
    const assessmentKey = getAssessmentKey(state.selectedAssessment);
    const assessmentStats = practiceStatistics[assessmentKey];
    const answeredQuestionsDetailed =
      assessmentStats?.answeredQuestionsDetailed || [];
    return answeredQuestionsDetailed.length;
  }, [practiceStatistics, state.selectedAssessment, getAssessmentKey]);

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
        name: "Question Bank",
        url: "/questionbank",
        icon: Layers2Icon,
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
      //   name: "Search Question",
      //   url: "/questionbank",
      //   icon: Frame,
      // },
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
