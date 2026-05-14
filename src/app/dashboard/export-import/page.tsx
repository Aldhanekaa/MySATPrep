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
import { DownloadIcon, FolderInputIcon, FolderOutputIcon } from "lucide-react";

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
    <section className="space-y-4 max-w-4xl lg:max-w-5xl xl:max-w-7xl w-full mx-auto px-3 py-10 ">
      You can export your data, which is stored on your browser local storage,
      to a JSON file, which can be imported back into the the platform later —
      whether you switch browser or testing our new alpha version of the
      platform (TBA). This is useful for backing up your data or transferring it
      to another device.
      <br />
      <br />
      I promise the data won't corrupt, but it's always a good idea to keep a
      backup just in case.
      <br />
      The exported data includes your saved questions, practice statistics, and
      any other relevant information stored in your local storage related to
      your assessments.
      <br />
      <br />
      In the meantime, please wait while I develop the authentication so you can
      store your data in the cloud (If you wish to) — many people asking me for
      this feature ._.
      <br />
      But anyway, later, the authentication is just optional. You can still use
      the platform while your data is stored locally and kept private.
      <br />
      <br />
      Thanks for using MySATPrep! Love yall
      <br />
      - Aldhaneka
      <br />
      <section className="flex gap-2 pt-5">
        {" "}
        <Button
          variant="outline"
          size="sm"
          onClick={handleExport}
          disabled={isExporting}
        >
          <DownloadIcon /> {isExporting ? "Exporting..." : "Export"}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleImportClick}
          disabled={isImporting}
        >
          <FolderInputIcon /> {isImporting ? "Importing..." : "Import"}
        </Button>
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
          className={`mt-4 p-3 rounded-md ${
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
