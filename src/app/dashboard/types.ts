import { type Workspace } from "@/components/ui/workspaces";

// Extended workspace interface for assessment selection
export interface AssessmentWorkspace extends Workspace {
  logo: string;
  plan: string;
  assessmentId: number;
}
