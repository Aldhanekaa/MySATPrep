"use client";

import React from "react";
import { motion } from "framer-motion";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/app/navbar";
import { WarpBackground } from "@/components/ui/warp-background";
import {
  downloadExportedData,
  exportLocalStorageData,
  importLocalStorageData,
  readFileAsJSON,
} from "@/lib/exportImport";

type HeroMessage = {
  type: "success" | "error";
  text: string;
} | null;

interface MainHeroState {
  isExpanded?: boolean;
}
export function MigrateHeroSection(
  state: MainHeroState = { isExpanded: false },
) {
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [isExporting, setIsExporting] = React.useState(false);
  const [isImporting, setIsImporting] = React.useState(false);
  const [message, setMessage] = React.useState<HeroMessage>(null);

  const handleExport = () => {
    try {
      setIsExporting(true);
      setMessage(null);
      const exportedData = exportLocalStorageData();
      downloadExportedData(exportedData);
      setMessage({
        type: "success",
        text: "Your backup file has been downloaded.",
      });
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Export failed.",
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
        text: `Imported ${result.imported} items.${result.skipped > 0 ? ` ${result.skipped} items were skipped.` : ""} Your data is now ready to sync after sign in.`,
      });
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Import failed.",
      });
    } finally {
      setIsImporting(false);
      event.target.value = "";
    }
  };

  return (
    <>
      <SiteHeader />

      <main className="overflow-hidden">
        <WarpBackground
          disableAnimation={state.isExpanded}
          className={`${
            state.isExpanded ? "border-0 " : "min-h-[1100px]"
          } flex items-center justify-center p-0`}
        >
          <motion.div
            className="relative w-full md:w-[10/12] xl:w-5xl"
            initial={false}
            animate={state.isExpanded ? { width: "100%" } : {}}
            transition={{
              duration: 0.8,
              ease: [0.4, 0.0, 0.2, 1],
            }}
          >
            <motion.div
              className="mx-auto my-auto"
              initial={false}
              animate={
                state.isExpanded ? { height: "auto", width: "100%" } : {}
              }
              transition={{
                duration: 0.8,
                ease: [0.4, 0.0, 0.2, 1],
              }}
              style={{ height: "60vh", width: "100%" }}
            >
              <Card
                className={`w-full h-full ${
                  state.isExpanded && "shadow-none border-0 bg-none  "
                }`}
              >
                <CardContent className="flex h-full flex-col gap-2 overflow-hidden px-0">
                  <div className="px-3">
                    <motion.div
                      className="flex flex-col items-center justify-center rounded-3xl bg-transparent p-0"
                      initial={false}
                      animate={{
                        paddingBottom: 80,
                        paddingTop: 20,
                      }}
                      transition={{
                        duration: 0.8,
                        ease: [0.4, 0.0, 0.2, 1],
                      }}
                    >
                      <div className="mx-auto flex w-full max-w-3xl flex-col items-center py-20 text-center">
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3 }}
                          className="flex flex-col items-center"
                        >
                          <h1 className="mb-3 text-3xl font-bold text-blue-500 sm:text-4xl">
                            We are migrating back to MySATPrep.fun!
                          </h1>
                          <p className="max-w-2xl text-gray-500 sm:text-lg">
                            User Authentication is now available. Sign in on
                            MySATPrep.fun, export your data here and import your
                            backup there to sync your data into the cloud and
                            keep it across devices. You can also sync your
                            different device data to the cloud after signing in
                            on MySatPrep.fun.
                          </p>
                        </motion.div>

                        <motion.div
                          className="mt-8 grid w-full gap-4 sm:grid-cols-3"
                          initial={{ opacity: 0, y: 18 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.35, duration: 0.5 }}
                        >
                          <div className="rounded-3xl border border-white/70 bg-white/80 p-5 text-left shadow-lg backdrop-blur dark:border-slate-800 dark:bg-slate-950/70">
                            <div className="mb-3 h-2.5 w-16 rounded-full bg-blue-500" />
                            <h2 className="text-lg font-semibold text-slate-950 dark:text-white">
                              Export backup
                            </h2>
                            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                              Download your local data as a JSON file before
                              migrating.
                            </p>
                          </div>

                          <div className="rounded-3xl border border-white/70 bg-white/80 p-5 text-left shadow-lg backdrop-blur dark:border-slate-800 dark:bg-slate-950/70">
                            <div className="mb-3 h-2.5 w-16 rounded-full bg-emerald-500" />
                            <h2 className="text-lg font-semibold text-slate-950 dark:text-white">
                              Sign in
                            </h2>
                            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                              Use your account on MySATPrep.fun to unlock cloud
                              sync.
                            </p>
                          </div>

                          <div className="rounded-3xl border border-white/70 bg-white/80 p-5 text-left shadow-lg backdrop-blur dark:border-slate-800 dark:bg-slate-950/70">
                            <div className="mb-3 h-2.5 w-16 rounded-full bg-amber-500" />
                            <h2 className="text-lg font-semibold text-slate-950 dark:text-white">
                              Import & sync
                            </h2>
                            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                              Upload the exported file after authentication to
                              sync it to the cloud.
                            </p>
                          </div>
                        </motion.div>

                        <motion.div
                          className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.45, duration: 0.5 }}
                        >
                          <Button
                            onClick={handleExport}
                            disabled={isExporting}
                            className="rounded-2xl bg-gradient-to-b from-blue-400 to-blue-500 px-8 py-6 text-lg font-bold text-white shadow-[0_4px_0_0_theme(colors.blue.600),0_8px_20px_theme(colors.blue.500/0.25)] transition-all duration-150 hover:from-blue-500 hover:to-blue-600 hover:shadow-[0_6px_0_0_theme(colors.blue.700),0_10px_25px_theme(colors.blue.500/0.3)] active:translate-y-0.5 active:scale-95 active:shadow-[0_2px_0_0_theme(colors.blue.600),0_4px_10px_theme(colors.blue.500/0.2)]"
                          >
                            {isExporting ? "Exporting..." : "Export Data"}
                          </Button>

                          <Button
                            variant="outline"
                            onClick={handleImportClick}
                            disabled={isImporting}
                            className="rounded-2xl px-8 py-6 text-lg font-bold shadow-[0_4px_0_0_theme(colors.gray.300),0_8px_20px_theme(colors.gray.300/0.25)] transition-all duration-150 hover:bg-gray-50 hover:shadow-[0_6px_0_0_theme(colors.gray.400),0_10px_25px_theme(colors.gray.300/0.3)] active:translate-y-0.5 active:scale-95 dark:shadow-[0_4px_0_0_theme(colors.gray.600),0_8px_20px_theme(colors.gray.700/0.25)] dark:hover:bg-gray-800"
                          >
                            {isImporting ? "Importing..." : "Import Data"}
                          </Button>
                        </motion.div>

                        <p className="mt-4 max-w-2xl text-sm text-gray-500">
                          Export downloads a JSON backup. Import loads that same
                          file back into your local data so you can sign in and
                          sync it to the cloud on MySATPrep.fun.
                        </p>

                        {message && (
                          <div
                            className={`mt-5 w-full max-w-2xl rounded-md px-4 py-3 text-sm ${
                              message.type === "success"
                                ? "bg-green-100 text-green-800 dark:bg-green-950/40 dark:text-green-200"
                                : "bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-200"
                            }`}
                          >
                            {message.text}
                          </div>
                        )}

                        <input
                          ref={fileInputRef}
                          type="file"
                          accept=".json"
                          onChange={handleFileSelect}
                          className="hidden"
                          aria-label="Import backup file"
                        />
                      </div>
                    </motion.div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        </WarpBackground>
      </main>
    </>
  );
}
