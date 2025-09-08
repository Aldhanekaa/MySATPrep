import React from "react";
import { Button } from "@/components/ui/button";

export function SavedTab() {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Saved Questions</h2>
      <p className="text-sm text-muted-foreground">
        Access your bookmarked questions for quick review.
      </p>
      <Button variant="outline">Browse Saved Questions</Button>
    </div>
  );
}
