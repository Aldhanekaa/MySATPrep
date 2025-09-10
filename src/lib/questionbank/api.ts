import { QuestionById_Data } from "@/types/question";

// Fetch question data from API (memoized)
export const fetchQuestionData = async (
  questionId: string
): Promise<QuestionById_Data | null> => {
  try {
    const response = await fetch(`/api/question-by-id/${questionId}`);

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
