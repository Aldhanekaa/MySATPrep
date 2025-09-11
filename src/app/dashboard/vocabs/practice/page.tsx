import VocabsPracticePage_Main from "@/components/dashboard/vocabs/practice/practice";
import { PracticeBanner } from "@/components/dashboard/vocabs/practice/practice-banner";
import React from "react";

export default function VocabsPracticePage() {
  return (
    <React.Fragment>
      <PracticeBanner />
      <section className="space-y-4 max-w-full lg:max-w-2xl w-full mx-auto px-3 py-10 ">
        <VocabsPracticePage_Main />
      </section>
    </React.Fragment>
  );
}
