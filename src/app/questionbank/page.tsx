"use client";

import { motion } from "framer-motion";
import React, { Suspense } from "react";
import { AuroraBackground } from "@/components/ui/aurora-background";
import { QB_MainHero } from "@/components/questionbank/main-hero";
import { SiteHeader } from "../navbar";
import FooterSection from "@/components/footer";
import { LoadingFallback } from "@/components/ui/loading";

export default function AuroraBackgroundDemo() {
  return (
    <React.Fragment>
      <SiteHeader />
      <Suspense fallback={<LoadingFallback />}>
        <QB_MainHero />
      </Suspense>

      <FooterSection />
    </React.Fragment>
  );
}
