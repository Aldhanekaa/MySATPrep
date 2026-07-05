"use client";
import { useAssessment } from "@/contexts/assessment-context";
import { useState, useRef } from "react";
import {
  exportLocalStorageData,
  downloadExportedData,
  readFileAsJSON,
  importLocalStorageData,
} from "@/lib/exportImport";

import { Button } from "@/components/ui/button";

export default function SessionsPage() {
  const { state } = useAssessment();
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const handleExport = async () => {
    try {
      setIsExporting(true);
      setMessage(null);
      const exportedData = exportLocalStorageData();
      downloadExportedData(exportedData);
      setMessage({
        type: "success",
        text: "✅ Data exported successfully! Your backup file has been downloaded.",
      });
    } catch (error) {
      setMessage({
        type: "error",
        text: `❌ Export failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsImporting(true);
      setMessage(null);
      const importedData = await readFileAsJSON(file);
      const result = importLocalStorageData(importedData);
      setMessage({
        type: "success",
        text: `✅ Import successful! ${result.imported} items imported.${result.skipped > 0 ? ` (${result.skipped} items skipped due to errors)` : ""} Page will refresh in 2 seconds...`,
      });
      // Refresh the page after 2 seconds
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error) {
      setMessage({
        type: "error",
        text: `❌ Import failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      });
    } finally {
      setIsImporting(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <section className="mx-auto w-full max-w-4xl space-y-6 px-3 py-10 lg:max-w-5xl xl:max-w-7xl">
      <div>
        <h1 className="text-2xl font-bold sm:text-3xl">Export &amp; Import</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
          Back up your local data or restore it from a previous export. You can
          also import a backup after signing in to sync your progress to the
          cloud.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border bg-background p-5 shadow-sm">
          <h2 className="text-lg font-semibold">Export your data</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Download your local storage data as a JSON file. It includes saved
            questions, practice statistics, and related assessment data.
          </p>
        </div>

        <div className="rounded-2xl border bg-background p-5 shadow-sm">
          <h2 className="text-lg font-semibold">Import &amp; sync to cloud</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Import a backup file to restore your data locally. Sign in first and
            your imported data will also sync to the cloud, keeping your
            progress available on any device.
          </p>
        </div>
      </div>

      <section className="space-y-4 rounded-2xl border bg-background p-5 shadow-sm">
        <p className="text-sm leading-6 text-muted-foreground">
          Export creates a downloadable backup of everything stored locally —
          useful before switching devices or browsers. Import restores that data
          back into local storage.
        </p>
        <p className="text-sm leading-6 text-muted-foreground">
          If you are signed in, importing will also sync your data to the cloud
          so your progress is tied to your account.
        </p>

        <section className="flex flex-wrap gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            disabled={isExporting}
          >
            {isExporting ? "Exporting..." : "Export Backup"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleImportClick}
            disabled={isImporting}
          >
            {isImporting ? "Importing..." : "Import Backup"}
          </Button>
        </section>
      </section>

      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleFileSelect}
        style={{ display: "none" }}
        aria-label="Import data file"
      />
      {message && (
        <div
          className={`rounded-md p-3 ${
            message.type === "success"
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          {message.text}
        </div>
      )}
    </section>
  );
}
