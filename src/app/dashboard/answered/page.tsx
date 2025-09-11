"use client";
import { AnsweredTab } from "@/components/dashboard";
import { useAssessment } from "@/contexts/assessment-context";

export default function SessionsPage() {
  const { state } = useAssessment();

  return (
    <section className="space-y-4 max-w-4xl lg:max-w-5xl xl:max-w-7xl w-full mx-auto px-3 py-10 ">
      <AnsweredTab selectedAssessment={state.selectedAssessment} />
    </section>
  );
}
