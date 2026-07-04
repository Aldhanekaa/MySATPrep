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
      <div className="rounded-3xl border border-blue-200 bg-blue-50/80 p-6 text-blue-950 shadow-sm dark:border-blue-900/50 dark:bg-blue-950/30 dark:text-blue-50">
        <p className="text-sm font-semibold uppercase tracking-wide text-blue-700 dark:text-blue-300">
          Important migration notice
        </p>
        <h1 className="mt-2 text-2xl font-bold sm:text-3xl">
          You need to migrate again to MySATPrep.fun.
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-blue-900/90 dark:text-blue-100/90">
          User authentication is now available. After you sign in, you can
          import your local data there and it will sync into the cloud so your
          progress stays with your account across devices.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border bg-background p-5 shadow-sm">
          <h2 className="text-lg font-semibold">Export your backup</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Use the export button below to download your local storage data as a
            JSON file. It includes saved questions, practice statistics, and
            related assessment data.
          </p>
        </div>

        <div className="rounded-2xl border bg-background p-5 shadow-sm">
          <h2 className="text-lg font-semibold">Import after sign in</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Once you are authenticated on MySATPrep.fun, import the same file
            there to sync your data to the cloud and keep it available on any
            device.
          </p>
        </div>
      </div>

      <section className="space-y-4 rounded-2xl border bg-background p-5 shadow-sm">
        <p className="text-sm leading-6 text-muted-foreground">
          If you are moving from the local-only version, export a backup first,
          then import it again on the authenticated MySATPrep.fun account. That
          gives you both a downloadable backup and a synced cloud copy.
        </p>
        <p className="text-sm leading-6 text-muted-foreground">
          Your data remains private, and exporting gives you a safe copy before
          you migrate.
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
