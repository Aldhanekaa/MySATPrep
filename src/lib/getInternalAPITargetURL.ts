/**
 * Resolves the internal API base URL for server-side fetch calls.
 *
 * Set NEXT_PUBLIC_URL in your environment to the deployment's origin:
 *   - Local:      http://localhost:3000
 *   - Cloudflare: https://your-worker.workers.dev  (or custom domain)
 *   - Vercel:     https://your-app.vercel.app
 *
 * Without this variable the Worker has no reliable way to know its own
 * public URL at runtime, so we throw early rather than silently using
 * a localhost fallback that would break in production.
 */
export default function getInternalAPITargetURL(): string {
  const url = process.env.NEXT_PUBLIC_URL;

  if (!url) {
    if (process.env.NODE_ENV === "development") {
      return "http://localhost:3000";
    }
    throw new Error(
      "NEXT_PUBLIC_URL is not set. " +
        "Add it to your environment variables (Cloudflare Worker secrets/vars or .env).",
    );
  }

  // Strip trailing slash for consistent concatenation
  return url.replace(/\/$/, "");
}
