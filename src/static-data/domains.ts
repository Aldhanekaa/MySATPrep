import { SkillCd_Variants } from "@/types/lookup";

export const skillCds: SkillCd_Variants[] = [
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
  "SYN",
];

export const domains = {
  "R&W": [
    {
      text: "Information and Ideas",
      id: "1",
      primaryClassCd: "INI",
      skill: [
        {
          text: "Central Ideas and Details",
          id: "1",
          skill_cd: "CID",
        },
        {
          text: "Inferences",
          id: "2",
          skill_cd: "INF",
        },
        {
          text: "Command of Evidence",
          id: "3",
          skill_cd: "COE",
        },
      ],
    },
    {
      text: "Craft and Structure",
      id: "2",
      primaryClassCd: "CAS",
      skill: [
        {
          text: "Words in Context",
          id: "5",
          skill_cd: "WIC",
        },
        {
          text: "Text Structure and Purpose",
          id: "6",
          skill_cd: "TSP",
        },
        {
          text: "Cross-Text Connections",
          id: "7",
          skill_cd: "CTC",
        },
      ],
    },
    {
      text: "Expression of Ideas",
      id: "3",
      primaryClassCd: "EOI",
      skill: [
        {
          text: "Rhetorical Synthesis",
          id: "8",
          skill_cd: "SYN",
        },
        {
          text: "Transitions",
          id: "9",
          skill_cd: "TRA",
        },
      ],
    },
    {
      text: "Standard English Conventions",
      id: "4",
      primaryClassCd: "SEC",
      skill: [
        {
          text: "Boundaries",
          id: "10",
          skill_cd: "BOU",
        },
        {
          text: "Form, Structure, and Sense",
          id: "11",
          skill_cd: "FSS",
        },
      ],
    },
  ],
  Math: [
    {
      text: "Algebra",
      id: "1",
      primaryClassCd: "H",
      skill: [
        {
          text: "Linear equations in one variable",
          id: "1",
          skill_cd: "H.A.",
        },
        {
          text: "Linear functions",
          id: "2",
          skill_cd: "H.B.",
        },
        {
          text: "Linear equations in two variables",
          id: "3",
          skill_cd: "H.C.",
        },
        {
          text: "Systems of two linear equations in two variables",
          id: "4",
          skill_cd: "H.D.",
        },
        {
          text: "Linear inequalities in one or two variables",
          id: "5",
          skill_cd: "H.E.",
        },
      ],
    },
    {
      text: "Advanced Math",
      id: "2",
      primaryClassCd: "P",
      skill: [
        {
          text: "Nonlinear functions",
          id: "6",
          skill_cd: "P.C.",
        },
        {
          text: "Nonlinear equations in one variable and systems of equations in two variables",
          id: "7",
          skill_cd: "P.B.",
        },
        {
          text: "Equivalent expressions",
          id: "8",
          skill_cd: "P.A.",
        },
      ],
    },
    {
      text: "Problem-Solving and Data Analysis",
      id: "3",
      primaryClassCd: "Q",
      skill: [
        {
          text: "Ratios, rates, proportional relationships, and units",
          id: "9",
          skill_cd: "Q.A.",
        },
        {
          text: "Percentages",
          id: "10",
          skill_cd: "Q.B.",
        },
        {
          text: "One-variable data: Distributions and measures of center and spread",
          id: "11",
          skill_cd: "Q.C.",
        },
        {
          text: "Two-variable data: Models and scatterplots",
          id: "12",
          skill_cd: "Q.D.",
        },
        {
          text: "Probability and conditional probability",
          id: "13",
          skill_cd: "Q.E.",
        },
        {
          text: "Inference from sample statistics and margin of error",
          id: "14",
          skill_cd: "Q.F.",
        },
        {
          text: "Evaluating statistical claims: Observational studies and experiments",
          id: "15",
          skill_cd: "Q.G.",
        },
      ],
    },
    {
      text: "Geometry and Trigonometry",
      id: "4",
      primaryClassCd: "S",
      skill: [
        {
          text: "Area and volume",
          id: "16",
          skill_cd: "S.A.",
        },
        {
          text: "Lines, angles, and triangles",
          id: "17",
          skill_cd: "S.B.",
        },
        {
          text: "Right triangles and trigonometry",
          id: "18",
          skill_cd: "S.C.",
        },
        {
          text: "Circles",
          id: "19",
          skill_cd: "S.D.",
        },
      ],
    },
  ],
};

// Dynamically build skillCdsObjectData from domains
export const skillCdsObjectData = (() => {
  const result: Record<string, { text: string; id: string; skill_cd: string }> =
    {};
  Object.values(domains).forEach((domainArr) => {
    domainArr.forEach((domain) => {
      domain.skill.forEach((skill) => {
        result[skill.skill_cd] = skill;
      });
    });
  });
  return result;
})();

// Dynamically build primaryClassCdObjectData from domains
export const primaryClassCdObjectData = (() => {
  const result: Record<
    string,
    {
      subject: string;
      text: string;
      id: string;
      primaryClassCd: string;
      skill: any[];
    }
  > = {};
  Object.entries(domains).forEach(([subject, domainArr]) => {
    domainArr.forEach((domain) => {
      result[domain.primaryClassCd] = { subject, ...domain };
    });
  });
  return result;
})();

// Returns the subject for a given skillCd (e.g., "CID", "H.A.")
export function getSubjectBySkillCd(skillCd: string): string | undefined {
  for (const [subject, domainArr] of Object.entries(domains)) {
    for (const domain of domainArr) {
      if (domain.skill.some((skill) => skill.skill_cd === skillCd)) {
        return subject == "R&W" ? "reading-writing" : "math";
      }
    }
  }
  return undefined;
}

// Returns the subject for a given primaryClassCd (e.g., "INI", "H")
export function getSubjectByPrimaryClassCd(
  primaryClassCd: string
): string | undefined {
  for (const [subject, domainArr] of Object.entries(domains)) {
    if (domainArr.some((domain) => domain.primaryClassCd === primaryClassCd)) {
      return subject == "R&W" ? "reading-writing" : "math";
    }
  }
  return undefined;
}
