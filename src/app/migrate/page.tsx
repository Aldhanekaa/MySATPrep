import type { Metadata } from "next";
import React from "react";

import { MigrateHeroSection } from "@/components/migrate/migrate-hero";

export const metadata: Metadata = {
	title: "Migrate Your SAT Prep Data - MySATPrep",
	description:
		"Continue your SAT prep on MySATPrep with a simple migration experience for saved progress and practice history.",
	alternates: {
		canonical: "https://www.mysatprep.fun/migrate",
	},
};

export default function MigratePageComponent() {
	return <MigrateHeroSection />;
}
