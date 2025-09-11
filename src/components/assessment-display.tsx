"use client";

import React from "react";
import { useAssessment } from "@/contexts/assessment-context";
import { Badge } from "@/components/ui/badge";

// Example component that automatically updates when assessment changes
export function AssessmentDisplay() {
  const { state, getAssessmentKey } = useAssessment();

  if (!state.selectedAssessment) {
    return <div>No assessment selected</div>;
  }

  return (
    <div className="p-4 border rounded-lg bg-card">
      <h3 className="text-lg font-semibold mb-2">Current Assessment</h3>
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Name:</span>
          <span>{state.selectedAssessment.name}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">ID:</span>
          <Badge variant="secondary">
            {state.selectedAssessment.assessmentId}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Storage Key:</span>
          <Badge variant="outline">
            {getAssessmentKey(state.selectedAssessment)}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Internal ID:</span>
          <Badge variant="outline">{state.activeAssessmentId}</Badge>
        </div>
      </div>
      <p className="text-xs text-muted-foreground mt-3">
        This component automatically updates when the assessment changes
        anywhere in the app!
      </p>
    </div>
  );
}

export default AssessmentDisplay;
