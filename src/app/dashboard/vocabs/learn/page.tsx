import LearnVocab from "@/components/dashboard/vocabs/learn";

import { Banner } from "@/components/ui/banner-v2";
import { MessageCircleWarningIcon } from "lucide-react";
import React from "react";

function PageBanner() {
  return (
    <Banner variant={"default"} className="dark text-foreground">
      <div className="w-full">
        <p className="flex items-center justify-center text-sm">
          <MessageCircleWarningIcon
            className="-mt-0.5 me-3 inline-flex opacity-60"
            size={16}
            strokeWidth={2}
            aria-hidden="true"
          />
          You should submit a sentence for each vocabulary so that you save your
          progress.
        </p>
      </div>
    </Banner>
  );
}

export default function VocabsPage() {
  return (
    <React.Fragment>
      <PageBanner />
      <section className="space-y-4 max-w-full lg:max-w-2xl w-full mx-auto px-3 py-10 ">
        <LearnVocab />
      </section>
    </React.Fragment>
  );
}
