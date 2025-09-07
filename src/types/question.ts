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
