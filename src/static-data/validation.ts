import { SkillCd_Variants } from "@/types/lookup";

// Valid skill codes for all subjects
export const validSkillCds: SkillCd_Variants[] = [
  "CID",
  "INF",
  "COE",
  "WIC",
  "TSP",
  "CTC",
  "SYN",
  "TRA",
  "BOU",
  "FSS",
  "H.A.",
  "H.B.",
  "H.C.",
  "H.D.",
  "H.E.",
  "P.C.",
  "P.B.",
  "P.A.",
  "Q.A.",
  "Q.B.",
  "Q.C.",
  "Q.D.",
  "Q.E.",
  "Q.F.",
  "Q.G.",
  "S.A.",
  "S.B.",
  "S.C.",
  "S.D.",
];

// Math domain IDs
export const mathDomains = ["H", "P", "Q", "S"];

// Reading & Writing domain IDs
export const rwDomains = ["INI", "CAS", "EOI", "SEC"];

// Math skill code prefixes
export const mathSkillPrefixes = ["H.", "P.", "Q.", "S."];

// Reading & Writing skill codes
export const rwSkillCds = [
  "CID",
  "INF",
  "COE",
  "WIC",
  "TSP",
  "CTC",
  "SYN",
  "TRA",
  "BOU",
  "FSS",
];

// Valid subjects
export const validSubjects = ["math", "reading-writing"];

// Valid practice types
export const validPracticeTypes = ["rush", "full-length"];
