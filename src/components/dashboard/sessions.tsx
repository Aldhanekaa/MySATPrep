import React from "react";
import { Button } from "@/components/ui/button";

export function SessionsTab() {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Practice Sessions</h2>
      <p className="text-sm text-muted-foreground">
        Review your past practice sessions and performance history.
      </p>
      <Button variant="outline">View Session History</Button>
    </div>
  );
}
