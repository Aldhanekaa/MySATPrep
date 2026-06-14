"use client";

import React, { useRef, useState } from "react";
import {
  ArrowRightIcon,
  ArrowDownUpIcon,
  DownloadIcon,
  FolderInputIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  downloadExportedData,
  exportLocalStorageData,
  importLocalStorageData,
  readFileAsJSON,
} from "@/lib/exportImport";
type ProgressiveBlurProps = {
  className?: string;
  backgroundColor?: string;
  position?: "top" | "bottom";
  height?: string;
  blurAmount?: string;
};

const ProgressiveBlur = ({
  className = "",
  backgroundColor = "black",
  position = "top",
  height = "150px",
  blurAmount = "4px",
}: ProgressiveBlurProps) => {
  const isTop = position === "top";

  return (
    <div
      className={`pointer-events-none absolute left-0 w-full select-none ${className}`}
      style={{
        [isTop ? "top" : "bottom"]: 0,
        height,
        background: isTop
          ? `linear-gradient(to top, transparent, ${backgroundColor})`
          : `linear-gradient(to bottom, transparent, ${backgroundColor})`,
        maskImage: isTop
          ? `linear-gradient(to bottom, ${backgroundColor} 50%, transparent)`
          : `linear-gradient(to top, ${backgroundColor} 50%, transparent)`,
        WebkitBackdropFilter: `blur(${blurAmount})`,
        backdropFilter: `blur(${blurAmount})`,
        WebkitUserSelect: "none",
        userSelect: "none",
      }}
    />
  );
};

const Skiper41 = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
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
        text: "Data exported successfully. Your backup file has been downloaded.",
      });
    } catch (error) {
      setMessage({
        type: "error",
        text: `Export failed: ${error instanceof Error ? error.message : "Unknown error"}`,
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
        text: `Import successful. ${result.imported} items imported.${result.skipped > 0 ? ` (${result.skipped} items skipped due to errors)` : ""}`,
      });
    } catch (error) {
      setMessage({
        type: "error",
        text: `Import failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      });
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <div className="relative flex h-full w-full flex-col items-center justify-center bg-[black] text-white/40">
      <ProgressiveBlur position="top" backgroundColor="black" />
      <ProgressiveBlur position="bottom" backgroundColor="black" />

      <div className="flex h-[calc(100vh-1rem)] w-full flex-col items-center overflow-scroll">
        <div className="mt-42 grid content-start justify-items-center gap-6 text-center text-white">
          <span className="relative max-w-[12ch] text-xs uppercase leading-tight opacity-40 after:absolute after:left-1/2 after:top-full after:h-16 after:w-px after:bg-gradient-to-b after:from-white after:to-black after:content-['']">
            MySATPrep Announcement.
          </span>
        </div>

        <div className="mt-24 w-full max-w-lg space-y-20 px-5 text-justify pb-40">
          <div className="mb-8">
            MySATPrep has been growing rapidly lately, and I’m truly grateful
            for all the support this community has shown. It means a lot to me
            who started this as passion project and as someone who is really
            upset by the Collegeboard's Questionbank website. I see so many
            people including students & tutors benefiting from MySATPrep and
            engaging with the platform.
            <br />
            <br />
            However, with this increased traffic, I’ve started receiving
            warnings from Vercel that our resource usage is exceeding the limits
            of the current free plan. To ensure the platform remains stable and
            accessible for everyone, I’m planning to migrate MySATPrep to
            independent hosting so it’s no longer restricted by these limits.
            <br />
            <br />
            At the moment, I’m working on raising the necessary funds to make
            this transition possible. Whilst you wait for the migration, you can
            continue practicing through our alternative site at
            practicesat.vercel.app. Thank you for your patience and continued
            support as I work to improve the platform for all of you.
            <br />
            <br />
            Please scroll down to export your data and migrate to the new site,
            and also consider supporting us on Ko-fi should you wish. It would
            really help us a lot in covering the hosting costs and ensuring the
            platform can continue to grow and serve students effectively.
            <br />
            <br />
            Sincerely,
            <br />
            Aldhaneka
          </div>

          <div className="rounded-2xl  border bg-black border-gray-900  w-full p-6 mb-6 mt-5 md:p-8 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Important Announcement
            </p>
            <h2 className="mt-2 text-2xl md:text-3xl font-bold text-left">
              In the meantime, please migrate to PracticeSAT.vercel.app & Export
              Your Data Here
            </h2>
            <p className="mt-3 text-muted-foreground max-w-3xl leading-relaxed">
              Please migrate to{" "}
              <a
                href="https://practicesat.vercel.app"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold underline underline-offset-4"
              >
                practicesat.vercel.app
              </a>{" "}
              for new updates and continued improvements. Before switching,
              export your local data so you can import it on the new platform.
              (visit the dashboard page to import your data)
            </p>

            <div className="mt-6 flex flex-wrap gap-3 ">
              <Button asChild>
                <a
                  href="https://practicesat.vercel.app"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Migrate to PracticeSAT
                  <ArrowRightIcon className="ml-2 h-4 w-4" />
                </a>
              </Button>

              <Button onClick={handleExport} disabled={isExporting}>
                <DownloadIcon className="mr-2 h-4 w-4" />
                {isExporting ? "Exporting..." : "Export"}
              </Button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleFileSelect}
              className="hidden"
              aria-label="Import data file"
            />

            {message && (
              <div
                className={`mt-4 rounded-md p-3 text-sm ${
                  message.type === "success"
                    ? "bg-green-100 text-green-800"
                    : "bg-red-100 text-red-800"
                }`}
              >
                {message.text}
              </div>
            )}
          </div>
          <div className="rounded-2xl  border bg-black border-gray-900  w-full p-6 mb-6 mt-5 md:p-8 shadow-sm">
            <h2 className="mt-2 text-2xl md:text-3xl font-bold tracking-tight">
              Visit MySATPrep Ko-fi Page
            </h2>
            <p className="mt-3 text-muted-foreground max-w-3xl  text-left">
              I'm currently raising funds to support the hosting costs of
              MySATPrep. Visit the ko-fi page to read & review the reports on
              current resource usage and goals for the funds.
            </p>

            <div className="mt-8">
              <a href="https://ko-fi.com/B8V8212GKQ" target="_blank">
                <img
                  className=" w-36"
                  height="36"
                  src="https://storage.ko-fi.com/cdn/kofi6.png?v=6"
                  alt="Buy Me a Coffee at ko-fi.com"
                />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export { ProgressiveBlur, Skiper41 };
