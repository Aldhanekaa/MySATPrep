"use client";

import React, { createContext, useContext, useReducer, useEffect } from "react";
import { Assessments } from "@/static-data/assessment";
import { AssessmentWorkspace } from "@/app/dashboard/types";

// Convert assessments to workspace format
export const assessmentWorkspaces: AssessmentWorkspace[] = Object.entries(
  Assessments
).map(([key, assessment]) => ({
  id: assessment.id.toString(),
  name: assessment.text,
  logo: `https://avatar.vercel.sh/${key.toLowerCase()}`,
  plan: "Assessment",
  assessmentId: assessment.id,
}));

// Assessment state type
interface AssessmentState {
  activeAssessmentId: string;
  selectedAssessment: AssessmentWorkspace | undefined;
}

// Action types
type AssessmentAction = {
  type: "SET_ASSESSMENT";
  payload: string; // assessment ID
};

// Assessment reducer
function assessmentReducer(
  state: AssessmentState,
  action: AssessmentAction
): AssessmentState {
  switch (action.type) {
    case "SET_ASSESSMENT": {
      const selectedAssessment = assessmentWorkspaces.find(
        (ws) => ws.id === action.payload
      );
      return {
        activeAssessmentId: action.payload,
        selectedAssessment: selectedAssessment || assessmentWorkspaces[0],
      };
    }
    default:
      return state;
  }
}

// Context type
interface AssessmentContextType {
  state: AssessmentState;
  setActiveAssessment: (assessmentId: string) => void;
  setActiveAssessmentByWorkspace: (workspace: AssessmentWorkspace) => void;
  getAssessmentKey: (assessment?: AssessmentWorkspace) => string;
}

// Create context
const AssessmentContext = createContext<AssessmentContextType | null>(null);

// Custom hook to use assessment context
export function useAssessment() {
  const context = useContext(AssessmentContext);
  if (!context) {
    throw new Error("useAssessment must be used within AssessmentProvider");
  }
  return context;
}

// Provider component
interface AssessmentProviderProps {
  children: React.ReactNode;
}

export function AssessmentProvider({ children }: AssessmentProviderProps) {
  // Get initial value from localStorage (client-side only)
  const getInitialAssessmentId = () => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("preferred-assessment-id");
      return stored || assessmentWorkspaces[0]?.id || "99";
    }
    return assessmentWorkspaces[0]?.id || "99";
  };

  const [state, dispatch] = useReducer(assessmentReducer, {
    activeAssessmentId: getInitialAssessmentId(),
    selectedAssessment:
      assessmentWorkspaces.find((ws) => ws.id === getInitialAssessmentId()) ||
      assessmentWorkspaces[0],
  });

  // Update localStorage whenever assessment changes
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("preferred-assessment-id", state.activeAssessmentId);
    }
  }, [state.activeAssessmentId]);

  // Load from localStorage on mount (hydration)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("preferred-assessment-id");
      if (stored && stored !== state.activeAssessmentId) {
        dispatch({ type: "SET_ASSESSMENT", payload: stored });
      }
    }
  }, []);

  // Helper function to get assessment key for localStorage mapping
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

  // Action creators
  const setActiveAssessment = React.useCallback((assessmentId: string) => {
    dispatch({ type: "SET_ASSESSMENT", payload: assessmentId });
    console.log("Assessment changed to ID:", assessmentId);
  }, []);

  const setActiveAssessmentByWorkspace = React.useCallback(
    (workspace: AssessmentWorkspace) => {
      dispatch({ type: "SET_ASSESSMENT", payload: workspace.id });
      console.log(
        "Assessment changed to:",
        workspace.name,
        "ID:",
        workspace.assessmentId
      );
    },
    []
  );

  const contextValue: AssessmentContextType = {
    state,
    setActiveAssessment,
    setActiveAssessmentByWorkspace,
    getAssessmentKey,
  };

  return (
    <AssessmentContext.Provider value={contextValue}>
      {children}
    </AssessmentContext.Provider>
  );
}

// Export types for use in other components
export type { AssessmentState, AssessmentContextType, AssessmentWorkspace };
