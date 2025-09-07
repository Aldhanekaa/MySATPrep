import { DomainItems, SkillCd_Variants } from "./lookup";

export type QuestionDifficulty = "E" | "M" | "H";
export type ProgramType = "SAT" | "P10" | "P89";

export type MultipleChoiceDisclosedQuestion = {
  answer: {
    choices: {
      [key in "a" | "b" | "c" | "d"]: { body: string };
    };
    correct_choice: keyof MultipleChoiceDisclosedQuestion["answer"]["choices"];
    rationale: string;
    style: "Multiple Choice";
  };
  item_id: string;
  prompt: string;
  section: string;
};

export type SPRDisclosedQuestion = {
  answer: {
    rationale: string;
    style: "SPR";
  };
  item_id: string;
  prompt: string;
  section: string;
};

export type ExternalID_ResponseQuestion = {
  answerOptions: Array<{ content: string; id: string }>;

  correct_answer: string[];
  keys: string[];
  externalid: string;
  rationale: string;
  stem: string;
  type: "mcq" | "spr";
};

export type API_Response_Question = {
  answerOptions?: {
    [key in "a" | "b" | "c" | "d"]: string;
  };
  correct_answer: string[];
  rationale: string;
  stem: string;
  type: "mcq" | "spr";

  externalid?: string;
  ibn?: null | string;
};

export type API_Response_Question_List = Array<{
  updateDate: number;
  pPcc: string;
  questionId: string;
  skill_cd: SkillCd_Variants;
  score_band_range_cd: number;
  uId: string;
  skill_desc: string;
  createDate: number;
  program: string;
  primary_class_cd_desc: string;
  ibn: null | string;
  external_id: null | string;
  primary_class_cd: DomainItems;
  difficulty: QuestionDifficulty;
}>;
