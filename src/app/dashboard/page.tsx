"use client";
import React, { useState } from "react";
import { SiteHeader } from "../navbar";

import {
  Workspaces,
  WorkspaceTrigger,
  WorkspaceContent,
} from "@/components/ui/workspaces";
import { Home, BookMarked, Clock, CheckCircle } from "lucide-react";
import { Assessments } from "@/static-data/assessment";
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
import { AssessmentWorkspace } from "./types";

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

// Convert assessments to workspace format
const assessmentWorkspaces: AssessmentWorkspace[] = Object.entries(
  Assessments
).map(([key, assessment]) => ({
  id: assessment.id.toString(),
  name: assessment.text,
  logo: `https://avatar.vercel.sh/${key.toLowerCase()}`,
  plan: "Assessment",
  assessmentId: assessment.id,
}));

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
  // Use custom hook for localStorage management
  const [activeAssessmentId, setActiveAssessmentId] = useLocalStorage(
    "preferred-assessment-id",
    assessmentWorkspaces[0]?.id || "99"
  );

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

  // Get the assessment key from selectedAssessment
  const getAssessmentKey = React.useCallback(
    (assessment?: AssessmentWorkspace): string => {
      if (!assessment) return "SAT"; // Default to SAT

      // Map assessment names to keys used in localStorage
      const assessmentMap: Record<string, string> = {
        SAT: "SAT",
        "PSAT/NMSQT & PSAT 10": "PSAT/NMSQT",
        "PSAT 8/9": "PSAT",
      };

      return assessmentMap[assessment.name] || "SAT";
    },
    []
  );

  const selectedAssessment = React.useMemo(() => {
    return assessmentWorkspaces.find((ws) => ws.id === activeAssessmentId);
  }, [activeAssessmentId]);

  // Calculate saved questions count for current assessment
  const savedQuestionsCount = React.useMemo(() => {
    const assessmentKey = getAssessmentKey(selectedAssessment);
    console.log("assessmentKey", assessmentKey, selectedAssessment);
    const assessmentSavedQuestions = savedQuestions[assessmentKey] || [];
    return assessmentSavedQuestions.length;
  }, [savedQuestions, selectedAssessment, getAssessmentKey]);

  // Calculate answered questions count for current assessment
  const answeredQuestionsCount = React.useMemo(() => {
    const assessmentKey = getAssessmentKey(selectedAssessment);
    const assessmentStats = practiceStatistics[assessmentKey];
    const answeredQuestionsDetailed =
      assessmentStats?.answeredQuestionsDetailed || [];
    return answeredQuestionsDetailed.length;
  }, [practiceStatistics, selectedAssessment, getAssessmentKey]);

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
    setActiveAssessmentId(workspace.id);
    console.log(
      "Selected assessment:",
      workspace.name,
      "ID:",
      workspace.assessmentId
    );
  };

  return (
    <React.Fragment>
      <SiteHeader />
      <div className="w-full flex flex-col min-h-screen pb-60 items-center">
        <section className="bg-accent w-full pt-32 mb-10 pb-3">
          <section className="space-y-4 max-w-7xl w-full mx-auto px-3 ">
            <div className="  flex flex-col gap-4 md:flex-row justify-between items-start md:pl-13 space-y-6">
              <div className="space-y-2">
                <h1 className="text-2xl font-bold">{getTimeBasedGreeting()}</h1>
                <p className="text-muted-foreground">
                  Select an assessment type to get started with practice
                  questions.
                </p>

                <ButtonsGroup
                  assessment={getAssessmentKey(selectedAssessment)}
                />
              </div>

              <div className="space-y-4">
                <label className="text-sm font-medium">Assessment Type</label>
                <Workspaces
                  workspaces={assessmentWorkspaces}
                  selectedWorkspaceId={activeAssessmentId}
                  onWorkspaceChange={handleAssessmentChange}
                >
                  <WorkspaceTrigger className="min-w-72" />
                  <WorkspaceContent title="Assessment Types"></WorkspaceContent>
                </Workspaces>
              </div>
            </div>
          </section>
        </section>
        <main className="space-y-4 max-w-7xl w-full mx-auto px-3">
          {/* Mobile Expandable Tabs - shown only on mobile */}
          <div className="lg:hidden md:pl-13">
            <ExpandableTabs
              tabs={EXPANDABLE_TAB_ITEMS}
              defaultValue="home"
              onTabChange={setActiveTab}
              className="text-sm text-muted-foreground"
            >
              {(() => {
                const ContentComponent =
                  TabContentComponents[
                    activeTab as keyof typeof TabContentComponents
                  ];
                return ContentComponent ? (
                  <ContentComponent selectedAssessment={selectedAssessment} />
                ) : null;
              })()}
            </ExpandableTabs>
          </div>

          {/* Desktop Vertical Tabs - shown only on lg screens and above */}
          <div className="hidden lg:block px-4 md:px-0">
            <VerticalTabs
              defaultValue="home"
              orientation="vertical"
              className="flex w-full gap-2"
            >
              <VerticalTabsList className="flex-col justify-start">
                {TAB_ITEMS.map((tab) => {
                  const IconComponent = tab.icon;
                  return (
                    <TooltipProvider key={tab.value} delayDuration={0}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span>
                            <VerticalTabsTrigger
                              value={tab.value}
                              className={`py-3 ${
                                tab.badge ? "group relative" : ""
                              }`}
                            >
                              {tab.badge ? (
                                <span className="relative">
                                  <IconComponent
                                    size={16}
                                    strokeWidth={2}
                                    aria-hidden={true}
                                  />
                                  <Badge className="absolute -top-2.5 left-full min-w-4 -translate-x-1.5 border-background px-0.5 text-[10px]/[.875rem] transition-opacity group-data-[state=inactive]:opacity-50">
                                    {tab.badge}
                                  </Badge>
                                </span>
                              ) : (
                                <IconComponent
                                  size={16}
                                  strokeWidth={2}
                                  aria-hidden={true}
                                />
                              )}
                            </VerticalTabsTrigger>
                          </span>
                        </TooltipTrigger>
                        <TooltipContent
                          side="right"
                          className="px-2 py-1 text-xs"
                        >
                          {tab.tooltip}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  );
                })}
              </VerticalTabsList>
              <div className="grow rounded-lg text-start min-h-[400px]">
                {TAB_ITEMS.map((tab) => {
                  const ContentComponent =
                    TabContentComponents[
                      tab.value as keyof typeof TabContentComponents
                    ];
                  return (
                    <VerticalTabsContent key={tab.value} value={tab.value}>
                      <div className=" space-y-4 h-full">
                        <ContentComponent
                          selectedAssessment={selectedAssessment}
                        />
                      </div>
                    </VerticalTabsContent>
                  );
                })}
              </div>
            </VerticalTabs>
          </div>
        </main>
      </div>
    </React.Fragment>
  );
}
