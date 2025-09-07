export type StateOfferings = [
  {
    stateCd: "AR";
    name: "Arkansas";
  },
  {
    stateCd: "CA";
    name: "California";
  },
  {
    stateCd: "CO";
    name: "Colorado";
  },
  {
    stateCd: "CT";
    name: "Connecticut";
  },
  {
    stateCd: "DE";
    name: "Delaware";
  },
  {
    stateCd: "DC";
    name: "District of Columbia";
  },
  {
    stateCd: "DD";
    name: "DoDEA";
  },
  {
    stateCd: "FL";
    name: "Florida";
  },
  {
    stateCd: "GA";
    name: "Georgia";
  },
  {
    stateCd: "ID";
    name: "Idaho";
  },
  {
    stateCd: "IL";
    name: "Illinois";
  },
  {
    stateCd: "IN";
    name: "Indiana";
  },
  {
    stateCd: "KY";
    name: "Kentucky";
  },
  {
    stateCd: "MI";
    name: "Michigan";
  },
  {
    stateCd: "NV";
    name: "Nevada";
  },
  {
    stateCd: "NH";
    name: "New Hampshire";
  },
  {
    stateCd: "NJ";
    name: "New Jersey";
  },
  {
    stateCd: "NM";
    name: "New Mexico";
  },
  {
    stateCd: "NY";
    name: "New York";
  },
  {
    stateCd: "NC";
    name: "North Carolina";
  },
  {
    stateCd: "OH";
    name: "Ohio";
  },
  {
    stateCd: "OK";
    name: "Oklahoma";
  },
  {
    stateCd: "PA";
    name: "Pennsylvania";
  },
  {
    stateCd: "RI";
    name: "Rhode Island";
  },
  {
    stateCd: "SC";
    name: "South Carolina";
  },
  {
    stateCd: "TN";
    name: "Tennessee";
  },
  {
    stateCd: "TX";
    name: "Texas";
  },
  {
    stateCd: "VA";
    name: "Virginia";
  },
  {
    stateCd: "WV";
    name: "West Virginia";
  }
];

export type DomainItems =
  | "INI"
  | "CAS"
  | "EOI"
  | "SEC" // Reading & Writing domains
  | "H"
  | "P"
  | "Q"
  | "S"; // Math domains

export const DomainItemsArray = [
  "INI",
  "CAS",
  "EOI",
  "SEC",
  "H",
  "P",
  "Q",
  "S",
];

export type SkillCd_Variants =
  | "CID"
  | "INF"
  | "COE"
  | "WIC"
  | "TSP"
  | "CTC"
  | "SYN"
  | "TRA"
  | "BOU"
  | "FSS"
  | "H.A."
  | "H.B."
  | "H.C."
  | "H.D."
  | "H.E."
  | "P.C."
  | "P.B."
  | "P.A."
  | "Q.A."
  | "Q.B."
  | "Q.D."
  | "Q.E."
  | "Q.F."
  | "Q.G."
  | "S.A."
  | "S.B."
  | "S.C."
  | "S.D.";

export type SkillDesc =
  | "Central Ideas and Details"
  | "Inferences"
  | "Command of Evidence"
  | "Words in Context"
  | "Text Structure and Purpose"
  | "Cross-Text Connections"
  | "Rhetorical Synthesis"
  | "Transitions"
  | "Boundaries"
  | "Form, Structure, and Sense"
  | "Linear equations in one variable"
  | "Linear functions"
  | "Linear equations in two variables"
  | "Systems of two linear equations in two variables"
  | "Linear inequalities in one or two variables"
  | "Nonlinear functions"
  | "Nonlinear equations in one variable and systems of equations in two variables"
  | "Equivalent expressions"
  | "Ratios, rates, proportional relationships, and units"
  | "Percentages"
  | "One-variable data: Distributions and measures of center and spread"
  | "Two-variable data: Models and scatterplots"
  | "Probability and conditional probability"
  | "Inference from sample statistics and margin of error"
  | "Evaluating statistical claims: Observational studies and experiments"
  | "Area and volume"
  | "Lines, angles, and triangles"
  | "Right triangles and trigonometry"
  | "Circles";

export const LookupDomainData = {
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
        },
        {
          text: "One-variable data: Distributions and measures of center and spread",
          id: "11",
          skill_cd: "Q.B.",
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

export type LookupRequest = {
  lookupData: {
    assessment: [
      {
        text: "SAT" | "PSAT/NMSQT & PSAT 10" | "PSAT 8/9";
        id: number;
      }
    ];
    test: [
      {
        text: "Reading and Writing";
        id: "1";
      },
      {
        text: "Math";
        id: "2";
      }
    ];
    domain: {
      "R&W": [
        {
          text: "Information and Ideas";
          id: "1";
          primaryClassCd: "INI";
          skill: [
            {
              text: "Central Ideas and Details";
              id: "1";
            },
            {
              text: "Inferences";
              id: "2";
            },
            {
              text: "Command of Evidence";
              id: "3";
            }
          ];
        },
        {
          text: "Craft and Structure";
          id: "2";
          primaryClassCd: "CAS";
          skill: [
            {
              text: "Words in Context";
              id: "5";
            },
            {
              text: "Text Structure and Purpose";
              id: "6";
            },
            {
              text: "Cross-Text Connections";
              id: "7";
            }
          ];
        },
        {
          text: "Expression of Ideas";
          id: "3";
          primaryClassCd: "EOI";
          skill: [
            {
              text: "Rhetorical Synthesis";
              id: "8";
            },
            {
              text: "Transitions";
              id: "9";
            }
          ];
        },
        {
          text: "Standard English Conventions";
          id: "4";
          primaryClassCd: "SEC";
          skill: [
            {
              text: "Boundaries";
              id: "10";
            },
            {
              text: "Form, Structure, and Sense";
              id: "11";
            }
          ];
        }
      ];
      Math: [
        {
          text: "Algebra";
          id: "1";
          primaryClassCd: "H";
          skill: [
            {
              text: "Linear equations in one variable";
              id: "1";
            },
            {
              text: "Linear functions";
              id: "2";
            },
            {
              text: "Linear equations in two variables";
              id: "3";
            },
            {
              text: "Systems of two linear equations in two variables";
              id: "4";
            },
            {
              text: "Linear inequalities in one or two variables";
              id: "5";
            }
          ];
        },
        {
          text: "Advanced Math";
          id: "2";
          primaryClassCd: "P";
          skill: [
            {
              text: "Nonlinear functions";
              id: "6";
            },
            {
              text: "Nonlinear equations in one variable and systems of equations in two variables";
              id: "7";
            },
            {
              text: "Equivalent expressions";
              id: "8";
            }
          ];
        },
        {
          text: "Problem-Solving and Data Analysis";
          id: "3";
          primaryClassCd: "Q";
          skill: [
            {
              text: "Ratios, rates, proportional relationships, and units";
              id: "9";
            },
            {
              text: "Percentages";
              id: "10";
            },
            {
              text: "One-variable data: Distributions and measures of center and spread";
              id: "11";
            },
            {
              text: "Two-variable data: Models and scatterplots";
              id: "12";
            },
            {
              text: "Probability and conditional probability";
              id: "13";
            },
            {
              text: "Inference from sample statistics and margin of error";
              id: "14";
            },
            {
              text: "Evaluating statistical claims: Observational studies and experiments";
              id: "15";
            }
          ];
        },
        {
          text: "Geometry and Trigonometry";
          id: "4";
          primaryClassCd: "S";
          skill: [
            {
              text: "Area and volume";
              id: "16";
            },
            {
              text: "Lines, angles, and triangles";
              id: "17";
            },
            {
              text: "Right triangles and trigonometry";
              id: "18";
            },
            {
              text: "Circles";
              id: "19";
            }
          ];
        }
      ];
    };
  };

  mathLiveItems: string[];
  readingLiveItems: string[];

  stateOfferings: StateOfferings;
};

export type LookupResponseData = {
  lookupData: {
    assessment: [
      {
        text: "SAT" | "PSAT/NMSQT & PSAT 10" | "PSAT 8/9";
        id: number;
      }
    ];
    test: [
      {
        text: "Reading and Writing";
        id: "1";
      },
      {
        text: "Math";
        id: "2";
      }
    ];
    domain: typeof LookupDomainData;
  };

  mathLiveItems: string[];
  readingLiveItems: string[];

  stateOfferings: StateOfferings;
};
