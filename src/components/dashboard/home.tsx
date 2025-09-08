import React from "react";
import { Button } from "@/components/ui/button";
import { AssessmentWorkspace } from "@/app/dashboard/types";

interface HomeTabProps {
  selectedAssessment?: AssessmentWorkspace;
}

export function HomeTab({ selectedAssessment }: HomeTabProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Home</h2>
      <p className="text-sm text-muted-foreground">
        Welcome to your assessment dashboard. Start practicing with your
        selected assessment type.
      </p>
      {selectedAssessment && (
        <div className="space-y-2">
          <p className="text-sm">
            Current Assessment: <strong>{selectedAssessment.name}</strong>
          </p>
          <div className="flex gap-2">
            <Button>Start Practice</Button>
            <Button variant="outline">View Question Bank</Button>
          </div>
        </div>
      )}
    </div>
  );
}
