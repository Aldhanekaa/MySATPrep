"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useDispatch } from "react-redux";
import { useAppSelector } from "@/lib/redux/hooks";
import { selectIsAuthenticated, selectUser } from "@/lib/redux/selectors";
import { logout } from "@/lib/redux/slices/authSlice";
import { clearUserData } from "@/lib/redux/slices/userDataSlice";
import type { AppDispatch } from "@/lib/redux/store";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  ShieldAlertIcon,
  UserIcon,
  TrashIcon,
  MailIcon,
  AlertTriangleIcon,
  CalendarIcon,
} from "lucide-react";
// ─── Confirmation phrase the user must type before deletion ─────────────────
const CONFIRM_PHRASE = "delete my account";

// ─── Data that will be removed (shown to user) ────────────────────────────────
const DATA_ITEMS = [
  "Practice sessions and history",
  "Saved / bookmarked questions",
  "Saved question collections",
  "Practice statistics and XP",
  "Vocabulary progress",
  "Question notes and answer history",
  "Account preferences",
  "Sign-in credentials and sessions",
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AccountPage() {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const user = useAppSelector(selectUser);

  const [confirmInput, setConfirmInput] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const confirmMatch = confirmInput.toLowerCase().trim() === CONFIRM_PHRASE;

  const handleDeleteAccount = async () => {
    if (!confirmMatch) return;

    setIsDeleting(true);
    setError(null);

    try {
      const response = await fetch("/api/user/account", {
        method: "DELETE",
        credentials: "include",
      });

      // Parse JSON only when present and when content-type is JSON.
      let data: any = undefined;
      const contentType = response.headers.get("content-type") ?? "";
      if (contentType.includes("application/json")) {
        try {
          data = await response.json();
        } catch {
          data = undefined;
        }
      }

      // Handle HTTP error responses first (may have no JSON body)
      if (!response.ok) {
        const errMsg =
          data?.error ?? "Failed to delete account. Please try again.";
        setError(errMsg);
        setIsDeleting(false);
        return;
      }

      // If server returned JSON but indicated failure, surface the error
      if (data && data.success === false) {
        setError(data.error ?? "Failed to delete account. Please try again.");
        setIsDeleting(false);
        return;
      }

      // Sign out via Redux thunk to clear cookie + Redux state
      await dispatch(logout());
      dispatch(clearUserData());

      // Clear any local storage data the app may have stored
      if (typeof window !== "undefined") {
        localStorage.clear();
        sessionStorage.clear();
      }

      // Redirect to home page
      router.push("/");
      router.refresh();
    } catch {
      setError("An unexpected error occurred. Please try again.");
      setIsDeleting(false);
    }
  };

  // ── Not authenticated ──────────────────────────────────────────────────────
  if (!isAuthenticated || !user) {
    return (
      <section className="space-y-6 max-w-4xl lg:max-w-5xl xl:max-w-7xl w-full mx-auto px-3 py-10">
        <div>
          <h1 className="text-2xl font-bold">Account</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage your account settings.
          </p>
        </div>
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            <UserIcon className="mx-auto mb-3 h-8 w-8 opacity-40" />
            <p>Sign in to manage your account.</p>
          </CardContent>
        </Card>
      </section>
    );
  }

  return (
    <section className="space-y-6 max-w-4xl lg:max-w-5xl xl:max-w-7xl w-full mx-auto px-3 py-10">
      <div>
        <h1 className="text-2xl font-bold">Account</h1>
        <p className="text-muted-foreground text-sm mt-1">
          View your account details and manage account data.
        </p>
      </div>

      {/* ── Account info ────────────────────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <UserIcon className="h-4 w-4" aria-hidden="true" />
            Account Info
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3 text-sm">
            <MailIcon
              className="h-4 w-4 shrink-0 text-muted-foreground"
              aria-hidden="true"
            />
            <span className="text-muted-foreground">Email</span>
            <span className="font-medium ml-auto">{user.email}</span>
          </div>
          <Separator />
          <div className="flex items-center gap-3 text-sm">
            <UserIcon
              className="h-4 w-4 shrink-0 text-muted-foreground"
              aria-hidden="true"
            />
            <span className="text-muted-foreground">Name</span>
            <span className="font-medium ml-auto">{user.name ?? "—"}</span>
          </div>
          {user.createdAt && (
            <>
              <Separator />
              <div className="flex items-center gap-3 text-sm">
                <CalendarIcon
                  className="h-4 w-4 shrink-0 text-muted-foreground"
                  aria-hidden="true"
                />
                <span className="text-muted-foreground">Member since</span>
                <span className="font-medium ml-auto">
                  {new Date(user.createdAt).toLocaleDateString(undefined, {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </span>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* ── Danger zone ─────────────────────────────────────────────────────── */}
      <Card className="border-destructive/50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base text-destructive">
            <ShieldAlertIcon className="h-4 w-4" aria-hidden="true" />
            Danger Zone
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-medium text-sm">Delete Account</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Permanently remove your account and all associated data. This
                cannot be undone.
              </p>
            </div>
            <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <AlertDialogTrigger asChild>
                <Button
                  variant="destructive"
                  size="sm"
                  className="shrink-0 sm:ml-4"
                  aria-label="Open delete account dialog"
                >
                  <TrashIcon className="mr-2 h-4 w-4" aria-hidden="true" />
                  Delete Account
                </Button>
              </AlertDialogTrigger>

              <AlertDialogContent className="max-w-lg">
                <AlertDialogHeader>
                  <AlertDialogTitle className="flex items-center gap-2 text-destructive">
                    <AlertTriangleIcon className="h-5 w-5" aria-hidden="true" />
                    Delete your account permanently?
                  </AlertDialogTitle>
                  <AlertDialogDescription asChild>
                    <div className="space-y-4 text-sm text-muted-foreground">
                      <p>
                        This will immediately and permanently delete your
                        account and <strong>all data associated with it</strong>
                        . There is no way to recover this data afterwards.
                      </p>

                      {/* Data list */}
                      <div className="rounded-lg border bg-muted/50 p-3 space-y-1.5">
                        <p className="font-medium text-foreground text-xs uppercase tracking-wide">
                          Data that will be deleted
                        </p>
                        <ul className="space-y-1">
                          {DATA_ITEMS.map((item) => (
                            <li
                              key={item}
                              className="flex items-center gap-2 text-xs"
                            >
                              <span className="h-1 w-1 rounded-full bg-destructive shrink-0" />
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Error */}
                      {error && (
                        <Alert variant="destructive">
                          <AlertDescription>{error}</AlertDescription>
                        </Alert>
                      )}

                      {/* Confirmation input */}
                      <div className="space-y-2">
                        <Label
                          htmlFor="confirm-input"
                          className="text-foreground"
                        >
                          To confirm, type{" "}
                          <Badge
                            variant="secondary"
                            className="font-mono text-xs"
                          >
                            {CONFIRM_PHRASE}
                          </Badge>{" "}
                          below:
                        </Label>
                        <Input
                          id="confirm-input"
                          value={confirmInput}
                          onChange={(e) => setConfirmInput(e.target.value)}
                          placeholder={CONFIRM_PHRASE}
                          className="font-mono text-sm"
                          autoComplete="off"
                          aria-describedby="confirm-hint"
                        />
                        <p
                          id="confirm-hint"
                          className="text-xs text-muted-foreground"
                        >
                          This action is irreversible.
                        </p>
                      </div>
                    </div>
                  </AlertDialogDescription>
                </AlertDialogHeader>

                <AlertDialogFooter>
                  <AlertDialogCancel
                    onClick={() => {
                      setConfirmInput("");
                      setError(null);
                    }}
                    disabled={isDeleting}
                  >
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={(e) => {
                      e.preventDefault();
                      handleDeleteAccount();
                    }}
                    disabled={!confirmMatch || isDeleting}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90 focus-visible:ring-destructive disabled:opacity-40"
                    aria-disabled={!confirmMatch || isDeleting}
                  >
                    {isDeleting ? (
                      <>
                        <span
                          className="mr-2 inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent"
                          aria-hidden="true"
                        />
                        Deleting…
                      </>
                    ) : (
                      <>
                        <TrashIcon
                          className="mr-2 h-4 w-4"
                          aria-hidden="true"
                        />
                        Yes, delete my account
                      </>
                    )}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
