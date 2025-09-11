import { QuestionDifficulty } from "@/types/question";
import { RangeValue } from "@/components/ui/calendar";
import { QuestionWithData, BluebookExternalIds } from "./types";
import { AnsweredQuestion } from "@/types/statistics";

// Helper function to check if a question has valid difficulty data
export const hasValidDifficulty = (question: QuestionWithData): boolean => {
  return question.difficulty && ["E", "M", "H"].includes(question.difficulty);
};

// Helper function to filter questions by difficulty
export const filterQuestionsByDifficulty = (
  questions: QuestionWithData[],
  selectedDifficulties: QuestionDifficulty[]
): QuestionWithData[] => {
  // Default behavior: show all questions when no difficulties are selected
  if (selectedDifficulties.length === 0) {
    return questions;
  }

  // Filter questions, gracefully handling missing difficulty data
  return questions.filter((question) => {
    // Handle questions with missing or invalid difficulty data
    if (!hasValidDifficulty(question)) {
      // Include questions with missing difficulty data when "Easy" is selected
      // This provides a fallback behavior for incomplete data and ensures
      // users can still access all content even with data quality issues
      return selectedDifficulties.includes("E");
    }

    // Standard filtering for questions with valid difficulty data
    return selectedDifficulties.includes(question.difficulty);
  });
};

// Helper function to filter questions by skills
export const filterQuestionsBySkills = (
  questions: QuestionWithData[],
  selectedSkills: string[]
): QuestionWithData[] => {
  // Default behavior: show all questions when no skills are selected
  if (selectedSkills.length === 0) {
    return questions;
  }

  // Filter questions by skill_cd
  return questions.filter((question) => {
    return selectedSkills.includes(question.skill_cd);
  });
};

// Helper function to filter out Bluebook questions
export const filterOutBluebookQuestions = (
  questions: QuestionWithData[],
  excludeBluebook: boolean,
  bluebookExternalIds?: BluebookExternalIds,
  selectedSubject?: string
): QuestionWithData[] => {
  // If not excluding Bluebook questions, return all questions
  if (!excludeBluebook || !bluebookExternalIds || !selectedSubject) {
    return questions;
  }

  // Get the relevant external IDs based on selected subject
  const relevantExternalIds =
    selectedSubject === "Math"
      ? bluebookExternalIds.mathLiveItems
      : bluebookExternalIds.readingLiveItems;

  // Filter out questions that have external IDs matching Bluebook external IDs
  return questions.filter((question) => {
    // If question has no external_id, keep it
    if (!question.external_id) {
      return true;
    }

    // Exclude if the question's external_id is in the Bluebook external IDs
    return !relevantExternalIds.includes(question.external_id);
  });
};

// Helper function to show only Bluebook questions
export const filterOnlyBluebookQuestions = (
  questions: QuestionWithData[],
  onlyBluebook: boolean,
  bluebookExternalIds?: BluebookExternalIds,
  selectedSubject?: string
): QuestionWithData[] => {
  // If not filtering for only Bluebook questions, return all questions
  if (!onlyBluebook || !bluebookExternalIds || !selectedSubject) {
    return questions;
  }

  // Get the relevant external IDs based on selected subject
  const relevantExternalIds =
    selectedSubject === "Math"
      ? bluebookExternalIds.mathLiveItems
      : bluebookExternalIds.readingLiveItems;

  // Show only questions that have external IDs matching Bluebook external IDs
  return questions.filter((question) => {
    // If question has no external_id, exclude it
    if (!question.external_id) {
      return false;
    }

    // Include only if the question's external_id is in the Bluebook external IDs
    return relevantExternalIds.includes(question.external_id);
  });
};

// Helper function to filter questions by date range
export const filterQuestionsByDateRange = (
  questions: QuestionWithData[],
  dateRange: RangeValue | null
): QuestionWithData[] => {
  // If no date range is selected, return all questions
  if (!dateRange || !dateRange.end) {
    return questions;
  }

  // Filter questions based on date range
  return questions.filter((question) => {
    // Get the question's createDate
    const getCreateDate = (question: QuestionWithData): Date | null => {
      if (question.createDate) {
        const createDate = question.createDate;
        // Convert to milliseconds if it's in seconds (10 digits)
        const timestamp =
          createDate.toString().length === 10 ? createDate * 1000 : createDate;
        return new Date(timestamp);
      }
      return null;
    };

    const questionDate = getCreateDate(question);

    // If question has no date, exclude it from date filtering
    if (!questionDate) {
      return false;
    }

    const startDate = dateRange.start;
    const endDate = dateRange.end;

    // Check if question date falls within the range
    if (startDate && endDate) {
      return questionDate >= startDate && questionDate <= endDate;
    } else if (endDate) {
      // If only end date is specified (start is null), include from beginning of time
      return questionDate <= endDate;
    }

    return true;
  });
};

// Helper function to filter questions by answer status
export const filterQuestionsByAnswerStatus = (
  questions: QuestionWithData[],
  answerStatus: "all" | "answered" | "not-answered",
  answeredQuestions: AnsweredQuestion[] = []
): QuestionWithData[] => {
  // Default behavior: show all questions when status is "all"
  if (answerStatus === "all") {
    return questions;
  }

  // Create a Set of answered question IDs for efficient lookup
  const answeredQuestionIds = new Set(
    answeredQuestions.map((aq) => aq.questionId)
  );

  // Filter questions based on answer status
  return questions.filter((question) => {
    const isAnswered = answeredQuestionIds.has(question.questionId);

    if (answerStatus === "answered") {
      return isAnswered;
    } else if (answerStatus === "not-answered") {
      return !isAnswered;
    }

    return true; // fallback to showing all
  });
};

// Helper function to sort questions by createDate
export const sortQuestionsByDate = (
  questions: QuestionWithData[],
  sortOrder: "default" | "newest" | "oldest"
): QuestionWithData[] => {
  if (sortOrder === "default") {
    return questions;
  }

  const newSorted = [...questions].sort((a, b) => {
    // Get createDate from questionData if available
    const getCreateDate = (question: QuestionWithData): number | null => {
      if (question.createDate) {
        const createDate = question.createDate;
        // Convert to milliseconds if it's in seconds (10 digits)
        return createDate.toString().length === 10
          ? createDate * 1000
          : createDate;
      }
      return null; // Return null if no createDate available
    };

    const dateA = getCreateDate(a);
    const dateB = getCreateDate(b);

    // Handle cases where createDate is not available
    if (dateA === null && dateB === null) {
      // Both don't have createDate, maintain original order
      return 0;
    }
    if (dateA === null) {
      // A doesn't have createDate, put it at the end
      return sortOrder === "newest" ? 1 : 1;
    }
    if (dateB === null) {
      // B doesn't have createDate, put it at the end
      return sortOrder === "newest" ? -1 : -1;
    }

    // Both have createDate, sort normally
    if (sortOrder === "newest") {
      return dateB - dateA; // Newest first (descending)
    } else {
      return dateA - dateB; // Oldest first (ascending)
    }
  });

  console.log("newSorted date", newSorted, newSorted.length);

  return newSorted;
};

// Basic filter function for reducer (without Bluebook filtering)
export const filterQuestionsBasic = (
  questions: QuestionWithData[],
  selectedDifficulties: QuestionDifficulty[],
  selectedSkills: string[]
): QuestionWithData[] => {
  let filtered = questions;

  // Apply difficulty filter
  filtered = filterQuestionsByDifficulty(filtered, selectedDifficulties);

  // Apply skill filter
  filtered = filterQuestionsBySkills(filtered, selectedSkills);

  return filtered;
};

// Combined filter function (includes Bluebook filtering and sorting)
export const filterQuestions = (
  questions: QuestionWithData[],
  selectedDifficulties: QuestionDifficulty[],
  selectedSkills: string[],
  excludeBluebook: boolean = false,
  onlyBluebook: boolean = false,
  sortOrder: "default" | "newest" | "oldest" = "default",
  dateRange: RangeValue | null = null,
  bluebookExternalIds?: BluebookExternalIds,
  selectedSubject?: string,
  answerStatus: "all" | "answered" | "not-answered" = "all",
  answeredQuestions: AnsweredQuestion[] = []
): QuestionWithData[] => {
  let filtered = questions;

  // Apply sorting
  filtered = sortQuestionsByDate(filtered, sortOrder);

  // Apply date range filter
  filtered = filterQuestionsByDateRange(filtered, dateRange);

  // Apply Bluebook filters (exclude takes precedence over only)
  if (excludeBluebook) {
    filtered = filterOutBluebookQuestions(
      filtered,
      excludeBluebook,
      bluebookExternalIds,
      selectedSubject
    );
  } else if (onlyBluebook) {
    filtered = filterOnlyBluebookQuestions(
      filtered,
      onlyBluebook,
      bluebookExternalIds,
      selectedSubject
    );
  }

  // Apply difficulty filter
  filtered = filterQuestionsByDifficulty(filtered, selectedDifficulties);

  // Apply skill filter
  filtered = filterQuestionsBySkills(filtered, selectedSkills);

  // Apply answer status filter
  filtered = filterQuestionsByAnswerStatus(
    filtered,
    answerStatus,
    answeredQuestions
  );

  return filtered;
};
