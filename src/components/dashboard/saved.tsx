import React, {
  useEffect,
  useCallback,
  useMemo,
  useReducer,
  useRef,
  useState,
} from "react";
import { Button } from "@/components/ui/button";
import { AssessmentWorkspace } from "@/app/dashboard/types";
import { useLocalStorage } from "@/lib/useLocalStorage";
import { SavedQuestions, SavedQuestion } from "@/types/savedQuestions";
import { SavedCollections, SavedCollection } from "@/types/savedCollections";
import { QuestionById_Data } from "@/types/question";
import { Card, CardContent } from "@/components/ui/card-v2";
import {
  OptimizedQuestionCard,
  BaseQuestionWithData,
} from "./shared/OptimizedQuestionCard";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import {
  AlignJustifyIcon,
  ListFilterIcon,
  PencilRuler,
  SigmaIcon,
  Star,
  Minus,
  Zap,
  Database,
  Folder,
  FolderOpen,
  Plus,
  ArrowLeft,
  MoreVertical,
  Pencil,
  Trash2,
  Grid3X3,
  List,
  Book,
} from "lucide-react";
import { mathDomains, rwDomains } from "@/static-data/validation";
import { FetchQuestionByUniqueID } from "@/lib/functions/fetchQuestionDatabyUniqueID";
import { FetchQuestionByID } from "@/lib/functions/fetchQuestionByID";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "../ui/breadcrumb";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
  DialogFooter,
} from "../ui/dialog";
import { Input } from "../ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { toast } from "sonner";
import { playSound } from "@/lib/playSound";

// Simple skeleton component
const Skeleton = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={`animate-pulse rounded-md bg-gray-200 ${className || ""}`}
    {...props}
  />
);

interface SavedTabProps {
  selectedAssessment?: AssessmentWorkspace;
}

interface QuestionWithData extends SavedQuestion, BaseQuestionWithData {
  questionData?: QuestionById_Data;
  isLoading?: boolean;
  hasError?: boolean;
  errorMessage?: string;
}

// View mode enum
type ViewMode = "folders" | "questions";

// State management for better performance
interface SavedTabState {
  questionsWithData: QuestionWithData[];
  allSavedQuestions: QuestionWithData[];
  displayedQuestionsCount: number;
  isLoadingMore: boolean;
  fetchedQuestionIds: Set<string>;
  isInitialized: boolean;
  filterSubject: string;
  filterDifficulty: string;
  viewMode: ViewMode;
  selectedCollection: SavedCollection | null;
}

function filterQuestions(
  questions: QuestionWithData[],
  subject: string,
  difficulty: string
) {
  let filteredBySubject = questions.filter((question) => {
    // Apply subject filter
    if (subject !== "all") {
      const primaryClassCd = question.plainQuestion?.primary_class_cd;

      if (primaryClassCd) {
        if (subject === "math" && mathDomains.includes(primaryClassCd)) {
          // Subject matches
        } else if (
          subject === "reading" &&
          rwDomains.includes(primaryClassCd)
        ) {
          // Subject matches
        } else {
          return false;
        }
      } else {
        return false;
      }
    }
    return true;
  });

  const filteredByDifficulty = filteredBySubject.filter((question) => {
    // Apply difficulty filter
    if (difficulty !== "all") {
      const questionDifficulty = question.plainQuestion?.difficulty;
      return questionDifficulty === difficulty;
    }

    return true;
  });

  return filteredByDifficulty;
}

type SavedTabAction =
  | {
      type: "INITIALIZE_QUESTIONS";
      payload: { questions: QuestionWithData[]; all: QuestionWithData[] };
    }
  | {
      type: "SET_QUESTION_LOADING";
      payload: { index: number; questionId: string };
    }
  | {
      type: "SET_QUESTION_SUCCESS";
      payload: {
        index: number;
        questionData: QuestionById_Data | null;
        qId: string;
      };
    }
  | {
      type: "SET_QUESTION_ERROR";
      payload: { index: number; errorMessage: string; qId: string };
    }
  | { type: "ADD_FETCHED_ID"; payload: string }
  | { type: "REMOVE_FETCHED_ID"; payload: string }
  | { type: "RESET_FETCHED_IDS" }
  | { type: "SET_FILTER_SUBJECT"; payload: string }
  | { type: "SET_FILTER_DIFFICULTY"; payload: string }
  | { type: "SET_VIEW_MODE"; payload: ViewMode }
  | { type: "SET_SELECTED_COLLECTION"; payload: SavedCollection | null }
  | { type: "LOAD_MORE" }
  | { type: "SET_LOADING_MORE"; payload: boolean };

const savedTabReducer = (
  state: SavedTabState,
  action: SavedTabAction
): SavedTabState => {
  switch (action.type) {
    case "INITIALIZE_QUESTIONS":
      return {
        ...state,
        questionsWithData: action.payload.questions,
        allSavedQuestions: action.payload.all,
        displayedQuestionsCount: action.payload.questions.length,
        isInitialized: true,
      };
    case "SET_QUESTION_LOADING":
      return {
        ...state,
        questionsWithData: state.questionsWithData.map((q, i) =>
          i === action.payload.index
            ? {
                ...q,
                isLoading: true,
                hasError: false,
                errorMessage: undefined,
              }
            : q
        ),
      };
    case "SET_QUESTION_SUCCESS":
      return {
        ...state,
        allSavedQuestions: state.allSavedQuestions.map((q, i) => {
          // console.log("SET_QUESTION_SUCCESS", q, action.payload);
          return q.questionId === action.payload.qId
            ? {
                ...q,
                questionData: action.payload.questionData || undefined,
                isLoading: false,
                hasError: false,
              }
            : q;
        }),
        questionsWithData: state.questionsWithData.map((q, i) =>
          q.questionId === action.payload.qId
            ? {
                ...q,
                questionData: action.payload.questionData || undefined,
                isLoading: false,
                hasError: false,
              }
            : q
        ),
      };
    case "SET_QUESTION_ERROR":
      return {
        ...state,
        questionsWithData: state.questionsWithData.map((q, i) =>
          q.questionId === action.payload.qId
            ? {
                ...q,
                isLoading: false,
                hasError: true,
                errorMessage: action.payload.errorMessage,
              }
            : q
        ),
      };
    case "ADD_FETCHED_ID":
      return {
        ...state,
        fetchedQuestionIds: new Set([
          ...state.fetchedQuestionIds,
          action.payload,
        ]),
      };
    case "SET_FILTER_SUBJECT":
      const filteredSubjectQuestions = filterQuestions(
        state.allSavedQuestions,
        action.payload,
        state.filterDifficulty
      ).slice(0, 10);

      // console.log(
      //   "filteredSubjectQuestions",
      //   filteredSubjectQuestions,
      //   action.payload
      // );
      return {
        ...state,
        questionsWithData: filteredSubjectQuestions,
        displayedQuestionsCount: filteredSubjectQuestions.length,
        filterSubject: action.payload,
        isLoadingMore: false,
      };
    case "SET_FILTER_DIFFICULTY":
      const filteredDifficultyQuestions = filterQuestions(
        state.allSavedQuestions,
        state.filterSubject,
        action.payload
      ).slice(0, 10);

      return {
        ...state,
        questionsWithData: filteredDifficultyQuestions,
        displayedQuestionsCount: filteredDifficultyQuestions.length,
        filterDifficulty: action.payload,
        isLoadingMore: false,
      };
    case "REMOVE_FETCHED_ID":
      const newFetchedIds = new Set(state.fetchedQuestionIds);
      newFetchedIds.delete(action.payload);
      return {
        ...state,
        fetchedQuestionIds: newFetchedIds,
      };
    case "RESET_FETCHED_IDS":
      return {
        ...state,
        fetchedQuestionIds: new Set(),
      };
    case "LOAD_MORE":
      const filteredQuestions = filterQuestions(
        state.allSavedQuestions,
        state.filterSubject,
        state.filterDifficulty
      );

      const nextCount = Math.min(
        state.displayedQuestionsCount + 10,
        filteredQuestions.length
      );
      const newQuestions = filteredQuestions
        .slice(state.displayedQuestionsCount, nextCount)
        .map((q) => ({
          ...q,
          isLoading: q.isLoading,
          hasError: false,
        }));

      return {
        ...state,
        questionsWithData: [...state.questionsWithData, ...newQuestions],
        displayedQuestionsCount: nextCount,
        isLoadingMore: false,
      };
    case "SET_LOADING_MORE":
      return {
        ...state,
        isLoadingMore: action.payload,
      };
    case "SET_VIEW_MODE":
      return {
        ...state,
        viewMode: action.payload,
        selectedCollection:
          action.payload === "folders" ? null : state.selectedCollection,
      };
    case "SET_SELECTED_COLLECTION":
      return {
        ...state,
        selectedCollection: action.payload,
        viewMode: action.payload ? "questions" : "folders",
      };
    default:
      return state;
  }
};

export function SavedTab({ selectedAssessment }: SavedTabProps) {
  // Load saved questions from localStorage
  const [savedQuestions] = useLocalStorage<SavedQuestions>(
    "savedQuestions",
    {}
  );

  // Load saved collections from localStorage
  const [savedCollections, setSavedCollections] =
    useLocalStorage<SavedCollections>("savedCollections", {});

  // State for collection management
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState("");
  const [editingCollection, setEditingCollection] =
    useState<SavedCollection | null>(null);
  const [gridView, setGridView] = useState(true);

  // Handle creating a new collection
  const handleCreateCollection = () => {
    if (newCollectionName.trim()) {
      const newCollection: SavedCollection = {
        id: Date.now().toString(),
        name: newCollectionName.trim(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        questionIds: [],
        questionDetails: [],
      };

      setSavedCollections({
        ...savedCollections,
        [newCollection.id]: newCollection,
      });

      setNewCollectionName("");
      setIsCreateDialogOpen(false);
    }
  };

  // Handle deleting a collection
  const handleDeleteCollection = (collectionId: string) => {
    const updatedCollections = { ...savedCollections };
    delete updatedCollections[collectionId];
    setSavedCollections(updatedCollections);
  };

  // Handle editing a collection
  const handleEditCollection = (collection: SavedCollection) => {
    setEditingCollection(collection);
    setNewCollectionName(collection.name);
    setIsCreateDialogOpen(true);
  };

  // Handle updating a collection
  const handleUpdateCollection = () => {
    if (editingCollection && newCollectionName.trim()) {
      setSavedCollections({
        ...savedCollections,
        [editingCollection.id]: {
          ...editingCollection,
          name: newCollectionName.trim(),
          updatedAt: new Date().toISOString(),
        },
      });

      setEditingCollection(null);
      setNewCollectionName("");
      setIsCreateDialogOpen(false);
    }
  };

  // Get collections as array with migration for backward compatibility
  const collectionsArray = Object.values(savedCollections).map(
    (collection, index) => {
      // Migrate collections that don't have questionDetails (backward compatibility)
      if (!collection.questionDetails) {
        return {
          ...collection,
          id: collection.id || `collection_${index}_${Date.now()}`, // Ensure id exists
          questionDetails: [], // Initialize empty array for legacy collections
          questionIds: collection.questionIds || [], // Ensure questionIds exists
        };
      }
      return {
        ...collection,
        id: collection.id || `collection_${index}_${Date.now()}`, // Ensure id exists
      };
    }
  );

  // Migrate collections in localStorage if needed
  useEffect(() => {
    const needsMigration = Object.values(savedCollections).some(
      (collection) => !collection.questionDetails
    );

    if (needsMigration) {
      const migratedCollections: SavedCollections = {};
      Object.entries(savedCollections).forEach(([id, collection]) => {
        migratedCollections[id] = {
          ...collection,
          questionDetails: collection.questionDetails || [],
          questionIds: collection.questionIds || [],
          updatedAt: collection.updatedAt || new Date().toISOString(),
        };
      });
      setSavedCollections(migratedCollections);
    }
  }, [savedCollections, setSavedCollections]);

  // Use reducer for better state management and performance
  const [state, dispatch] = useReducer(savedTabReducer, {
    questionsWithData: [],
    allSavedQuestions: [],
    displayedQuestionsCount: 0,
    isLoadingMore: false,
    fetchedQuestionIds: new Set<string>(),
    isInitialized: false,
    filterSubject: "all",
    filterDifficulty: "all",
    viewMode: "folders" as ViewMode,
    selectedCollection: null,
  });

  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Get the assessment key from selectedAssessment (memoized)
  const getAssessmentKey = useCallback(
    (assessment?: AssessmentWorkspace): string => {
      if (!assessment) return "SAT"; // Default to SAT

      // Map assessment names to keys used in localStorage
      const assessmentMap: Record<string, string> = {
        SAT: "SAT",
        "PSAT/NMSQT & PSAT 10": "PSAT/NMSQT",
        "PSAT 8/9": "PSAT",
      };

      return assessmentMap[assessment.name] || "SAT";
    },
    []
  );

  // Memoize assessment key to prevent unnecessary recalculations
  const assessmentKey = useMemo(
    () => getAssessmentKey(selectedAssessment),
    [selectedAssessment, getAssessmentKey]
  );

  // Memoize assessment name to prevent unnecessary recalculations
  const assessmentName = useMemo(
    () => selectedAssessment?.name || "SAT",
    [selectedAssessment?.name]
  );

  // Memoize filtered count to prevent unnecessary recalculations
  const filteredCount = useMemo(
    () =>
      filterQuestions(
        state.allSavedQuestions,
        state.filterSubject,
        state.filterDifficulty
      ).length,
    [state.allSavedQuestions, state.filterSubject, state.filterDifficulty]
  );

  // Fetch question data from API (memoized)
  const fetchQuestionData = useCallback(FetchQuestionByID, []);

  // Memoized retry handler to prevent recreation on every render
  const handleRetry = useCallback((index: number, questionId: string) => {
    dispatch({ type: "REMOVE_FETCHED_ID", payload: questionId });
    dispatch({ type: "SET_QUESTION_LOADING", payload: { index, questionId } });
  }, []);

  // Initialize questions when assessment, saved questions, or selected collection change
  useEffect(() => {
    const assessmentSavedQuestions = savedQuestions[assessmentKey] || [];

    let questionsToShow: QuestionWithData[];

    if (state.selectedCollection) {
      // Filter questions based on selected collection
      const collectionQuestionIds =
        state.selectedCollection.questionDetails.map(
          (detail) => detail.questionId
        );
      questionsToShow = assessmentSavedQuestions
        .filter((question) =>
          collectionQuestionIds.includes(question.questionId)
        )
        .map((question) => ({
          ...question,
          isLoading: true,
          hasError: false,
        }));
    } else {
      // Show all questions
      questionsToShow = assessmentSavedQuestions.map((question) => ({
        ...question,
        isLoading: true,
        hasError: false,
      }));
    }

    const initialQuestions = questionsToShow.slice(0, 10).map((q) => ({
      ...q,
      isLoading: true,
      hasError: false,
    }));

    dispatch({
      type: "INITIALIZE_QUESTIONS",
      payload: { questions: initialQuestions, all: questionsToShow },
    });
    dispatch({ type: "RESET_FETCHED_IDS" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assessmentKey, savedQuestions, state.selectedCollection?.id]);

  // Fetch question data progressively
  useEffect(() => {
    if (!state.isInitialized || state.questionsWithData.length === 0) return;

    const fetchQuestionsProgressively = async () => {
      console.log(state.questionsWithData);
      // Find questions that need to be fetched
      const questionsToFetch = state.questionsWithData
        .map((question, index) => ({ question, index }))
        .filter(
          ({ question }) =>
            question.isLoading &&
            !question.questionData &&
            !question.hasError &&
            !state.fetchedQuestionIds.has(question.questionId)
        );

      if (questionsToFetch.length === 0) return;

      // Process questions with small delays
      for (const { question, index } of questionsToFetch) {
        const id = question.externalId || question.ibn;
        if (!id) {
          dispatch({
            type: "SET_QUESTION_ERROR",
            payload: {
              index,
              errorMessage: "No valid ID to fetch question",
              qId: question.questionId,
            },
          });
          continue;
        }
        try {
          // console.log("FETCH question", question);
          const questionData = await fetchQuestionData(id);
          if (!questionData) {
            dispatch({
              type: "SET_QUESTION_ERROR",
              payload: {
                index,
                errorMessage: "Failed to fetch question data",
                qId: question.questionId,
              },
            });
            continue;
          }
          if (!question.plainQuestion) {
            dispatch({
              type: "SET_QUESTION_ERROR",
              payload: {
                index,
                errorMessage: "Question metadata not available",
                qId: question.questionId,
              },
            });
            continue;
          }

          dispatch({
            type: "SET_QUESTION_SUCCESS",
            payload: {
              index,
              qId: question.questionId,
              questionData: {
                problem: questionData,
                question: question.plainQuestion,
              },
            },
          });

          // Small delay between requests
          await new Promise((resolve) => setTimeout(resolve, 100));
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : "Unknown error";

          dispatch({
            type: "SET_QUESTION_ERROR",
            payload: { index, errorMessage, qId: question.questionId },
          });
        }
        // Mark these questions as being fetched
        dispatch({ type: "ADD_FETCHED_ID", payload: question.questionId });
      }
    };

    fetchQuestionsProgressively();
  }, [
    state.isInitialized,
    state.isLoadingMore,
    state.filterSubject,
    state.filterDifficulty,
    fetchQuestionData,
  ]);

  // Function to load more questions
  const loadMoreQuestions = useCallback(() => {
    console.log(state.displayedQuestionsCount);
    if (state.isLoadingMore || filteredCount <= state.displayedQuestionsCount) {
      return;
    }

    dispatch({ type: "SET_LOADING_MORE", payload: true });
    setTimeout(() => {
      dispatch({ type: "LOAD_MORE" });
    }, 100);
  }, [state.isLoadingMore, filteredCount, state.displayedQuestionsCount]);

  // Intersection Observer for infinite scrolling
  useEffect(() => {
    const currentLoadMoreRef = loadMoreRef.current;
    if (!currentLoadMoreRef || filteredCount <= state.displayedQuestionsCount)
      return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !state.isLoadingMore) {
          loadMoreQuestions();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(currentLoadMoreRef);

    return () => {
      if (currentLoadMoreRef) {
        observer.unobserve(currentLoadMoreRef);
      }
    };
  }, [
    filteredCount,
    state.displayedQuestionsCount,
    state.isLoadingMore,
    loadMoreQuestions,
  ]);

  if (!state.isInitialized) {
    return (
      <div className="w-full lg:px-28">
        <h2 className="text-lg font-semibold">Saved Questions</h2>
        <p className="text-sm text-muted-foreground">
          Loading saved questions...
        </p>
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }

  return (
    <div className=" w-full lg:px-22">
      <div className="px-8  grid grid-cols-12">
        <div className="col-span-12 md:col-span-8 flex flex-col flex-wrap gap-2 items-start text-sm ">
          <div className="flex items-center gap-2">
            {state.viewMode === "questions" && state.selectedCollection && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  dispatch({ type: "SET_VIEW_MODE", payload: "folders" })
                }
                className="p-1"
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
            )}
            <h2 className="text-lg font-semibold">
              {state.viewMode === "folders"
                ? "Saved Collections"
                : state.selectedCollection
                ? state.selectedCollection.name
                : "All Questions"}
            </h2>
          </div>
          <p className="text-sm text-muted-foreground">
            {state.viewMode === "folders"
              ? `${
                  collectionsArray.length +
                  (state.allSavedQuestions.length > 0 ? 1 : 0)
                } folder${
                  collectionsArray.length +
                    (state.allSavedQuestions.length > 0 ? 1 : 0) !==
                  1
                    ? "s"
                    : ""
                }`
              : state.selectedCollection
              ? `${
                  (state.selectedCollection.questionDetails || []).length
                } question${
                  (state.selectedCollection.questionDetails || []).length !== 1
                    ? "s"
                    : ""
                } in ${state.selectedCollection.name}`
              : `${state.allSavedQuestions.length} saved question${
                  state.allSavedQuestions.length !== 1 ? "s" : ""
                } for ${assessmentName}`}
          </p>
        </div>

        <div className="mt-10 md:mt-0 col-span-12 md:col-span-4 flex flex-col items-end justify-end gap-3">
          {/* View mode toggle */}
          <div className="flex gap-2 w-full lg:w-[80%]">
            <Button
              variant={state.viewMode === "folders" ? "default" : "outline"}
              size="sm"
              onClick={() =>
                dispatch({ type: "SET_VIEW_MODE", payload: "folders" })
              }
              className="flex-1"
            >
              <Folder className="w-4 h-4 mr-2" />
              Folders
            </Button>
            <Button
              variant={state.viewMode === "questions" ? "default" : "outline"}
              size="sm"
              onClick={() =>
                dispatch({ type: "SET_VIEW_MODE", payload: "questions" })
              }
              className="flex-1"
            >
              <Book className="w-4 h-4 mr-2" />
              Questions
            </Button>
          </div>

          {state.viewMode === "questions" && (
            <>
              <Select
                onValueChange={(value) =>
                  dispatch({ type: "SET_FILTER_SUBJECT", payload: value })
                }
              >
                <SelectTrigger
                  icon={
                    state.filterSubject === "all"
                      ? ListFilterIcon
                      : state.filterSubject == "math"
                      ? SigmaIcon
                      : PencilRuler
                  }
                  className="w-full lg:w-[80%] bg-background"
                >
                  <SelectValue placeholder="Sort by subject" />
                </SelectTrigger>
                <SelectContent className="font-medium absolute">
                  <SelectItem value="all" icon={AlignJustifyIcon}>
                    All Subjects
                  </SelectItem>
                  <SelectItem value="math" icon={SigmaIcon}>
                    Maths
                  </SelectItem>
                  <SelectItem value="reading" icon={PencilRuler}>
                    Reading & Writing
                  </SelectItem>
                </SelectContent>
              </Select>
              <Select
                onValueChange={(value) =>
                  dispatch({ type: "SET_FILTER_DIFFICULTY", payload: value })
                }
              >
                <SelectTrigger
                  icon={ListFilterIcon}
                  className="w-full lg:w-[80%] bg-background"
                >
                  <SelectValue placeholder="Filter by difficulty" />
                </SelectTrigger>
                <SelectContent className="font-medium absolute">
                  <SelectItem value="all" icon={AlignJustifyIcon}>
                    All Difficulties
                  </SelectItem>
                  <SelectItem value="E" icon={Star}>
                    Easy
                  </SelectItem>
                  <SelectItem value="M" icon={Minus}>
                    Medium
                  </SelectItem>
                  <SelectItem value="H" icon={Zap}>
                    Hard
                  </SelectItem>
                </SelectContent>
              </Select>
            </>
          )}
        </div>
      </div>

      {/* Main content area */}
      <div className="space-y-4 max-w-full mx-auto mt-10">
        {state.viewMode === "folders" ? (
          // Folder view
          <div className="px-8">
            {/* Create new folder button */}
            <div className="mb-6">
              <Button
                onClick={() => setIsCreateDialogOpen(true)}
                className="flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Create New Folder
              </Button>
            </div>

            {/* Folders grid */}
            {collectionsArray.length > 0 ||
            state.allSavedQuestions.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {/* All Questions folder - always show first if there are saved questions */}
                {state.allSavedQuestions.length > 0 && (
                  <Card
                    key="all-questions"
                    className="p-4 cursor-pointer hover:shadow-md transition-shadow relative group"
                    onClick={() => {
                      dispatch({
                        type: "SET_SELECTED_COLLECTION",
                        payload: null,
                      });
                      dispatch({ type: "SET_VIEW_MODE", payload: "questions" });
                    }}
                  >
                    <div className="flex flex-col items-center text-center space-y-3">
                      <div className="w-16 h-16 bg-green-100 rounded-lg flex items-center justify-center">
                        <Book className="w-8 h-8 text-green-600" />
                      </div>
                      <div>
                        <h3 className="font-medium text-sm truncate max-w-full">
                          All Questions
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          {state.allSavedQuestions.length} question
                          {state.allSavedQuestions.length !== 1 ? "s" : ""}
                        </p>
                      </div>
                    </div>
                  </Card>
                )}

                {/* Collection folders */}
                {collectionsArray.map((collection) => (
                  <Card
                    key={collection.id}
                    className="p-4 cursor-pointer hover:shadow-md transition-shadow relative group"
                    onClick={() => {
                      dispatch({
                        type: "SET_SELECTED_COLLECTION",
                        payload: collection,
                      });
                      dispatch({ type: "SET_VIEW_MODE", payload: "questions" });
                    }}
                  >
                    <div className="flex flex-col items-center text-center space-y-3">
                      <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Folder className="w-8 h-8 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-medium text-sm truncate max-w-full">
                          {collection.name}
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          {(collection.questionDetails || []).length} question
                          {(collection.questionDetails || []).length !== 1
                            ? "s"
                            : ""}
                        </p>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditCollection(collection);
                          }}
                          className="h-8 w-8 p-0"
                        >
                          <Pencil className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteCollection(collection.id);
                          }}
                          className="h-8 w-8 p-0 text-red-500 hover:text-red-600"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center text-gray-500">
                    <Folder className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-lg font-medium">No collections yet</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Create your first collection to organize your saved
                      questions.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        ) : (
          // Questions view
          <>
            {state.questionsWithData.length > 0 ? (
              state.questionsWithData.map((question, index) => {
                return (
                  <div
                    key={`${question.questionId}-${index}`}
                    className=" mb-32"
                  >
                    <OptimizedQuestionCard
                      question={question}
                      index={index}
                      onRetry={handleRetry}
                      type="saved"
                    />
                  </div>
                );
              })
            ) : (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center text-gray-500">
                    <p className="text-lg">📚</p>
                    <p className="mt-2">
                      {state.selectedCollection
                        ? `No questions in "${state.selectedCollection.name}" yet.`
                        : "You haven't saved any questions yet."}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {state.selectedCollection
                        ? "Add questions to this collection using the save button on question cards."
                        : "Questions you bookmark will appear here for easy review."}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>

      {/* Load more section - only show in questions view */}
      {state.viewMode === "questions" && (
        <>
          {filteredCount > state.displayedQuestionsCount && (
            <div className="space-y-4">
              <div
                ref={loadMoreRef}
                className="h-10 flex items-center justify-center"
              >
                {state.isLoadingMore && (
                  <div className="text-center text-sm text-muted-foreground">
                    Loading more questions...
                  </div>
                )}
              </div>

              {!state.isLoadingMore && (
                <div className="flex justify-center">
                  <Button
                    variant="outline"
                    onClick={loadMoreQuestions}
                    disabled={state.isLoadingMore}
                    className="px-6 py-2"
                  >
                    Load More Questions (
                    {filteredCount - state.displayedQuestionsCount} remaining)
                  </Button>
                </div>
              )}
            </div>
          )}

          {filteredCount <= state.displayedQuestionsCount &&
            state.questionsWithData.length > 0 && (
              <div className="text-center text-sm text-muted-foreground mt-4">
                You've reached the end of the questions for the selected filter.
              </div>
            )}

          {state.questionsWithData.some((q) => q.isLoading) &&
            !state.isLoadingMore && (
              <div className="text-center text-sm text-muted-foreground">
                Loading questions...
              </div>
            )}
        </>
      )}

      {/* Create/Edit Collection Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingCollection ? "Edit Collection" : "Create New Collection"}
            </DialogTitle>
            <DialogDescription>
              {editingCollection
                ? "Update the name of your collection."
                : "Give your new collection a name to organize your saved questions."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Input
                placeholder="Collection name"
                value={newCollectionName}
                onChange={(e) => setNewCollectionName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    editingCollection
                      ? handleUpdateCollection()
                      : handleCreateCollection();
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsCreateDialogOpen(false);
                setEditingCollection(null);
                setNewCollectionName("");
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={
                editingCollection
                  ? handleUpdateCollection
                  : handleCreateCollection
              }
              disabled={!newCollectionName.trim()}
            >
              {editingCollection ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
