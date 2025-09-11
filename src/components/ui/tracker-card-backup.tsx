"use client";

import React, { useState, useEffect, useMemo, useCallback, memo } from "react";
import {
  CheckCircle2,
  Circle,
  CircleAlert,
  CircleDotDashed,
  CircleX,
} from "lucide-react";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";

// Type definitions
interface Question {
  id: string;
  title: string;
  description: string;
  difficulty: string;
  status: string;
}

interface Subtask {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  tools?: string[]; // Optional array of MCP server tools
  questions?: Question[]; // Optional array of individual questions
}

interface Task {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  level: number;
  dependencies: string[];
  subtasks: Subtask[];
}

// Initial task data
const exampleData: Task[] = [
  {
    id: "1",
    title: "Research Project Requirements",
    description:
      "Gather all necessary information about project scope and requirements",
    status: "in-progress",
    priority: "high",
    level: 0,
    dependencies: [],
    subtasks: [
      {
        id: "1.1",
        title: "Interview stakeholders",
        description:
          "Conduct interviews with key stakeholders to understand needs",
        status: "completed",
        priority: "high",
        tools: ["communication-agent", "meeting-scheduler"],
      },
      {
        id: "1.2",
        title: "Review existing documentation",
        description:
          "Go through all available documentation and extract requirements",
        status: "in-progress",
        priority: "medium",
        tools: ["file-system", "browser"],
      },
      {
        id: "1.3",
        title: "Compile findings report",
        description:
          "Create a comprehensive report of all gathered information",
        status: "need-help",
        priority: "medium",
        tools: ["file-system", "markdown-processor"],
      },
    ],
  },
];

interface TrackerCardProps {
  tasks?: Task[];
  initialExpandedTasks?: string[];
}

// Custom comparison function for React.memo
const arePropsEqual = (
  prevProps: TrackerCardProps,
  nextProps: TrackerCardProps
) => {
  // Compare tasks array by reference first
  if (prevProps.tasks === nextProps.tasks) {
    return true;
  }

  // If one is undefined and the other isn't, they're different
  if (!prevProps.tasks !== !nextProps.tasks) {
    return false;
  }

  // If both are defined, compare length and first few items
  if (prevProps.tasks && nextProps.tasks) {
    if (prevProps.tasks.length !== nextProps.tasks.length) {
      return false;
    }

    // Compare first item as a quick check
    if (prevProps.tasks[0]?.id !== nextProps.tasks[0]?.id) {
      return false;
    }
  }

  // Always allow re-render if initialExpandedTasks changed
  if (
    JSON.stringify(prevProps.initialExpandedTasks) !==
    JSON.stringify(nextProps.initialExpandedTasks)
  ) {
    return false;
  }

  return true;
};

const TrackerCard = memo(function TrackerCard({
  tasks: initialTasks = exampleData,
  initialExpandedTasks = ["1"],
}: TrackerCardProps) {
  // Debug logging
  console.log("TrackerCard rendered with:", {
    tasksCount: initialTasks?.length,
    initialExpandedTasks,
  });

  // Use state with initialization only - don't sync with props changes automatically
  const [tasks, setTasks] = useState<Task[]>(() => initialTasks || exampleData);
  const [expandedTasks, setExpandedTasks] = useState<string[]>(
    () => initialExpandedTasks || ["1"]
  );
  const [expandedSubtasks, setExpandedSubtasks] = useState<{
    [key: string]: boolean;
  }>({});
  const [expandedQuestions, setExpandedQuestions] = useState<{
    [key: string]: boolean;
  }>({});

  console.log("Current state:", {
    tasksCount: tasks.length,
    expandedTasks,
    expandedSubtasks,
    expandedQuestions,
  });

  // Only update when tasks prop changes and is actually different
  useEffect(() => {
    if (initialTasks && initialTasks.length > 0) {
      // Simple reference check first, then deeper comparison
      setTasks((prevTasks) => {
        // If it's the same reference, don't update
        if (prevTasks === initialTasks) return prevTasks;

        // If lengths are different, update
        if (prevTasks.length !== initialTasks.length) return initialTasks;

        // If first item id is different, update (simple heuristic)
        if (prevTasks[0]?.id !== initialTasks[0]?.id) return initialTasks;

        // Otherwise, keep existing tasks
        return prevTasks;
      });
    }
  }, [initialTasks]);

  // Only update expanded tasks when they actually change - but don't override user interactions
  useEffect(() => {
    if (initialExpandedTasks && initialExpandedTasks.length > 0) {
      setExpandedTasks((prevExpanded) => {
        // Only set initial state if we don't have any expanded tasks yet
        if (prevExpanded.length === 0) {
          return initialExpandedTasks;
        }
        // Otherwise keep the current state to preserve user interactions
        return prevExpanded;
      });
    }
  }, [initialExpandedTasks]);

  // Add support for reduced motion preference
  const prefersReducedMotion = useMemo(
    () =>
      typeof window !== "undefined"
        ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
        : false,
    []
  );

  // Toggle task expansion - memoized callback
  const toggleTaskExpansion = useCallback((taskId: string) => {
    console.log("Toggling task expansion for:", taskId);
    setExpandedTasks((prev) => {
      const newExpanded = prev.includes(taskId)
        ? prev.filter((id) => id !== taskId)
        : [...prev, taskId];
      console.log("Previous expanded:", prev, "New expanded:", newExpanded);
      return newExpanded;
    });
  }, []);

  // Toggle subtask expansion - memoized callback
  const toggleSubtaskExpansion = useCallback(
    (taskId: string, subtaskId: string) => {
      const key = `${taskId}-${subtaskId}`;
      console.log("Toggling subtask expansion for:", key);
      setExpandedSubtasks((prev) => {
        const newExpanded = {
          ...prev,
          [key]: !prev[key],
        };
        console.log(
          "Previous subtask expanded:",
          prev,
          "New subtask expanded:",
          newExpanded
        );
        return newExpanded;
      });
    },
    []
  );

  // Toggle question expansion - memoized callback
  const toggleQuestionExpansion = useCallback((subtaskId: string) => {
    const key = `questions-${subtaskId}`;
    console.log("Toggling question expansion for:", key);
    setExpandedQuestions((prev) => {
      const newExpanded = {
        ...prev,
        [key]: !prev[key],
      };
      console.log(
        "Previous question expanded:",
        prev,
        "New question expanded:",
        newExpanded
      );
      return newExpanded;
    });
  }, []);

  // For now, just return a simple structure - we'll add the third level later
  return (
    <div className="bg-background text-foreground h-full overflow-auto p-2">
      <motion.div
        className="bg-card border-border rounded-lg border shadow overflow-hidden"
        initial={{ opacity: 0, y: 10 }}
        animate={{
          opacity: 1,
          y: 0,
          transition: {
            duration: 0.3,
            ease: [0.2, 0.65, 0.3, 0.9],
          },
        }}
      >
        <LayoutGroup>
          <div className="p-4 overflow-hidden">
            <ul className="space-y-1 overflow-hidden">
              {tasks.map((task, index) => {
                const isExpanded = expandedTasks.includes(task.id);
                const isCompleted = task.status === "completed";

                return (
                  <motion.li
                    key={task.id}
                    className={` ${index !== 0 ? "mt-1 pt-2" : ""} `}
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    {/* Task row */}
                    <motion.div
                      className="group flex items-center px-3 py-1.5 rounded-md cursor-pointer"
                      onClick={() => toggleTaskExpansion(task.id)}
                      whileHover={{
                        backgroundColor: "rgba(0,0,0,0.03)",
                        transition: { duration: 0.2 },
                      }}
                    >
                      <div className="mr-2 flex-shrink-0">
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                      </div>

                      <div className="flex min-w-0 flex-grow items-center justify-between">
                        <div className="mr-2 flex-1 truncate">
                          <span
                            className={`${
                              isCompleted
                                ? "text-muted-foreground line-through"
                                : ""
                            }`}
                          >
                            {task.title}
                          </span>
                        </div>

                        <div className="flex flex-shrink-0 items-center space-x-2 text-xs">
                          <span className="bg-blue-100 text-blue-700 rounded px-1.5 py-0.5">
                            {task.status}
                          </span>
                        </div>
                      </div>
                    </motion.div>

                    {/* Subtasks */}
                    <AnimatePresence mode="wait">
                      {isExpanded && task.subtasks.length > 0 && (
                        <motion.div
                          className="relative overflow-hidden mt-1 ml-3"
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                        >
                          <ul className="space-y-0.5">
                            {task.subtasks.map((subtask) => {
                              const subtaskKey = `${task.id}-${subtask.id}`;
                              const isSubtaskExpanded =
                                expandedSubtasks[subtaskKey];
                              const questionsKey = `questions-${subtask.id}`;
                              const areQuestionsExpanded =
                                expandedQuestions[questionsKey];

                              return (
                                <motion.li
                                  key={subtask.id}
                                  className="group flex flex-col py-0.5 pl-6"
                                  initial={{ opacity: 0, x: -10 }}
                                  animate={{ opacity: 1, x: 0 }}
                                >
                                  <motion.div
                                    className="flex flex-1 items-center rounded-md p-1 cursor-pointer"
                                    onClick={() =>
                                      toggleSubtaskExpansion(
                                        task.id,
                                        subtask.id
                                      )
                                    }
                                    whileHover={{
                                      backgroundColor: "rgba(0,0,0,0.03)",
                                      transition: { duration: 0.2 },
                                    }}
                                  >
                                    <div className="mr-2 flex-shrink-0">
                                      <Circle className="text-muted-foreground h-4 w-4" />
                                    </div>

                                    <span className="cursor-pointer text-sm">
                                      {subtask.title}
                                    </span>

                                    {subtask.questions &&
                                      subtask.questions.length > 0 && (
                                        <button
                                          className="ml-auto text-xs text-blue-600 hover:text-blue-800"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            toggleQuestionExpansion(subtask.id);
                                          }}
                                        >
                                          {areQuestionsExpanded
                                            ? "Hide"
                                            : "Show"}{" "}
                                          {subtask.questions.length} questions
                                        </button>
                                      )}
                                  </motion.div>

                                  {/* Subtask Details */}
                                  <AnimatePresence mode="wait">
                                    {isSubtaskExpanded && (
                                      <motion.div
                                        className="text-muted-foreground border-foreground/20 mt-1 ml-1.5 border-l border-dashed pl-5 text-xs overflow-hidden"
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: "auto" }}
                                        exit={{ opacity: 0, height: 0 }}
                                      >
                                        <p className="py-1">
                                          {subtask.description}
                                        </p>
                                        {subtask.tools &&
                                          subtask.tools.length > 0 && (
                                            <div className="mt-0.5 mb-1 flex flex-wrap items-center gap-1.5">
                                              <span className="text-muted-foreground font-medium">
                                                MCP Servers:
                                              </span>
                                              <div className="flex flex-wrap gap-1">
                                                {subtask.tools.map(
                                                  (tool, idx) => (
                                                    <span
                                                      key={idx}
                                                      className="bg-secondary/40 text-secondary-foreground rounded px-1.5 py-0.5 text-[10px] font-medium shadow-sm"
                                                    >
                                                      {tool}
                                                    </span>
                                                  )
                                                )}
                                              </div>
                                            </div>
                                          )}
                                      </motion.div>
                                    )}
                                  </AnimatePresence>

                                  {/* Questions List */}
                                  <AnimatePresence mode="wait">
                                    {areQuestionsExpanded &&
                                      subtask.questions && (
                                        <motion.div
                                          className="mt-1 ml-6 space-y-1"
                                          initial={{ opacity: 0, height: 0 }}
                                          animate={{
                                            opacity: 1,
                                            height: "auto",
                                          }}
                                          exit={{ opacity: 0, height: 0 }}
                                        >
                                          {subtask.questions.map((question) => (
                                            <div
                                              key={question.id}
                                              className="flex items-center gap-2 text-xs p-2 bg-muted/30 rounded"
                                            >
                                              <Circle className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                                              <span className="flex-1">
                                                {question.title}
                                              </span>
                                              <span
                                                className={`px-1.5 py-0.5 rounded text-[10px] ${
                                                  question.difficulty === "E"
                                                    ? "bg-green-100 text-green-700"
                                                    : question.difficulty ===
                                                      "M"
                                                    ? "bg-yellow-100 text-yellow-700"
                                                    : "bg-red-100 text-red-700"
                                                }`}
                                              >
                                                {question.difficulty}
                                              </span>
                                            </div>
                                          ))}
                                        </motion.div>
                                      )}
                                  </AnimatePresence>
                                </motion.li>
                              );
                            })}
                          </ul>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.li>
                );
              })}
            </ul>
          </div>
        </LayoutGroup>
      </motion.div>
    </div>
  );
},
arePropsEqual);

export default TrackerCard;
