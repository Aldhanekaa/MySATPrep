"use client";
import React, { useState } from "react";
import { SiteHeader } from "../navbar";

import {
  Workspaces,
  WorkspaceTrigger,
  WorkspaceContent,
} from "@/components/ui/workspaces";
import { Home, BookMarked, Clock, CheckCircle } from "lucide-react";
import { useLocalStorage } from "@/lib/useLocalStorage";
import { SavedQuestions } from "@/types/savedQuestions";
import { PracticeStatistics } from "@/types/statistics";
import { Badge } from "@/components/ui/badge";
import {
  HomeTab,
  SavedTab,
  AnsweredTab,
  SessionsTab,
} from "@/components/dashboard";
import {
  useAssessment,
  assessmentWorkspaces,
  type AssessmentWorkspace,
} from "@/contexts/assessment-context";

import {
  Tabs as VerticalTabs,
  TabsContent as VerticalTabsContent,
  TabsList as VerticalTabsList,
  TabsTrigger as VerticalTabsTrigger,
} from "@/components/ui/vertical-tabs";

import { ExpandableTabs } from "@/components/ui/expandable-tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import ButtonsGroup from "@/components/dashboard/buttons-group";

// Tab configuration
interface TabItem {
  value: string;
  label: string;
  icon: React.ComponentType<{
    className?: string;
    size?: number;
    strokeWidth?: number;
    "aria-hidden"?: boolean;
  }>;
  tooltip: string;
  badge?: number;
}

// Shared tab content components
const TabContentComponents = {
  home: HomeTab,
  saved: SavedTab,
  answered: AnsweredTab,
  // tracker: TrackerTab,
  sessions: SessionsTab,
};

export default function DashboardPage() {
  const { state, setActiveAssessmentByWorkspace, getAssessmentKey } =
    useAssessment();

  // Active tab state for mobile expandable tabs
  const [activeTab, setActiveTab] = React.useState<string>("home");

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
    console.log("assessmentKey", assessmentKey, state.selectedAssessment);
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

  // Dynamic tab items with calculated badge count
  const TAB_ITEMS: TabItem[] = React.useMemo(
    () => [
      {
        value: "home",
        label: "Home",
        icon: Home,
        tooltip: "Home",
      },
      {
        value: "saved",
        label: "Saved",
        icon: BookMarked,
        tooltip: "Saved Questions",
        badge: savedQuestionsCount > 0 ? savedQuestionsCount : undefined,
      },
      {
        value: "answered",
        label: "Answered",
        icon: CheckCircle,
        tooltip: "Answered Questions",
        badge: answeredQuestionsCount > 0 ? answeredQuestionsCount : undefined,
      },
      // {
      //   value: "tracker",
      //   label: "Tracker",
      //   icon: TrendingUp,
      //   tooltip: "Progress Tracker",
      // },
      {
        value: "sessions",
        label: "Sessions",
        icon: Clock,
        tooltip: "Practice Sessions",
      },
    ],
    [savedQuestionsCount, answeredQuestionsCount]
  );

  // Convert TAB_ITEMS to ExpandableTabs format
  const EXPANDABLE_TAB_ITEMS = React.useMemo(
    () =>
      TAB_ITEMS.map((item) => ({
        title: item.label,
        icon: item.icon,
        value: item.value,
        badge: item.badge,
      })),
    [TAB_ITEMS]
  );

  // Get time-based greeting
  const getTimeBasedGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  };

  const handleAssessmentChange = (workspace: AssessmentWorkspace) => {
    setActiveAssessmentByWorkspace(workspace);
  };

  return (
    <React.Fragment>
      <div className="w-full flex flex-col min-h-screen pb-60 items-center">
        <section className="bg-accent w-full pt-20 mb-10 pb-3">
          <section className="space-y-4 max-w-7xl w-full mx-auto px-3 ">
            <div className="  flex flex-col gap-4 md:flex-row justify-between items-start md:px-13 space-y-6">
              <div className="space-y-2">
                <h1 className="text-2xl font-bold">{getTimeBasedGreeting()}</h1>
                <p className="text-muted-foreground">
                  Select an assessment type to get started with practice
                  questions.
                </p>

                <ButtonsGroup
                  assessment={getAssessmentKey(state.selectedAssessment)}
                />
              </div>

              <div className="space-y-4">
                <label className="text-sm font-medium">Assessment Type</label>
                <Workspaces
                  workspaces={assessmentWorkspaces}
                  selectedWorkspaceId={state.activeAssessmentId}
                  onWorkspaceChange={handleAssessmentChange}
                >
                  <WorkspaceTrigger className="min-w-72" />
                  <WorkspaceContent title="Assessment Types"></WorkspaceContent>
                </Workspaces>
              </div>
            </div>
          </section>
        </section>
        <main className="space-y-4 max-w-4xl lg:max-w-5xl xl:max-w-7xl w-full mx-auto px-3 py-10">
          <HomeTab selectedAssessment={state.selectedAssessment} />
        </main>
      </div>
    </React.Fragment>
  );
}
