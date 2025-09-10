"use client";

import { motion } from "framer-motion";
import React from "react";
import { AuroraBackground } from "@/components/ui/aurora-background";
import { QB_MainHero } from "@/components/questionbank/main-hero";
import { SiteHeader } from "../navbar";

export default function AuroraBackgroundDemo() {
  return (
    <React.Fragment>
      <SiteHeader />
      <QB_MainHero />
    </React.Fragment>
  );
}
