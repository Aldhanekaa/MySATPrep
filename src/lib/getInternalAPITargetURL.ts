export default function getInternalAPITargetURL() {
  const targetUrl = `${
    process.env.NEXT_PUBLIC_URL
      ? process.env.NEXT_PUBLIC_URL
      : process.env.NEXT_PUBLIC_VERCEL_ENV !== "production"
        ? `${
            process.env.VERCEL_BRANCH_URL
              ? `https://${process.env.VERCEL_BRANCH_URL}`
              : "http://localhost:3000"
          }`
        : `${
            process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL
              ? `https://${process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL}`
              : "http://localhost:3000"
          }`
  }`;
  return targetUrl;
}
