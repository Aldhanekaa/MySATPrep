import React from "react";
import { Button } from "@/components/ui/button";

export function TrackerTab() {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Progress Tracker</h2>
      <p className="text-sm text-muted-foreground">
        Monitor your performance and track improvement over time.
      </p>
      <Button variant="outline">View Analytics</Button>
    </div>
  );
}
