import ResourceSection from "@/components/resources";
import React from "react";
import { SiteHeader } from "../navbar";

export default function Page() {
  return (
    <React.Fragment>
      <SiteHeader />;
      <ResourceSection />
    </React.Fragment>
  );
}
