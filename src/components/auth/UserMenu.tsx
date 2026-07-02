"use client";

/**
 * UserMenu component
 *
 * Displays an avatar button that opens a dropdown showing the authenticated
 * user's name and email, plus a logout option.
 *
 * Validates: Requirement 16.3, 19.2
 */

import { memo, useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "sonner";
import type { AppDispatch } from "@/lib/redux/store";
import { selectUser, selectAuthLoading } from "@/lib/redux/selectors";
import { logout } from "@/lib/redux/slices/authSlice";
import { clearUserData } from "@/lib/redux/slices/userDataSlice";

// ─── Props ────────────────────────────────────────────────────────────────────

export interface UserMenuProps {
  /** Additional CSS classes for the root element */
  className?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Returns a two-character initials string from a display name or email. */
function getInitials(name: string | null, email: string): string {
  if (name) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }
  return email.slice(0, 2).toUpperCase();
}

// ─── Component ────────────────────────────────────────────────────────────────

export const UserMenu = memo(function UserMenu({
  className = "",
}: UserMenuProps) {
  const dispatch = useDispatch<AppDispatch>();
  const user = useSelector(selectUser);
  const loading = useSelector(selectAuthLoading);

  const router = useRouter();
  const [open, setOpen] = useState(false);
  const uid = useId();
  const menuId = `${uid}-menu`;
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // ── Close on outside click ───────────────────────────────────────────────
  useEffect(() => {
    if (!open) return;

    function handlePointerDown(e: PointerEvent) {
      if (
        triggerRef.current?.contains(e.target as Node) ||
        menuRef.current?.contains(e.target as Node)
      ) {
        return;
      }
      setOpen(false);
    }

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [open]);

  // ── Close on Escape ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!open) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  // Don't render if there's no authenticated user
  if (!user) return null;

  const initials = getInitials(user.name, user.email);
  const displayName = user.name ?? user.email;

  async function handleLogout() {
    setOpen(false);
    const result = await dispatch(logout());
    dispatch(clearUserData());
    if (logout.fulfilled.match(result)) {
      toast.success("You've been signed out.");
      router.push("/");
    }
  }

  return (
    <div className={["relative", className].filter(Boolean).join(" ")}>
      {/* Trigger button */}
      <button
        ref={triggerRef}
        type="button"
        id={`${uid}-trigger`}
        aria-haspopup="true"
        aria-expanded={open}
        aria-controls={menuId}
        aria-label={`User menu for ${displayName}`}
        onClick={() => setOpen((v) => !v)}
        className={[
          "flex h-9 w-9 items-center justify-center rounded-full",
          "bg-blue-600 text-sm font-semibold text-white",
          "transition-opacity hover:opacity-90 active:opacity-75",
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500",
          "dark:bg-blue-500",
        ].join(" ")}
      >
        {initials}
      </button>

      {/* Dropdown menu */}
      {open && (
        <div
          ref={menuRef}
          id={menuId}
          role="menu"
          aria-labelledby={`${uid}-trigger`}
          className={[
            "absolute right-0 mt-2 w-64 origin-top-right rounded-xl",
            "bg-white shadow-lg ring-1 ring-black/5 focus:outline-none",
            "dark:bg-gray-900 dark:ring-white/10",
          ].join(" ")}
        >
          {/* User info */}
          <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800">
            <p
              className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate"
              title={user.name ?? undefined}
            >
              {user.name ?? "—"}
            </p>
            <p
              className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5"
              title={user.email}
            >
              {user.email}
            </p>
          </div>

          {/* Menu items */}
          <div className="py-1">
            <button
              role="menuitem"
              type="button"
              onClick={handleLogout}
              disabled={loading}
              aria-busy={loading}
              className={[
                "flex w-full items-center gap-2 px-4 py-2 text-sm text-left",
                "text-gray-700 dark:text-gray-300",
                "hover:bg-gray-50 dark:hover:bg-gray-800",
                "focus-visible:bg-gray-50 dark:focus-visible:bg-gray-800 outline-none",
                "disabled:cursor-not-allowed disabled:opacity-60",
              ].join(" ")}
            >
              {loading ? (
                <svg
                  className="h-4 w-4 animate-spin shrink-0"
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-hidden="true"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                  />
                </svg>
              ) : (
                <svg
                  className="h-4 w-4 shrink-0"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  aria-hidden="true"
                >
                  <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
              )}
              {loading ? "Signing out…" : "Sign out"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
});
