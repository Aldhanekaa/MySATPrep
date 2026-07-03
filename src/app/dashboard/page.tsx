"use client";
import React from "react";

import {
  Workspaces,
  WorkspaceTrigger,
  WorkspaceContent,
} from "@/components/ui/workspaces";
import { useLocalStorage } from "@/lib/useLocalStorage";
import { SavedQuestions } from "@/types/savedQuestions";
import { PracticeStatistics } from "@/types/statistics";
import { HomeTab } from "@/components/dashboard";
import {
  useAssessment,
  assessmentWorkspaces,
  type AssessmentWorkspace,
} from "@/contexts/assessment-context";
import { useAppSelector } from "@/lib/redux/hooks";
import {
  selectIsAuthenticated,
  selectUserBookmarks,
  selectUserStatistics,
} from "@/lib/redux/selectors";

import ButtonsGroup from "@/components/dashboard/buttons-group";

export default function DashboardPage() {
  const { state, setActiveAssessmentByWorkspace, getAssessmentKey } =
    useAssessment();

  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const reduxBookmarks = useAppSelector(selectUserBookmarks);
  const reduxStatistics = useAppSelector(selectUserStatistics);

  // localStorage fallback for badge counts (used when not authenticated)
  const [savedQuestionsLS] = useLocalStorage<SavedQuestions>(
    "savedQuestions",
    {},
  );
  const [practiceStatisticsLS] = useLocalStorage<PracticeStatistics>(
    "practiceStatistics",
    {},
  );

  /**
   * Count of saved questions for the current assessment.
   * Authenticated → from Redux bookmarks; unauthenticated → from localStorage.
   * Available for badge indicators in tab navigation UI.
   */
  const savedQuestionsCount = React.useMemo(() => {
    const assessmentKey = getAssessmentKey(state.selectedAssessment);
    if (isAuthenticated) {
      return reduxBookmarks.filter((b) => b.assessment === assessmentKey)
        .length;
    }
    return (savedQuestionsLS[assessmentKey] || []).length;
  }, [
    isAuthenticated,
    reduxBookmarks,
    savedQuestionsLS,
    state.selectedAssessment,
    getAssessmentKey,
  ]);

  /**
   * Count of answered questions for the current assessment.
   * Authenticated → from Redux statistics; unauthenticated → from localStorage.
   * Available for badge indicators in tab navigation UI.
   */
  const answeredQuestionsCount = React.useMemo(() => {
    const assessmentKey = getAssessmentKey(state.selectedAssessment);
    if (isAuthenticated) {
      const assessmentStats = (reduxStatistics as PracticeStatistics)[
        assessmentKey
      ];
      return assessmentStats?.answeredQuestionsDetailed?.length ?? 0;
    }
    const assessmentStats = practiceStatisticsLS[assessmentKey];
    return assessmentStats?.answeredQuestionsDetailed?.length ?? 0;
  }, [
    isAuthenticated,
    reduxStatistics,
    practiceStatisticsLS,
    state.selectedAssessment,
    getAssessmentKey,
  ]);

  // Suppress unused-variable warnings; counts are available for tab badges
  void savedQuestionsCount;
  void answeredQuestionsCount;

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
            <div className="flex flex-col gap-4 md:flex-row justify-between items-start md:px-13 space-y-6">
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
