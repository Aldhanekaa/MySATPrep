"use client";
import React from "react";

import {
  Workspaces,
  WorkspaceTrigger,
  WorkspaceContent,
} from "@/components/ui/workspaces";
import {
  useResolvedBookmarks,
  useResolvedPracticeStatistics,
} from "@/hooks/use-resolved-user-data";
import { HomeTab } from "@/components/dashboard";
import {
  useAssessment,
  assessmentWorkspaces,
  type AssessmentWorkspace,
} from "@/contexts/assessment-context";

import ButtonsGroup from "@/components/dashboard/buttons-group";

export default function DashboardPage() {
  const { state, setActiveAssessmentByWorkspace, getAssessmentKey } =
    useAssessment();

  const practiceStatistics = useResolvedPracticeStatistics();
  const savedQuestions = useResolvedBookmarks()[0];

  const savedQuestionsCount = React.useMemo(() => {
    const assessmentKey = getAssessmentKey(state.selectedAssessment);
    return (savedQuestions[assessmentKey] || []).length;
  }, [savedQuestions, state.selectedAssessment, getAssessmentKey]);

  const answeredQuestionsCount = React.useMemo(() => {
    const assessmentKey = getAssessmentKey(state.selectedAssessment);
    const assessmentStats = practiceStatistics[assessmentKey];
    return assessmentStats?.answeredQuestionsDetailed?.length ?? 0;
  }, [practiceStatistics, state.selectedAssessment, getAssessmentKey]);

  // Suppress unused-variable warnings; counts are available for tab badges
  void savedQuestionsCount;
  void answeredQuestionsCount;

  const getTimeBasedGreeting = React.useCallback(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  }, []);

  const greeting = React.useMemo(
    () => getTimeBasedGreeting(),
    [getTimeBasedGreeting],
  );

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
                <h1 className="text-2xl font-bold">{greeting}</h1>
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
