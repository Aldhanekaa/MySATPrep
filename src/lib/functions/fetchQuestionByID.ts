import { API_Response_Question, QuestionById_Data } from "@/types";

export const FetchQuestionByID = async (
  questionId: string
): Promise<API_Response_Question | null> => {
  try {
    // either externalId or ibn
    const response = await fetch(`/api/question/${questionId}`);

    if (!response.ok) {
      throw new Error(`Failed to fetch question: ${response.status}`);
    }

    const result = await response.json();

    if (result.success && result.data) {
      return result.data;
    } else {
      throw new Error(result.message || "Failed to fetch question data");
    }
  } catch (error) {
    console.error(`Error fetching question ${questionId}:`, error);
    throw error;
  }
};
