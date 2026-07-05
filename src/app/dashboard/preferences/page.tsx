"use client";

import React, { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks";
import {
  selectUserPreferences,
  selectIsAuthenticated,
} from "@/lib/redux/selectors";
import { debouncedSavePreferences } from "@/lib/utils/dataSync";
import { updatePreferences } from "@/lib/redux/slices/userDataSlice";
import type { UserPreferences } from "@/lib/types/userData";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import {
  SunIcon,
  MoonIcon,
  CloudIcon,
  HardDriveIcon,
  GraduationCapIcon,
  CheckIcon,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type Theme = "light" | "dark";
type DataMode = "localstorage" | "cloud";
type Assessment = "SAT" | "PSAT/NMSQT" | "PSAT";

// ─── Option card component ────────────────────────────────────────────────────

interface OptionCardProps {
  value: string;
  selected: boolean;
  icon: React.ReactNode;
  label: string;
  description: string;
  badge?: string;
  onSelect: (value: string) => void;
}

function OptionCard({
  value,
  selected,
  icon,
  label,
  description,
  badge,
  onSelect,
}: OptionCardProps) {
  return (
    <button
      type="button"
      onClick={() => onSelect(value)}
      className={`relative flex flex-col items-start gap-2 rounded-xl border-2 p-4 text-left transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
        selected
          ? "border-primary bg-primary/5"
          : "border-border bg-card hover:border-primary/40 hover:bg-accent/50"
      }`}
      aria-pressed={selected}
    >
      {selected && (
        <span className="absolute top-3 right-3 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <CheckIcon className="h-3 w-3" aria-hidden="true" />
        </span>
      )}
      <div className="flex items-center gap-2">
        <span
          className={`flex h-8 w-8 items-center justify-center rounded-lg ${
            selected
              ? "bg-primary/10 text-primary"
              : "bg-muted text-muted-foreground"
          }`}
          aria-hidden="true"
        >
          {icon}
        </span>
        <span className="font-medium text-sm">{label}</span>
        {badge && (
          <Badge variant="secondary" className="text-xs">
            {badge}
          </Badge>
        )}
      </div>
      <p className="text-xs text-muted-foreground">{description}</p>
    </button>
  );
}

// ─── Section wrapper ──────────────────────────────────────────────────────────

function PreferenceSection({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-base font-semibold">{title}</h2>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      {children}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PreferencesPage() {
  const dispatch = useAppDispatch();
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const reduxPrefs = useAppSelector(selectUserPreferences);
  const reduxState = useAppSelector((s) => s);

  // Resolve initial values — Redux for authenticated users, localStorage otherwise
  const resolveInitial = <T extends string>(
    key: keyof UserPreferences,
    fallback: T,
  ): T => {
    if (reduxPrefs?.[key] !== undefined) return reduxPrefs[key] as T;
    if (!isAuthenticated) {
      // Only read localStorage for unauthenticated users
      if (typeof window !== "undefined") {
        try {
          const raw = localStorage.getItem("userPreferences");
          if (raw) {
            const parsed: UserPreferences = JSON.parse(raw);
            if (parsed[key] !== undefined) return parsed[key] as T;
          }
        } catch {
          // ignore
        }
      }
    }
    return fallback;
  };

  const [theme, setTheme] = useState<Theme>(() =>
    resolveInitial<Theme>("theme", "light"),
  );
  const [dataMode, setDataMode] = useState<DataMode>(() =>
    resolveInitial<DataMode>("data_mode_priority", "cloud"),
  );
  const [assessment, setAssessment] = useState<Assessment>(() =>
    resolveInitial<Assessment>("assessment", "SAT"),
  );

  // Sync from Redux when it loads (e.g. after auth)
  useEffect(() => {
    if (!reduxPrefs) return;
    if (reduxPrefs.theme) setTheme(reduxPrefs.theme);
    if (reduxPrefs.data_mode_priority)
      setDataMode(reduxPrefs.data_mode_priority);
    if (reduxPrefs.assessment) setAssessment(reduxPrefs.assessment);
  }, [reduxPrefs]);

  // Apply theme to <html> element
  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [theme]);

  // Persist on change
  const persist = (patch: Partial<UserPreferences>) => {
    const next: UserPreferences = {
      ...reduxPrefs,
      theme,
      data_mode_priority: dataMode,
      assessment,
      ...patch,
    };
    dispatch(updatePreferences(next));
    debouncedSavePreferences(next, dispatch, reduxState);
  };

  const handleThemeChange = (value: string) => {
    const t = value as Theme;
    setTheme(t);
    persist({ theme: t });
  };

  const handleDataModeChange = (value: string) => {
    const d = value as DataMode;
    setDataMode(d);
    persist({ data_mode_priority: d });
  };

  const handleAssessmentChange = (value: string) => {
    const a = value as Assessment;
    setAssessment(a);
    persist({ assessment: a });
  };

  return (
    <section className="space-y-6 max-w-4xl lg:max-w-5xl xl:max-w-7xl w-full mx-auto px-3 py-10">
      <div>
        <h1 className="text-2xl font-bold">Preferences</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Customize your experience. Changes are saved automatically.
          {!isAuthenticated && (
            <span className="text-yellow-600 dark:text-yellow-400">
              {" "}
              Sign in to sync preferences across devices.
            </span>
          )}
        </p>
      </div>

      <Card>
        <CardContent className="divide-y divide-border p-0">
          {/* ── Appearance ── */}
          <div className="p-6">
            <PreferenceSection
              title="Appearance"
              description="Choose how the interface looks to you."
            >
              <RadioGroup
                value={theme}
                onValueChange={handleThemeChange}
                className="grid grid-cols-1 gap-3 sm:grid-cols-2"
                aria-label="Theme"
              >
                <div>
                  <RadioGroupItem
                    value="light"
                    id="theme-light"
                    className="sr-only"
                  />
                  <OptionCard
                    value="light"
                    selected={theme === "light"}
                    icon={<SunIcon className="h-4 w-4" />}
                    label="Light"
                    description="Bright interface, best for well-lit environments."
                    onSelect={handleThemeChange}
                  />
                </div>
                <div>
                  <RadioGroupItem
                    value="dark"
                    id="theme-dark"
                    className="sr-only"
                  />
                  <OptionCard
                    value="dark"
                    selected={theme === "dark"}
                    icon={<MoonIcon className="h-4 w-4" />}
                    label="Dark"
                    description="Easier on the eyes in low-light conditions."
                    onSelect={handleThemeChange}
                  />
                </div>
              </RadioGroup>
            </PreferenceSection>
          </div>

          {/* ── Data Mode (authenticated users only) ── */}
          {isAuthenticated && (
            <div className="p-6">
              <PreferenceSection
                title="Data Storage Priority"
                description="Where your progress data is primarily stored and read from."
              >
                <RadioGroup
                  value={dataMode}
                  onValueChange={handleDataModeChange}
                  className="grid grid-cols-1 gap-3 sm:grid-cols-2"
                  aria-label="Data storage priority"
                >
                  <div>
                    <RadioGroupItem
                      value="cloud"
                      id="mode-cloud"
                      className="sr-only"
                    />
                    <OptionCard
                      value="cloud"
                      selected={dataMode === "cloud"}
                      icon={<CloudIcon className="h-4 w-4" />}
                      label="Cloud"
                      description="Sync your data to the cloud. Requires sign-in."
                      badge="Recommended"
                      onSelect={handleDataModeChange}
                    />
                  </div>
                  <div>
                    <RadioGroupItem
                      value="localstorage"
                      id="mode-local"
                      className="sr-only"
                    />
                    <OptionCard
                      value="localstorage"
                      selected={dataMode === "localstorage"}
                      icon={<HardDriveIcon className="h-4 w-4" />}
                      label="Local Storage"
                      description="Keep data on this device only. Works offline, no account needed."
                      onSelect={handleDataModeChange}
                    />
                  </div>
                </RadioGroup>
              </PreferenceSection>
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
