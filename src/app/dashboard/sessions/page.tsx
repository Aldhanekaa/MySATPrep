"use client";
import { SessionsTab } from "@/components/dashboard";

export default function SessionsPage() {
  return (
    <section className="space-y-4 max-w-4xl lg:max-w-5xl xl:max-w-7xl w-full mx-auto px-3 py-10 ">
      <SessionsTab />
    </section>
  );
}
